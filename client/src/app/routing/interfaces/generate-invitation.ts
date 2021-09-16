import { MessageType } from "../api"
import { InvitationDTO } from "../../utils/dto/invitation"

export interface MessageGenerateInvitationOut {
  type: MessageType.GENERATE_INVITATION
}

export interface MessageGenerateInvitationInOk {
  type: MessageType.GENERATE_INVITATION
  invitation: InvitationDTO
}
