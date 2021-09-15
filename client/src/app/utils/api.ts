import { DataCreateRoomOut, DataCreateRoomInOk } from "./interfaces/create-room"
import {
  DataUsernameValidOut,
  DataUsernameValidInOk
} from "./interfaces/username-valid"
import {
  DataGenerateInvitationOut,
  DataGenerateInvitationInOk
} from "./interfaces/generate-invitation"
import {
  DataJoinRoomOut,
  DataJoinRoomInOk,
  DataPushUserConnectedInOk
} from "./interfaces/join-room"
import { DataGetRoomOut, DataGetRoomInOk } from "./interfaces/get-room"
import {
  DataOfferOut,
  DataOfferInOk,
  DataPushOfferInOk
} from "./interfaces/offer"
import {
  DataCandidateOut,
  DataCandidateInOk,
  DataPushCandidateInOk
} from "./interfaces/candidate"
import {
  DataAnswerOut,
  DataAnswerInOk,
  DataPushAnswerInOk
} from "./interfaces/answer"
import { DataGuardOut, DataGuardInOk } from "./interfaces/guard"
import { DataRoomExistsOut, DataRoomExistsInOk } from "./interfaces/room-exists"
import {
  DataLockRoomOut,
  DataLockRoomInOk,
  DataPushLockRoomInOk
} from "./interfaces/lock-room"
import {
  DataLeaveRoomOut,
  DataLeaveRoomInOk,
  DataPushUserDisconnectedInOk
} from "./interfaces/leave-room"
import { DataRenewTokenInOk, DataRenewTokenOut } from "./interfaces/renew-token"

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
export type MessageInErr<T = ErrorType> =
  | MessageCreateRoomInErr<T>
  | MessageUsernameValidInErr<T>
  | MessageGenerateInvitationInErr<T>
  | MessageJoinRoomInErr<T>
  | MessageGetRoomInErr<T>
  | MessageOfferInErr<T>
  | MessageCandidateInErr<T>
  | MessageAnswerInErr<T>
  | MessageGuardInErr<T>
  | MessageRoomExistsInErr<T>
  | MessageLockRoomInErr<T>
  | MessageLeaveRoomInErr<T>
  | MessageRenewTokenInErr<T>
export type MessageIn = MessageInOk | MessageInErr
export interface InternalSocketMessage<T extends MessageIn | MessageOut> {
  refClient: string | null
  payload: T
}

export interface AnyMessageOut {
  anyType: MessageType
  anyData: DataOut
}

export type DataOut =
  | DataCreateRoomOut
  | DataUsernameValidOut
  | DataGenerateInvitationOut
  | DataJoinRoomOut
  | DataGetRoomOut
  | DataOfferOut
  | DataCandidateOut
  | DataAnswerOut
  | DataGuardOut
  | DataRoomExistsOut
  | DataLockRoomOut
  | DataLeaveRoomOut
type DataIn =
  | DataCreateRoomInOk
  | DataUsernameValidInOk
  | DataGenerateInvitationInOk
  | DataJoinRoomInOk
  | DataGetRoomInOk
  | DataOfferInOk
  | DataCandidateInOk
  | DataAnswerInOk
  | DataGuardInOk
  | DataRoomExistsInOk
  | DataLockRoomInOk
  | DataLeaveRoomInOk
  | DataPushOfferInOk
  | DataPushCandidateInOk
  | DataPushAnswerInOk

interface WithDataOut<T extends DataOut> {
  data: T
}
interface WithDataIn<T extends DataIn> {
  data: T
}
interface WithError<T = ErrorType> {
  error: {
    type: T
    message: string
  }
}

// username valid
export interface MessageUsernameValidOut
  extends BaseMessage<MessageType.USERNAME_VALID>,
    WithDataOut<DataUsernameValidOut> {}
export interface MessageUsernameValidInOk
  extends BaseMessage<MessageType.USERNAME_VALID>,
    WithDataIn<DataUsernameValidInOk> {}
export interface MessageUsernameValidInErr<T = ErrorType>
  extends BaseMessage<MessageType.USERNAME_VALID>,
    WithError<T> {}

// create room
export interface MessageCreateRoomOut
  extends BaseMessage<MessageType.CREATE_ROOM>,
    WithDataOut<DataCreateRoomOut> {}
export interface MessageCreateRoomInOk
  extends BaseMessage<MessageType.CREATE_ROOM>,
    WithDataIn<DataCreateRoomInOk> {}
export interface MessageCreateRoomInErr<T = ErrorType>
  extends BaseMessage<MessageType.CREATE_ROOM>,
    WithError<T> {}

// generate-invitation
export interface MessageGenerateInvitationOut
  extends BaseMessage<MessageType.GENERATE_INVITATION>,
    WithDataOut<DataGenerateInvitationOut> {}
export interface MessageGenerateInvitationInOk
  extends BaseMessage<MessageType.GENERATE_INVITATION>,
    WithDataIn<DataGenerateInvitationInOk> {}
export interface MessageGenerateInvitationInErr<T = ErrorType>
  extends BaseMessage<MessageType.GENERATE_INVITATION>,
    WithError<T> {}

// join-room
export interface MessageJoinRoomOut
  extends BaseMessage<MessageType.JOIN_ROOM>,
    WithDataOut<DataJoinRoomOut> {}
export interface MessageJoinRoomInOk
  extends BaseMessage<MessageType.JOIN_ROOM>,
    WithDataIn<DataJoinRoomInOk> {}
