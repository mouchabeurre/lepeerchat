import {
  create,
  decode,
  getNumericDate,
  Header,
  Payload,
  verify
} from "../../deps/djwt/djwt.ts"
import { AnyJson } from "./json.ts"
import { config } from "../../deps/dotenv/dotenv.ts"

const { JWT_SECRET } = config({ safe: true })

const alg = "HS256"
const key = JWT_SECRET

export function buildToken(data: AnyJson, expiration: number) {
  const header: Header = {
    alg
  }
  const payload: Payload = {
    exp: getNumericDate(expiration),
    data
  }
  return create(header, payload, key)
}

export function validateToken(token: string) {
  return verify(token, key, alg)
}
