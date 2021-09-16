import { Controller } from "./controller.ts"
import { MessageType } from "./utils/types.ts"
import { validateBaseMessage } from "./interfaces/base.ts"
import { User } from "./model/user.ts"
import { log } from "../deps/std/log/log.ts"
import { logger } from "./utils/logger.ts"

export class WebSocketRouter {
  private _controller: Controller
  constructor(controller: Controller) {
    this._controller = controller
  }

  private _log<
    T extends log.Logger,
    K extends keyof Pick<T, "debug" | "info" | "warning" | "error" | "critical">
  >(obj: T, key: K, msg: string) {
    return obj[key](`ROUTER: ${msg}`)
  }

  handleMessage(user: User, rawMessage: string) {
    validateBaseMessage(rawMessage)
      .then(baseMessage => {
        switch (baseMessage.payload.type) {
          case MessageType.USERNAME_VALID:
            this._controller.usernameValid(
              user,
              baseMessage.payload,
              baseMessage.refClient
            )
            break
          case MessageType.CREATE_ROOM:
            this._controller.createRoom(
              user,
              baseMessage.payload,
              baseMessage.refClient
            )
            break
          case MessageType.GENERATE_INVITATION:
            this._controller.generateInvitation(
              user,
              baseMessage.payload,
              baseMessage.refClient
            )
            break
          case MessageType.JOIN_ROOM:
            this._controller.joinRoom(
              user,
              baseMessage.payload,
              baseMessage.refClient
            )
            break
          case MessageType.GET_ROOM:
            this._controller.getRoom(
              user,
              baseMessage.payload,
              baseMessage.refClient
            )
            break
          case MessageType.OFFER:
            this._controller.offer(
              user,
              baseMessage.payload,
              baseMessage.refClient
            )
            break
          case MessageType.CANDIDATE:
            this._controller.candidate(
              user,
              baseMessage.payload,
              baseMessage.refClient
            )
            break
          case MessageType.ANSWER:
            this._controller.answer(
              user,
              baseMessage.payload,
              baseMessage.refClient
            )
            break
          case MessageType.GUARD:
            this._controller.guard(
              user,
              baseMessage.payload,
              baseMessage.refClient
            )
            break
          case MessageType.ROOM_EXISTS:
            this._controller.roomExists(
              user,
              baseMessage.payload,
              baseMessage.refClient
            )
            break
          case MessageType.LOCK_ROOM:
            this._controller.lockRoom(
              user,
              baseMessage.payload,
              baseMessage.refClient
            )
            break
          case MessageType.LEAVE_ROOM:
            this._controller.leaveRoom(
              user,
              baseMessage.payload,
              baseMessage.refClient
            )
            break
          case MessageType.RENEW_TOKEN:
            this._controller.renewToken(
              user,
              baseMessage.payload,
              baseMessage.refClient
            )
            break
        }
      })
      .catch(error => {
        this._log(logger, "warning", `message validation error: ${error}`)
      })
  }
}
