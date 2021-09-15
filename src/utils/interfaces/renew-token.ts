import { P, ProofType } from "../../../deps/prove/prove.ts"

export const renewTokenShape = P.shape({
  token: P.string
})

export type DataRenewTokenIn = ProofType<typeof renewTokenShape>

export interface DataRenewTokenOutOk {
  token: string
}
