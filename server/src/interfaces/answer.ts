import { v, TypeOf } from "../../deps/suretype/suretype.ts"
import { MessageType } from "../utils/types.ts"

export const answerSchema = v.object({
  type: v.string().const(MessageType.ANSWER).required(),
  id: v.string().required(),
  description: v.unknown().required(),
})

export type MessageAnswerIn = TypeOf<typeof answerSchema>

export interface MessageAnswerOutOk {
  type: MessageType.ANSWER
}

export interface MessagePushAnswerOutOk {
  type: MessageType.PUSH_ANSWER
  id: string
  description: MessageAnswerIn["description"]
}
