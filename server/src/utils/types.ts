import {
  MessageCreateRoomIn,
  MessageCreateRoomOutOk,
} from "../interfaces/create-room.ts"
import {
  MessageUsernameValidIn,
  MessageUsernameValidOutOk,
} from "../interfaces/username-valid.ts"
import {
  MessageGenerateInvitationIn,
  MessageGenerateInvitationOutOk,
} from "../interfaces/generate-invitation.ts"
import {
  MessageJoinRoomIn,
  MessageJoinRoomOutOk,
  MessagePushUserConnectedOutOk,
} from "../interfaces/join-room.ts"
import {
  MessageGetRoomIn,
  MessageGetRoomOutOk,
} from "../interfaces/get-room.ts"
import {
  MessageOfferIn,
  MessageOfferOutOk,
  MessagePushOfferOutOk,
} from "../interfaces/offer.ts"
import {
  MessageCandidateIn,
  MessageCandidateOutOk,
  MessagePushCandidateOutOk,
} from "../interfaces/candidate.ts"
import {
  MessageAnswerIn,
  MessageAnswerOutOk,
  MessagePushAnswerOutOk,
} from "../interfaces/answer.ts"
import { MessageGuardIn, MessageGuardOutOk } from "../interfaces/guard.ts"
import {
  MessageRoomExistsIn,
  MessageRoomExistsOutOk,
} from "../interfaces/room-exists.ts"
import {
  MessageLockRoomIn,
  MessageLockRoomOutOk,
  MessagePushLockRoomOutOk,
} from "../interfaces/lock-room.ts"
import {
  MessageLeaveRoomIn,
  MessageLeaveRoomOutOk,
  MessagePushUserDisconnectedOutOk,
} from "../interfaces/leave-room.ts"
import {
  MessageRenewTokenIn,
  MessageRenewTokenOutOk,
} from "../interfaces/renew-token.ts"
import { BaseMessage } from "../interfaces/base.ts"
import { User } from "../model/user.ts"

export type HashMap<T> = Map<string, T>

export interface Serializable<T extends {}> {
  toDTO: () => T
}

export enum KeepAlive {
  Ping = "ping",
  Pong = "pong",
}

export type AnyJson = boolean | number | string | null | JsonArray | JsonMap
interface JsonMap {
  [key: string]: AnyJson
}
interface JsonArray extends Array<AnyJson> {}

export type MessageHandler<Payload extends MessageIn> = (
  user: User,
  message: Payload,
  refClient: BaseMessage["refClient"]
) => void

export enum MessageType {
  CREATE_ROOM = "create-room",
  USERNAME_VALID = "username-valid",
  GENERATE_INVITATION = "generate-invitation",
  JOIN_ROOM = "join-room",
  GET_ROOM = "get-room",
  OFFER = "offer",
  CANDIDATE = "candidate",
  ANSWER = "answer",
  GUARD = "guard",
  ROOM_EXISTS = "room-exists",
  LOCK_ROOM = "lock-room",
  LEAVE_ROOM = "leave-room",
  PUSH_OFFER = "push-offer",
  PUSH_CANDIDATE = "push-candidate",
  PUSH_ANSWER = "push-answer",
  RENEW_TOKEN = "renew-token",
  PUSH_USER_CONNECTED = "push-user-connected",
  PUSH_USER_DISCONNECTED = "push-user-disconnected",
  PUSH_LOCK_ROOM = "push-lock-room",
}
export type MessageTypePush =
  | MessageType.PUSH_ANSWER
  | MessageType.PUSH_CANDIDATE
  | MessageType.PUSH_LOCK_ROOM
  | MessageType.PUSH_OFFER
  | MessageType.PUSH_USER_CONNECTED
  | MessageType.PUSH_USER_DISCONNECTED

export type MessageTypeIn = Exclude<MessageType, MessageTypePush>

export enum ErrorType {
  Validation,
  UnknownRoom,
  DoesntBelongRoom,
  BelongsRoom,
  InvalidInvitation,
  InvalidToken,
  CannotGenerateToken,
  NotEnoughPrivileges,
}

export type MessageIn =
  | MessageCreateRoomIn
  | MessageUsernameValidIn
  | MessageGenerateInvitationIn
  | MessageJoinRoomIn
  | MessageGetRoomIn
  | MessageOfferIn
  | MessageCandidateIn
  | MessageAnswerIn
  | MessageGuardIn
  | MessageRoomExistsIn
  | MessageLockRoomIn
  | MessageLeaveRoomIn
  | MessageRenewTokenIn
export type MessageOutOk =
  | MessageCreateRoomOutOk
  | MessageUsernameValidOutOk
  | MessageGenerateInvitationOutOk
  | MessageJoinRoomOutOk
  | MessageGetRoomOutOk
  | MessageOfferOutOk
  | MessageCandidateOutOk
  | MessageAnswerOutOk
  | MessageGuardOutOk
  | MessageRoomExistsOutOk
  | MessageLockRoomOutOk
  | MessageLeaveRoomOutOk
  | MessagePushOfferOutOk
  | MessagePushCandidateOutOk
  | MessagePushAnswerOutOk
  | MessageRenewTokenOutOk
  | MessagePushUserConnectedOutOk
  | MessagePushUserDisconnectedOutOk
  | MessagePushLockRoomOutOk
export type MessageOutErr<T = ErrorType> = WithError<T>
export type MessageOut = MessageOutOk | MessageOutErr
export interface InternalSocketMessage<T extends MessageIn | MessageOut> {
  refClient: string | null
  payload: T
}

interface WithError<T = ErrorType> {
  error: {
    type: T
    message: string
  }
}
