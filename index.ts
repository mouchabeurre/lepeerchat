import { Application, Router, send } from "./deps/oak/oak.ts"

import {
  isWebSocketCloseEvent,
  isWebSocketPongEvent
} from "./deps/std/ws/ws.ts"
import { HashMap } from "./src/utils/types.ts"
import { User } from "./src/model/user.ts"
import { Room } from "./src/model/room.ts"
import { GarbageCollector } from "./src/utils/gc.ts"
import * as Api from "./src/utils/api.ts"
import { Controller } from "./src/controller.ts"
import { Router as WsRouter } from "./src/router.ts"
import { log } from "./src/utils/logger.ts"
import { GC } from "./src/utils/constants.ts"

const users: HashMap<User> = new Map()
const rooms: HashMap<Room> = new Map()

const gc = new GarbageCollector(rooms, users)
gc.start()
const controller = new Controller(users, rooms)
const wsRouter = new WsRouter()
wsRouter
  .use(Api.MessageType.USERNAME_VALID, controller.usernameValid)
  .use(Api.MessageType.CREATE_ROOM, controller.createRoom)
  .use(Api.MessageType.GENERATE_INVITATION, controller.generateInvitation)
  .use(Api.MessageType.JOIN_ROOM, controller.joinRoom)
  .use(Api.MessageType.GET_ROOM, controller.getRoom)
  .use(Api.MessageType.OFFER, controller.offer)
  .use(Api.MessageType.CANDIDATE, controller.candidate)
  .use(Api.MessageType.ANSWER, controller.answer)
  .use(Api.MessageType.GUARD, controller.guard)
  .use(Api.MessageType.ROOM_EXISTS, controller.roomExists)
  .use(Api.MessageType.LOCK_ROOM, controller.lockRoom)
  .use(Api.MessageType.LEAVE_ROOM, controller.leaveRoom)
  .use(Api.MessageType.RENEW_TOKEN, controller.renewToken)

function cleanupUser(user: User) {
  const userRoomId = user.getRoomId()
  if (userRoomId !== null) {
    const room = rooms.get(userRoomId)
    if (room) {
      log.info("cleaner", "cleaning user from room", userRoomId)
      room.removeUser(user)
      const roomUsers = room.getUsers()
      if (roomUsers.size > 0) {
        const notifyOtherResponse: Api.MessagePushUserDisconnectedOutOk = {
          type: Api.MessageType.PUSH_USER_DISCONNECTED,
          data: { userId: user.id }
        }
        for (const [, user] of roomUsers) {
          user.send(notifyOtherResponse, null)
        }
      }
    }
  }
  log.info("cleaner", "cleaning user", user.id)
  users.delete(user.id)
}

function pingUser(user: User) {
  user.ping()
}

const hostname = "0.0.0.0"
const port = 8080
const cwd = Deno.cwd()

const router = new Router()
router
  .get("/ws", async context => {
    try {
      const sock = await context.upgrade()
      const user = new User(sock)
      users.set(user.id, user)
      pingUser(user)

      try {
        for await (const ev of sock) {
          if (typeof ev === "string") {
            wsRouter.handleMessage(user, ev)
          } else if (isWebSocketPongEvent(ev)) {
            user.updatePong()
            setTimeout(() => {
              pingUser(user)
            }, GC.USER_PING_TIMEOUT)
          } else if (isWebSocketCloseEvent(ev)) {
            log.info("router", "socket closed for", user.id)
            break
          }
        }
      } catch (err) {
        log.error("router", "failed to recieve frame for", user.id)
      }
      if (!sock.isClosed) {
        await sock.close(1000).catch(() => {
          log.info("router", "forcefully closing socket for", user.id)
          sock.closeForce()
        })
      }
      cleanupUser(user)
    } catch (err) {
      log.error("router", "failed to accept websocket")
    }
  })
  .get("/static/(.*)", async context => {
    const filename = context.params["0"]
    if (!filename) {
      try {
        await send(context, "index.html", {
          root: `${cwd}/dist`
        })
      } catch (err) {
        log.warning("router", "couldn't serve static content")
      }
    }
    try {
      await send(context, `${filename}`, {
        root: `${cwd}/dist`
      })
    } catch (err) {
      log.warning("router", "couldn't serve static content")
    }
  })
  .get("/(.*)", async context => {
    try {
      await send(context, "index.html", {
        root: `${cwd}/dist`
      })
    } catch (err) {
      log.warning("router", "couldn't serve static content")
    }
  })

const app = new Application()
app.use(router.routes())
app.use(router.allowedMethods())
app.addEventListener("listen", ({ hostname, port, secure }) => {
  log.info(
    "server",
    `Listening on: ${secure ? "https://" : "http://"}${
      hostname ?? "localhost"
    }:${port}`
  )
})
app.addEventListener("error", event => {
  log.error(
    "server",
    `ln${event.lineno};col${event.colno}`,
    event.error,
    event.message
  )
})

await app.listen({
  port,
  hostname
})
