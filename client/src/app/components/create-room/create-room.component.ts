import { Component, OnInit } from "@angular/core"
import { Router } from "@angular/router"
import { FormBuilder, FormGroup, AbstractControl } from "@angular/forms"
import { SocketService } from "src/app/injectables/socket.service"
import { CacheManagerService } from "src/app/injectables/cache-manager.service"
import {
  UsernameConstraintList,
  RoomNameConstraintList
} from "src/app/utils/constants"
import { ErrorType, MessageInErr } from "src/app/routing/api"

@Component({
  selector: "app-create-room",
  templateUrl: "./create-room.component.html",
  styleUrls: ["./create-room.component.sass"]
})
export class CreateRoomComponent implements OnInit {
  fg_create: FormGroup
  joinRoomError: string

  get username() {
    return this.fg_create.get("username")
  }

  get show_error_username(): boolean {
    return (
      !this.username?.valid &&
      !!this.username?.dirty &&
      !!this.username?.touched
    )
  }

  get room_name() {
    return this.fg_create.get("room_name")
  }

  get show_error_room_name(): boolean {
    return (
      !this.room_name?.valid &&
      !!this.room_name?.dirty &&
      !!this.room_name?.touched
    )
  }

  constructor(
    private _fb: FormBuilder,
    private _router: Router,
    private _socketService: SocketService,
    private _cacheManagerService: CacheManagerService
  ) {
    this.createForm()
  }

  ngOnInit(): void {}

  private createForm() {
    this.fg_create = this._fb.group({
      username: this._fb.control(null, UsernameConstraintList),
      room_name: this._fb.control(null, RoomNameConstraintList)
    })
  }

  onCreateRoom() {
    this.fg_create.disable({ emitEvent: false })
    this._socketService.send
      .createRoom({
        roomName: this.fg_create.get("room_name")!.value,
        username: this.fg_create.get("username")!.value
      })
      .then(({ roomId, username, userId, roomName, token }) => {
        this._cacheManagerService.saveRoom(roomId, {
          roomName,
          token,
          username
        })
        this._router.navigate(["room", roomId])
      })
      .catch((err: MessageInErr) => {
        if (err.error.type !== ErrorType.Validation) {
          this.joinRoomError = err.error.message
        }
        this.fg_create.enable({ emitEvent: false })
      })
  }
}
