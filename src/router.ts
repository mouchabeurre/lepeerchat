import { MessageType, AnyMessageIn } from "./utils/api.ts"
import { User } from "./model/user.ts"
import { validateBase, isValidationSuccess } from "./utils/validator.ts"
import { Logger } from "./utils/logger.ts"

export type RouteHandler = (
  user: User,
  anyMessage: AnyMessageIn,
  refClient: string
) => void

export class Router extends Logger {
  private _routesMap: Map<MessageType, RouteHandler>
  constructor() {
    super("web socket router")
    this._routesMap = new Map()
  }

  use(endpoint: MessageType, callback: RouteHandler): this {
    this._routesMap.set(endpoint, callback)
    return this
  }

  handleMessage(user: User, message: string) {
    const vResult = validateBase(message)
    if (!isValidationSuccess(vResult)) {
      this.log.warning("base message validation error", vResult[0])
    } else {
      const handler = this._routesMap.get(vResult[1].anyMessage.anyType)
      if (!handler) {
        this.log.warning(
          "router doesn't support endpoint",
          vResult[1].anyMessage.anyType
        )
      } else {
        handler(user, vResult[1].anyMessage, vResult[1].refClient)
      }
    }
  }
}
