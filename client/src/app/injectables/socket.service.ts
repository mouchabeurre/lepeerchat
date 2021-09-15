import { Injectable } from "@angular/core"
import {
  WebSocketProxy,
  SocketState,
  SocketEvent
} from "../utils/web-socket-proxy"
import { environment } from "src/environments/environment"
import { Observable } from "rxjs"
import { first } from "rxjs/operators"
import {
  MessageIn,
  MessageInOk,
  MessageInErr,
  MessageOut,
  DataOut,
  MessageCreateRoomInOk,
  MessageCreateRoomInErr,
  MessageCreateRoomOut,
  MessageType,
  MessageUsernameValidInOk,
  MessageUsernameValidInErr,
  MessageUsernameValidOut,
  MessageGenerateInvitationInOk,
  MessageGenerateInvitationInErr,
  MessageGenerateInvitationOut,
  MessageJoinRoomInOk,
  MessageJoinRoomInErr,
  MessageJoinRoomOut,
  MessageGetRoomInOk,
  MessageGetRoomInErr,
  MessageGetRoomOut,
  MessageOfferInOk,
  MessageOfferInErr,
  MessageOfferOut,
  MessageCandidateInOk,
  MessageCandidateInErr,
  MessageCandidateOut,
  MessageAnswerInOk,
  MessageAnswerInErr,
  MessageAnswerOut,
  MessageGuardInOk,
  MessageGuardInErr,
  MessageGuardOut,
  MessageRoomExistsInOk,
  MessageRoomExistsInErr,
  MessageRoomExistsOut,
  MessageLockRoomInOk,
  MessageLockRoomInErr,
  MessageLockRoomOut,
  MessageLeaveRoomInOk,
  MessageLeaveRoomInErr,
  MessageLeaveRoomOut
} from "../utils/api"
import { DataCreateRoomOut } from "../utils/interfaces/create-room"
import { DataUsernameValidOut } from "../utils/interfaces/username-valid"
import { DataGenerateInvitationOut } from "../utils/interfaces/generate-invitation"
import { DataJoinRoomOut } from "../utils/interfaces/join-room"
import { DataGetRoomOut } from "../utils/interfaces/get-room"
import { DataOfferOut } from "../utils/interfaces/offer"
import { DataCandidateOut } from "../utils/interfaces/candidate"
import { DataAnswerOut } from "../utils/interfaces/answer"
import { DataGuardOut } from "../utils/interfaces/guard"
import { DataRoomExistsOut } from "../utils/interfaces/room-exists"
import { DataLockRoomOut } from "../utils/interfaces/lock-room"
import { DataLeaveRoomOut } from "../utils/interfaces/leave-room"

function isErrorMessage(message: MessageIn): message is MessageInErr {
  return !!(message as MessageInErr).error
}

interface CallableRoutesMap {
  createRoom: (data: DataCreateRoomOut) => Promise<MessageCreateRoomInOk>
  usernameValid: (
    data: DataUsernameValidOut
  ) => Promise<MessageUsernameValidInOk>
  generateInvitation: (
    data: DataGenerateInvitationOut
  ) => Promise<MessageGenerateInvitationInOk>
  joinRoom: (data: DataJoinRoomOut) => Promise<MessageJoinRoomInOk>
  getRoom: (data: DataGetRoomOut) => Promise<MessageGetRoomInOk>
  offer: (data: DataOfferOut) => Promise<MessageOfferInOk>
  candidate: (data: DataCandidateOut) => Promise<MessageCandidateInOk>
  answer: (data: DataAnswerOut) => Promise<MessageAnswerInOk>
  guard: (data: DataGuardOut) => Promise<MessageGuardInOk>
  roomExists: (data: DataRoomExistsOut) => Promise<MessageRoomExistsInOk>
  lockRoom: (data: DataLockRoomOut) => Promise<MessageLockRoomInOk>
  leaveRoom: (data: DataLeaveRoomOut) => Promise<MessageLeaveRoomInOk>
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
      return this._send<MessageCreateRoomInOk, MessageCreateRoomInErr>(<
        MessageCreateRoomOut
      >{
        type: MessageType.CREATE_ROOM,
        data
      })
    },
    usernameValid: data => {
      return this._send<MessageUsernameValidInOk, MessageUsernameValidInErr>(<
        MessageUsernameValidOut
      >{
        type: MessageType.USERNAME_VALID,
        data
      })
    },
    generateInvitation: data => {
      return this._send<
        MessageGenerateInvitationInOk,
        MessageGenerateInvitationInErr
      >(<MessageGenerateInvitationOut>{
        type: MessageType.GENERATE_INVITATION,
        data
      })
    },
    joinRoom: data => {
      return this._send<MessageJoinRoomInOk, MessageJoinRoomInErr>(<
        MessageJoinRoomOut
      >{
        type: MessageType.JOIN_ROOM,
        data
      })
    },
    getRoom: data => {
      return this._send<MessageGetRoomInOk, MessageGetRoomInErr>(<
        MessageGetRoomOut
      >{
        type: MessageType.GET_ROOM,
        data
      })
    },
    offer: data => {
      return this._send<MessageOfferInOk, MessageOfferInErr>(<MessageOfferOut>{
        type: MessageType.OFFER,
        data
      })
    },
    candidate: data => {
      return this._send<MessageCandidateInOk, MessageCandidateInErr>(<
        MessageCandidateOut
      >{
        type: MessageType.CANDIDATE,
        data
      })
    },
    answer: data => {
      return this._send<MessageAnswerInOk, MessageAnswerInErr>(<
        MessageAnswerOut
      >{
        type: MessageType.ANSWER,
        data
      })
    },
    guard: data => {
      return this._send<MessageGuardInOk, MessageGuardInErr>(<MessageGuardOut>{
        type: MessageType.GUARD,
        data
      })
    },
    roomExists: data => {
      return this._send<MessageRoomExistsInOk, MessageRoomExistsInErr>(<
        MessageRoomExistsOut
      >{
        type: MessageType.ROOM_EXISTS,
        data
      })
    },
    lockRoom: data => {
      return this._send<MessageLockRoomInOk, MessageLockRoomInErr>(<
        MessageLockRoomOut
      >{
        type: MessageType.LOCK_ROOM,
        data
      })
    },
    leaveRoom: data => {
      return this._send<MessageLeaveRoomInOk, MessageLeaveRoomInErr>(<
        MessageLeaveRoomOut
      >{
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

  private _send<Ok extends MessageInOk, Err extends MessageInErr>(
    message: MessageOut
  ): Promise<Ok> {
    return new Promise((resolve, reject) => {
      this._proxy
        .send(message)
        .then(response => {
          if (isErrorMessage(response)) {
            reject(response as Err)
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
