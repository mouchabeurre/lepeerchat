import { v, TypeOf } from "../../deps/suretype/suretype.ts"
import { MessageType } from "../utils/types.ts"

export const candidateSchema = v.object({
  type: v.string().const(MessageType.CANDIDATE).required(),
  id: v.string().required(),
  candidate: v.unknown().required(),
})

export type MessageCandidateIn = TypeOf<typeof candidateSchema>

export interface MessageCandidateOutOk {
  type: MessageType.CANDIDATE
}

export interface MessagePushCandidateOutOk {
  type: MessageType.PUSH_CANDIDATE
  id: string
  candidate: MessageCandidateIn["candidate"]
}
