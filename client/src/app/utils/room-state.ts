import { ReplaySubject, Subject, Observable } from "rxjs"
import { takeUntil } from "rxjs/operators"
import { CacheManagerService } from "../injectables/cache-manager.service"
import { SocketService } from "../injectables/socket.service"
import {
  MessageIn,
  MessagePushOfferInOk,
  MessagePushCandidateInOk,
  MessagePushAnswerInOk,
  MessageType,
  MessageInErr,
  MessageGetRoomInOk,
  MessageInOk
} from "./api"
import { RoomDTO } from "./dto/room"
import { DataChannelMessageType } from "./message-validator"
import {
  PeerController,
  OtherPeerEventType,
  DataChannelEventType,
  OtherPeerEvent,
  DataChannelEvent,
  DataChannelInternalMessage,
  ChatMessage,
  PingMessage,
  AckMessage
} from "./peer-controller"

export enum UserConnectionStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected"
}

export interface User {
  readonly id: string
  readonly name: string
  connectionState: {
    status: UserConnectionStatus
    dataChannel: boolean
    media: null | MediaStream
  }
}

export interface Room {
  readonly id: string
  locked: boolean
  readonly name: string
  ownerUsername: string
  self: Pick<User, "id" | "name">
  users: User[]
}

export type RoomProperties = Pick<
  Room,
  "id" | "name" | "ownerUsername" | "locked" | "self"
>
type PeerMessageInOk =
  | MessagePushOfferInOk
  | MessagePushCandidateInOk
  | MessagePushAnswerInOk

export type PeerDataChannelMessage = ChatMessage | AckMessage | PingMessage
export interface PeerConnectionStatus {
  status: UserConnectionStatus
}
export interface PeerDataChannelState {
  opened: boolean
}
export interface PeerStream {
  readonly stream: MediaStream | null
}
type PeerData =
  | PeerDataChannelMessage
  | PeerDataChannelState
  | PeerConnectionStatus
  | PeerStream
export interface PeerMessage<T extends PeerData> {
  from: string
  data: T
}

const getUserDefaultConnectionState = (): Pick<User, "connectionState"> => {
  return {
    connectionState: {
      status: UserConnectionStatus.DISCONNECTED,
      dataChannel: false,
      media: null
    }
  }
}

function getUpdatedRoom(oldRoom: Room, newRoom: RoomDTO): Room {
  return {
    id: oldRoom.id,
    locked: newRoom.locked,
    name: oldRoom.name,
    ownerUsername: oldRoom.ownerUsername,
    self: oldRoom.self,
    users: newRoom.users.map<User>(newUser => {
      return (
        oldRoom.users.find(user => user.id === newUser.id) ?? {
          id: newUser.id,
          name: newUser.name,
          ...getUserDefaultConnectionState()
        }
      )
    })
  }
}

function getRoomsDiff(
  roomA: Room | null,
  roomB: Room
): {
  properties: Partial<RoomProperties>
  userList: { added: User[]; removed: User[] }
} {
  const properties: Partial<RoomProperties> = {}
  if (roomA?.locked !== roomB.locked) {
    properties.locked = roomB.locked
  }
  if (roomA?.ownerUsername !== roomB.ownerUsername) {
    properties.ownerUsername = roomB.ownerUsername
  }
  const userList = {
    added: roomB.users.filter(userB => {
      return !roomA?.users.find(userA => {
        return userA.id === userB.id
      })
    }),
    removed:
      roomA?.users.filter(userA => {
        return !roomB.users.find(userB => {
          return userB.id === userA.id
        })
      }) ?? []
  }
  return {
    properties,
    userList
  }
}

function isPeerMessageOk(message: MessageIn): message is PeerMessageInOk {
  if (
    message.type === MessageType.PUSH_OFFER ||
    message.type === MessageType.PUSH_CANDIDATE ||
    message.type === MessageType.PUSH_ANSWER
  ) {
    return true
  }
  return false
}

function isSocketMessageInOk(message: MessageIn): message is MessageInOk {
  return !(message as MessageInErr).error
}

export class RoomState {
  private _room: Room | null
  private _peerController: PeerController | null

  private _roomPropertiesSubject$: ReplaySubject<RoomProperties>
  private _userListSubject$: ReplaySubject<User[]>
  private _peerConnectionStatus$: Subject<PeerMessage<PeerConnectionStatus>>
  private _peerDataChannelState$: Subject<PeerMessage<PeerDataChannelState>>
  private _peerDataChannelMessage$: Subject<PeerMessage<PeerDataChannelMessage>>
  private _peerStream$: Subject<PeerMessage<PeerStream>>

