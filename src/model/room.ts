import { nanoid } from "../../deps/nanoid/nanoid.ts"
import { User, UserDTO, Sendable } from "./user.ts"
import { Invitation } from "./invitation.ts"
import { HashMap } from "../utils/types.ts"
import { Serializable } from "../utils/types.ts"
import { Logger } from "../utils/logger.ts"
import { MessageOutOk, MessageOutErr } from "../utils/api.ts"
import { buildToken } from "../utils/jwt.ts"
import { ROOM_TOKEN_EXPIRATION } from "../utils/constants.ts"

export type RoomUserDTO = UserDTO & { name: string }

export interface RoomDTO {
  id: string
  locked: boolean
  name: string
  ownerUsername: string
  users: RoomUserDTO[]
}

export class RoomUser implements Sendable, Serializable<RoomUserDTO> {
  readonly ref: User
  readonly username: string
  constructor(ref: User, username: string) {
    this.ref = ref
    this.username = username
  }

  send(message: MessageOutOk | MessageOutErr, refClient: string | null) {
    this.ref.send(message, refClient)
  }

  toDTO(): RoomUserDTO {
    return {
      name: this.username,
      ...this.ref.toDTO()
    }
  }
}

export class Room extends Logger implements Serializable<RoomDTO> {
  readonly id: string
  private _lastVisitorDate: number
  private _locked: boolean
  private _name: string
  private _invitations: HashMap<Invitation>
  private _users: HashMap<RoomUser>
  private _ownerUsername: string
  private _userTokenMemory: HashMap<string>
  private constructor(
    name: string,
    owner: { user: User; username: string; token: string },
    id: string
  ) {
    super("room", id)
    this._name = name
    this.id = id
    this._lastVisitorDate = Date.now()
    this._locked = false
    this._invitations = new Map()
    this._users = new Map()
    this._userTokenMemory = new Map()
    this._ownerUsername = this._addUser(
      owner.user,
      owner.username,
      owner.token
    ).username
    this.log.info("new room")
  }

  static buildRoom(
    name: string,
    owner: { user: User; username: string }
  ): Promise<[Room, string]> {
    const id = nanoid()
    return new Promise((resolve, reject) => {
      buildToken(
        { username: owner.username, roomId: id },
        ROOM_TOKEN_EXPIRATION
      )
        .then(token => {
          const room = new Room(name, { ...owner, token }, id)
          resolve([room, token])
        })
        .catch(() => reject())
    })
  }

  private _addUser(user: User, username: string, token: string): RoomUser {
    const roomUser = new RoomUser(user, username)
    this._users.set(user.id, roomUser)
    this._userTokenMemory.set(username, token)
    this.log.info("user", user.id, "added")
    return roomUser
  }

  getName() {
    return this._name
  }
  setName(name: string) {
    this._name = name
  }

  getOwnerId(): string | null {
    for (const [, user] of this._users.entries()) {
      if (user.username === this._ownerUsername) {
        return user.ref.id
      }
    }
    return null
  }

  getLastVisitorDate() {
    return this._lastVisitorDate
  }

  isUniqueUsername(username: string) {
    return !this._userTokenMemory.has(username)
  }

  isInUseUsername(username: string) {
    for (const [, user] of this._users.entries()) {
      if (user.username === username) {
        return true
      }
    }
    return false
  }

  isLocked() {
    return this._locked
  }
  lock() {
    this._locked = true
    this.log.info("room locked")
  }
  unlock() {
    this._locked = false
    this.log.info("room unlocked")
  }

  getTokenMemory() {
    return this._userTokenMemory
  }

  getUsers() {
    return this._users
  }

  addUser(user: User, username: string): Promise<[RoomUser, string]> {
    return new Promise((resolve, reject) => {
      buildToken({ username, roomId: this.id }, ROOM_TOKEN_EXPIRATION)
        .then(token => {
          const roomUser = this._addUser(user, username, token)
          resolve([roomUser, token])
        })
        .catch(() => reject())
    })
  }
  removeUser(user: User) {
    this._users.delete(user.id)
    this.log.info("user", user.id, "removed")
    if (this._users.size === 0) {
      this._lastVisitorDate = Date.now()
      this.log.info("room is empty")
    }
  }

  getInvitations() {
    return this._invitations
  }
  addInvitation(invitation: Invitation) {
    this._invitations.set(invitation.id, invitation)
    this.log.info("invitation added", invitation.id)
  }
  removeInvitation(invitation: Invitation) {
    this._invitations.delete(invitation.id)
    this.log.info("invitation removed", invitation.id)
  }

  getUserToDTO(id: string): RoomUserDTO | null {
    return this._users.get(id)?.toDTO() ?? null
  }

  toDTO(): RoomDTO {
    let usersDTO: RoomUserDTO[] = []
    this._users.forEach(user => {
      usersDTO.push(user.toDTO())
    })
    return {
      id: this.id,
      locked: this._locked,
      name: this._name,
      ownerUsername: this._ownerUsername,
      users: usersDTO
    }
  }
}
