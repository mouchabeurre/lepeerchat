import { Validators } from "@angular/forms"

const alphanumRegex = /.+/

export const SOCKET_RESPONSE_TIMEOUT = 3000
export const SOCKET_OPEN_TIMEOUT = 2500
export const DATA_CHANNEL_RESPONSE_TIMEOUT = 3000
export const FEEDBACK_TIMEOUT = 3000
export const RENEW_TOKEN_TIMEOUT = 3600000

export const PING_INTERVAL = 1500

export const UsernameConstraintList = [
  Validators.required,
  Validators.pattern(alphanumRegex),
  Validators.minLength(3),
  Validators.maxLength(20)
]

export const RoomNameConstraintList = [
  Validators.required,
  Validators.pattern(alphanumRegex),
  Validators.minLength(3),
  Validators.maxLength(20)
]
