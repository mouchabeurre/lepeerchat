import { MessageType } from "../api"

export interface MessageOfferOut {
  type: MessageType.OFFER
  id: string
  description: RTCSessionDescription
}

export interface MessageOfferInOk {
  type: MessageType.OFFER
}

export interface MessagePushOfferInOk {
  type: MessageType.PUSH_OFFER
  id: string
  description: RTCSessionDescription
}
