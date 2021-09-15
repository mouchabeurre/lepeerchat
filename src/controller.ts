import { User } from "./model/user.ts"
import { Room } from "./model/room.ts"
import { Invitation } from "./model/invitation.ts"
import {
  MessageType,
  ErrorType,
  MessageCreateRoomIn,
  MessageUsernameValidIn,
  MessageUsernameValidOutErr,
  MessageUsernameValidOutOk,
  MessageCreateRoomOutErr,
  MessageCreateRoomOutOk,
  MessageGenerateInvitationIn,
  MessageGenerateInvitationOutErr,
  MessageGenerateInvitationOutOk,
  MessageJoinRoomIn,
  MessageJoinRoomOutErr,
  MessageJoinRoomOutOk,
  MessageGetRoomIn,
  MessageGetRoomOutErr,
  MessageGetRoomOutOk,
  MessageOfferIn,
  MessageOfferOutErr,
  MessageCandidateIn,
  MessageCandidateOutErr,
  MessageAnswerOutErr,
  MessageOfferOutOk,
  MessageCandidateOutOk,
  MessageAnswerIn,
  MessageAnswerOutOk,
  MessageOutErr,
  MessageGuardIn,
  MessageGuardOutErr,
  MessageGuardOutOk,
  MessageRoomExistsIn,
  MessageRoomExistsOutErr,
  MessageRoomExistsOutOk,
  MessageLockRoomIn,
  MessageLockRoomOutErr,
  MessageLockRoomOutOk,
  MessageLeaveRoomIn,
  MessageLeaveRoomOutErr,
  MessageLeaveRoomOutOk,
  MessagePushOfferOutOk,
  MessagePushCandidateOutOk,
  MessagePushAnswerOutOk,
  MessageRenewTokenIn,
  MessageRenewTokenOutOk,
  MessageRenewTokenOutErr,
  MessagePushUserConnectedOutOk,
  MessagePushLockRoomOutOk,
  MessagePushUserDisconnectedOutOk
} from "./utils/api.ts"
import { validateSomeMessage, isValidationSuccess } from "./utils/validator.ts"
import { buildToken, validateToken } from "./utils/jwt.ts"
import { RouteHandler } from "./router.ts"
import { HashMap } from "./utils/types.ts"
import { ProofType } from "../deps/prove/prove.ts"
import { DataJoinRoomIn, tokenShape } from "./utils/interfaces/join-room.ts"
import { Logger } from "./utils/logger.ts"
import { ROOM_TOKEN_EXPIRATION } from "./utils/constants.ts"

function buildErrorResponse<T extends MessageOutErr>(
  mtype: MessageType,
  etype: ErrorType,
  message: string
) {
  const response = {
    type: mtype,
    error: {
      type: etype,
      message
    }
  } as T
  return response
}

type ProvedToken = ProofType<typeof tokenShape>
function isCreditentialToken(data: DataJoinRoomIn): data is ProvedToken {
  return !!(data as ProvedToken).token
}

export class Controller extends Logger {
  private _users: HashMap<User>
  private _rooms: HashMap<Room>
  constructor(users: HashMap<User>, rooms: HashMap<Room>) {
    super("controller")
    this._users = users
    this._rooms = rooms
  }

