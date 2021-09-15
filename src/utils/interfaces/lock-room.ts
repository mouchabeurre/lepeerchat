import { P, ProofType } from "../../../deps/prove/prove.ts"

export const lockRoomShape = P.shape({
  locked: P.boolean
})

export type DataLockRoomIn = ProofType<typeof lockRoomShape>

export interface DataLockRoomOutOk {
  locked: boolean
}

export interface DataPushLockRoomOutOk {
  locked: boolean
}
