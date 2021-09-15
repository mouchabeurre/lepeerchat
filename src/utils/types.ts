export type HashMap<T> = Map<string, T>

export interface Serializable<T extends {}> {
  toDTO: () => T
}

type RTCSdpType = "answer" | "offer" | "pranswer" | "rollback"
export interface RTCSessionDescription {
  readonly sdp: string
  readonly type: RTCSdpType
}

type RTCIceComponent = "rtcp" | "rtp"
type RTCIceProtocol = "tcp" | "udp"
type RTCIceTcpCandidateType = "active" | "passive" | "so"
type RTCIceCandidateType = "host" | "prflx" | "relay" | "srflx"
export interface RTCIceCandidate {
  readonly candidate: string
  readonly component: RTCIceComponent | null
  readonly foundation: string | null
  readonly port: number | null
  readonly priority: number | null
  readonly protocol: RTCIceProtocol | null
  readonly relatedAddress: string | null
  readonly relatedPort: number | null
  readonly sdpMLineIndex: number | null
  readonly sdpMid: string | null
  readonly tcpType: RTCIceTcpCandidateType | null
  readonly type: RTCIceCandidateType | null
  readonly usernameFragment: string | null
}
