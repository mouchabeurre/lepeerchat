import { MessageType } from "../api"

export interface MessageLeaveRoomOut {
  type: MessageType.LEAVE_ROOM
}

export interface MessageLeaveRoomInOk {
  type: MessageType.LEAVE_ROOM
}

export interface MessagePushUserDisconnectedInOk {
  type: MessageType.PUSH_USER_DISCONNECTED
  userId: string
}
