import { v, TypeOf } from "../../deps/suretype/suretype.ts"
import { MessageType } from "../utils/types.ts"

export const renewTokenSchema = v.object({
  type: v.string().const(MessageType.RENEW_TOKEN).required(),
  token: v.string().required(),
})

export type MessageRenewTokenIn = TypeOf<typeof renewTokenSchema>

export interface MessageRenewTokenOutOk {
  type: MessageType.RENEW_TOKEN
  token: string
}
