import { v, TypeOf } from "../../deps/suretype/suretype.ts"
import { MessageType } from "../utils/types.ts"
import { RoomDTO } from "../model/room.ts"

export const getRoomSchema = v.object({
  type: v.string().const(MessageType.GET_ROOM).required(),
})

export type MessageGetRoomIn = TypeOf<typeof getRoomSchema>

export interface MessageGetRoomOutOk {
  type: MessageType.GET_ROOM
  room: RoomDTO
}
