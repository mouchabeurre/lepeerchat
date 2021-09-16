import { v, TypeOf } from "../../deps/suretype/suretype.ts"
import { MessageType } from "../utils/types.ts"
import { USERNAME } from "../utils/constants.ts"

export const usernameValidSchema = v.object({
  type: v.string().const(MessageType.USERNAME_VALID).required(),
  username: v
    .string()
    .matches(USERNAME.CHARS_REGEX)
    .minLength(USERNAME.MIN_LENGTH)
    .maxLength(USERNAME.MAX_LENGTH)
    .required(),
  roomId: v.string().required(),
  token: v.string(),
})

export type MessageUsernameValidIn = TypeOf<typeof usernameValidSchema>

export interface MessageUsernameValidOutOk {
  type: MessageType.USERNAME_VALID
  username: string
}