  usernameValid: RouteHandler = (user, anyMessage, refClient) => {
    const vResult = validateSomeMessage<MessageUsernameValidIn>(anyMessage)
    if (!isValidationSuccess(vResult)) {
      user.send(
        buildErrorResponse<MessageUsernameValidOutErr>(
          MessageType.USERNAME_VALID,
          ErrorType.Validation,
          `validation error: ${vResult[0]}`
        ),
        refClient
      )
      this.log.warning("username validation")
      return
    }
    const { username, roomId, token } = vResult[1].data
    const room = this._rooms.get(roomId)
    if (!room) {
      user.send(
        buildErrorResponse<MessageUsernameValidOutErr>(
          MessageType.USERNAME_VALID,
          ErrorType.UnknownRoom,
          `couldn't find room`
        ),
        refClient
      )
      return
    }
    const sendSucces = () => {
      const response: MessageUsernameValidOutOk = {
        type: MessageType.USERNAME_VALID,
        data: {
          username
        }
      }
      user.send(response, refClient)
    }
    if (!room.isUniqueUsername(username)) {
      if (!token) {
        user.send(
          buildErrorResponse<MessageUsernameValidOutErr>(
            MessageType.USERNAME_VALID,
            ErrorType.Validation,
            `username already used by another user`
          ),
          refClient
        )
        return
      }
      validateToken(token)
        .then(payload => {
          const { exp, data } = payload as {
            exp: number
            data: { username: string; roomId: string }
          }
          if (
            data.roomId === roomId &&
            data.username === username &&
            !room.isInUseUsername(username) &&
            room.getTokenMemory().get(username) === token
          ) {
            sendSucces()
          } else {
            user.send(
              buildErrorResponse<MessageUsernameValidOutErr>(
                MessageType.USERNAME_VALID,
                ErrorType.Validation,
                `username already used by another user`
              ),
              refClient
            )
          }
        })
        .catch(() => {
          user.send(
            buildErrorResponse<MessageUsernameValidOutErr>(
              MessageType.USERNAME_VALID,
              ErrorType.InvalidToken,
              `invalid token`
            ),
            refClient
          )
        })
    } else {
      sendSucces()
    }
  }

  createRoom: RouteHandler = (user, anyMessage, refClient) => {
    const vResult = validateSomeMessage<MessageCreateRoomIn>(anyMessage)
    if (!isValidationSuccess(vResult)) {
      user.send(
        buildErrorResponse<MessageCreateRoomOutErr>(
          MessageType.CREATE_ROOM,
          ErrorType.Validation,
          `validation error: ${vResult[0]}`
        ),
        refClient
      )
      return
    }
    const { roomName, username } = vResult[1].data
    Room.buildRoom(roomName, { user, username })
      .then(([room, token]) => {
        user.setRoomId(room.id)
        this._rooms.set(room.id, room)
        const response: MessageCreateRoomOutOk = {
          type: MessageType.CREATE_ROOM,
          data: {
            token,
            roomId: room.id,
            userId: user.id,
            username,
            roomName
          }
        }
        user.send(response, refClient)
      })
      .catch(() => {
        user.send(
          buildErrorResponse<MessageCreateRoomOutErr>(
            MessageType.CREATE_ROOM,
            ErrorType.CannotGenerateToken,
            `couldn't generate token`
          ),
          refClient
        )
      })
  }

  generateInvitation: RouteHandler = (user, anyMessage, refClient) => {
    const vResult = validateSomeMessage<MessageGenerateInvitationIn>(anyMessage)
    if (!isValidationSuccess(vResult)) {
      user.send(
        buildErrorResponse<MessageGenerateInvitationOutErr>(
          MessageType.GENERATE_INVITATION,
          ErrorType.Validation,
          `validation error: ${vResult[0]}`
        ),
        refClient
      )
      return
    }
    const roomId = user.getRoomId()
    if (!roomId) {
      user.send(
        buildErrorResponse<MessageGenerateInvitationOutErr>(
          MessageType.GENERATE_INVITATION,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to any room`
        ),
        refClient
      )
      return
    }
    const room = this._rooms.get(roomId)
    if (!room) {
      user.send(
        buildErrorResponse<MessageGenerateInvitationOutErr>(
          MessageType.GENERATE_INVITATION,
          ErrorType.UnknownRoom,
          `could not find room`
        ),
        refClient
      )
      return
    }
    if (!room.getUsers().has(user.id)) {
      user.send(
        buildErrorResponse<MessageGenerateInvitationOutErr>(
          MessageType.GENERATE_INVITATION,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    if (room.getOwnerId() !== user.id) {
      user.send(
        buildErrorResponse<MessageGenerateInvitationOutErr>(
          MessageType.GENERATE_INVITATION,
          ErrorType.NotEnoughPrivileges,
          `user isn't room owner`
        ),
        refClient
      )
      return
    }
    const invitation = new Invitation()
    room.addInvitation(invitation)
    const response: MessageGenerateInvitationOutOk = {
      type: MessageType.GENERATE_INVITATION,
      data: {
        invitation: {
          key: invitation.id,
          password: invitation.password,
          expireAt: invitation.expireAt
        }
      }
    }
    user.send(response, refClient)
  }

