import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core"
import { FormControl } from "@angular/forms"
import { LeavePromptResponse } from "../room/room.component"
import { leavePromptAnimations } from "./animations"

@Component({
  selector: "app-leave-room-prompt",
  templateUrl: "./leave-room-prompt.component.html",
  styleUrls: ["./leave-room-prompt.component.sass"],
  animations: leavePromptAnimations
})
export class LeaveRoomPromptComponent implements OnInit {
  preventPromptControl: FormControl
  @Input() roomId: string
  @Input() roomName: string
  @Output() closeLeavePrompt: EventEmitter<LeavePromptResponse>

  constructor() {
    this.preventPromptControl = new FormControl(false)
    this.closeLeavePrompt = new EventEmitter()
  }

  ngOnInit(): void {}

  onCloseLeavePrompt() {
    this.closeLeavePrompt.next({
      result: false
    })
  }

  onActionCancel() {
    this.closeLeavePrompt.next({
      result: false,
      preventPrompt: this.preventPromptControl.value
    })
  }

  onActionConfirm() {
    this.closeLeavePrompt.next({
      result: true,
      preventPrompt: this.preventPromptControl.value
    })
  }
}
