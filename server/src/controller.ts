import { User } from "./model/user.ts"
import { Room } from "./model/room.ts"
import { Invitation } from "./model/invitation.ts"
import { MessageType, ErrorType, MessageOutErr } from "./utils/types.ts"
import { buildToken, validateToken } from "./utils/jwt.ts"
import { HashMap, MessageHandler } from "./utils/types.ts"
import {
  isCreditentialToken,
  MessageJoinRoomIn,
  MessageJoinRoomOutOk,
  MessagePushUserConnectedOutOk,
} from "./interfaces/join-room.ts"
import {
  MessageUsernameValidIn,
  MessageUsernameValidOutOk,
} from "./interfaces/username-valid.ts"
import {
  MessageCreateRoomIn,
  MessageCreateRoomOutOk,
} from "./interfaces/create-room.ts"
import {
  MessageOfferIn,
  MessageOfferOutOk,
  MessagePushOfferOutOk,
} from "./interfaces/offer.ts"
import {
  MessageCandidateIn,
  MessageCandidateOutOk,
  MessagePushCandidateOutOk,
} from "./interfaces/candidate.ts"
import {
  MessageAnswerIn,
  MessageAnswerOutOk,
  MessagePushAnswerOutOk,
} from "./interfaces/answer.ts"
import { MessageGuardIn, MessageGuardOutOk } from "./interfaces/guard.ts"
import {
  MessageGenerateInvitationIn,
  MessageGenerateInvitationOutOk,
} from "./interfaces/generate-invitation.ts"
import { MessageGetRoomIn, MessageGetRoomOutOk } from "./interfaces/get-room.ts"
import {
  MessageLeaveRoomIn,
  MessageLeaveRoomOutOk,
  MessagePushUserDisconnectedOutOk,
} from "./interfaces/leave-room.ts"
import {
  MessageLockRoomIn,
  MessageLockRoomOutOk,
  MessagePushLockRoomOutOk,
} from "./interfaces/lock-room.ts"
import {
  MessageRenewTokenIn,
  MessageRenewTokenOutOk,
} from "./interfaces/renew-token.ts"
import {
  MessageRoomExistsIn,
  MessageRoomExistsOutOk,
} from "./interfaces/room-exists.ts"
import { log } from "../deps/std/log/log.ts"
import { ROOM_TOKEN_EXPIRATION } from "./utils/constants.ts"

function buildErrorResponse(type: ErrorType, message: string): MessageOutErr {
  return {
    error: {
      type,
      message,
    },
  }
}

export class Controller {
  private _users: HashMap<User>
  private _rooms: HashMap<Room>
  constructor(users: HashMap<User>, rooms: HashMap<Room>) {
    this._users = users
    this._rooms = rooms
  }

  private _log<
    T extends log.Logger,
    K extends keyof Pick<T, "debug" | "info" | "warning" | "error" | "critical">
  >(obj: T, key: K, msg: string) {
    return obj[key](`CONTROLLER: ${msg}`)
  }

