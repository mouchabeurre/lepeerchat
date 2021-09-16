import { MessageType } from "../api"

export interface MessageGuardOut {
  type: MessageType.GUARD
  roomId: string
  token: string
}

export interface MessageGuardInOk {
  type: MessageType.GUARD
}
