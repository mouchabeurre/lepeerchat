import { P, ProofType } from "../../../deps/prove/prove.ts"
import { RoomDTO } from "../../model/room.ts"

export const getRoomShape = P.shape({})

export type DataGetRoomIn = ProofType<typeof getRoomShape>

export interface DataGetRoomOutOk {
  room: RoomDTO
}
