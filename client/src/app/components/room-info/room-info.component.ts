import { Component, NgZone, OnDestroy, OnInit } from "@angular/core"
import { merge, Subject, zip } from "rxjs"
import { first, takeUntil, map } from "rxjs/operators"
import {
  RoomService,
  RoomUpdate,
  RoomUpdateKind
} from "src/app/injectables/room.service"
import {
  Room,
  RoomProperties,
  User,
  UserConnectionStatus
} from "src/app/utils/room-state"
import { ChatUser } from "../chat/types"
import { roomInfoAnimations } from "./animations"

@Component({
  selector: "app-room-info",
  templateUrl: "./room-info.component.html",
  styleUrls: ["./room-info.component.sass"],
  animations: roomInfoAnimations
})
export class RoomInfoComponent implements OnInit, OnDestroy {
  private _unsubscribeSubject: Subject<void>
  roomState: { roomProperties: RoomProperties; userList: User[] } | null
  showManager: boolean
  userConnectionStatus: Record<keyof typeof UserConnectionStatus, string>

  constructor(private _roomService: RoomService, private _ngZone: NgZone) {
    this._unsubscribeSubject = new Subject()
    this.roomState = null
    this.showManager = false
    this.userConnectionStatus = UserConnectionStatus
  }

  ngOnInit(): void {
    zip(this._roomService.getRoomProperties(), this._roomService.getUserList())
      .pipe(first())
      .subscribe({
        next: initialState => {
          this.roomState = {
            roomProperties: initialState[0],
            userList: initialState[1]
          }
          merge<RoomUpdate>(
            this._roomService.getRoomPropertiesAsUpdate(),
            this._roomService.getUserListAsUpdate(),
            this._roomService.getPeerConnectionEventAsUpdate(),
            this._roomService.getPeerDataChannelStateAsUpdate()
          )
            .pipe(takeUntil(this._unsubscribeSubject))
            .subscribe({
              next: update => {
                if (update.kind === RoomUpdateKind.ROOM_PROPERTIES) {
                  this._ngZone.run(() => {
                    this.roomState!.roomProperties = update.content
                  })
                } else if (update.kind === RoomUpdateKind.USER_LIST) {
                  this._ngZone.run(() => {
                    this.roomState!.userList = update.content
                  })
                  // } else if (
                  //   update.kind === RoomUpdateKind.PEER_CONNECTION_EVENT
                  // ) {
                  //   const user = this.roomState!.userList.find(
                  //     user => user.id === update.content.from
                  //   )
                  //   if (user) {
                  //     this._ngZone.run(() => {
                  //       user.connectionState.status = update.content.data.status
                  //     })
                  //   }
                  // } else if (
                  //   update.kind === RoomUpdateKind.PEER_DATA_CHANNEL_STATE
                  // ) {
                  //   const user = this.roomState!.userList.find(
                  //     user => user.id === update.content.from
                  //   )
                  //   if (user) {
                  //     this._ngZone.run(() => {
                  //       user.connectionState.dataChannel =
                  //         update.content.data.opened
                  //     })
                  //   }
                }
              }
            })
        }
      })
  }

  isSelfUserOwner() {
    return (
      !!this.roomState &&
      this.roomState?.roomProperties.ownerUsername ===
        this.roomState.roomProperties?.self.name
    )
  }

  onOpenManager() {
    this.showManager = true
  }

  onCloseManager() {
    this.showManager = false
  }

  ngOnDestroy() {
    this._unsubscribeSubject.next()
  }
  public handleDone(event: any): void {
    console.log(
      event.triggerName,
      event.fromState,
      event.toState,
      event.totalTime
    )
  }
}