  private _unsubscribeSubject$: Subject<void>
  constructor(
    private _socketService: SocketService,
    private _cacheManagerService: CacheManagerService
  ) {
    this._roomPropertiesSubject$ = new ReplaySubject(1)
    this._userListSubject$ = new ReplaySubject(1)
    this._peerConnectionStatus$ = new Subject()
    this._peerDataChannelState$ = new Subject()
    this._peerDataChannelMessage$ = new Subject()
    this._peerStream$ = new Subject()
    this._unsubscribeSubject$ = new Subject()
  }

  private _setRoom(newRoom: Room) {
    const diff = getRoomsDiff(this._room, newRoom)
    this._room = newRoom
    if (Object.keys(diff.properties).length > 0 || true) {
      this._roomPropertiesSubject$.next(this._room)
    }
    const { added, removed } = diff.userList
    if (added.length + removed.length > 0) {
      this._userListSubject$.next(this._room.users)
      this._updatePeerControllerUserList(
        diff.userList.added,
        diff.userList.removed
      )
    }
  }

  private _updatePeerControllerUserList(added: User[], removed: User[]) {
    added.forEach(user => {
      this._peerController?.addParticipant(user.id)
    })
    removed.forEach(user => {
      this._peerController?.removeParticipant(user.id)
    })
  }

  private _onSocketMessage = (message: MessageIn) => {
    if (isSocketMessageInOk(message)) {
      switch (message.type) {
        case MessageType.GET_ROOM:
          const { room } = message.data
          this._setRoom(getUpdatedRoom(this._room!, room))
          break
        case MessageType.PUSH_LOCK_ROOM:
          const { locked } = message.data
          this._setRoom({ ...this._room!, locked })
          break
        case MessageType.PUSH_USER_CONNECTED:
          const { user } = message.data
          this._setRoom({
            ...this._room!,
            users: [
              ...this._room!.users,
              { ...user, ...getUserDefaultConnectionState() }
            ]
          })
          break
        case MessageType.PUSH_USER_DISCONNECTED:
          const { userId } = message.data
          this._setRoom({
            ...this._room!,
            users: this._room!.users.filter(user => user.id !== userId)
          })
          break
      }
    }
  }

  private _onOtherPeerEvent = (event: OtherPeerEvent) => {
    const user = this._room!.users.find(user => user.id === event.from)
    if (!user) {
      return
    }
    switch (event.data.type) {
      case OtherPeerEventType.CONNECTION_EVENT:
        this._onPeerEventConnection(user, event.data.state)
        break
      case OtherPeerEventType.DATA_CHANNEL_EVENT:
        this._onPeerEventDataChannel(user, event.data.state)
        break
      case OtherPeerEventType.ANY_ERROR:
        this._onPeerEventError(user, event.data.error)
        break
      case OtherPeerEventType.STREAM:
        this._onPeerEventStream(user, event.data.stream)
        break
    }
  }

  private _onPeerEventConnection = (
    user: User,
    state: RTCIceConnectionState
  ) => {
    let status = user.connectionState.status
    switch (state) {
      case "new":
      case "checking":
        status = UserConnectionStatus.CONNECTING
        break
      case "connected":
      case "completed":
        status = UserConnectionStatus.CONNECTED
        break
      case "disconnected":
      case "failed":
        status = UserConnectionStatus.DISCONNECTED
        break
    }
    user.connectionState.status = status
    this._peerConnectionStatus$.next({ from: user.id, data: { status } })
  }
  private _onPeerEventDataChannel = (user: User, event: DataChannelEvent) => {
    switch (event.type) {
      case DataChannelEventType.OPEN:
        this._onPeerDataChannelOpened(user)
        break
      case DataChannelEventType.CLOSE:
        this._onPeerDataChannelClosed(user)
        break
      case DataChannelEventType.MESSAGE:
        this._onPeerDataChannelMessage(user, event.message)
        break
    }
  }
  private _onPeerEventError = (user: User, error: any) => {}
  private _onPeerEventStream = (user: User, stream: MediaStream | null) => {
    this._peerStream$.next({ from: user.id, data: { stream } })
  }
  private _onPeerDataChannelOpened = (user: User) => {
    const opened = true
    user.connectionState.dataChannel = opened
    this._peerDataChannelState$.next({ from: user.id, data: { opened } })
  }
  private _onPeerDataChannelClosed = (user: User) => {
    const opened = false
    user.connectionState.dataChannel = opened
    this._peerDataChannelState$.next({ from: user.id, data: { opened } })
  }
  private _onPeerDataChannelMessage = (
    user: User,
    message: DataChannelInternalMessage
  ) => {
    switch (message.type) {
      case DataChannelMessageType.PING:
        break
      case DataChannelMessageType.CHAT:
        this._peerDataChannelMessage$.next({ from: user.id, data: message })
        break
      case DataChannelMessageType.ACK_CHAT:
        this._peerDataChannelMessage$.next({ from: user.id, data: message })
        break
    }
  }

