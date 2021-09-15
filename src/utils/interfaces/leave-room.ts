import { P, ProofType } from "../../../deps/prove/prove.ts"

export const leaveRoomShape = P.shape({})

export type DataLeaveRoomIn = ProofType<typeof leaveRoomShape>

export interface DataLeaveRoomOutOk {}

export interface DataPushUserDisconnectedOutOk {
  userId: string
}
