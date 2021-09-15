import { UserDTO } from "../dto/user"

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

export type DataJoinRoomOut = Invitation | Token

export interface DataJoinRoomInOk {
  roomId: string
  roomName: string
  username: string
  token: string
}

export interface DataPushUserConnectedInOk {
  user: UserDTO
}
