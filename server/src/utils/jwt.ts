import {
  create,
  getNumericDate,
  Header,
  Payload,
  verify,
} from "../../deps/djwt/djwt.ts"
import { AnyJson } from "./types.ts"

const key = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"]
)

export function buildToken(data: AnyJson, expiration: number) {
  const header: Header = {
    alg: "HS512",
  }
  const payload: Payload = {
    exp: getNumericDate(expiration),
    data,
  }
  return create(header, payload, key)
}

export function validateToken(token: string) {
  return verify(token, key)
}
