import { P, ProofType } from "../../../deps/prove/prove.ts"
import { RoomUserDTO } from "../../model/room.ts"
import { USERNAME } from "../constants.ts"

export const invitationShape = P.shape({
  key: P.string,
  password: P.string,
  roomId: P.string,
  username: P.string(
    x => !!x.match(USERNAME.CHARS_REGEX) || "invalid charaters"
  )(x => x.length >= USERNAME.MIN_LENGTH || "too short")(
    x => x.length <= USERNAME.MAX_LENGTH || "too long"
  )
})

export const tokenShape = P.shape({
  token: P.string,
  username: P.string
})

export const joinRoomShape = P.or(invitationShape, tokenShape)

export type DataJoinRoomIn = ProofType<typeof joinRoomShape>

export interface DataJoinRoomOutOk {
  roomId: string
  roomName: string
  username: string
  token: string
}

export interface DataPushUserConnectedOutOk {
  user: RoomUserDTO
}
