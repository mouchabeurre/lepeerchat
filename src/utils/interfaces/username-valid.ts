import { P, ProofType } from "../../../deps/prove/prove.ts"
import { USERNAME } from "../constants.ts"

export const usernameValidShape = P.shape({
  username: P.string(
    x => !!x.match(USERNAME.CHARS_REGEX) || "invalid charaters"
  )(x => x.length >= USERNAME.MIN_LENGTH || "too short")(
    x => x.length <= USERNAME.MAX_LENGTH || "too long"
  ),
  roomId: P.string,
  token: P.optional(P.string)
})

export type DataUsernameValidIn = ProofType<typeof usernameValidShape>

export interface DataUsernameValidOutOk {
  username: string
}
