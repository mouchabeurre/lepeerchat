import { isProved } from "../../deps/prove/prove.ts"
import {
  MessageIn,
  MessageType,
  AnyMessageIn,
  InternalSocketMessage
} from "./api.ts"
import { baseValidShape } from "./interfaces/base.ts"
import { createRoomShape, DataCreateRoomIn } from "./interfaces/create-room.ts"
import {
  usernameValidShape,
  DataUsernameValidIn
} from "./interfaces/username-valid.ts"
import {
  generateInvitationShape,
  DataGenerateInvitationIn
} from "./interfaces/generate-invitation.ts"
import { joinRoomShape, DataJoinRoomIn } from "./interfaces/join-room.ts"
import { getRoomShape, DataGetRoomIn } from "./interfaces/get-room.ts"
import { offerShape, DataOfferIn } from "./interfaces/offer.ts"
import { candidateShape, DataCandidateIn } from "./interfaces/candidate.ts"
import { answerShape, DataAnswerIn } from "./interfaces/answer.ts"
import { guardShape, DataGuardIn } from "./interfaces/guard.ts"
import { roomExistsShape, DataRoomExistsIn } from "./interfaces/room-exists.ts"
import { lockRoomShape, DataLockRoomIn } from "./interfaces/lock-room.ts"
import { leaveRoomShape, DataLeaveRoomIn } from "./interfaces/leave-room.ts"

interface AnyMessageWithRefs {
  refClient: string
  anyMessage: AnyMessageIn
}
export type ValidationSuccess<T extends AnyMessageWithRefs | MessageIn> = [
  null,
  T
]
export type ValidationFailure = [string, null]
export type SomeBaseMessage =
  | ValidationSuccess<AnyMessageWithRefs>
  | ValidationFailure
export type SomeMessage<T extends MessageIn> =
  | ValidationSuccess<T>
  | ValidationFailure

export function isValidationSuccess<T extends AnyMessageWithRefs | MessageIn>(
  x: ValidationSuccess<T> | ValidationFailure
): x is ValidationSuccess<T> {
  return x[0] === null && x[1] !== null
}

export function validateBase(message: string): SomeBaseMessage {
  const baseProof = baseValidShape(
    JSON.parse(message) as InternalSocketMessage<MessageIn>
  )
  if (!isProved(baseProof)) {
    return [baseProof[0], null]
  } else {
    if (baseProof[1].refClient === null) {
      return ["client reference cannot be null", null]
    } else {
      return [
        null,
        {
          refClient: baseProof[1].refClient,
          anyMessage: {
            anyType: baseProof[1].payload.type,
            anyData: baseProof[1].payload.data
          }
        }
      ]
    }
  }
}

export function validateSomeMessage<T extends MessageIn>(
  message: AnyMessageIn
): SomeMessage<T> {
  let proof: any = null
  switch (message.anyType) {
    case MessageType.CREATE_ROOM:
      proof = createRoomShape(message.anyData as DataCreateRoomIn)
      break
    case MessageType.USERNAME_VALID:
      proof = usernameValidShape(message.anyData as DataUsernameValidIn)
      break
    case MessageType.GENERATE_INVITATION:
      proof = generateInvitationShape(
        message.anyData as DataGenerateInvitationIn
      )
      break
    case MessageType.JOIN_ROOM:
      proof = joinRoomShape(message.anyData as DataJoinRoomIn)
      break
    case MessageType.GET_ROOM:
      proof = getRoomShape(message.anyData as DataGetRoomIn)
      break
    case MessageType.OFFER:
      proof = offerShape(message.anyData as DataOfferIn)
      break
    case MessageType.CANDIDATE:
      proof = candidateShape(message.anyData as DataCandidateIn)
      break
    case MessageType.ANSWER:
      proof = answerShape(message.anyData as DataAnswerIn)
      break
    case MessageType.GUARD:
      proof = guardShape(message.anyData as DataGuardIn)
      break
    case MessageType.ROOM_EXISTS:
      proof = roomExistsShape(message.anyData as DataRoomExistsIn)
      break
    case MessageType.LOCK_ROOM:
      proof = lockRoomShape(message.anyData as DataLockRoomIn)
      break
    case MessageType.LEAVE_ROOM:
      proof = leaveRoomShape(message.anyData as DataLeaveRoomIn)
      break
  }
  if (proof) {
    return getValidationMessageResult<T>(proof, message.anyType)
  } else {
    return ["unknown message type", null]
  }
}

function getValidationMessageResult<T extends MessageIn>(
  proof: any,
  type: MessageType
): SomeMessage<T> {
  if (!isProved(proof)) {
    return [proof[0], null]
  } else {
    return [
      null,
      {
        type,
        data: proof[1]
      } as T
    ]
  }
}
