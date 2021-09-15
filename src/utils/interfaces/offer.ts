import { P, ProofType } from "../../../deps/prove/prove.ts"
import { RTCSessionDescription } from "../types.ts"

export const offerShape = P.shape({
  id: P.string,
  description: P<RTCSessionDescription>(x => {
    if (x.type === "offer" && typeof x.sdp === "string") {
      return true
    } else {
      return "invalid offer description"
    }
  })
})

export type DataOfferIn = ProofType<typeof offerShape>

export interface DataOfferOutOk {}

export interface DataPushOfferOutOk {
  id: string
  description: RTCSessionDescription
}
