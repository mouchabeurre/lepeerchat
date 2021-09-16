import { MessageType } from "../api"

export interface MessageLockRoomOut {
  type: MessageType.LOCK_ROOM
  locked: boolean
}

export interface MessageLockRoomInOk {
  type: MessageType.LOCK_ROOM
  locked: boolean
}

export interface MessagePushLockRoomInOk {
  type: MessageType.PUSH_LOCK_ROOM
  locked: boolean
}
