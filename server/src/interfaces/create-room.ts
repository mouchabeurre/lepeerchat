import { v, TypeOf } from "../../deps/suretype/suretype.ts"
import { MessageType } from "../utils/types.ts"
import { ROOM_NAME, USERNAME } from "../utils/constants.ts"

export const createRoomSchema = v.object({
  type: v.string().const(MessageType.CREATE_ROOM).required(),
  roomName: v
    .string()
    .matches(ROOM_NAME.CHARS_REGEX)
    .minLength(ROOM_NAME.MIN_LENGTH)
    .maxLength(ROOM_NAME.MAX_LENGTH)
    .required(),
  username: v
    .string()
    .matches(USERNAME.CHARS_REGEX)
    .minLength(USERNAME.MIN_LENGTH)
    .maxLength(USERNAME.MAX_LENGTH)
    .required(),
})

export type MessageCreateRoomIn = TypeOf<typeof createRoomSchema>

export interface MessageCreateRoomOutOk {
  type: MessageType.CREATE_ROOM
  token: string
  roomName: string
  roomId: string
  userId: string
  username: string
}
