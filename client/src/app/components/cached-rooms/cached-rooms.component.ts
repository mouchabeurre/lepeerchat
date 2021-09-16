import { Component, OnInit } from "@angular/core"
import { CacheManagerService } from "src/app/injectables/cache-manager.service"
import { SocketService } from "src/app/injectables/socket.service"
import { MessageInErr } from "src/app/routing/api"
import { MessageRoomExistsInOk } from "src/app/routing/interfaces/room-exists"

interface CachedRoom {
  roomName: string
  username: string
  id: string
  // date: Date
}

@Component({
  selector: "app-cached-rooms",
  templateUrl: "./cached-rooms.component.html",
  styleUrls: ["./cached-rooms.component.sass"]
})
export class CachedRoomsComponent implements OnInit {
  rooms: CachedRoom[]
  roomsCheckedState: { found: boolean; pending: boolean }
  readonly hadCachedRooms: boolean

  constructor(
    private _socketService: SocketService,
    private _cacheManagerService: CacheManagerService
  ) {
    this.rooms = []
    this.roomsCheckedState = { found: false, pending: true }
    this.hadCachedRooms = this._cacheManagerService.getAllRooms().size > 0
  }

  private _buildRoomsFromCache() {
    const map = this._cacheManagerService.getAllRooms()
    return [...map.entries()].map<CachedRoom>(room => {
      return {
        id: room[0],
        roomName: room[1].roomName,
        username: room[1].username
      }
    })
  }

  ngOnInit(): void {
    const cachedRooms = this._buildRoomsFromCache()
    const allPromises: Promise<MessageRoomExistsInOk>[] = cachedRooms.map(
      room => {
        return this._socketService.send.roomExists({ roomId: room.id })
      }
    )
    Promise.all(allPromises)
      .then(results => {
        for (let i = 0; i < results.length; i++) {
          if (!results[i].exists) {
            this._cacheManagerService.deleteRoom(cachedRooms[i].id)
          }
        }
        this.rooms = this._buildRoomsFromCache()
        this.roomsCheckedState = { found: true, pending: false }
      })
      .catch((err: MessageInErr) => {
        this.roomsCheckedState = { found: false, pending: false }
        console.log("Couldn't sync cached rooms with server state:", err.error)
      })
  }

  onClearCachedRooms() {
    this._cacheManagerService.deleteAllRooms()
    this.rooms = this._buildRoomsFromCache()
  }
}