  joinRoom: RouteHandler = (user, anyMessage, refClient) => {
    const vResult = validateSomeMessage<MessageJoinRoomIn>(anyMessage)
    if (!isValidationSuccess(vResult)) {
      user.send(
        buildErrorResponse<MessageJoinRoomOutErr>(
          MessageType.JOIN_ROOM,
          ErrorType.Validation,
          `validation error: ${vResult[0]}`
        ),
        refClient
      )
      return
    }
    const sendSuccess = (username: string, room: Room) => {
      user.setRoomId(room.id)
      room
        .addUser(user, username)
        .then(([roomUser, token]) => {
          const response: MessageJoinRoomOutOk = {
            type: MessageType.JOIN_ROOM,
            data: {
              roomId: room.id,
              roomName: room.getName(),
              username,
              token
            }
          }
          user.send(response, refClient)
          const notifyOtherResponse: MessagePushUserConnectedOutOk = {
            type: MessageType.PUSH_USER_CONNECTED,
            data: { user: roomUser.toDTO() }
          }
          for (const [, peer] of room.getUsers()) {
            if (peer.ref !== user) {
              peer.send(notifyOtherResponse, null)
            }
          }
        })
        .catch(() => {
          user.send(
            buildErrorResponse<MessageJoinRoomOutErr>(
              MessageType.JOIN_ROOM,
              ErrorType.CannotGenerateToken,
              `couldn't generate token`
            ),
            refClient
          )
        })
    }
    const creditentials = vResult[1].data
    if (isCreditentialToken(creditentials)) {
      const { token, username } = creditentials
      validateToken(token)
        .then(payload => {
          const { exp, data } = payload as {
            exp: number
            data: { username: string; roomId: string }
          }
          const { roomId } = data
          const room = this._rooms.get(roomId)
          if (!room) {
            user.send(
              buildErrorResponse<MessageJoinRoomOutErr>(
                MessageType.JOIN_ROOM,
                ErrorType.UnknownRoom,
                `could not find room`
              ),
              refClient
            )
            return
          }
          if (username !== data.username) {
            user.send(
              buildErrorResponse<MessageJoinRoomOutErr>(
                MessageType.JOIN_ROOM,
                ErrorType.Validation,
                `requested username different from old username`
              ),
              refClient
            )
            return
          }
          if (!room.isUniqueUsername(username)) {
            if (
              !room.isInUseUsername(username) &&
              room.getTokenMemory().get(username) === token
            ) {
              sendSuccess(username, room)
            } else {
              user.send(
                buildErrorResponse<MessageJoinRoomOutErr>(
                  MessageType.JOIN_ROOM,
                  ErrorType.Validation,
                  `username already used by another user`
                ),
                refClient
              )
            }
          } else {
            sendSuccess(username, room)
          }
        })
        .catch(() => {
          user.send(
            buildErrorResponse<MessageJoinRoomOutErr>(
              MessageType.JOIN_ROOM,
              ErrorType.InvalidToken,
              `invalid token`
            ),
            refClient
          )
        })
    } else {
      const { roomId, username, password, key } = creditentials
      const room = this._rooms.get(roomId)
      if (!room) {
        user.send(
          buildErrorResponse<MessageJoinRoomOutErr>(
            MessageType.JOIN_ROOM,
            ErrorType.UnknownRoom,
            `could not find room`
          ),
          refClient
        )
        return
      }
      if (room.getUsers().has(user.id)) {
        user.send(
          buildErrorResponse<MessageJoinRoomOutErr>(
            MessageType.JOIN_ROOM,
            ErrorType.BelongsRoom,
            `user already belongs to room`
          ),
          refClient
        )
        return
      }
      if (!room.isUniqueUsername(username)) {
        user.send(
          buildErrorResponse<MessageJoinRoomOutErr>(
            MessageType.JOIN_ROOM,
            ErrorType.Validation,
            `username already used by another user`
          ),
          refClient
        )
        return
      }
      const invitation = room.getInvitations().get(key)
      if (room.isLocked()) {
        user.send(
          buildErrorResponse<MessageJoinRoomOutErr>(
            MessageType.JOIN_ROOM,
            ErrorType.InvalidInvitation,
            `room in locked state`
          ),
          refClient
        )
        return
      }
      if (!invitation || invitation?.password !== password) {
        user.send(
          buildErrorResponse<MessageJoinRoomOutErr>(
            MessageType.JOIN_ROOM,
            ErrorType.InvalidInvitation,
            `invalid or expired invitation`
          ),
          refClient
        )
        return
      }
      sendSuccess(username, room)
    }
  }