  usernameValid: MessageHandler<MessageUsernameValidIn> = (
    user,
    payload,
    refClient
  ) => {
    const { username, roomId, token } = payload
    const room = this._rooms.get(roomId)
    if (!room) {
      user.send(
        buildErrorResponse(ErrorType.UnknownRoom, `couldn't find room`),
        refClient
      )
      return
    }
    const sendSucces = () => {
      const response: MessageUsernameValidOutOk = {
        type: MessageType.USERNAME_VALID,
        username,
      }
      user.send(response, refClient)
    }
    if (!room.isUniqueUsername(username)) {
      if (!token) {
        user.send(
          buildErrorResponse(
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
              buildErrorResponse(
                ErrorType.Validation,
                `username already used by another user`
              ),
              refClient
            )
          }
        })
        .catch(() => {
          user.send(
            buildErrorResponse(ErrorType.InvalidToken, `invalid token`),
            refClient
          )
        })
    } else {
      sendSucces()
    }
  }

  createRoom: MessageHandler<MessageCreateRoomIn> = (
    user,
    payload,
    refClient
  ) => {
    const { username, roomName } = payload
    Room.buildRoom(roomName, { user, username })
      .then(([room, token]) => {
        user.setRoomId(room.id)
        this._rooms.set(room.id, room)
        const response: MessageCreateRoomOutOk = {
          type: MessageType.CREATE_ROOM,
          token,
          roomId: room.id,
          userId: user.id,
          username,
          roomName,
        }
        user.send(response, refClient)
      })
      .catch(() => {
        user.send(
          buildErrorResponse(
            ErrorType.CannotGenerateToken,
            `couldn't generate token`
          ),
          refClient
        )
      })
  }

  generateInvitation: MessageHandler<MessageGenerateInvitationIn> = (
    user,
    payload,
    refClient
  ) => {
    const roomId = user.getRoomId()
    if (!roomId) {
      user.send(
        buildErrorResponse(
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
        buildErrorResponse(ErrorType.UnknownRoom, `could not find room`),
        refClient
      )
      return
    }
    if (!room.getUsers().has(user.id)) {
      user.send(
        buildErrorResponse(
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    if (room.getOwnerId() !== user.id) {
      user.send(
        buildErrorResponse(
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
      invitation: {
        key: invitation.id,
        password: invitation.password,
        expireAt: invitation.expireAt,
      },
    }
    user.send(response, refClient)
  }

  joinRoom: MessageHandler<MessageJoinRoomIn> = (user, payload, refClient) => {
    const { creditentials } = payload
    const sendSuccess = (username: string, room: Room) => {
      user.setRoomId(room.id)
      room
        .addUser(user, username)
        .then(([roomUser, token]) => {
          const response: MessageJoinRoomOutOk = {
            type: MessageType.JOIN_ROOM,
            roomId: room.id,
            roomName: room.getName(),
            username,
            token,
          }
          user.send(response, refClient)
          const notifyOtherResponse: MessagePushUserConnectedOutOk = {
            type: MessageType.PUSH_USER_CONNECTED,
            user: roomUser.toDTO(),
          }
          for (const [, peer] of room.getUsers()) {
            if (peer.ref !== user) {
              peer.send(notifyOtherResponse, null)
            }
          }
        })
        .catch(() => {
          user.send(
            buildErrorResponse(
              ErrorType.CannotGenerateToken,
              `couldn't generate token`
            ),
            refClient
          )
        })
    }
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
              buildErrorResponse(ErrorType.UnknownRoom, `could not find room`),
              refClient
            )
            return
          }
          if (username !== data.username) {
            user.send(
              buildErrorResponse(
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
                buildErrorResponse(
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
            buildErrorResponse(ErrorType.InvalidToken, `invalid token`),
            refClient
          )
        })
    } else {
      const { roomId, username, password, key } = creditentials
      const room = this._rooms.get(roomId)
      if (!room) {
        user.send(
          buildErrorResponse(ErrorType.UnknownRoom, `could not find room`),
          refClient
        )
        return
      }
      if (room.getUsers().has(user.id)) {
        user.send(
          buildErrorResponse(
            ErrorType.BelongsRoom,
            `user already belongs to room`
          ),
          refClient
        )
        return
      }
      if (!room.isUniqueUsername(username)) {
        user.send(
          buildErrorResponse(
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
          buildErrorResponse(
            ErrorType.InvalidInvitation,
            `room in locked state`
          ),
          refClient
        )
        return
      }
      if (!invitation || invitation?.password !== password) {
        user.send(
          buildErrorResponse(
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

  getRoom: MessageHandler<MessageGetRoomIn> = (user, payload, refClient) => {
    const roomId = user.getRoomId()
    if (!roomId) {
      user.send(
        buildErrorResponse(
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
        buildErrorResponse(ErrorType.UnknownRoom, `could not find room`),
        refClient
      )
      return
    }
    if (!room.getUsers().has(user.id)) {
      user.send(
        buildErrorResponse(
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    const response: MessageGetRoomOutOk = {
      type: MessageType.GET_ROOM,
      room: room.toDTO(),
    }
    user.send(response, refClient)
  }

  offer: MessageHandler<MessageOfferIn> = (user, payload, refClient) => {
    const { id, description } = payload
    const roomId = user.getRoomId()
    if (!roomId) {
      user.send(
        buildErrorResponse(
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
        buildErrorResponse(ErrorType.UnknownRoom, `could not find room`),
        refClient
      )
      return
    }
    if (!room.getUsers().has(user.id)) {
      user.send(
        buildErrorResponse(
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
        buildErrorResponse(
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    const responsePush: MessagePushOfferOutOk = {
      type: MessageType.PUSH_OFFER,
      id: user.id,
      description,
    }
    toUser.send(responsePush, null)
    const responseAck: MessageOfferOutOk = {
      type: MessageType.OFFER,
    }
    user.send(responseAck, refClient)
  }

  candidate: MessageHandler<MessageCandidateIn> = (
    user,
    payload,
    refClient
  ) => {
    const { id, candidate } = payload
    const roomId = user.getRoomId()
    if (!roomId) {
      user.send(
        buildErrorResponse(
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
        buildErrorResponse(ErrorType.UnknownRoom, `could not find room`),
        refClient
      )
      return
    }
    if (!room.getUsers().has(user.id)) {
      user.send(
        buildErrorResponse(
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
        buildErrorResponse(
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    const responsePush: MessagePushCandidateOutOk = {
      type: MessageType.PUSH_CANDIDATE,
      id: user.id,
      candidate,
    }
    toUser.send(responsePush, null)
    const responseAck: MessageCandidateOutOk = {
      type: MessageType.CANDIDATE,
    }
    user.send(responseAck, refClient)
  }

  answer: MessageHandler<MessageAnswerIn> = (user, payload, refClient) => {
    const { id, description } = payload
    const roomId = user.getRoomId()
    if (!roomId) {
      user.send(
        buildErrorResponse(
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
        buildErrorResponse(ErrorType.UnknownRoom, `could not find room`),
        refClient
      )
      return
    }
    if (!room.getUsers().has(user.id)) {
      user.send(
        buildErrorResponse(
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
        buildErrorResponse(
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    const responsePush: MessagePushAnswerOutOk = {
      type: MessageType.PUSH_ANSWER,
      id: user.id,
      description,
    }
    toUser.send(responsePush, null)
    const responseAck: MessageAnswerOutOk = {
      type: MessageType.ANSWER,
    }
    user.send(responseAck, refClient)
  }

  guard: MessageHandler<MessageGuardIn> = (user, payload, refClient) => {
    const { roomId: targetRoomId, token } = payload
    validateToken(token)
      .then(payload => {
        const { exp, data } = payload as {
          exp: number
          data: { username: string; roomId: string }
        }
        const roomId = user.getRoomId()
        if (!roomId) {
          user.send(
            buildErrorResponse(
              ErrorType.DoesntBelongRoom,
              `user doesn't belong to any room`
            ),
            refClient
          )
          return
        }
        if (data.roomId !== roomId) {
          user.send(
            buildErrorResponse(
              ErrorType.InvalidToken,
              `token room doesn't match server state`
            ),
            refClient
          )
          return
        }
        if (targetRoomId !== roomId) {
          user.send(
            buildErrorResponse(
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
            buildErrorResponse(ErrorType.UnknownRoom, `could not find room`),
            refClient
          )
          return
        }
        if (!room.getUsers().has(user.id)) {
          user.send(
            buildErrorResponse(
              ErrorType.DoesntBelongRoom,
              `user doesn't belong to room`
            ),
            refClient
          )
          return
        }
        const response: MessageGuardOutOk = {
          type: MessageType.GUARD,
        }
        user.send(response, refClient)
      })
      .catch(() => {
        user.send(
          buildErrorResponse(ErrorType.InvalidToken, `invalid token`),
          refClient
        )
      })
  }

  roomExists: MessageHandler<MessageRoomExistsIn> = (
    user,
    payload,
    refClient
  ) => {
    const { roomId } = payload
    const response: MessageRoomExistsOutOk = {
      type: MessageType.ROOM_EXISTS,
      exists: this._rooms.has(roomId),
    }
    user.send(response, refClient)
  }

  lockRoom: MessageHandler<MessageLockRoomIn> = (user, payload, refClient) => {
    const { locked } = payload
    const roomId = user.getRoomId()
    if (!roomId) {
      user.send(
        buildErrorResponse(
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
        buildErrorResponse(ErrorType.UnknownRoom, `could not find room`),
        refClient
      )
      return
    }
    if (!room.getUsers().has(user.id)) {
      user.send(
        buildErrorResponse(
          ErrorType.DoesntBelongRoom,
          `user doesn't belong to room`
        ),
        refClient
      )
      return
    }
    if (room.getOwnerId() !== user.id) {
      user.send(
        buildErrorResponse(
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
      locked: room.isLocked(),
    }
    user.send(response, refClient)
    const notifyOtherResponse: MessagePushLockRoomOutOk = {
      type: MessageType.PUSH_LOCK_ROOM,
      locked: room.isLocked(),
    }
    for (const [, peer] of room.getUsers()) {
      if (peer.ref !== user) {
        peer.send(notifyOtherResponse, null)
      }
    }
  }

  leaveRoom: MessageHandler<MessageLeaveRoomIn> = (
    user,
    payload,
    refClient
  ) => {
    const roomId = user.getRoomId()
    if (!roomId) {
      user.send(
        buildErrorResponse(
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
        buildErrorResponse(ErrorType.UnknownRoom, `could not find room`),
        refClient
      )
      return
    }
    room.removeUser(user)
    user.setRoomId(null)
    const response: MessageLeaveRoomOutOk = {
      type: MessageType.LEAVE_ROOM,
    }
    user.send(response, refClient)
    const notifyOtherResponse: MessagePushUserDisconnectedOutOk = {
      type: MessageType.PUSH_USER_DISCONNECTED,
      userId: user.id,
    }
    for (const [, peer] of room.getUsers()) {
      if (peer.ref !== user) {
        peer.send(notifyOtherResponse, null)
      }
    }
  }

  renewToken: MessageHandler<MessageRenewTokenIn> = (
    user,
    payload,
    refClient
  ) => {
    const { token } = payload
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
              token,
            }
            user.send(response, refClient)
          })
          .catch(() => {
            user.send(
              buildErrorResponse(
                ErrorType.CannotGenerateToken,
                `couldn't generate token`
              ),
              refClient
            )
          })
      })
      .catch(() => {
        user.send(
          buildErrorResponse(ErrorType.InvalidToken, `invalid token`),
          refClient
        )
      })
  }
}
