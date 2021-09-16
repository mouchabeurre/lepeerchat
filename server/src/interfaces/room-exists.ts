import { v, TypeOf } from "../../deps/suretype/suretype.ts"
import { MessageType } from "../utils/types.ts"

export const roomExistsSchema = v.object({
  type: v.string().const(MessageType.ROOM_EXISTS).required(),
  roomId: v.string().required(),
})

export type MessageRoomExistsIn = TypeOf<typeof roomExistsSchema>

export interface MessageRoomExistsOutOk {
  type: MessageType.ROOM_EXISTS
  exists: boolean
}
