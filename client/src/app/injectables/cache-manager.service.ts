import { Injectable } from "@angular/core"

const StoredRoomsKey = "ROOMS"
const StoredSettingsKey = "SETTINGS"

interface RoomEntry {
  username: string
  roomName: string
  preventPromptLeave?: boolean
  token?: string
  invitations?: RoomInvitation[]
}

export interface RoomInvitation {
  issueDate: Date
  link: string
  expiresAt: Date
}

interface Settings {
  mediaDevices: CachedMediaDevices
}

interface CachedMediaDevices {
  audio: string | null
  video: string | null
}

type RawCachedRooms = [string, RoomEntry]

type CachedRoomsMap = Map<string, RoomEntry>

function compareRoomEntries(a: RoomEntry, b: RoomEntry): boolean {
  if (a.username !== b.username) {
    return true
  }
  if (a.roomName !== b.roomName) {
    return true
  }
  if (a?.preventPromptLeave !== b?.preventPromptLeave) {
    return true
  }
  if (a?.token !== b?.token) {
    return true
  }
  const diffCount: number =
    (a.invitations?.filter(invA => {
      return !b.invitations?.find(invB => invB.link === invA.link)
    })?.length ?? 0) +
    (b.invitations?.filter(invB => {
      return !a.invitations?.find(invA => invA.link === invB.link)
    })?.length ?? 0)
  if (diffCount > 0) {
    return true
  }
  return false
}

@Injectable({
  providedIn: "root"
})
export class CacheManagerService {
  private _cachedRooms: CachedRoomsMap
  private _settings: Settings

  constructor() {
    this._cachedRooms = this._getCachedRooms()
    this._settings = this._getCachedSettings()
    this._persistRooms(this._cachedRooms)
    this._persistSettings(this._settings)
  }

  private _getCachedRooms(): CachedRoomsMap {
    const localStorageItem = localStorage.getItem(StoredRoomsKey)
    if (!localStorageItem) {
      return new Map()
    }
    const cachedRooms: CachedRoomsMap = new Map()
    const rawRoomList: RawCachedRooms[] = JSON.parse(localStorageItem)
    if (rawRoomList && rawRoomList.length > 0) {
      for (const [roomId, entry] of rawRoomList) {
        if (entry && entry.username && entry.token) {
          cachedRooms.set(roomId, {
            username: entry.username,
            token: entry.token,
            roomName: entry.roomName,
            preventPromptLeave: entry.preventPromptLeave ?? false,
            invitations:
              entry.invitations
                ?.map(invitation => {
                  return {
                    issueDate: new Date(invitation.issueDate),
                    link: invitation.link,
                    expiresAt: new Date(invitation.expiresAt)
                  }
                })
                .filter(invitation => invitation.expiresAt > new Date()) ?? []
          })
        }
      }
    }
    return cachedRooms
  }

  private _getCachedSettings(): Settings {
    const localStorageItem = localStorage.getItem(StoredRoomsKey)
    if (!localStorageItem) {
      return {
        mediaDevices: {
          audio: null,
          video: null
        }
      }
    }
    const settings: Settings = JSON.parse(localStorageItem)
    return {
      mediaDevices: {
        audio: settings?.mediaDevices?.audio || null,
        video: settings?.mediaDevices?.video || null
      }
    }
  }

  private _persistRooms(rooms: CachedRoomsMap) {
    const rawRooms = [...rooms.entries()]
    localStorage.setItem(StoredRoomsKey, JSON.stringify(rawRooms))
  }

  private _persistSettings(settings: Settings) {
    localStorage.setItem(StoredSettingsKey, JSON.stringify(settings))
  }

  getAllRooms() {
    return this._cachedRooms
  }

  deleteAllRooms() {
    this._cachedRooms.clear()
    this._persistRooms(this._cachedRooms)
  }

  getRoom(roomId: string): RoomEntry | null {
    return this._cachedRooms.get(roomId) || null
  }

  getSettings(): Settings {
    return this._settings
  }

  saveRoom(roomId: string, roomEntry: RoomEntry) {
    const oldRoom = this._cachedRooms.get(roomId)
    let save = false
    if (oldRoom) {
      save = compareRoomEntries(oldRoom, roomEntry)
    } else {
      save = true
    }
    if (save) {
      this._cachedRooms.set(roomId, roomEntry)
      this._persistRooms(this._cachedRooms)
    }
  }

  saveSettings(settings: Settings) {
    this._settings = settings
    this._persistSettings(this._settings)
  }

  deleteRoom(roomId: string) {
    if (this._cachedRooms.has(roomId)) {
      this._cachedRooms.delete(roomId)
      this._persistRooms(this._cachedRooms)
    }
  }
}
