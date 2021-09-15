import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Renderer2
} from "@angular/core"
import { SocketService } from "src/app/injectables/socket.service"
import { CacheManagerService } from "src/app/injectables/cache-manager.service"
import { RoomProperties } from "../../utils/room-state"
import { CanComponentDeactivate } from "src/app/routing/component-deactivate.guard"
import { RoomService } from "src/app/injectables/room.service"
import { Subject } from "rxjs"
import { bufferCount, delay, first, takeUntil } from "rxjs/operators"
import { roomAnimations } from "./animations"

export interface LeavePromptResponse {
  result: boolean
  preventPrompt?: boolean
}
const GRID_GUTTER_MARGIN = 10
const RESIZER_WIDTH = GRID_GUTTER_MARGIN

@Component({
  selector: "app-room",
  templateUrl: "./room.component.html",
  styleUrls: ["./room.component.sass"],
  animations: roomAnimations
})
export class RoomComponent
  implements CanComponentDeactivate, OnInit, OnDestroy {
  private _unsubscribeSubject: Subject<void>
  private _leavePromptSubject$: Subject<LeavePromptResponse>
  private _resizerSet$: Subject<void>

  roomProperties: RoomProperties | null
  roomFoundState: { found: boolean; pending: boolean }
  showLeavePrompt: boolean
  resizerState: {
    resizing: boolean
  }
  roomContainerRef: ElementRef<HTMLDivElement>
  resizerRef: ElementRef<HTMLDivElement>
  mediaControllerRef: ElementRef<HTMLDivElement>
  chatRef: ElementRef<HTMLDivElement>

  @ViewChild("roomContainer", { static: false }) set roomContainerRefSetter(
    ref: ElementRef<HTMLDivElement>
  ) {
    if (ref) {
      this.roomContainerRef = ref
      this._resizerSet$.next()
    }
  }
  @ViewChild("resizer", { static: false }) set resizerSetter(
    ref: ElementRef<HTMLDivElement>
  ) {
    if (ref) {
      this.resizerRef = ref
      this._resizerSet$.next()
    }
  }
  @ViewChild("mediaController", { static: false }) set mediaControllerRefSetter(
    ref: ElementRef<HTMLDivElement>
  ) {
    if (ref) {
      this.mediaControllerRef = ref
      this._resizerSet$.next()
    }
  }
  @ViewChild("chat", { static: false }) set chatRefSetter(
    ref: ElementRef<HTMLDivElement>
  ) {
    if (ref) {
      this.chatRef = ref
      this._resizerSet$.next()
    }
  }

  constructor(
    private _roomService: RoomService,
    private _socketService: SocketService,
    private _cacheManagerService: CacheManagerService,
    private _renderer: Renderer2
  ) {
    this.roomFoundState = { found: false, pending: true }
    this.showLeavePrompt = false
    this._leavePromptSubject$ = new Subject()
    this._resizerSet$ = new Subject()
    this._unsubscribeSubject = new Subject()
    this.resizerState = { resizing: false }
    this._resizerSet$
      .pipe(
        bufferCount(4),
        delay(1000),
        first(),
        takeUntil(this._unsubscribeSubject)
      )
      .subscribe({
        next: () => {
          const mediaControllerRects = this.mediaControllerRef.nativeElement.getBoundingClientRect()
          this._renderer.setStyle(
            this.resizerRef.nativeElement,
            "left",
            `${
              mediaControllerRects.right +
              GRID_GUTTER_MARGIN / 2 -
              RESIZER_WIDTH / 2
            }px`
          )
          this._renderer.setStyle(
            this.resizerRef.nativeElement,
            "width",
            `${RESIZER_WIDTH}px`
          )
        }
      })
  }

  ngOnInit() {
    this._roomService
      .init()
      .then(() => {
        this._roomService
          .getRoomProperties()
          .pipe(takeUntil(this._unsubscribeSubject))
          .subscribe({
            next: props => {
              this.roomProperties = props
            }
          })
        this.roomFoundState = { found: true, pending: false }
      })
      .catch(() => {
        this.roomFoundState = { found: false, pending: false }
      })
  }

  onCloseLeavePrompt(response: LeavePromptResponse) {
    this.showLeavePrompt = false
    this._leavePromptSubject$.next(response)
  }

  onStartResize(event: MouseEvent) {
    this.resizerState = {
      resizing: true
    }
  }
  onResize(event: MouseEvent) {
    if (this.resizerState.resizing) {
      const mediaControllerRects = this.mediaControllerRef.nativeElement.getBoundingClientRect()
      const chatRects = this.chatRef.nativeElement.getBoundingClientRect()
      const totalWidth = mediaControllerRects.width + chatRects.width
      if (totalWidth === 0) {
        return
      }
      const resizerRelativeX = event.clientX - mediaControllerRects.left
      const resizerFraction = resizerRelativeX / totalWidth
      let adjustedOffset: number
      if (resizerFraction < 0.33) {
        adjustedOffset = 0.33 * totalWidth + mediaControllerRects.left
      } else if (resizerFraction > 0.66) {
        adjustedOffset = 0.66 * totalWidth + mediaControllerRects.left
      } else {
        adjustedOffset = event.clientX
      }
      adjustedOffset = Math.floor(adjustedOffset)
      if (
        this.resizerRef.nativeElement.getBoundingClientRect().left !==
        adjustedOffset
      ) {
        this._renderer.setStyle(
          this.resizerRef.nativeElement,
          "left",
          `${adjustedOffset}px`
        )
      }
    }
  }
  onEndResize(event: MouseEvent) {
    const mediaControllerRects = this.mediaControllerRef.nativeElement.getBoundingClientRect()
    const chatRects = this.chatRef.nativeElement.getBoundingClientRect()
    const resizerRects = this.resizerRef.nativeElement.getBoundingClientRect()
    const totalWidth = mediaControllerRects.width + chatRects.width
    const resizerRelativeX = resizerRects.left - mediaControllerRects.left
    const resizerFraction = resizerRelativeX / totalWidth
    const oldTemplateColumns = window.getComputedStyle(
      this.roomContainerRef.nativeElement
    ).gridTemplateColumns
    const newTemplateColumns = [
      oldTemplateColumns.split(" ")[0],
      `${resizerFraction}fr`,
      `${1 - resizerFraction}fr`
    ].join(" ")
    this._renderer.setStyle(
      this.roomContainerRef.nativeElement,
      "grid-template-columns",
      newTemplateColumns
    )
    this.resizerState = {
      resizing: false
    }
  }

  canDeactivate() {
    if (this.roomProperties === null) {
      return true
    }
    const roomId = this.roomProperties.id
    const cachedRoom = this._cacheManagerService.getRoom(roomId)
    if (!cachedRoom) {
      return false
    }
    if (cachedRoom.preventPromptLeave) {
      return true
    }
    this.showLeavePrompt = true
    return new Promise<boolean>(resolve => {
      this._leavePromptSubject$.pipe(first()).subscribe({
        next: response => {
          if (response.preventPrompt !== cachedRoom.preventPromptLeave) {
            this._cacheManagerService.saveRoom(roomId, {
              ...cachedRoom,
              preventPromptLeave: response.preventPrompt
            })
          }
          resolve(response.result)
        }
      })
    })
  }

  ngOnDestroy() {
    this._unsubscribeSubject.next()
    this._roomService.destroy()
    this._socketService.send.leaveRoom({}).catch(console.error)
  }
}