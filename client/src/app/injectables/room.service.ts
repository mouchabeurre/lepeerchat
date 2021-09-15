import { Injectable } from "@angular/core"
import { CacheManagerService } from "./cache-manager.service"
import { SocketService } from "./socket.service"
import {
  PeerConnectionStatus,
  PeerDataChannelMessage,
  PeerDataChannelState,
  PeerMessage,
  PeerStream,
  RoomProperties,
  RoomState,
  User
} from "../utils/room-state"
import { map } from "rxjs/operators"

export enum RoomUpdateKind {
  ROOM_PROPERTIES,
  USER_LIST,
  PEER_CONNECTION_EVENT,
  PEER_STREAM_EVENT,
  PEER_DATA_CHANNEL_STATE,
  PEER_DATA_CHANNEL_MESSAGE
}

export interface RoomPropertiesUpdate {
  kind: RoomUpdateKind.ROOM_PROPERTIES
  content: RoomProperties
}
export interface UserListUpdate {
  kind: RoomUpdateKind.USER_LIST
  content: User[]
}
export interface PeerConnectionEventUpdate {
  kind: RoomUpdateKind.PEER_CONNECTION_EVENT
  content: PeerMessage<PeerConnectionStatus>
}
export interface PeerStreamEventUpdate {
  kind: RoomUpdateKind.PEER_STREAM_EVENT
  content: PeerMessage<PeerStream>
}
export interface PeerDataChannelStateUpdate {
  kind: RoomUpdateKind.PEER_DATA_CHANNEL_STATE
  content: PeerMessage<PeerDataChannelState>
}
export interface PeerDataChannelMessageUpdate {
  kind: RoomUpdateKind.PEER_DATA_CHANNEL_MESSAGE
  content: PeerMessage<PeerDataChannelMessage>
}

export type RoomUpdate =
  | RoomPropertiesUpdate
  | UserListUpdate
  | PeerConnectionEventUpdate
  | PeerStreamEventUpdate
  | PeerDataChannelStateUpdate
  | PeerDataChannelMessageUpdate

@Injectable({
  providedIn: "root"
})
export class RoomService {
  private _roomState: RoomState
  constructor(
    private _socketService: SocketService,
    private _cacheManagerService: CacheManagerService
  ) {}

  init(): Promise<void> {
    this._roomState?.destroy()
    this._roomState = new RoomState(
      this._socketService,
      this._cacheManagerService
    )
    return this._roomState.init()
  }

  getRoomProperties() {
    return this._roomState?.getRoomPropertiesAsObservable()
  }
  getUserList() {
    return this._roomState?.getUserListAsObservable()
  }
  getPeerConnectionEvent() {
    return this._roomState?.getPeerConnectionStatusAsObservable()
  }
  getPeerStreamEvent() {
    return this._roomState?.getPeerStreamAsObservable()
  }
  getPeerDataChannelState() {
    return this._roomState?.getPeerDataChannelStateAsObservable()
  }
  getPeerDataChannelMessage() {
    return this._roomState?.getPeerDataChannelMessageAsObservable()
  }

  getRoomPropertiesAsUpdate() {
    return this._roomState?.getRoomPropertiesAsObservable().pipe(
      map(
        (content): RoomPropertiesUpdate => {
          return { kind: RoomUpdateKind.ROOM_PROPERTIES, content }
        }
      )
    )
  }
  getUserListAsUpdate() {
    return this._roomState?.getUserListAsObservable().pipe(
      map(
        (content): UserListUpdate => {
          return { kind: RoomUpdateKind.USER_LIST, content }
        }
      )
    )
  }
  getPeerConnectionEventAsUpdate() {
    return this._roomState?.getPeerConnectionStatusAsObservable().pipe(
      map(
        (content): PeerConnectionEventUpdate => {
          return { kind: RoomUpdateKind.PEER_CONNECTION_EVENT, content }
        }
      )
    )
  }
  getPeerStreamEventAsUpdate() {
    return this._roomState?.getPeerStreamAsObservable().pipe(
      map(
        (content): PeerStreamEventUpdate => {
          return { kind: RoomUpdateKind.PEER_STREAM_EVENT, content }
        }
      )
    )
  }
  getPeerDataChannelStateAsUpdate() {
    return this._roomState?.getPeerDataChannelStateAsObservable().pipe(
      map(
        (content): PeerDataChannelStateUpdate => {
          return {
            kind: RoomUpdateKind.PEER_DATA_CHANNEL_STATE,
            content
          }
        }
      )
    )
  }
  getPeerDataChannelMessageAsUpdate() {
    return this._roomState?.getPeerDataChannelMessageAsObservable().pipe(
      map(
        (content): PeerDataChannelMessageUpdate => {
          return {
            kind: RoomUpdateKind.PEER_DATA_CHANNEL_MESSAGE,
            content
          }
        }
      )
    )
  }

  sendDataChannelMessage(message: PeerDataChannelMessage) {
    this._roomState.sendDataChannelMessage(message)
  }
  updateStream(stream: MediaStream | null) {
    this._roomState.updateStream(stream)
  }

  destroy() {
    this._roomState?.destroy()
  }
}
