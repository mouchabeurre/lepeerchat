import { P, ProofType } from "../../../deps/prove/prove.ts"
import { RTCSessionDescription } from "../types.ts"

export const answerShape = P.shape({
  id: P.string,
  description: P<RTCSessionDescription>(x => {
    if (x.type === "answer" && typeof x.sdp === "string") {
      return true
    } else {
      return "invalid answer description"
    }
  })
})

export type DataAnswerIn = ProofType<typeof answerShape>

export interface DataAnswerOutOk {}

export interface DataPushAnswerOutOk {
  id: string
  description: RTCSessionDescription
}
