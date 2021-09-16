import { MessageType } from "../api"

export interface MessageRenewTokenOut {
  type: MessageType.RENEW_TOKEN
  token: string
}

export interface MessageRenewTokenInOk {
  type: MessageType.RENEW_TOKEN
  token: string
}
