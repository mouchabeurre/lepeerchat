import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild
} from "@angular/core"
import { FormControl } from "@angular/forms"
import { Router } from "@angular/router"
import { interval, Observable, Subject, timer } from "rxjs"
import { first, takeUntil } from "rxjs/operators"
import {
  CacheManagerService,
  RoomInvitation
} from "src/app/injectables/cache-manager.service"
import { RoomService } from "src/app/injectables/room.service"
import { SocketService } from "src/app/injectables/socket.service"
import { RoomProperties } from "src/app/utils/room-state"
import { managerAnimations } from "./animations"

enum RequestStatus {
  SUCCESS,
  ERROR
}

function filterExpiredInvitations(invitation: RoomInvitation): boolean {
  return invitation.expiresAt > new Date()
}

@Component({
  selector: "app-room-manager",
  templateUrl: "./room-manager.component.html",
  styleUrls: ["./room-manager.component.sass"],
  animations: managerAnimations
})
export class RoomManagerComponent implements OnInit, OnDestroy {
  private _unsubscribeSubject: Subject<void>
  private _minuteInterval$: Observable<any>

  roomProperties: RoomProperties | null
  invitationControl: FormControl
  generatedInvitationStatus: Record<keyof typeof RequestStatus, number>
  generatedInvitation: {
    pending: boolean
    response:
      | null
      | { status: RequestStatus.ERROR; error: string }
      | {
          status: RequestStatus.SUCCESS
          invitation: RoomInvitation
        }
  }
  selectedInvitation: RoomInvitation | null
  invitations: RoomInvitation[] | null
  nowDate: Date
  toggleLock: {
    pending: boolean
    response:
      | null
      | { status: RequestStatus.ERROR }
      | { status: RequestStatus.SUCCESS }
  }
  clipboardCopyPending: boolean
  @ViewChild("roomManagerContainer")
  roomManagerContainerRef: ElementRef<HTMLDivElement>
  @Output() closeManager: EventEmitter<void>

  constructor(
    private _socketService: SocketService,
    private _renderer: Renderer2,
    private _roomService: RoomService,
    private _router: Router,
    private _cacheManagerService: CacheManagerService
  ) {
    this._unsubscribeSubject = new Subject()
    this.generatedInvitationStatus = RequestStatus
    this.closeManager = new EventEmitter()
    this.roomProperties = null
    this.generatedInvitation = { pending: false, response: null }
    this.toggleLock = { pending: false, response: null }
    this.clipboardCopyPending = false
    this.invitations = null
    this.invitationControl = new FormControl("")
    this.nowDate = new Date()
    this._minuteInterval$ = interval(1000 * 60).pipe(
      takeUntil(this._unsubscribeSubject)
    )
    this._minuteInterval$.subscribe({
      next: () => (this.nowDate = new Date())
    })
  }

  onGenerateInvitation() {
    this.generatedInvitation = {
      pending: true,
      response: null
    }
    this._socketService.send
      .generateInvitation({})
      .then(({ invitation: { key, password, expireAt } }) => {
        const params = {
          k: key,
          p: password
        }
        const path = this._router.createUrlTree(
          ["/join", this.roomProperties!.id],
          {
            queryParamsHandling: "merge",
            queryParams: params
          }
        )
        const { host, protocol } = window.location
        const invitation: RoomInvitation = {
          issueDate: new Date(),
          link: `${protocol}//${host}${path.toString()}`,
          expiresAt: new Date(expireAt)
        }
        this.onSelectInvitation(invitation)
        this.invitations = [invitation, ...this.invitations!]
        this.generatedInvitation = {
          pending: false,
          response: {
            status: RequestStatus.SUCCESS,
            invitation
          }
        }
        const cachedRoom = this._cacheManagerService.getRoom(
          this.roomProperties!.id
        )
        if (cachedRoom) {
          this._cacheManagerService.saveRoom(this.roomProperties!.id, {
            ...cachedRoom,
            invitations: this.invitations!
          })
        }
      })
      .catch(error => {
        this.generatedInvitation = {
          pending: false,
          response: {
            status: RequestStatus.ERROR,
            error
          }
        }
      })
  }

  onSelectInvitation(invitation: RoomInvitation, e?: KeyboardEvent) {
    if (e && e.key !== "Enter") {
      return
    }
    if (this.selectedInvitation === invitation) {
      this.selectedInvitation = null
      this.invitationControl.setValue(null)
    } else {
      this.selectedInvitation = invitation
      this.invitationControl.setValue(invitation.link)
    }
  }

  onToggleLockState(e?: KeyboardEvent) {
    if ((e && e.key !== "Enter") || this.toggleLock.pending) {
      return
    }
    this.toggleLock = {
      pending: true,
      response: null
    }
    this._socketService.send
      .lockRoom({ locked: !this.roomProperties!.locked })
      .then(({ locked }) => {
        this.roomProperties!.locked = locked
        this.toggleLock = {
          pending: false,
          response: { status: RequestStatus.SUCCESS }
        }
      })
      .catch(() => {
        this.toggleLock = {
          pending: false,
          response: { status: RequestStatus.ERROR }
        }
      })
  }

  onCopyLinkToClipboard() {
    if (this.selectedInvitation) {
      this.clipboardCopyPending = true
      navigator.clipboard
        .writeText(this.selectedInvitation.link)
        .then(() => {
          this.clipboardCopyPending = false
        })
        .catch(() => {
          this.clipboardCopyPending = false
        })
    }
  }

  onCloseManager() {
    this.closeManager.next()
  }

  ngOnInit(): void {
    this._roomService
      .getRoomProperties()
      .pipe(first())
      .subscribe({
        next: props => {
          this.roomProperties = props
          const cachedRoom = this._cacheManagerService.getRoom(props.id)
          if (cachedRoom && cachedRoom.invitations) {
            const filteredInvitations = cachedRoom.invitations.filter(
              filterExpiredInvitations
            )
            this.invitations = filteredInvitations
            if (filteredInvitations.length !== cachedRoom.invitations.length) {
              this._cacheManagerService.saveRoom(props.id, {
                ...cachedRoom,
                invitations: filteredInvitations
              })
            }
          } else {
            this.invitations = []
          }
          this._minuteInterval$.subscribe({
            next: () => {
              if (this.invitations!.length > 0) {
                const filteredInvitations = this.invitations!.filter(
                  filterExpiredInvitations
                )
                if (filteredInvitations.length !== this.invitations!.length) {
                  const cachedRoom = this._cacheManagerService.getRoom(
                    this.roomProperties!.id
                  )
                  if (cachedRoom) {
                    this._cacheManagerService.saveRoom(
                      this.roomProperties!.id,
                      { ...cachedRoom, invitations: filteredInvitations }
                    )
                  }
                  if (
                    !filteredInvitations.find(
                      invitation =>
                        invitation.link === this.selectedInvitation?.link
                    )
                  ) {
                    this.selectedInvitation = null
                    this.invitationControl.setValue(null)
                  }
                  this.invitations = filteredInvitations
                }
              }
            }
          })
        }
      })
  }

  ngOnDestroy() {
    this._unsubscribeSubject.next()
  }
}
