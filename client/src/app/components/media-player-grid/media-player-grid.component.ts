import { Component, NgZone, OnDestroy, OnInit } from "@angular/core"
import { merge, Subject, zip } from "rxjs"
import { first, takeUntil } from "rxjs/operators"
import {
  RoomService,
  RoomUpdate,
  RoomUpdateKind
} from "src/app/injectables/room.service"
import { User } from "src/app/utils/room-state"

@Component({
  selector: "app-media-player-grid",
  templateUrl: "./media-player-grid.component.html",
  styleUrls: ["./media-player-grid.component.sass"]
})
export class MediaPlayerGridComponent implements OnInit, OnDestroy {
  private _unsubscribeSubject$: Subject<void>
  private _showSelfMedia: boolean
  roomState: {
    peers: User[]
    selfUser: User
  } | null

  get show_self_player() {
    return this._showSelfMedia && this.roomState?.selfUser.connectionState.media
  }

  get peers_with_stream() {
    return (
      this.roomState?.peers.filter(peer => peer.connectionState.media) ?? []
    )
  }

  constructor(private _roomService: RoomService, private _ngZone: NgZone) {
    this._unsubscribeSubject$ = new Subject()
    this.roomState = null
    this._showSelfMedia = false
  }

  ngOnInit(): void {
    zip(this._roomService.getRoomProperties(), this._roomService.getUserList())
      .pipe(first())
      .subscribe({
        next: initialState => {
          const selfUser = initialState[1].find(
            user => user.id === initialState[0].self.id
          )
          if (!selfUser) {
            console.error("self is dead, long live self")
            return
          }
          this.roomState = {
            selfUser,
            peers: initialState[1].filter(user => user.id !== selfUser.id)
          }
          merge<RoomUpdate>(
            this._roomService.getUserListAsUpdate(),
            this._roomService.getPeerConnectionEventAsUpdate(),
            this._roomService.getPeerStreamEventAsUpdate()
          )
            .pipe(takeUntil(this._unsubscribeSubject$))
            .subscribe({
              next: update => {
                if (update.kind === RoomUpdateKind.USER_LIST) {
                  this.roomState!.peers = update.content.filter(
                    user => user.id !== this.roomState!.selfUser.id
                  )
                } else if (
                  update.kind === RoomUpdateKind.PEER_CONNECTION_EVENT
                ) {
                } else if (update.kind === RoomUpdateKind.PEER_STREAM_EVENT) {
                  const peer = this.roomState?.peers.find(
                    user => user.id === update.content.from
                  )
                  if (peer) {
                    this._ngZone.run(() => {
                      peer.connectionState.media = update.content.data.stream
                    })
                  }
                }
              }
            })
        }
      })
  }

  onShowSelfPlayer(show: boolean) {
    this._showSelfMedia = show
  }
  onStreamSelfMedia(stream: MediaStream | null) {
    this.roomState!.selfUser.connectionState.media = stream
    this._roomService.updateStream(stream)
  }

  ngOnDestroy() {
    this._unsubscribeSubject$.next()
  }
}
