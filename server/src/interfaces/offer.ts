import { v, TypeOf } from "../../deps/suretype/suretype.ts"
import { MessageType } from "../utils/types.ts"

export const offerSchema = v.object({
  type: v.string().const(MessageType.OFFER).required(),
  id: v.string().required(),
  description: v.unknown().required(),
})

export type MessageOfferIn = TypeOf<typeof offerSchema>

export interface MessageOfferOutOk {
  type: MessageType.OFFER
}

export interface MessagePushOfferOutOk {
  type: MessageType.PUSH_OFFER
  id: string
  description: MessageOfferIn["description"]
}
