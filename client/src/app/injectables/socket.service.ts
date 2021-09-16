import { Injectable } from "@angular/core"
import {
  WebSocketProxy,
  SocketState,
  SocketEvent
} from "../utils/web-socket-proxy"
import { environment } from "src/environments/environment"
import { Observable } from "rxjs"
import {
  MessageIn,
  MessageInOk,
  MessageInErr,
  MessageOut,
  MessageType
} from "../routing/api"
import {
  MessageCreateRoomOut,
  MessageCreateRoomInOk
} from "../routing/interfaces/create-room"
import {
  MessageUsernameValidOut,
  MessageUsernameValidInOk
} from "../routing/interfaces/username-valid"
import {
  MessageGenerateInvitationOut,
  MessageGenerateInvitationInOk
} from "../routing/interfaces/generate-invitation"
import {
  MessageJoinRoomOut,
  MessageJoinRoomInOk
} from "../routing/interfaces/join-room"
import {
  MessageGetRoomOut,
  MessageGetRoomInOk
} from "../routing/interfaces/get-room"
import { MessageOfferOut, MessageOfferInOk } from "../routing/interfaces/offer"
import {
  MessageCandidateOut,
  MessageCandidateInOk
} from "../routing/interfaces/candidate"
import { MessageAnswerOut, MessageAnswerInOk } from "../routing/interfaces/answer"
import { MessageGuardOut, MessageGuardInOk } from "../routing/interfaces/guard"
import {
  MessageRoomExistsOut,
  MessageRoomExistsInOk
} from "../routing/interfaces/room-exists"
import {
  MessageLockRoomOut,
  MessageLockRoomInOk
} from "../routing/interfaces/lock-room"
import {
  MessageLeaveRoomOut,
  MessageLeaveRoomInOk
} from "../routing/interfaces/leave-room"

export type OmitMessageType<T extends MessageOut> = Omit<T, "type">

function isErrorMessage(message: MessageIn): message is MessageInErr {
  return !!(message as MessageInErr).error
}

export interface CallableRoutesMap {
  createRoom: (
    data: OmitMessageType<MessageCreateRoomOut>
  ) => Promise<MessageCreateRoomInOk>
  usernameValid: (
    data: OmitMessageType<MessageUsernameValidOut>
  ) => Promise<MessageUsernameValidInOk>
  generateInvitation: (
    data: OmitMessageType<MessageGenerateInvitationOut>
  ) => Promise<MessageGenerateInvitationInOk>
  joinRoom: (
    data: OmitMessageType<MessageJoinRoomOut>
  ) => Promise<MessageJoinRoomInOk>
  getRoom: (
    data: OmitMessageType<MessageGetRoomOut>
  ) => Promise<MessageGetRoomInOk>
  offer: (data: OmitMessageType<MessageOfferOut>) => Promise<MessageOfferInOk>
  candidate: (
    data: OmitMessageType<MessageCandidateOut>
  ) => Promise<MessageCandidateInOk>
  answer: (
    data: OmitMessageType<MessageAnswerOut>
  ) => Promise<MessageAnswerInOk>
  guard: (data: OmitMessageType<MessageGuardOut>) => Promise<MessageGuardInOk>
  roomExists: (
    data: OmitMessageType<MessageRoomExistsOut>
  ) => Promise<MessageRoomExistsInOk>
  lockRoom: (
    data: OmitMessageType<MessageLockRoomOut>
  ) => Promise<MessageLockRoomInOk>
  leaveRoom: (
    data: OmitMessageType<MessageLeaveRoomOut>
  ) => Promise<MessageLeaveRoomInOk>
}

@Injectable({
  providedIn: "root"
})
export class SocketService {
  private _proxy: WebSocketProxy
  private _socketEvent$: Observable<SocketEvent>
  private _message$: Observable<MessageIn>

  public send: CallableRoutesMap = {
    createRoom: data => {
      return this._send<MessageCreateRoomInOk>(<MessageCreateRoomOut>{
        type: MessageType.CREATE_ROOM,
        ...data
      })
    },
    usernameValid: data => {
      return this._send<MessageUsernameValidInOk>(<MessageUsernameValidOut>{
        type: MessageType.USERNAME_VALID,
        ...data
      })
    },
    generateInvitation: data => {
      return this._send<MessageGenerateInvitationInOk>(<
        MessageGenerateInvitationOut
      >{
        type: MessageType.GENERATE_INVITATION,
        ...data
      })
    },
    joinRoom: data => {
      return this._send<MessageJoinRoomInOk>(<MessageJoinRoomOut>{
        type: MessageType.JOIN_ROOM,
        ...data
      })
    },
    getRoom: data => {
      return this._send<MessageGetRoomInOk>(<MessageGetRoomOut>{
        type: MessageType.GET_ROOM,
        ...data
      })
    },
    offer: data => {
      return this._send<MessageOfferInOk>(<MessageOfferOut>{
        type: MessageType.OFFER,
        ...data
      })
    },
    candidate: data => {
      return this._send<MessageCandidateInOk>(<MessageCandidateOut>{
        type: MessageType.CANDIDATE,
        ...data
      })
    },
    answer: data => {
      return this._send<MessageAnswerInOk>(<MessageAnswerOut>{
        type: MessageType.ANSWER,
        ...data
      })
    },
    guard: data => {
      return this._send<MessageGuardInOk>(<MessageGuardOut>{
        type: MessageType.GUARD,
        ...data
      })
    },
    roomExists: data => {
      return this._send<MessageRoomExistsInOk>(<MessageRoomExistsOut>{
        type: MessageType.ROOM_EXISTS,
        ...data
      })
    },
    lockRoom: data => {
      return this._send<MessageLockRoomInOk>(<MessageLockRoomOut>{
        type: MessageType.LOCK_ROOM,
        ...data
      })
    },
    leaveRoom: data => {
      return this._send<MessageLeaveRoomInOk>(<MessageLeaveRoomOut>{
        type: MessageType.LEAVE_ROOM,
        data
      })
    }
  }

  constructor() {
    this._proxy = new WebSocketProxy()
    this._socketEvent$ = new Observable(subscriber => {
      this._proxy.getEventAsObservable().subscribe({
        next: event => subscriber.next(event)
      })
    })
    this._message$ = new Observable(subscriber => {
      this._proxy.getMessageAsObservable().subscribe({
        next: message => subscriber.next(message)
      })
    })
  }

  private _send<Ok extends MessageInOk>(message: MessageOut): Promise<Ok> {
    return new Promise((resolve, reject) => {
      this._proxy
        .send(message)
        .then(response => {
          if (isErrorMessage(response)) {
            reject(response)
          } else {
            resolve(response as Ok)
          }
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  connect(): Promise<void> {
    const { host, pathname, port } = environment.backend
    let protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const address = `${protocol}//${host}:${port}/${pathname}`
    return new Promise((resolve, reject) => {
      this._proxy
        .connect(address)
        .then(() => resolve())
        .catch(err => reject(err))
    })
  }

  disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._proxy
        .disconnect()
        .then(() => resolve())
        .catch(err => reject(err))
    })
  }

  getState(): SocketState {
    return this._proxy.getState()
  }

  getEventObservable() {
    return this._socketEvent$
  }

  getMessageObservable() {
    return this._message$
  }
}
