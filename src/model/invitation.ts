import { nanoid } from "../../deps/nanoid/nanoid.ts"
import { Serializable } from "../utils/types.ts"
import { hashDict } from "../utils/constants.ts"

export interface InvitationDTO {
  expireAt: number
  key: string
  password: string
}

export class Invitation implements Serializable<InvitationDTO> {
  readonly expireAt: number
  readonly password: string
  readonly id: string
  constructor(lifeSpan: number = 1000 * 60 * 60) {
    this.expireAt = Date.now() + lifeSpan
    this.password = Array.from(crypto.getRandomValues(new Uint32Array(32)))
      .map(x => hashDict[x % hashDict.length])
      .join("")
    this.id = nanoid()
  }

  toDTO(): InvitationDTO {
    return {
      key: this.id,
      expireAt: this.expireAt,
      password: this.password
    }
  }
}
