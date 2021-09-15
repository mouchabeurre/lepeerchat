import { Component, OnInit, OnDestroy } from "@angular/core"
import { ActivatedRoute, Router, ParamMap } from "@angular/router"
import { SocketService } from "src/app/injectables/socket.service"
import { CacheManagerService } from "src/app/injectables/cache-manager.service"
import {
  FormBuilder,
  FormGroup,
  AsyncValidatorFn,
  AbstractControl,
  ValidatorFn,
  ValidationErrors
} from "@angular/forms"
import { DataJoinRoomOut } from "src/app/utils/interfaces/join-room"
import {
  Subject,
  Subscription,
  Observable,
  of,
  BehaviorSubject,
  timer
} from "rxjs"
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  first,
  delay,
  takeUntil
} from "rxjs/operators"
import { UsernameConstraintList } from "src/app/utils/constants"
import { MessageJoinRoomInErr, MessageType, ErrorType } from "src/app/utils/api"
import { DataUsernameValidOut } from "src/app/utils/interfaces/username-valid"

@Component({
  selector: "app-join-room",
  templateUrl: "./join-room.component.html",
  styleUrls: ["./join-room.component.sass"]
})
export class JoinRoomComponent implements OnInit, OnDestroy {
  private _unsubscribeSubject$: Subject<void>
  private _formSubject$: Subject<string>
  fg_join: FormGroup
  roomId: string
  roomFoundState: {
    readonly found: boolean
    readonly pending: boolean
  }
  joinRoomError: string
  oldUsername: string | null

  get username() {
    return this.fg_join.get("username")
  }

  get show_error_username(): boolean {
    return (
      !this.username?.valid &&
      !!this.username?.dirty &&
      !!this.username?.touched
    )
  }

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private _fb: FormBuilder,
    private _socketService: SocketService,
    private _cacheManagerService: CacheManagerService
  ) {
    this._unsubscribeSubject$ = new Subject()
    this._formSubject$ = new Subject()
    this.roomFoundState = { found: false, pending: true }
    this.oldUsername = null
    this.createForm()
  }

  private createForm() {
    this.fg_join = this._fb.group(
      {
        username: this._fb.control(null, {
          validators: [this.oldUsernameMismatch(), ...UsernameConstraintList],
          asyncValidators: this.usernameAvailable()
        })
      },
      { asyncValidators: this.existsRoomValidator() }
    )
    this.fg_join.disable({ emitEvent: false, onlySelf: true })
  }

  private oldUsernameMismatch(): ValidatorFn {
    return (control: AbstractControl) => {
      if (!!this.oldUsername && control.value !== this.oldUsername) {
        return { oldUsernameMismatch: true }
      }
      return null
    }
  }

  private existsRoomValidator(): AsyncValidatorFn {
    return (control: AbstractControl) =>
      control.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(() => {
          return new Observable<boolean>(subscriber => {
            this._socketService.send
              .roomExists({ roomId: this.roomId || "" })
              .then(() => subscriber.next(true))
              .catch(() => subscriber.next(false))
          })
        }),
        map(valid => (valid ? null : { lostRoom: true })),
        first()
      )
  }

  private usernameAvailable(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      return control.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged<string>(),
        switchMap(value => {
          return new Observable<boolean>(subscriber => {
            const token = this._cacheManagerService.getRoom(this.roomId)?.token
            let data: DataUsernameValidOut
            if (token) {
              data = { roomId: this.roomId, username: value, token }
            } else {
              data = { roomId: this.roomId, username: value }
            }
            this._socketService.send
              .usernameValid(data)
              .then(() => subscriber.next(true))
              .catch((err: MessageJoinRoomInErr) => {
                if (err.error.type === ErrorType.InvalidToken) {
                  const cachedRoom = this._cacheManagerService.getRoom(
                    this.roomId
                  )
                  if (cachedRoom) {
                    delete cachedRoom.token
                    this._cacheManagerService.saveRoom(this.roomId, {
                      ...cachedRoom,
                      roomName: cachedRoom.roomName,
                      username: cachedRoom.username
                    })
                  }
                }
                subscriber.next(false)
              })
          })
        }),
        map(valid => (valid ? null : { usernameAvailable: true })),
        first()
      )
    }
  }

  private _joinRoom(payload: DataJoinRoomOut) {
    this._socketService.send
      .joinRoom(payload)
      .then(response => {
        const { token, username, roomName, roomId } = response.data
        const cachedRoom = this._cacheManagerService.getRoom(roomId)
        this._cacheManagerService.saveRoom(roomId, {
          ...cachedRoom,
          token,
          username,
          roomName
        })
        this._router.navigate(["/room", roomId])
      })
      .catch((err: MessageJoinRoomInErr) => {
        if (err.error.type !== ErrorType.Validation) {
          this.joinRoomError = err.error.message
        }
        this.fg_join.enable({ emitEvent: false })
      })
  }

  ngOnInit(): void {
    this._activatedRoute.params.pipe(first()).subscribe({
      next: params => {
        let roomId = params.id
        this.roomId = roomId
        if (!roomId) {
          // router redirects to home
        } else {
          this._socketService.send.roomExists({ roomId }).then(response => {
            this.roomFoundState = {
              found: response.data.exists,
              pending: false
            }
            if (!response.data.exists) {
            } else {
              this.oldUsername =
                this._cacheManagerService.getRoom(roomId)?.username ?? null
              if (this.oldUsername) {
                // synchronous updateValueAndValidity not triggering FormGroup validators ?
                timer(1).subscribe(() => {
                  this.username!.setValue(this.oldUsername)
                  this.fg_join.markAllAsTouched()
                  this.fg_join.markAsDirty()
                })
              }
              this.fg_join.enable({ emitEvent: false })
              this._activatedRoute.queryParamMap.pipe(first()).subscribe({
                next: queryParams => {
                  const token = this._cacheManagerService.getRoom(roomId)?.token
                  if (token) {
                    this.fg_join.valueChanges
                      .pipe(first(), delay(2000))
                      .subscribe(() => {
                        if (this.fg_join.valid) {
                          this.fg_join.disable({ emitEvent: false })
                          this._joinRoom({
                            username: this.username!.value,
                            token
                          })
                        }
                      })
                  } else {
                    const key = queryParams.get("k")
                    const password = queryParams.get("p")
                    if (key && password) {
                      this._formSubject$
                        .pipe(takeUntil(this._unsubscribeSubject$))
                        .subscribe({
                          next: username => {
                            this._joinRoom({
                              key,
                              password,
                              username,
                              roomId
                            })
                          }
                        })
                    } else {
                      this._router.navigate(["/"])
                    }
                  }
                }
              })
            }
          })
        }
      }
    })
  }

  ngOnDestroy() {
    this._unsubscribeSubject$.next()
  }

  onJoinRoom() {
    this.fg_join.disable({ emitEvent: false })
    this._formSubject$.next(this.username!.value)
  }
}
