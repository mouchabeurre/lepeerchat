import { v, TypeOf } from "../../deps/suretype/suretype.ts"
import { MessageType } from "../utils/types.ts"
import { InvitationDTO } from "../model/invitation.ts"

export const generateInvitationSchema = v.object({
  type: v.string().const(MessageType.GENERATE_INVITATION).required(),
})

export type MessageGenerateInvitationIn = TypeOf<
  typeof generateInvitationSchema
>

export interface MessageGenerateInvitationOutOk {
  type: MessageType.GENERATE_INVITATION
  invitation: InvitationDTO
}