  getRoom: RouteHandler = (user, anyMessage, refClient) => {
    const vResult = validateSomeMessage<MessageGetRoomIn>(anyMessage)
    if (!isValidationSuccess(vResult)) {
      user.send(
        buildErrorResponse<MessageGetRoomOutErr>(
          MessageType.GET_ROOM,
          ErrorType.Validation,
          `validation error: ${vResult[0]}`
        ),
        refClient
      )
      return
    }
    const roomId = user.getRoomId()
    if (!roomId) {
      user.send(
        buildErrorResponse<MessageGetRoomOutErr>(
          MessageType.GET_ROOM,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to any room`
        ),
        refClient
      )
      return
    }
    const room = this._rooms.get(roomId)
    if (!room) {
      user.send(
        buildErrorResponse<MessageGetRoomOutErr>(
          MessageType.GET_ROOM,
          ErrorType.UnknownRoom,
          `could not find room`
        ),
        refClient
      )
      return
    }
    if (!room.getUsers().has(user.id)) {
      user.send(
        buildErrorResponse<MessageGetRoomOutErr>(
          MessageType.GET_ROOM,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    const response: MessageGetRoomOutOk = {
      type: MessageType.GET_ROOM,
      data: {
        room: room.toDTO()
      }
    }
    user.send(response, refClient)
  }

  offer: RouteHandler = (user, anyMessage, refClient) => {
    const vResult = validateSomeMessage<MessageOfferIn>(anyMessage)
    if (!isValidationSuccess(vResult)) {
      user.send(
        buildErrorResponse<MessageOfferOutErr>(
          MessageType.OFFER,
          ErrorType.Validation,
          `validation error: ${vResult[0]}`
        ),
        refClient
      )
      return
    }
    const { id, description } = vResult[1].data
    const roomId = user.getRoomId()
    if (!roomId) {
      user.send(
        buildErrorResponse<MessageOfferOutErr>(
          MessageType.OFFER,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to any room`
        ),
        refClient
      )
      return
    }
    const room = this._rooms.get(roomId)
    if (!room) {
      user.send(
        buildErrorResponse<MessageOfferOutErr>(
          MessageType.OFFER,
          ErrorType.UnknownRoom,
          `could not find room`
        ),
        refClient
      )
      return
    }
    if (!room.getUsers().has(user.id)) {
      user.send(
        buildErrorResponse<MessageOfferOutErr>(
          MessageType.OFFER,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    const toUser = room.getUsers().get(id)
    if (!toUser) {
      user.send(
        buildErrorResponse<MessageOfferOutErr>(
          MessageType.OFFER,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    const responsePush: MessagePushOfferOutOk = {
      type: MessageType.PUSH_OFFER,
      data: {
        id: user.id,
        description
      }
    }
    toUser.send(responsePush, null)
    const responseAck: MessageOfferOutOk = {
      type: MessageType.OFFER,
      data: {}
    }
    user.send(responseAck, refClient)
  }

  candidate: RouteHandler = (user, anyMessage, refClient) => {
    const vResult = validateSomeMessage<MessageCandidateIn>(anyMessage)
    if (!isValidationSuccess(vResult)) {
      user.send(
        buildErrorResponse<MessageCandidateOutErr>(
          MessageType.CANDIDATE,
          ErrorType.Validation,
          `validation error: ${vResult[0]}`
        ),
        refClient
      )
      return
    }
    const { id, candidate } = vResult[1].data
    const roomId = user.getRoomId()
    if (!roomId) {
      user.send(
        buildErrorResponse<MessageCandidateOutErr>(
          MessageType.CANDIDATE,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to any room`
        ),
        refClient
      )
      return
    }
    const room = this._rooms.get(roomId)
    if (!room) {
      user.send(
        buildErrorResponse<MessageCandidateOutErr>(
          MessageType.CANDIDATE,
          ErrorType.UnknownRoom,
          `could not find room`
        ),
        refClient
      )
      return
    }
    if (!room.getUsers().has(user.id)) {
      user.send(
        buildErrorResponse<MessageCandidateOutErr>(
          MessageType.CANDIDATE,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    const toUser = room.getUsers().get(id)
    if (!toUser) {
      user.send(
        buildErrorResponse<MessageCandidateOutErr>(
          MessageType.CANDIDATE,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    const responsePush: MessagePushCandidateOutOk = {
      type: MessageType.PUSH_CANDIDATE,
      data: {
        id: user.id,
        candidate
      }
    }
    toUser.send(responsePush, null)
    const responseAck: MessageCandidateOutOk = {
      type: MessageType.CANDIDATE,
      data: {}
    }
    user.send(responseAck, refClient)
  }

  answer: RouteHandler = (user, anyMessage, refClient) => {
    const vResult = validateSomeMessage<MessageAnswerIn>(anyMessage)
    if (!isValidationSuccess(vResult)) {
      user.send(
        buildErrorResponse<MessageAnswerOutErr>(
          MessageType.ANSWER,
          ErrorType.Validation,
          `validation error: ${vResult[0]}`
        ),
        refClient
      )
      return
    }
    const { id, description } = vResult[1].data
    const roomId = user.getRoomId()
    if (!roomId) {
      user.send(
        buildErrorResponse<MessageAnswerOutErr>(
          MessageType.ANSWER,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to any room`
        ),
        refClient
      )
      return
    }
    const room = this._rooms.get(roomId)
    if (!room) {
      user.send(
        buildErrorResponse<MessageAnswerOutErr>(
          MessageType.ANSWER,
          ErrorType.UnknownRoom,
          `could not find room`
        ),
        refClient
      )
      return
    }
    if (!room.getUsers().has(user.id)) {
      user.send(
        buildErrorResponse<MessageAnswerOutErr>(
          MessageType.ANSWER,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    const toUser = room.getUsers().get(id)
    if (!toUser) {
      user.send(
        buildErrorResponse<MessageAnswerOutErr>(
          MessageType.ANSWER,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    const responsePush: MessagePushAnswerOutOk = {
      type: MessageType.PUSH_ANSWER,
      data: {
        id: user.id,
        description
      }
    }
    toUser.send(responsePush, null)
    const responseAck: MessageAnswerOutOk = {
      type: MessageType.ANSWER,
      data: {}
    }
    user.send(responseAck, refClient)
  }

  guard: RouteHandler = (user, anyMessage, refClient) => {
    const vResult = validateSomeMessage<MessageGuardIn>(anyMessage)
    if (!isValidationSuccess(vResult)) {
      user.send(
        buildErrorResponse<MessageGuardOutErr>(
          MessageType.GUARD,
          ErrorType.Validation,
          `validation error: ${vResult[0]}`
        ),
        refClient
      )
      return
    }
    const { roomId: targetRoomId, token } = vResult[1].data
    validateToken(token)
      .then(payload => {
        const { exp, data } = payload as {
          exp: number
          data: { username: string; roomId: string }
        }
        const roomId = user.getRoomId()
        if (!roomId) {
          user.send(
            buildErrorResponse<MessageGuardOutErr>(
              MessageType.GUARD,
              ErrorType.DoesntBelongRoom,
              `user doesn't belong to any room`
            ),
            refClient
          )
          return
        }
        if (data.roomId !== roomId) {
          user.send(
            buildErrorResponse<MessageGuardOutErr>(
              MessageType.GUARD,
              ErrorType.InvalidToken,
              `token room doesn't match server state`
            ),
            refClient
          )
          return
        }
        if (targetRoomId !== roomId) {
          user.send(
            buildErrorResponse<MessageGuardOutErr>(
              MessageType.GUARD,
              ErrorType.InvalidToken,
              `token room doesn't match targeted room`
            ),
            refClient
          )
          return
        }
        const room = this._rooms.get(roomId)
        if (!room) {
          user.send(
            buildErrorResponse<MessageGuardOutErr>(
              MessageType.GUARD,
              ErrorType.UnknownRoom,
              `could not find room`
            ),
            refClient
          )
          return
        }
        if (!room.getUsers().has(user.id)) {
          user.send(
            buildErrorResponse<MessageGuardOutErr>(
              MessageType.GUARD,
              ErrorType.DoesntBelongRoom,
              `user doesn't belong to room`
            ),
            refClient
          )
          return
        }
        const response: MessageGuardOutOk = {
          type: MessageType.GUARD,
          data: {}
        }
        user.send(response, refClient)
      })
      .catch(() => {
        user.send(
          buildErrorResponse<MessageGuardOutErr>(
            MessageType.GUARD,
            ErrorType.InvalidToken,
            `invalid token`
          ),
          refClient
        )
      })
  }

  roomExists: RouteHandler = (user, anyMessage, refClient) => {
    const vResult = validateSomeMessage<MessageRoomExistsIn>(anyMessage)
    if (!isValidationSuccess(vResult)) {
      user.send(
        buildErrorResponse<MessageRoomExistsOutErr>(
          MessageType.ROOM_EXISTS,
          ErrorType.Validation,
          `validation error: ${vResult[0]}`
        ),
        refClient
      )
      return
    }
    const { roomId } = vResult[1].data
    const response: MessageRoomExistsOutOk = {
      type: MessageType.ROOM_EXISTS,
      data: {
        exists: this._rooms.has(roomId)
      }
    }
    user.send(response, refClient)
  }

  lockRoom: RouteHandler = (user, anyMessage, refClient) => {
    const vResult = validateSomeMessage<MessageLockRoomIn>(anyMessage)
    if (!isValidationSuccess(vResult)) {
      user.send(
        buildErrorResponse<MessageLockRoomOutErr>(
          MessageType.LOCK_ROOM,
          ErrorType.Validation,
          `validation error: ${vResult[0]}`
        ),
        refClient
      )
      return
    }
    const { locked } = vResult[1].data
    const roomId = user.getRoomId()
    if (!roomId) {
      user.send(
        buildErrorResponse<MessageLockRoomOutErr>(
          MessageType.LOCK_ROOM,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to any room`
        ),
        refClient
      )
      return
    }
    const room = this._rooms.get(roomId)
    if (!room) {
      user.send(
        buildErrorResponse<MessageLockRoomOutErr>(
          MessageType.LOCK_ROOM,
          ErrorType.UnknownRoom,
          `could not find room`
        ),
        refClient
      )
      return
    }
    if (!room.getUsers().has(user.id)) {
      user.send(
        buildErrorResponse<MessageLockRoomOutErr>(
          MessageType.LOCK_ROOM,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    if (room.getOwnerId() !== user.id) {
      user.send(
        buildErrorResponse<MessageLockRoomOutErr>(
          MessageType.LOCK_ROOM,
          ErrorType.NotEnoughPrivileges,
          `user isn't room owner`
        ),
        refClient
      )
      return
    }
    if (locked) {
      room.lock()
    } else {
      room.unlock()
    }
    const response: MessageLockRoomOutOk = {
      type: MessageType.LOCK_ROOM,
      data: {
        locked: room.isLocked()
      }
    }
    user.send(response, refClient)
    const notifyOtherResponse: MessagePushLockRoomOutOk = {
      type: MessageType.PUSH_LOCK_ROOM,
      data: { locked: room.isLocked() }
    }
    for (const [, peer] of room.getUsers()) {
      if (peer.ref !== user) {
        peer.send(notifyOtherResponse, null)
      }
    }
  }

  leaveRoom: RouteHandler = (user, anyMessage, refClient) => {
    const vResult = validateSomeMessage<MessageLeaveRoomIn>(anyMessage)
    if (!isValidationSuccess(vResult)) {
      user.send(
        buildErrorResponse<MessageLeaveRoomOutErr>(
          MessageType.LEAVE_ROOM,
          ErrorType.Validation,
          `validation error: ${vResult[0]}`
        ),
        refClient
      )
      return
    }
    const roomId = user.getRoomId()
    if (!roomId) {
      user.send(
        buildErrorResponse<MessageLockRoomOutErr>(
          MessageType.LOCK_ROOM,
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to any room`
        ),
        refClient
      )
      return
    }
    const room = this._rooms.get(roomId)
    if (!room) {
      user.send(
        buildErrorResponse<MessageLockRoomOutErr>(
          MessageType.LOCK_ROOM,
          ErrorType.UnknownRoom,
          `could not find room`
        ),
        refClient
      )
      return
    }
    room.removeUser(user)
    user.setRoomId(null)
    const response: MessageLeaveRoomOutOk = {
      type: MessageType.LEAVE_ROOM,
      data: {}
    }
    user.send(response, refClient)
    const notifyOtherResponse: MessagePushUserDisconnectedOutOk = {
      type: MessageType.PUSH_USER_DISCONNECTED,
      data: { userId: user.id }
    }
    for (const [, peer] of room.getUsers()) {
      if (peer.ref !== user) {
        peer.send(notifyOtherResponse, null)
      }
    }
  }

  renewToken: RouteHandler = (user, anyMessage, refClient) => {
    const vResult = validateSomeMessage<MessageRenewTokenIn>(anyMessage)
    if (!isValidationSuccess(vResult)) {
      user.send(
        buildErrorResponse<MessageRenewTokenOutErr>(
          MessageType.RENEW_TOKEN,
          ErrorType.Validation,
          `validation error: ${vResult[0]}`
        ),
        refClient
      )
      return
    }
    const { token } = vResult[1].data
    validateToken(token)
      .then(payload => {
        const { exp, data } = payload as {
          exp: number
          data: { username: string; roomId: string }
        }
        const { username, roomId } = data
        buildToken({ username, roomId }, ROOM_TOKEN_EXPIRATION)
          .then(token => {
            const response: MessageRenewTokenOutOk = {
              type: MessageType.RENEW_TOKEN,
              data: {
                token
              }
            }
            user.send(response, refClient)
          })
          .catch(() => {
            user.send(
              buildErrorResponse<MessageRenewTokenOutErr>(
                MessageType.RENEW_TOKEN,
                ErrorType.CannotGenerateToken,
                `couldn't generate token`
              ),
              refClient
            )
          })
      })
      .catch(() => {
        user.send(
          buildErrorResponse<MessageRenewTokenOutErr>(
            MessageType.RENEW_TOKEN,
            ErrorType.InvalidToken,
            `invalid token`
          ),
          refClient
        )
      })
  }
}
