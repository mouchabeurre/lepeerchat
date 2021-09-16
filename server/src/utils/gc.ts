import { Room } from "../model/room.ts"
import { GC } from "./constants.ts"
import { HashMap } from "../utils/types.ts"
import { MessagePushUserDisconnectedOutOk } from "../interfaces/leave-room.ts"
import { User } from "../model/user.ts"
import { MessageType } from "./types.ts"
import { validateToken } from "./jwt.ts"
import { log } from "../../deps/std/log/log.ts"
import { logger } from "./logger.ts"

type CleanerFunction = (now: number) => void

const interval = 1000 * 60 * 2

export class GarbageCollector {
  private _rooms: HashMap<Room>
  private _users: HashMap<User>
  private _intervalRef: undefined | number
  constructor(rooms: HashMap<Room>, users: HashMap<User>) {
    this._rooms = rooms
    this._users = users
    this.start()
  }

  private _log<
    T extends log.Logger,
    K extends keyof Pick<T, "debug" | "info" | "warning" | "error" | "critical">
  >(obj: T, key: K, msg: string) {
    return obj[key](`CLEANER: ${msg}`)
  }

  private _executeCleaners(now: number, cleaners: CleanerFunction[]) {
    for (const cleaner of cleaners) {
      cleaner(now)
    }
  }

  private _cleanEmptyRooms: CleanerFunction = (now: number) => {
    for (const [, room] of this._rooms) {
      if (
        room.getUsers().size === 0 &&
        room.getLastVisitorDate() + GC.EMPTY_ROOM_LIFESPAN < now
      ) {
        this._log(logger, "info", `cleaning room ${room.id}`)
        this._rooms.delete(room.id)
      }
    }
  }

  private _cleanDisconnectedUsers: CleanerFunction = (now: number) => {
    for (const [, user] of this._users) {
      if (user.isDisconnected(now)) {
        const userRoomId = user.getRoomId()
        if (userRoomId !== null) {
          const room = this._rooms.get(userRoomId)
          if (room) {
            this._log(
              logger,
              "info",
              `cleaning user ${user.id} from room ${room.id}`
            )
            room.removeUser(user)
            const notifyOtherResponse: MessagePushUserDisconnectedOutOk = {
              type: MessageType.PUSH_USER_DISCONNECTED,
              userId: user.id,
            }
            for (const [, user] of room.getUsers()) {
              user.send(notifyOtherResponse, null)
            }
          }
        }
        this._users.delete(user.id)
        this._log(logger, "info", `cleaning user ${user.id}`)
      }
    }
  }

  private _cleanExpiredRoomMemory: CleanerFunction = (now: number) => {
    for (const [, room] of this._rooms) {
      for (const [key, token] of room.getTokenMemory()) {
        validateToken(token).catch(() => {
          room.getTokenMemory().delete(key)
          this._log(logger, "info", `cleaning token for user ${key}`)
        })
      }
    }
  }

  private _cleanExpiredInvitations: CleanerFunction = (now: number) => {
    for (const [, room] of this._rooms) {
      for (const [, invitation] of room.getInvitations()) {
        if (invitation.expireAt < now) {
          room.removeInvitation(invitation)
          this._log(
            logger,
            "info",
            `cleaning expired invitation ${invitation.id}`
          )
        }
      }
    }
  }

  start() {
    if (this._intervalRef) {
      return
    }
    this._intervalRef = setInterval(() => {
      const start = Date.now()
      this._executeCleaners(start, [
        this._cleanDisconnectedUsers,
        this._cleanEmptyRooms,
        this._cleanExpiredRoomMemory,
        this._cleanExpiredInvitations,
      ])
      const elapsed = Date.now() - start
      this._log(
        logger,
        "info",
        `done cleaning (${elapsed}ms): ${this._rooms.size} room${
          this._rooms.size > 1 ? "s" : ""
        }, ${this._users.size} user${this._users.size > 1 ? "s" : ""}`
      )
    }, interval)
  }

  stop() {
    clearInterval(this._intervalRef)
  }
}
