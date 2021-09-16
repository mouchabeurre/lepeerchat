import { MessageType } from "../api"
import { UserDTO } from "../../utils/dto/user"

interface Invitation {
  username: string
  roomId: string
  key: string
  password: string
}

interface Token {
  token: string
  username: string
}

export interface MessageJoinRoomOut {
  type: MessageType.JOIN_ROOM
  creditentials: Invitation | Token
}

export interface MessageJoinRoomInOk {
  type: MessageType.JOIN_ROOM
  roomId: string
  roomName: string
  username: string
  token: string
}

export interface MessagePushUserConnectedInOk {
  type: MessageType.PUSH_USER_CONNECTED
  user: UserDTO
}
