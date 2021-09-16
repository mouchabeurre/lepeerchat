import { MessageType } from "../api"
import { RoomDTO } from "../../utils/dto/room"

export interface MessageGetRoomOut {
  type: MessageType.GET_ROOM
}

export interface MessageGetRoomInOk {
  type: MessageType.GET_ROOM
  room: RoomDTO
}
