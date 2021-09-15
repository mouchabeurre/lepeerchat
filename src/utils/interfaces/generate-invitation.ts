import { P, ProofType } from "../../../deps/prove/prove.ts"
import { InvitationDTO } from "../../model/invitation.ts"

export const generateInvitationShape = P.shape({})

export type DataGenerateInvitationIn = ProofType<typeof generateInvitationShape>

export interface DataGenerateInvitationOutOk {
  invitation: InvitationDTO
}
