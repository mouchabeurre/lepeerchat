import { UserDTO } from "./user"

export interface RoomDTO {
  id: string
  locked: boolean
  name: string
  ownerUsername: string
  users: UserDTO[]
}
