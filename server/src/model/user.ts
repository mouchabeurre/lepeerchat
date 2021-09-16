import { nanoid } from "../../deps/nanoid/nanoid.ts"
import {
  MessageOutOk,
  MessageOutErr,
  InternalSocketMessage,
} from "../utils/types.ts"
import { Serializable } from "../utils/types.ts"
import { GC } from "../utils/constants.ts"
import { KeepAlive } from "../utils/types.ts"
import { log } from "../../deps/std/log/log.ts"
import { logger } from "../utils/logger.ts"

export interface UserDTO {
  id: string
}

export interface Sendable {
  send(message: MessageOutOk | MessageOutErr, refClient: string | null): void
}
export class User implements Sendable, Serializable<UserDTO> {
  readonly id: string
  private _roomId: string | null
  private _ws: WebSocket
  private _lastPong: number
  constructor(socket: WebSocket, id = nanoid()) {
    this.id = id
    this._roomId = null
    this._ws = socket
    this._lastPong = Date.now()
    this._log(logger, "info", "new user")
  }

  private _log<
    T extends log.Logger,
    K extends keyof Pick<T, "debug" | "info" | "warning" | "error" | "critical">
  >(obj: T, key: K, msg: string) {
    return obj[key](`USER[${this.id}]: ${msg}`)
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
    return this._ws.readyState === this._ws.OPEN
  }

  send(message: MessageOutOk | MessageOutErr, refClient: string | null) {
    if (this.isOpened()) {
      this._ws.send(
        JSON.stringify(<InternalSocketMessage<typeof message>>{
          refClient,
          payload: message,
        })
      )
    }
  }

  ping() {
    if (this.isOpened()) {
      this._ws.send(KeepAlive.Ping)
    }
  }

  isDisconnected(now: number) {
    return (
      !this.isOpened() && now - this._lastPong > GC.KEEP_ALIVE_ACCEPTABLE_DELAY
    )
  }

  toDTO(): UserDTO {
    return { id: this.id }
  }
}
