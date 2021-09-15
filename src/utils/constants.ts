export const GC = {
  EMPTY_ROOM_LIFESPAN: 1000 * 60 * 30,
  USER_PONG_TIMEOUT: 1000 * 10,
  USER_PING_TIMEOUT: 1000 * 6
}

export const hashDict =
  '0123456789AZERTYUIOPQSDFGHJKLMWXCVBNazertyuiopqsdfghjklmwxcvbn-=+!?;.$#&()"[]'

const alphaNumRegex = /.+/

export const USERNAME = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  CHARS_REGEX: alphaNumRegex
}

export const ROOM_NAME = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  CHARS_REGEX: alphaNumRegex
}

export const ROOM_TOKEN_EXPIRATION = 60 * 60 * 6
