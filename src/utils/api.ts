import {
  DataCreateRoomIn,
  DataCreateRoomOutOk
} from "./interfaces/create-room.ts"
import {
  DataUsernameValidIn,
  DataUsernameValidOutOk
} from "./interfaces/username-valid.ts"
import {
  DataGenerateInvitationIn,
  DataGenerateInvitationOutOk
} from "./interfaces/generate-invitation.ts"
import {
  DataJoinRoomIn,
  DataJoinRoomOutOk,
  DataPushUserConnectedOutOk
} from "./interfaces/join-room.ts"
import { DataGetRoomIn, DataGetRoomOutOk } from "./interfaces/get-room.ts"
import {
  DataOfferIn,
  DataOfferOutOk,
  DataPushOfferOutOk
} from "./interfaces/offer.ts"
import {
  DataCandidateIn,
  DataCandidateOutOk,
  DataPushCandidateOutOk
} from "./interfaces/candidate.ts"
import {
  DataAnswerIn,
  DataAnswerOutOk,
  DataPushAnswerOutOk
} from "./interfaces/answer.ts"
import { DataGuardIn, DataGuardOutOk } from "./interfaces/guard.ts"
import {
  DataRoomExistsIn,
  DataRoomExistsOutOk
} from "./interfaces/room-exists.ts"
import {
  DataLockRoomIn,
  DataLockRoomOutOk,
  DataPushLockRoomOutOk
} from "./interfaces/lock-room.ts"
import {
  DataLeaveRoomIn,
  DataLeaveRoomOutOk,
  DataPushUserDisconnectedOutOk
} from "./interfaces/leave-room.ts"
import {
  DataRenewTokenIn,
  DataRenewTokenOutOk
} from "./interfaces/renew-token.ts"

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
interface BaseMessage<T extends MessageType> {
  type: T
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
export type MessageOutErr<T = ErrorType> =
  | MessageCreateRoomOutErr<T>
  | MessageUsernameValidOutErr<T>
  | MessageGenerateInvitationOutErr<T>
  | MessageJoinRoomOutErr<T>
  | MessageGetRoomOutErr<T>
  | MessageOfferOutErr<T>
  | MessageCandidateOutErr<T>
  | MessageAnswerOutErr<T>
  | MessageGuardOutErr<T>
  | MessageRoomExistsOutErr<T>
  | MessageLockRoomOutErr<T>
  | MessageLeaveRoomOutErr<T>
  | MessageRenewTokenOutErr<T>
export type MessageOut = MessageOutOk | MessageOutErr
export interface InternalSocketMessage<T extends MessageIn | MessageOut> {
  refClient: string | null
  payload: T
}

export interface AnyMessageIn {
  anyType: MessageType
  anyData: DataIn
}

export type DataIn =
  | DataCreateRoomIn
  | DataUsernameValidIn
  | DataGenerateInvitationIn
  | DataJoinRoomIn
  | DataGetRoomIn
  | DataOfferIn
  | DataCandidateIn
  | DataAnswerIn
  | DataGuardIn
  | DataRoomExistsIn
  | DataLockRoomIn
  | DataLeaveRoomIn
type DataOut =
  | DataCreateRoomOutOk
  | DataUsernameValidOutOk
  | DataGenerateInvitationOutOk
  | DataJoinRoomOutOk
  | DataGetRoomOutOk
  | DataOfferOutOk
  | DataCandidateOutOk
  | DataAnswerOutOk
  | DataGuardOutOk
  | DataRoomExistsOutOk
  | DataLockRoomOutOk
  | DataLeaveRoomOutOk
  | DataPushOfferOutOk
  | DataPushCandidateOutOk
  | DataPushAnswerOutOk

interface WithDataIn<T extends DataIn> {
  data: T
}
interface WithDataOut<T extends DataOut> {
  data: T
}
interface WithError<T = ErrorType> {
  error: {
    type: T
    message: string
  }
}

// username valid
export interface MessageUsernameValidIn
  extends BaseMessage<MessageType.USERNAME_VALID>,
    WithDataIn<DataUsernameValidIn> {}
export interface MessageUsernameValidOutOk
  extends BaseMessage<MessageType.USERNAME_VALID>,
    WithDataOut<DataUsernameValidOutOk> {}
export interface MessageUsernameValidOutErr<T = ErrorType>
  extends BaseMessage<MessageType.USERNAME_VALID>,
    WithError<T> {}

// create room
export interface MessageCreateRoomIn
  extends BaseMessage<MessageType.CREATE_ROOM>,
    WithDataIn<DataCreateRoomIn> {}
export interface MessageCreateRoomOutOk
  extends BaseMessage<MessageType.CREATE_ROOM>,
    WithDataOut<DataCreateRoomOutOk> {}
export interface MessageCreateRoomOutErr<T = ErrorType>
  extends BaseMessage<MessageType.CREATE_ROOM>,
    WithError<T> {}

// generate-invitation
export interface MessageGenerateInvitationIn
  extends BaseMessage<MessageType.GENERATE_INVITATION>,
    WithDataIn<DataGenerateInvitationIn> {}
export interface MessageGenerateInvitationOutOk
  extends BaseMessage<MessageType.GENERATE_INVITATION>,
    WithDataOut<DataGenerateInvitationOutOk> {}
export interface MessageGenerateInvitationOutErr<T = ErrorType>
  extends BaseMessage<MessageType.GENERATE_INVITATION>,
    WithError<T> {}

// join-room
export interface MessageJoinRoomIn
  extends BaseMessage<MessageType.JOIN_ROOM>,
    WithDataIn<DataJoinRoomIn> {}
export interface MessageJoinRoomOutOk
  extends BaseMessage<MessageType.JOIN_ROOM>,
    WithDataOut<DataJoinRoomOutOk> {}
export interface MessageJoinRoomOutErr<T = ErrorType>
  extends BaseMessage<MessageType.JOIN_ROOM>,
    WithError<T> {}

// get-room
export interface MessageGetRoomIn
  extends BaseMessage<MessageType.GET_ROOM>,
    WithDataIn<DataGetRoomIn> {}
export interface MessageGetRoomOutOk
  extends BaseMessage<MessageType.GET_ROOM>,
    WithDataOut<DataGetRoomOutOk> {}
export interface MessageGetRoomOutErr<T = ErrorType>
  extends BaseMessage<MessageType.GET_ROOM>,
    WithError<T> {}

// offer
export interface MessageOfferIn
  extends BaseMessage<MessageType.OFFER>,
    WithDataIn<DataOfferIn> {}
export interface MessageOfferOutOk
  extends BaseMessage<MessageType.OFFER>,
    WithDataOut<DataOfferOutOk> {}
export interface MessageOfferOutErr<T = ErrorType>
  extends BaseMessage<MessageType.OFFER>,
    WithError<T> {}

// candidate
export interface MessageCandidateIn
  extends BaseMessage<MessageType.CANDIDATE>,
    WithDataIn<DataCandidateIn> {}
export interface MessageCandidateOutOk
  extends BaseMessage<MessageType.CANDIDATE>,
    WithDataOut<DataCandidateOutOk> {}
export interface MessageCandidateOutErr<T = ErrorType>
  extends BaseMessage<MessageType.CANDIDATE>,
    WithError<T> {}

// answer
export interface MessageAnswerIn
  extends BaseMessage<MessageType.ANSWER>,
    WithDataIn<DataAnswerIn> {}
export interface MessageAnswerOutOk
  extends BaseMessage<MessageType.ANSWER>,
    WithDataOut<DataAnswerOutOk> {}
export interface MessageAnswerOutErr<T = ErrorType>
  extends BaseMessage<MessageType.ANSWER>,
    WithError<T> {}

// guard
export interface MessageGuardIn
  extends BaseMessage<MessageType.GUARD>,
    WithDataIn<DataGuardIn> {}
export interface MessageGuardOutOk
  extends BaseMessage<MessageType.GUARD>,
    WithDataOut<DataGuardOutOk> {}
export interface MessageGuardOutErr<T = ErrorType>
  extends BaseMessage<MessageType.GUARD>,
    WithError<T> {}

// room-exists
export interface MessageRoomExistsIn
  extends BaseMessage<MessageType.ROOM_EXISTS>,
    WithDataIn<DataRoomExistsIn> {}
export interface MessageRoomExistsOutOk
  extends BaseMessage<MessageType.ROOM_EXISTS>,
    WithDataOut<DataRoomExistsOutOk> {}
export interface MessageRoomExistsOutErr<T = ErrorType>
  extends BaseMessage<MessageType.ROOM_EXISTS>,
    WithError<T> {}

// lock-room
export interface MessageLockRoomIn
  extends BaseMessage<MessageType.LOCK_ROOM>,
    WithDataIn<DataLockRoomIn> {}
export interface MessageLockRoomOutOk
  extends BaseMessage<MessageType.LOCK_ROOM>,
    WithDataOut<DataLockRoomOutOk> {}
export interface MessageLockRoomOutErr<T = ErrorType>
  extends BaseMessage<MessageType.LOCK_ROOM>,
    WithError<T> {}

// leave-room
export interface MessageLeaveRoomIn
  extends BaseMessage<MessageType.LEAVE_ROOM>,
    WithDataIn<DataLeaveRoomIn> {}
export interface MessageLeaveRoomOutOk
  extends BaseMessage<MessageType.LEAVE_ROOM>,
    WithDataOut<DataLeaveRoomOutOk> {}
export interface MessageLeaveRoomOutErr<T = ErrorType>
  extends BaseMessage<MessageType.LEAVE_ROOM>,
    WithError<T> {}

// push-offer
export interface MessagePushOfferOutOk
  extends BaseMessage<MessageType.PUSH_OFFER>,
    WithDataOut<DataPushOfferOutOk> {}

// push-candidate
export interface MessagePushCandidateOutOk
  extends BaseMessage<MessageType.PUSH_CANDIDATE>,
    WithDataOut<DataPushCandidateOutOk> {}

// push-answer
export interface MessagePushAnswerOutOk
  extends BaseMessage<MessageType.PUSH_ANSWER>,
    WithDataOut<DataPushAnswerOutOk> {}

// renew-token
export interface MessageRenewTokenIn
  extends BaseMessage<MessageType.RENEW_TOKEN>,
    WithDataIn<DataRenewTokenIn> {}
export interface MessageRenewTokenOutOk
  extends BaseMessage<MessageType.RENEW_TOKEN>,
    WithDataOut<DataRenewTokenOutOk> {}
export interface MessageRenewTokenOutErr<T = ErrorType>
  extends BaseMessage<MessageType.RENEW_TOKEN>,
    WithError<T> {}

// push-user-connected
export interface MessagePushUserConnectedOutOk
  extends BaseMessage<MessageType.PUSH_USER_CONNECTED>,
    WithDataOut<DataPushUserConnectedOutOk> {}

// push-user-disconnected
export interface MessagePushUserDisconnectedOutOk
  extends BaseMessage<MessageType.PUSH_USER_DISCONNECTED>,
    WithDataOut<DataPushUserDisconnectedOutOk> {}

// push-lock-room
export interface MessagePushLockRoomOutOk
  extends BaseMessage<MessageType.PUSH_LOCK_ROOM>,
    WithDataOut<DataPushLockRoomOutOk> {}
