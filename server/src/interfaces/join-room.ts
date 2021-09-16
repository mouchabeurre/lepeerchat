import { v, TypeOf } from "../../deps/suretype/suretype.ts"
import { MessageType } from "../utils/types.ts"
import { RoomUserDTO } from "../model/room.ts"
import { USERNAME } from "../utils/constants.ts"

const invitationSchema = v.object({
  key: v.string().required(),
  password: v.string().required(),
  roomId: v.string().required(),
  username: v
    .string()
    .matches(USERNAME.CHARS_REGEX)
    .minLength(USERNAME.MIN_LENGTH)
    .maxLength(USERNAME.MAX_LENGTH)
    .required(),
})

const tokenSchema = v.object({
  token: v.string().required(),
  username: v.string().required(),
})

export const joinRoomSchema = v.object({
  type: v.string().const(MessageType.JOIN_ROOM).required(),
  creditentials: v.anyOf([invitationSchema, tokenSchema]).required(),
})

export type MessageJoinRoomIn = TypeOf<typeof joinRoomSchema>

export interface MessageJoinRoomOutOk {
  type: MessageType.JOIN_ROOM
  roomId: string
  roomName: string
  username: string
  token: string
}

export interface MessagePushUserConnectedOutOk {
  type: MessageType.PUSH_USER_CONNECTED
  user: RoomUserDTO
}

export function isCreditentialToken(
  data: MessageJoinRoomIn["creditentials"]
): data is TypeOf<typeof tokenSchema> {
  return !!(data as TypeOf<typeof tokenSchema>).token
}
