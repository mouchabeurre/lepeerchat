import { MessageType } from "../api"

export interface MessageCandidateOut {
  type: MessageType.CANDIDATE
  id: string
  candidate: RTCIceCandidate
}

export interface MessageCandidateInOk {
  type: MessageType.CANDIDATE
}

export interface MessagePushCandidateInOk {
  type: MessageType.PUSH_CANDIDATE
  id: string
  candidate: RTCIceCandidate
}
