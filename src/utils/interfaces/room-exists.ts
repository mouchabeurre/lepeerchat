import { P, ProofType } from "../../../deps/prove/prove.ts"

export const roomExistsShape = P.shape({
  roomId: P.string
})

export type DataRoomExistsIn = ProofType<typeof roomExistsShape>

export interface DataRoomExistsOutOk {
  exists: boolean
}
