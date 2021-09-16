import { MessageType } from "../api"

export interface MessageAnswerOut {
  type: MessageType.ANSWER
  id: string
  description: RTCSessionDescription
}

export interface MessageAnswerInOk {
  type: MessageType.ANSWER
}

export interface MessagePushAnswerInOk {
  type: MessageType.PUSH_ANSWER
  id: string
  description: RTCSessionDescription
}
