import { v, TypeOf } from "../../deps/suretype/suretype.ts"
import { MessageType } from "../utils/types.ts"

export const guardSchema = v.object({
  type: v.string().const(MessageType.GUARD).required(),
  roomId: v.string().required(),
  token: v.string().required(),
})

export type MessageGuardIn = TypeOf<typeof guardSchema>

export interface MessageGuardOutOk {
  type: MessageType.GUARD
}
