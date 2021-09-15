import { log as stdLog } from "../../deps/std/log/log.ts"

enum LogFlag {
  DEBUG = "debug",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical"
}
const nameLength = 5

function getDate() {
  const d = new Date()
  const day = `${d.getDate()}`.padStart(2, "0")
  const month = `${d.getMonth() + 1}`.padStart(2, "0")
  const year = `${d.getFullYear()}`
  const hours = `${d.getHours()}`.padStart(2, "0")
  const minutes = `${d.getMinutes()}`.padStart(2, "0")
  const seconds = `${d.getSeconds()}`.padStart(2, "0")
  const mseconds = `${d.getMilliseconds()}`.padStart(3, "0")
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}.${mseconds}`
}

function buildLog(type: string, ...message: any[]) {
  return `[${getDate()}] [${type
    .slice(0, nameLength)
    .toUpperCase()}]: ${message.join(" ")}`
}

export const log: {
  [k in LogFlag]: (type: string, ...message: any[]) => void
} = {
  debug: (type, ...message) => stdLog.debug(buildLog(type, ...message)),
  info: (type, ...message) => stdLog.info(buildLog(type, ...message)),
  warning: (type, ...message) => stdLog.warning(buildLog(type, ...message)),
  error: (type, ...message) => stdLog.error(buildLog(type, ...message)),
  critical: (type, ...message) => stdLog.critical(buildLog(type, ...message))
}

export class Logger {
  private _type: string
  private _id: string | null
  protected log: { [k in LogFlag]: (...message: any[]) => void } = {
    debug: this.debug.bind(this),
    info: this.info.bind(this),
    warning: this.warning.bind(this),
    error: this.error.bind(this),
    critical: this.critical.bind(this)
  }
  constructor(type: string, id?: string) {
    this._type = type.slice(0, nameLength).toUpperCase()
    this._id = id || null
  }

  private _buildLog(...message: any[]) {
    return `[${getDate()}] [${this._type}${
      this._id ? `(${this._id})` : ""
    }]: ${message.join(" ")}`
  }

  debug(...message: any[]) {
    stdLog.debug(this._buildLog(...message))
  }
  info(...message: any[]) {
    stdLog.info(this._buildLog(...message))
  }
  warning(...message: any[]) {
    stdLog.warning(this._buildLog(...message))
  }
  error(...message: any[]) {
    stdLog.error(this._buildLog(...message))
  }
  critical(...message: any[]) {
    stdLog.critical(this._buildLog(...message))
  }
}
