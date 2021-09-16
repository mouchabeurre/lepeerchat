import { MessageType } from "../api"

export interface MessageUsernameValidOut {
  type: MessageType.USERNAME_VALID
  username: string
  roomId: string
  token?: string
}

export interface MessageUsernameValidInOk {
  type: MessageType.USERNAME_VALID
  username: string
}
