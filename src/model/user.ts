import { WebSocket } from "../../deps/std/ws/ws.ts"
import { nanoid } from "../../deps/nanoid/nanoid.ts"
import {
  MessageOutOk,
  MessageOutErr,
  InternalSocketMessage
} from "../utils/api.ts"
import { Serializable } from "../utils/types.ts"
import { GC } from "../utils/constants.ts"
import { Logger } from "../utils/logger.ts"

export interface UserDTO {
  id: string
}

export interface Sendable {
  send(message: MessageOutOk | MessageOutErr, refClient: string | null): void
}
export class User extends Logger implements Sendable, Serializable<UserDTO> {
  readonly id: string
  private _roomId: string | null
  private _ws: WebSocket
  private _lastPong: number
  constructor(socket: WebSocket, id = nanoid()) {
    super("user", id)
    this.id = id
    this._roomId = null
    this._ws = socket
    this._lastPong = Date.now()
    this.log.info("new user")
  }

  getRoomId() {
    return this._roomId
  }
  setRoomId(roomId: string | null) {
    this._roomId = roomId
  }

  updatePong() {
    this._lastPong = Date.now()
  }
  getLastPong() {
    return this._lastPong
  }

  isOpened() {
    return !this._ws.isClosed
  }

  send(message: MessageOutOk | MessageOutErr, refClient: string | null) {
    if (this.isOpened()) {
      this._ws.send(
        JSON.stringify(<InternalSocketMessage<typeof message>>{
          refClient,
          payload: message
        })
      )
    }
  }

  ping() {
    if (this.isOpened()) {
      this._ws.ping()
    }
  }

  isDisconnected(now: number) {
    return !this.isOpened() && now - this._lastPong > GC.USER_PONG_TIMEOUT
  }

  toDTO(): UserDTO {
    return { id: this.id }
  }
}
