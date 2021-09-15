import { P, ProofType } from "../../../deps/prove/prove.ts"
import { MessageType } from "../api.ts"
import { usernameValidShape } from "./username-valid.ts"
import { createRoomShape } from "./create-room.ts"
import { generateInvitationShape } from "./generate-invitation.ts"
import { getRoomShape } from "./get-room.ts"
import { offerShape } from "./offer.ts"
import { candidateShape } from "./candidate.ts"
import { answerShape } from "./answer.ts"
import { renewTokenShape } from "./renew-token.ts"

export const baseValidShape = P.shape({
  refClient: P.or(P.string, P.null),
  payload: P.shape({
    type: P<MessageType>(x => {
      if (typeof x === "string" && Object.values(MessageType).includes(x)) {
        return true
      } else {
        return "invalid message type"
      }
    }),
    data: P.or(
      usernameValidShape,
      createRoomShape,
      generateInvitationShape,
      getRoomShape,
      offerShape,
      candidateShape,
      answerShape,
      renewTokenShape
    )
  })
})

export type baseValidProof = ProofType<typeof baseValidShape>
