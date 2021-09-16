import { GC } from "./utils/constants.ts"
import { User } from "./model/user.ts"
import { Room } from "./model/room.ts"
import { logger } from "./utils/logger.ts"
import { HashMap, KeepAlive } from "./utils/types.ts"
import { MessageType } from "./utils/types.ts"
import { MessagePushUserDisconnectedOutOk } from "./interfaces/leave-room.ts"
import { GarbageCollector } from "./utils/gc.ts"
import { WebSocketRouter } from "./ws-router.ts"
import { Controller } from "./controller.ts"

const users: HashMap<User> = new Map()
const rooms: HashMap<Room> = new Map()

const gc = new GarbageCollector(rooms, users)
const router = new WebSocketRouter(new Controller(users, rooms))

function cleanupUser(user: User) {
  const userRoomId = user.getRoomId()
  if (userRoomId !== null) {
    const room = rooms.get(userRoomId)
    if (room) {
      logger.info(`CLEANER: cleaning user ${user.id} from room ${userRoomId}`)
      room.removeUser(user)
      const roomUsers = room.getUsers()
      if (roomUsers.size > 0) {
        const notifyOtherResponse: MessagePushUserDisconnectedOutOk = {
          type: MessageType.PUSH_USER_DISCONNECTED,
          userId: user.id,
        }
        for (const [, user] of roomUsers) {
          user.send(notifyOtherResponse, null)
        }
      }
    }
  }
  logger.info(`CLEANER: cleaning user ${user.id}`)
  users.delete(user.id)
}

function pingUser(user: User) {
  user.ping()
}
function waitWebsocketOpen(ws: WebSocket, tries: number): Promise<void> {
  const sleep = () =>
    new Promise<void>(resolve => {
      setTimeout(() => {
        resolve()
      }, GC.WEBSOCKET_READY_TIMEOUT)
    })
  if (ws.readyState === ws.OPEN) {
    return Promise.resolve()
  }
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < tries; i++) {
      await sleep()
      if (ws.readyState === ws.OPEN) {
        resolve()
      }
    }
    reject()
  })
}

export function handleWebsocket(ws: WebSocket) {
  const user = new User(ws)
  users.set(user.id, user)

  waitWebsocketOpen(ws, 3)
    .then(() => {
      logger.info(`WEBSOCKET: socket ready for ${user.id}`)
      pingUser(user)
    })
    .catch(() => {
      logger.info(`WEBSOCKET: socket didn't open quickly enough ${user.id}`)
      cleanupUser(user)
      ws.close()
    })

  ws.onerror = event => {
    logger.info(`WEBSOCKET: socket error for ${user.id}: ${event}`)
    cleanupUser(user)
    ws.close()
  }
  ws.onclose = () => {
    logger.info(`WEBSOCKET: socket closed for ${user.id}`)
    cleanupUser(user)
  }
  ws.onmessage = event => {
    const data = event.data
    if (typeof data == "string") {
      if (data === KeepAlive.Pong) {
        user.updatePong()
        setTimeout(() => {
          pingUser(user)
        }, GC.KEEP_ALIVE_TIMEOUT)
      } else {
        router.handleMessage(user, data)
      }
    }
  }
}
