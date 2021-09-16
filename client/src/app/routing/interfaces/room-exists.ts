import { MessageType } from "../api"

export interface MessageRoomExistsOut {
  type: MessageType.ROOM_EXISTS
  roomId: string
}

export interface MessageRoomExistsInOk {
  type: MessageType.ROOM_EXISTS
  exists: boolean
}
