import { P, ProofType } from "../../../deps/prove/prove.ts"

export const guardShape = P.shape({
  roomId: P.string,
  token: P.string
})

export type DataGuardIn = ProofType<typeof guardShape>

export interface DataGuardOutOk {}
