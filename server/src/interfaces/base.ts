import { v, TypeOf, compile } from "../../deps/suretype/suretype.ts"
import { usernameValidSchema } from "./username-valid.ts"
import { createRoomSchema } from "./create-room.ts"
import { generateInvitationSchema } from "./generate-invitation.ts"
import { getRoomSchema } from "./get-room.ts"
import { joinRoomSchema } from "./join-room.ts"
import { leaveRoomSchema } from "./leave-room.ts"
import { lockRoomSchema } from "./lock-room.ts"
import { offerSchema } from "./offer.ts"
import { guardSchema } from "./guard.ts"
import { candidateSchema } from "./candidate.ts"
import { answerSchema } from "./answer.ts"
import { renewTokenSchema } from "./renew-token.ts"
import { roomExistsSchema } from "./room-exists.ts"

export const baseMessageSchema = v.object({
  refClient: v.anyOf([v.string(), v.null()]).required(),
  payload: v
    .anyOf([
      usernameValidSchema,
      createRoomSchema,
      generateInvitationSchema,
      getRoomSchema,
      guardSchema,
      joinRoomSchema,
      leaveRoomSchema,
      lockRoomSchema,
      offerSchema,
      roomExistsSchema,
      candidateSchema,
      answerSchema,
      renewTokenSchema,
    ])
    .required(),
})

export type BaseMessage = TypeOf<typeof baseMessageSchema>

const ensureBaseMessage = compile(baseMessageSchema, { ensure: true })
export function validateBaseMessage(message: string): Promise<BaseMessage> {
  try {
    const result = ensureBaseMessage(JSON.parse(message))
    return Promise.resolve(result)
  } catch (error) {
    return Promise.reject(error)
  }
}
