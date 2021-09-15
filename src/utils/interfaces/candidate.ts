import { P, ProofType } from "../../../deps/prove/prove.ts"
import { RTCIceCandidate } from "../types.ts"

export const candidateShape = P.shape({
  id: P.string,
  candidate: P<RTCIceCandidate>(x => {
    if (typeof x.candidate === "string") {
      return true
    } else {
      return "invalid candidate description"
    }
  })
})

export type DataCandidateIn = ProofType<typeof candidateShape>

export interface DataCandidateOutOk {}

export interface DataPushCandidateOutOk {
  id: string
  candidate: RTCIceCandidate
}
