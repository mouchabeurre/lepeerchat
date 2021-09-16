import {
  MessageCreateRoomOut,
  MessageCreateRoomInOk
} from "./interfaces/create-room"
import {
  MessageUsernameValidOut,
  MessageUsernameValidInOk
} from "./interfaces/username-valid"
import {
  MessageGenerateInvitationOut,
  MessageGenerateInvitationInOk
} from "./interfaces/generate-invitation"
import {
  MessageJoinRoomOut,
  MessageJoinRoomInOk,
  MessagePushUserConnectedInOk
} from "./interfaces/join-room"
import { MessageGetRoomOut, MessageGetRoomInOk } from "./interfaces/get-room"
import {
  MessageOfferOut,
  MessageOfferInOk,
  MessagePushOfferInOk
} from "./interfaces/offer"
import {
  MessageCandidateOut,
  MessageCandidateInOk,
  MessagePushCandidateInOk
} from "./interfaces/candidate"
import {
  MessageAnswerOut,
  MessageAnswerInOk,
  MessagePushAnswerInOk
} from "./interfaces/answer"
import { MessageGuardOut, MessageGuardInOk } from "./interfaces/guard"
import {
  MessageRoomExistsOut,
  MessageRoomExistsInOk
} from "./interfaces/room-exists"
import {
  MessageLockRoomOut,
  MessageLockRoomInOk,
  MessagePushLockRoomInOk
} from "./interfaces/lock-room"
import {
  MessageLeaveRoomOut,
  MessageLeaveRoomInOk,
  MessagePushUserDisconnectedInOk
} from "./interfaces/leave-room"
import {
  MessageRenewTokenInOk,
  MessageRenewTokenOut
} from "./interfaces/renew-token"

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
  PUSH_LOCK_ROOM = "push-lock-room"
}

export enum ErrorType {
  Validation,
  UnknownRoom,
  DoesntBelongRoom,
  BelongsRoom,
  InvalidInvitation,
  InvalidToken,
  CannotGenerateToken,
  NotEnoughPrivileges
}

export type MessageOut =
  | MessageCreateRoomOut
  | MessageUsernameValidOut
  | MessageGenerateInvitationOut
  | MessageJoinRoomOut
  | MessageGetRoomOut
  | MessageOfferOut
  | MessageCandidateOut
  | MessageAnswerOut
  | MessageGuardOut
  | MessageRoomExistsOut
  | MessageLockRoomOut
  | MessageLeaveRoomOut
  | MessageRenewTokenOut
export type MessageInOk =
  | MessageCreateRoomInOk
  | MessageUsernameValidInOk
  | MessageGenerateInvitationInOk
  | MessageJoinRoomInOk
  | MessageGetRoomInOk
  | MessageOfferInOk
  | MessageCandidateInOk
  | MessageAnswerInOk
  | MessageGuardInOk
  | MessageRoomExistsInOk
  | MessageLockRoomInOk
  | MessageLeaveRoomInOk
  | MessagePushOfferInOk
  | MessagePushCandidateInOk
  | MessagePushAnswerInOk
  | MessageRenewTokenInOk
  | MessagePushUserConnectedInOk
  | MessagePushUserDisconnectedInOk
  | MessagePushLockRoomInOk
export type MessageInErr<T = ErrorType> = WithError<T>
export type MessageIn = MessageInOk | MessageInErr
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
