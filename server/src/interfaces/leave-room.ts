import { v, TypeOf } from "../../deps/suretype/suretype.ts"
import { MessageType } from "../utils/types.ts"

export const leaveRoomSchema = v.object({
  type: v.string().const(MessageType.LEAVE_ROOM).required(),
})

export type MessageLeaveRoomIn = TypeOf<typeof leaveRoomSchema>

export interface MessageLeaveRoomOutOk {
  type: MessageType.LEAVE_ROOM
}

export interface MessagePushUserDisconnectedOutOk {
  type: MessageType.PUSH_USER_DISCONNECTED
  userId: string
}
