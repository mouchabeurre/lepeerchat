import { MessageType } from "../api"

export interface MessageCreateRoomOut {
  type: MessageType.CREATE_ROOM
  roomName: string
  username: string
}

export interface MessageCreateRoomInOk {
  type: MessageType.CREATE_ROOM
  token: string
  roomName: string
  roomId: string
  userId: string
  username: string
}
