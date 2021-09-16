import { v, TypeOf } from "../../deps/suretype/suretype.ts"
import { MessageType } from "../utils/types.ts"

export const lockRoomSchema = v.object({
  type: v.string().const(MessageType.LOCK_ROOM).required(),
  locked: v.boolean().required(),
})

export type MessageLockRoomIn = TypeOf<typeof lockRoomSchema>

export interface MessageLockRoomOutOk {
  type: MessageType.LOCK_ROOM
  locked: boolean
}

export interface MessagePushLockRoomOutOk {
  type: MessageType.PUSH_LOCK_ROOM
  locked: boolean
}
