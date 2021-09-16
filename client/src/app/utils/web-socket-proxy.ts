import { nanoid } from "nanoid"
import { Subject, Observable } from "rxjs"
import { first, timeout } from "rxjs/operators"
import {
  InternalSocketMessage,
  MessageIn,
  MessageOut,
  MessageType
} from "../routing/api"
import { SOCKET_RESPONSE_TIMEOUT, SOCKET_OPEN_TIMEOUT } from "./constants"

export enum SocketState {
  OPEN = 1,
  CLOSED = 3,
  CLOSING = 2,
  CONNECTING = 0
}

export enum EventType {
  OPEN,
  CLOSE,
  ERROR
}

export enum KeepAlive {
  Ping = "ping",
  Pong = "pong"
}

export interface SocketEvent {
  type: EventType
  data: any
}

export enum SocketErrorType {
  TIMEOUT,
  REFUSED,
  CLOSED
}

export interface SocketError {
  type: SocketErrorType
}

export class WebSocketProxy {
  private _socket: WebSocket
  private _onEventSubject$: Subject<SocketEvent>
  private _onMessageSubject$: Subject<InternalSocketMessage<MessageIn>>
  constructor() {
    this._onEventSubject$ = new Subject()
    this._onMessageSubject$ = new Subject()
  }

  private handleEvents() {
    this._socket.onopen = event => {
      this._onEventSubject$.next({ type: EventType.OPEN, data: event })
      console.log(`Socket state event: [OPEN]`)
    }

    this._socket.onclose = event => {
      this._onEventSubject$.next({ type: EventType.CLOSE, data: event })
      console.log(`Socket state event: [CLOSE]`)
    }

    this._socket.onerror = event => {
      this._onEventSubject$.next({ type: EventType.ERROR, data: event })
      console.log(`Socket state event: [ERROR]`)
    }

    this._socket.onmessage = event => {
      if (event.data === KeepAlive.Ping) {
        this._socket.send(KeepAlive.Pong)
      } else {
        const message: InternalSocketMessage<MessageIn> = JSON.parse(event.data)
        this._onMessageSubject$.next(message)
      }
    }
  }

  getState(): SocketState {
    return this._socket.readyState
  }

  connect(address: string): Promise<void> {
    console.log(`Connecting WebSocket to endpoint ${address}`)
    this._socket = new WebSocket(address)
    this.handleEvents()

    return new Promise((resolve, reject) => {
      const subscription = this._onEventSubject$
        .pipe(timeout(SOCKET_RESPONSE_TIMEOUT))
        .subscribe({
          next: event => {
            switch (event.type) {
              case EventType.OPEN:
                resolve()
                subscription.unsubscribe()
                break
              case EventType.ERROR:
                reject(<SocketError>{ type: SocketErrorType.REFUSED })
                subscription.unsubscribe()
                break
            }
          },
          error: () => {
            reject(<SocketError>{ type: SocketErrorType.TIMEOUT })
          }
        })
    })
  }

  disconnect(): Promise<void> {
    console.log(`Disconnecting WebSocket`)
    this._socket.close()
    return new Promise((resolve, reject) => {
      const subscription = this._onEventSubject$
        .pipe(timeout(SOCKET_RESPONSE_TIMEOUT))
        .subscribe({
          next: event => {
            if (event.type === EventType.CLOSE) {
              resolve()
              subscription.unsubscribe()
            }
          },
          error: () => {
            reject(<SocketError>{ type: SocketErrorType.TIMEOUT })
          }
        })
    })
  }

  send(message: MessageOut): Promise<MessageIn> {
    const refClient = nanoid()
    const msgWithRef: InternalSocketMessage<typeof message> = {
      refClient,
      payload: message
    }
    // console.log("Sending message", msgWithRef)
    if (this._socket.readyState === SocketState.OPEN) {
      this._socket.send(JSON.stringify(msgWithRef))
    } else {
      const subscription = this._onEventSubject$
        .pipe(timeout(SOCKET_OPEN_TIMEOUT))
        .subscribe({
          next: event => {
            if (event.type === EventType.OPEN) {
              this._socket.send(JSON.stringify(msgWithRef))
              subscription.unsubscribe()
            }
          },
          error: () => {
            console.error("WebSocket took too long to open")
          }
        })
    }

    return new Promise((resolve, reject) => {
      const subscription = this._onMessageSubject$
        .pipe(timeout(SOCKET_RESPONSE_TIMEOUT))
        .subscribe({
          next: response => {
            if (refClient === response.refClient) {
              resolve(response.payload)
              subscription.unsubscribe()
            }
          },
          error: () => {
            reject(<SocketError>{ type: SocketErrorType.TIMEOUT })
          }
        })
    })
  }

  getEventAsObservable(): Observable<SocketEvent> {
    return this._onEventSubject$
  }

  getMessageAsObservable(): Observable<MessageIn> {
    return new Observable(subscriber => {
      this._onMessageSubject$.subscribe({
        next: response => subscriber.next(response.payload)
      })
    })
  }
}