export interface MessageJoinRoomInErr<T = ErrorType>
  extends BaseMessage<MessageType.JOIN_ROOM>,
    WithError<T> {}

// get-room
export interface MessageGetRoomOut
  extends BaseMessage<MessageType.GET_ROOM>,
    WithDataOut<DataGetRoomOut> {}
export interface MessageGetRoomInOk
  extends BaseMessage<MessageType.GET_ROOM>,
    WithDataIn<DataGetRoomInOk> {}
export interface MessageGetRoomInErr<T = ErrorType>
  extends BaseMessage<MessageType.GET_ROOM>,
    WithError<T> {}

// offer
export interface MessageOfferOut
  extends BaseMessage<MessageType.OFFER>,
    WithDataOut<DataOfferOut> {}
export interface MessageOfferInOk
  extends BaseMessage<MessageType.OFFER>,
    WithDataIn<DataOfferInOk> {}
export interface MessageOfferInErr<T = ErrorType>
  extends BaseMessage<MessageType.OFFER>,
    WithError<T> {}

// candidate
export interface MessageCandidateOut
  extends BaseMessage<MessageType.CANDIDATE>,
    WithDataOut<DataCandidateOut> {}
export interface MessageCandidateInOk
  extends BaseMessage<MessageType.CANDIDATE>,
    WithDataIn<DataCandidateInOk> {}
export interface MessageCandidateInErr<T = ErrorType>
  extends BaseMessage<MessageType.CANDIDATE>,
    WithError<T> {}

// answer
export interface MessageAnswerOut
  extends BaseMessage<MessageType.ANSWER>,
    WithDataOut<DataAnswerOut> {}
export interface MessageAnswerInOk
  extends BaseMessage<MessageType.ANSWER>,
    WithDataIn<DataAnswerInOk> {}
export interface MessageAnswerInErr<T = ErrorType>
  extends BaseMessage<MessageType.ANSWER>,
    WithError<T> {}

// guard
export interface MessageGuardOut
  extends BaseMessage<MessageType.GUARD>,
    WithDataOut<DataGuardOut> {}
export interface MessageGuardInOk
  extends BaseMessage<MessageType.GUARD>,
    WithDataIn<DataGuardInOk> {}
export interface MessageGuardInErr<T = ErrorType>
  extends BaseMessage<MessageType.GUARD>,
    WithError<T> {}

// room-exists
export interface MessageRoomExistsOut
  extends BaseMessage<MessageType.ROOM_EXISTS>,
    WithDataOut<DataRoomExistsOut> {}
export interface MessageRoomExistsInOk
  extends BaseMessage<MessageType.ROOM_EXISTS>,
    WithDataIn<DataRoomExistsInOk> {}
export interface MessageRoomExistsInErr<T = ErrorType>
  extends BaseMessage<MessageType.ROOM_EXISTS>,
    WithError<T> {}

// lock-room
export interface MessageLockRoomOut
  extends BaseMessage<MessageType.LOCK_ROOM>,
    WithDataOut<DataLockRoomOut> {}
export interface MessageLockRoomInOk
  extends BaseMessage<MessageType.LOCK_ROOM>,
    WithDataIn<DataLockRoomInOk> {}
export interface MessageLockRoomInErr<T = ErrorType>
  extends BaseMessage<MessageType.LOCK_ROOM>,
    WithError<T> {}

// leave-room
export interface MessageLeaveRoomOut
  extends BaseMessage<MessageType.LEAVE_ROOM>,
    WithDataOut<DataLeaveRoomOut> {}
export interface MessageLeaveRoomInOk
  extends BaseMessage<MessageType.LEAVE_ROOM>,
    WithDataIn<DataLeaveRoomInOk> {}
export interface MessageLeaveRoomInErr<T = ErrorType>
  extends BaseMessage<MessageType.LEAVE_ROOM>,
    WithError<T> {}

// push-offer
export interface MessagePushOfferInOk
  extends BaseMessage<MessageType.PUSH_OFFER>,
    WithDataIn<DataPushOfferInOk> {}

// push-candidate
export interface MessagePushCandidateInOk
  extends BaseMessage<MessageType.PUSH_CANDIDATE>,
    WithDataIn<DataPushCandidateInOk> {}

// push-offer
export interface MessagePushAnswerInOk
  extends BaseMessage<MessageType.PUSH_ANSWER>,
    WithDataIn<DataPushAnswerInOk> {}

// renew-token
export interface MessageRenewTokenOut
  extends BaseMessage<MessageType.RENEW_TOKEN>,
    WithDataOut<DataRenewTokenOut> {}
export interface MessageRenewTokenInOk
  extends BaseMessage<MessageType.RENEW_TOKEN>,
    WithDataIn<DataRenewTokenInOk> {}
export interface MessageRenewTokenInErr<T = ErrorType>
  extends BaseMessage<MessageType.RENEW_TOKEN>,
    WithError<T> {}

// push-user-connected
export interface MessagePushUserConnectedInOk
  extends BaseMessage<MessageType.PUSH_USER_CONNECTED>,
    WithDataIn<DataPushUserConnectedInOk> {}

// push-user-disconnected
export interface MessagePushUserDisconnectedInOk
  extends BaseMessage<MessageType.PUSH_USER_DISCONNECTED>,
    WithDataIn<DataPushUserDisconnectedInOk> {}

// push-lock-room
export interface MessagePushLockRoomInOk
  extends BaseMessage<MessageType.PUSH_LOCK_ROOM>,
    WithDataIn<DataPushLockRoomInOk> {}
