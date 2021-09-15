import P, { ProofType } from "ts-prove"

export enum DataChannelMessageType {
  CHAT = "chat",
  ACK_CHAT = "ack-chat",
  PING = "ping",
  OFFER = "offer",
  CANDIDATE = "candidate",
  ANSWER = "answer"
}

// chat
export const chatMessageShape = P.shape({
  type: P<DataChannelMessageType.CHAT>(x => {
    if (typeof x === "string" && x === DataChannelMessageType.CHAT) {
      return true
    } else {
      return "invalid message type"
    }
  }),
  id: P.string,
  date: P.number,
  content: P.string
})

export type DataChatMessageProof = ProofType<typeof chatMessageShape>

// ping
export const pingMessageShape = P.shape({
  type: P<DataChannelMessageType.PING>(x => {
    if (typeof x === "string" && x === DataChannelMessageType.PING) {
      return true
    } else {
      return "invalid message type"
    }
  }),
  remoteInitiated: P.boolean,
  id: P.string
})

// ack-chat
export const ackChatMessageShape = P.shape({
  type: P<DataChannelMessageType.ACK_CHAT>(x => {
    if (typeof x === "string" && x === DataChannelMessageType.ACK_CHAT) {
      return true
    } else {
      return "invalid message type"
    }
  }),
  messageId: P.string
})

export type DataAckChatMessageProof = ProofType<typeof ackChatMessageShape>

// offer
export const offerMessageShape = P.shape({
  type: P<DataChannelMessageType.OFFER>(x => {
    if (typeof x === "string" && x === DataChannelMessageType.OFFER) {
      return true
    } else {
      return "invalid message type"
    }
  }),
  description: P<RTCSessionDescription>(x => {
    if (x.type === "offer" && typeof x.sdp === "string") {
      return true
    } else {
      return "invalid offer description"
    }
  })
})

export type DataOfferMessageProof = ProofType<typeof offerMessageShape>

// candidate
export const candidateMessageShape = P.shape({
  type: P<DataChannelMessageType.CANDIDATE>(x => {
    if (typeof x === "string" && x === DataChannelMessageType.CANDIDATE) {
      return true
    } else {
      return "invalid message type"
    }
  }),
  candidate: P<RTCIceCandidate>(x => {
    if (typeof x.candidate === "string") {
      return true
    } else {
      return "invalid candidate description"
    }
  })
})

export type DataCandidateMessageProof = ProofType<typeof candidateMessageShape>

// answer
export const answerMessageShape = P.shape({
  type: P<DataChannelMessageType.ANSWER>(x => {
    if (typeof x === "string" && x === DataChannelMessageType.ANSWER) {
      return true
    } else {
      return "invalid message type"
    }
  }),
  description: P<RTCSessionDescription>(x => {
    if (x.type === "answer" && typeof x.sdp === "string") {
      return true
    } else {
      return "invalid answer description"
    }
  })
})

export type DataAnswerMessageProof = ProofType<typeof answerMessageShape>

export type DataPingMessageProof = ProofType<typeof pingMessageShape>

export const baseMessageValidShape = P.or(
  chatMessageShape,
  pingMessageShape,
  ackChatMessageShape,
  offerMessageShape,
  candidateMessageShape,
  answerMessageShape
)

export type baseMessageValidProof = ProofType<typeof baseMessageValidShape>
