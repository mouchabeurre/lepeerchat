import { log } from "../../deps/std/log/log.ts"

const formatter: log.FormatterFunction = (r: log.LogRecord) => {
  return `${r.datetime.toISOString()} ${r.levelName.padEnd(8, " ")}: ${r.msg}`
}

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter,
    }),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
})

export const logger = log.getLogger()
