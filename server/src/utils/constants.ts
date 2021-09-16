export const GC = {
  EMPTY_ROOM_LIFESPAN: 1000 * 60 * 30,
  KEEP_ALIVE_ACCEPTABLE_DELAY: 1000 * 2,
  KEEP_ALIVE_TIMEOUT: 1000 * 10,
  WEBSOCKET_READY_TIMEOUT: 1000,
}

export const hashDict =
  '0123456789AZERTYUIOPQSDFGHJKLMWXCVBNazertyuiopqsdfghjklmwxcvbn-=+!?;.$#&()"[]'

const anythingRegex = /.*/

export const USERNAME = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  CHARS_REGEX: anythingRegex,
}

export const ROOM_NAME = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  CHARS_REGEX: anythingRegex,
}

export const ROOM_TOKEN_EXPIRATION = 60 * 60 * 6
