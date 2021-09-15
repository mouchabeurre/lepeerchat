import { User } from 'src/app/utils/room-state'

export enum ChatMessageType {
  SPECIAL,
  USER
}
export enum SpecialChatMessageType {
  ROOM_SELF,
  ROOM_BROADCAST
}
export interface SpecialChatMessage {
  type: ChatMessageType.SPECIAL
  id: string
  date: Date
  authorType: SpecialChatMessageType
  content: string
}
export interface UserChatMessage {
  type: ChatMessageType.USER
  id: string
  date: Date
  authorName: string
  authorId: string
  content: string
}
export type ChatMessage = SpecialChatMessage | UserChatMessage

export type ChatUser = User & {
  lastRecievedMessageId: string | null
}

