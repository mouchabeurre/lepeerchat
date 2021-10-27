import {
  Application,
  RouterContext,
  Router,
  Status,
  createHttpError,
  send,
  isHttpError,
} from "./deps/oak/oak.ts"
import { handleWebsocket } from "./src/ws.ts"
import { logger } from "./src/utils/logger.ts"

const hostname = "0.0.0.0"
const port = 8080
const staticDir = `${Deno.cwd()}/dist`

const router = new Router()
router
  .get("/ws", async (context: RouterContext) => {
    const ws = await context.upgrade()
    handleWebsocket(ws)
  })
  .get("/static/(.*)", async (context: RouterContext) => {
    const filename = context.params["0"]
    context.assert(!!filename, Status.NotFound)
    try {
      await send(context, `${filename}`, {
        root: `${staticDir}`,
      })
    } catch (error) {
      throw createHttpError(Status.NotFound)
    }
  })
  .get("/(.*)", async (context: RouterContext) => {
    await send(context, "index.html", {
      root: `${staticDir}`,
    })
  })

const app = new Application()
app.use(async ({ response }, next) => {
  try {
    await next()
  } catch (error) {
    if (isHttpError(error)) {
      response.status = error.status
    } else {
      logger.error("ERROR MIDDLEWARE: processing unknown error")
      response.status = Status.InternalServerError
      response.body = { message: "An unexpected server error occured" }
    }
  }
})
app.use(router.routes())
app.use(router.allowedMethods())
app.addEventListener("listen", ({ hostname, port, secure, serverType }) => {
  logger.info(
    `SERVER: listening on [${secure ? "https://" : "http://"}${
      hostname ?? "localhost"
    }:${port}] with [${serverType}] HttpServer`
  )
})
app.addEventListener("error", event => {
  logger.error(
    `SERVER: ln${event.lineno};col${event.colno}`,
    event.error,
    event.message
  )
})

await app.listen({
  port,
  hostname,
})
