import { P, ProofType } from "../../../deps/prove/prove.ts"
import { ROOM_NAME, USERNAME } from "../constants.ts"

export const createRoomShape = P.shape({
  roomName: P.string(
    x => !!x.match(ROOM_NAME.CHARS_REGEX) || "invalid charaters"
  )(x => x.length >= ROOM_NAME.MIN_LENGTH || "too short")(
    x => x.length <= ROOM_NAME.MAX_LENGTH || "too long"
  ),
  username: P.string(
    x => !!x.match(USERNAME.CHARS_REGEX) || "invalid charaters"
  )(x => x.length >= USERNAME.MIN_LENGTH || "too short")(
    x => x.length <= USERNAME.MAX_LENGTH || "too long"
  )
})

export type DataCreateRoomIn = ProofType<typeof createRoomShape>

export interface DataCreateRoomOutOk {
  token: string
  roomName: string
  roomId: string
  userId: string
  username: string
}