  getRoomPropertiesAsObservable(): Observable<RoomProperties> {
    return this._roomPropertiesSubject$
  }
  getUserListAsObservable(): Observable<User[]> {
    return this._userListSubject$
  }
  getPeerConnectionStatusAsObservable(): Observable<
    PeerMessage<PeerConnectionStatus>
  > {
    return this._peerConnectionStatus$
  }
  getPeerDataChannelMessageAsObservable(): Observable<
    PeerMessage<PeerDataChannelMessage>
  > {
    return this._peerDataChannelMessage$
  }
  getPeerDataChannelStateAsObservable(): Observable<
    PeerMessage<PeerDataChannelState>
  > {
    return this._peerDataChannelState$
  }
  getPeerStreamAsObservable(): Observable<PeerMessage<PeerStream>> {
    return this._peerStream$
  }

  sendDataChannelMessage(message: PeerDataChannelMessage) {
    this._peerController?.sendMessageToPeers(message)
  }
  updateStream(stream: MediaStream | null) {
    this._peerController?.mergeStream(stream)
  }

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._socketService.send
        .getRoom({})
        .then(response => {
          const { room } = response.data
          const users = room.users.map<User>(user => ({
            ...user,
            ...getUserDefaultConnectionState()
          }))
          const self = users.find(user => {
            return (
              user.name === this._cacheManagerService.getRoom(room.id)?.username
            )
          })
          if (!self) {
            reject()
            return
          }
          this._setRoom({
            self,
            id: room.id,
            name: room.name,
            ownerUsername: room.ownerUsername,
            locked: room.locked,
            users
          })

          this._socketService
            .getMessageObservable()
            .pipe(takeUntil(this._unsubscribeSubject$))
            .subscribe({
              next: this._onSocketMessage
            })

          const peerMessageFiltred$ = new Observable<PeerMessageInOk>(
            subscriber => {
              this._socketService
                .getMessageObservable()
                .pipe(takeUntil(this._unsubscribeSubject$))
                .subscribe({
                  next: message => {
                    if (isPeerMessageOk(message)) {
                      subscriber.next(message)
                    }
                  }
                })
            }
          )
          this._peerController = new PeerController(
            this._room!.users.filter(user => user.id !== self.id).map(
              user => user.id
            ),
            {
              offer: this._socketService.send.offer,
              candidate: this._socketService.send.candidate,
              answer: this._socketService.send.answer
            },
            {
              onOffer$: new Observable(subscriber => {
                peerMessageFiltred$
                  .pipe(takeUntil(this._unsubscribeSubject$))
                  .subscribe({
                    next: message => {
                      if (message.type === MessageType.PUSH_OFFER) {
                        subscriber.next(message.data)
                      }
                    }
                  })
              }),
              onCandidate$: new Observable(subscriber => {
                peerMessageFiltred$
                  .pipe(takeUntil(this._unsubscribeSubject$))
                  .subscribe({
                    next: message => {
                      if (message.type === MessageType.PUSH_CANDIDATE) {
                        subscriber.next(message.data)
                      }
                    }
                  })
              }),
              onAnswer$: new Observable(subscriber => {
                peerMessageFiltred$
                  .pipe(takeUntil(this._unsubscribeSubject$))
                  .subscribe({
                    next: message => {
                      if (message.type === MessageType.PUSH_ANSWER) {
                        subscriber.next(message.data)
                      }
                    }
                  })
              })
            }
          )
          this._peerController
            .getPeerSubjectAsObservable()
            .pipe(takeUntil(this._unsubscribeSubject$))
            .subscribe({
              next: this._onOtherPeerEvent
            })
          resolve()
        })
        .catch(err => {
          console.error(`An error occured while retrieving room data.`)
          reject()
        })
    })
  }

  destroy() {
    this._peerController?.destroy()
    this._unsubscribeSubject$.next()
    this._unsubscribeSubject$.complete()
  }
}
