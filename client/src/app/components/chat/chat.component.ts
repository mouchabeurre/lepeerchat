import {
  Component,
  OnInit,
  OnDestroy,
  TrackByFunction,
  NgZone
} from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { Observable, Subject, zip, merge, BehaviorSubject } from "rxjs"
import {
  ChatMessage,
  ChatMessageType,
  SpecialChatMessageType,
  SpecialChatMessage,
  UserChatMessage,
  ChatUser
} from "./types"
import { first, map, takeUntil } from "rxjs/operators"
import { chatAnimations } from "./animations"
import {
  PeerDataChannelMessageUpdate,
  RoomService,
  RoomUpdate,
  RoomUpdateKind,
  UserListUpdate
} from "src/app/injectables/room.service"
import { RoomProperties } from "src/app/utils/room-state"
import { CacheManagerService } from "src/app/injectables/cache-manager.service"
import { nanoid } from "nanoid"
import { DataChannelMessageType } from "src/app/utils/message-validator"

function buildChatMessage(
  messageData: (
    | { type: ChatMessageType.USER; authorName: string; authorId: string }
    | { type: ChatMessageType.SPECIAL; authorType: SpecialChatMessageType }
  ) & { content: string; fromExisting?: { id?: string; date?: Date } }
): ChatMessage | null {
  const id = messageData.fromExisting?.id ?? nanoid()
  const date = messageData.fromExisting?.date ?? new Date()
  switch (messageData.type) {
    case ChatMessageType.USER:
      return <UserChatMessage>{
        type: messageData.type,
        id,
        date,
        content: messageData.content,
        authorName: messageData.authorName,
        authorId: messageData.authorId
      }
    case ChatMessageType.SPECIAL:
      return <SpecialChatMessage>{
        type: messageData.type,
        id,
        date,
        content: messageData.content,
        authorType: messageData.authorType
      }

    default:
      return null
  }
}

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.sass"],
  animations: chatAnimations
})
export class ChatComponent implements OnInit, OnDestroy {
  private _unsubscribeSubject: Subject<void>
  private _usernameMemory: Map<string, string>

  roomState: { roomProperties: RoomProperties; userList: ChatUser[] } | null
  fg_send: FormGroup
  chatMessageSubject$: BehaviorSubject<ChatMessage[]>
  scrollerSubject$: Subject<void>
  chatMessageType: Record<keyof typeof ChatMessageType, number>
  specialChatMessageType: Record<keyof typeof SpecialChatMessageType, number>

  get draftMessage() {
    return this.fg_send.get("message")
  }

  constructor(
    private _roomService: RoomService,
    private _cacheManagerService: CacheManagerService,
    private _fb: FormBuilder,
    private _ngZone: NgZone
  ) {
    this._unsubscribeSubject = new Subject()
    this._usernameMemory = new Map()
    this.roomState = null
    this.chatMessageSubject$ = new BehaviorSubject([])
    this.scrollerSubject$ = new Subject()
    this.chatMessageType = ChatMessageType
    this.specialChatMessageType = SpecialChatMessageType
    this._createChatForm()
  }

  private _createChatForm() {
    this.fg_send = this._fb.group({
      message: this._fb.control(null, { validators: [Validators.required] })
    })
  }

  private _postChatMessage(message: ChatMessage) {
    this.chatMessageSubject$.pipe(first()).subscribe({
      next: messages => {
        if (messages.length === 0) {
          messages.push(message)
        } else {
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].date <= message.date) {
              messages.splice(i + 1, 0, message)
              break
            }
          }
        }
        this._ngZone.run(() => {
          this.chatMessageSubject$.next(messages)
        })
      }
    })
  }

  private _logChatUserFlux(
    diffUsers: {
      added: ChatUser[]
      deleted: ChatUser[]
    },
    greet = false
  ) {
    if (greet) {
      if (diffUsers.added.length > 0) {
        const filteredAdded = diffUsers.added.filter(
          user => user.id !== this.roomState?.roomProperties.self.id
        )
        if (filteredAdded.length === 0) {
          return
        }
        const content = `Currently connected: ${filteredAdded
          .filter(user => user.id)
          .map(user => user.name)
          .join(", ")}.`
        const message = buildChatMessage({
          type: ChatMessageType.SPECIAL,
          authorType: SpecialChatMessageType.ROOM_SELF,
          content
        })
        if (message) {
          this._postChatMessage(message)
        }
      }
    } else {
      if (diffUsers.deleted.length > 0) {
        const content = `Disconnected: ${diffUsers.deleted
          .map(user => user.name)
          .join(", ")}.`
        const message = buildChatMessage({
          type: ChatMessageType.SPECIAL,
          authorType: SpecialChatMessageType.ROOM_SELF,
          content
        })
        if (message) {
          this._postChatMessage(message)
        }
      }
      if (diffUsers.added.length > 0) {
        const content = `Connected: ${diffUsers.added
          .map(user => user.name)
          .join(", ")}.`
        const message = buildChatMessage({
          type: ChatMessageType.SPECIAL,
          authorType: SpecialChatMessageType.ROOM_SELF,
          content
        })
        if (message) {
          this._postChatMessage(message)
        }
      }
    }
  }

  private _updateUsernameMemory(users: ChatUser[]) {
    for (const user of users) {
      this._usernameMemory.set(user.id, user.name)
    }
  }

  private _onUserListUpdate = (update: UserListUpdate) => {
    const updatedUserList: ChatUser[] = update.content.map(user => {
      return {
        ...user,
        lastRecievedMessageId:
          this.roomState!.userList.find(oldUser => oldUser.id === user.id)
            ?.lastRecievedMessageId ?? null
      }
    })
    const diffUsers = {
      added: updatedUserList.filter(user => {
        return (
          user.id !== this.roomState?.roomProperties.self.id &&
          !this.roomState!.userList.find(oldUser => {
            return oldUser.id === user.id
          })
        )
      }),
      deleted:
        this.roomState!.userList.filter(oldUser => {
          return !updatedUserList.find(user => {
            return user.id === oldUser.id
          })
        }) ?? []
    }
    this.roomState!.userList = updatedUserList
    this._updateUsernameMemory(diffUsers.added)
    this._logChatUserFlux(diffUsers)
  }
  private _onPeerDataChannelMessageUpdate = (
    update: PeerDataChannelMessageUpdate
  ) => {
    const from = update.content.from
    switch (update.content.data.type) {
      case DataChannelMessageType.CHAT:
        const { id, date, content } = update.content.data
        const authorName = this._usernameMemory.get(from)
        if (!authorName) {
          return
        }
        const message = buildChatMessage({
          type: ChatMessageType.USER,
          authorId: from,
          authorName,
          content,
          fromExisting: {
            id,
            date: new Date(date)
          }
        })
        if (message) {
          this._postChatMessage(message)
          const user = this.roomState?.userList.find(user => user.id === from)
          if (user) {
            this._ngZone.run(() => {
              user.lastRecievedMessageId = message.id
            })
          }
          this._roomService.sendDataChannelMessage({
            type: DataChannelMessageType.ACK_CHAT,
            messageId: update.content.data.id
          })
        }
        break
      case DataChannelMessageType.ACK_CHAT:
        const user = this.roomState?.userList.find(user => user.id === from)
        if (user) {
          const messageId = update.content.data.messageId
          this._ngZone.run(() => {
            user.lastRecievedMessageId = messageId
          })
        }
        break
      case DataChannelMessageType.PING:
        break
    }
  }

  ngOnInit(): void {
    zip(
      this._roomService.getRoomProperties(),
      this._roomService.getUserList().pipe(
        map((userList): ChatUser[] => {
          return userList.map(user => ({
            ...user,
            lastRecievedMessageId: null
          }))
        })
      )
    )
      .pipe(first())
      .subscribe({
        next: initialState => {
          this.roomState = {
            roomProperties: initialState[0],
            userList: initialState[1]
          }
          this._updateUsernameMemory(this.roomState.userList)
          this._logChatUserFlux(
            { added: this.roomState.userList, deleted: [] },
            true
          )
          merge<RoomUpdate>(
            this._roomService.getUserListAsUpdate(),
            this._roomService.getPeerDataChannelStateAsUpdate(),
            this._roomService.getPeerDataChannelMessageAsUpdate()
          )
            .pipe(takeUntil(this._unsubscribeSubject))
            .subscribe({
              next: update => {
                if (update.kind === RoomUpdateKind.USER_LIST) {
                  this._onUserListUpdate(update)
                } else if (
                  update.kind === RoomUpdateKind.PEER_DATA_CHANNEL_STATE
                ) {
                  // console.log("data channel state", update.content)
                } else if (
                  update.kind === RoomUpdateKind.PEER_DATA_CHANNEL_MESSAGE
                ) {
                  this._onPeerDataChannelMessageUpdate(update)
                }
              }
            })
        }
      })
  }

  trackMessageIndex: TrackByFunction<ChatMessage> = (index, message) => {
    return message.id
  }

  isUserConnected(id: string): boolean {
    return !!this.roomState?.userList.find(user => user.id === id)
  }

  spliceUnicode(s: string): string {
    return [...s].slice(0, 3).join("")
  }

  onSendMessage(e?: Event) {
    e?.preventDefault()
    if (
      this.draftMessage &&
      this.fg_send.valid &&
      this.roomState?.roomProperties.self
    ) {
      const content = this.draftMessage.value
      const message = buildChatMessage({
        type: ChatMessageType.USER,
        authorId: this.roomState.roomProperties.self.id,
        content,
        authorName: this.roomState.roomProperties.self.name
      })
      if (message) {
        this._postChatMessage(message)
        this._roomService.sendDataChannelMessage({
          type: DataChannelMessageType.CHAT,
          id: message.id,
          date: message.date.getTime(),
          content
        })
        this.fg_send.reset()
      }
    }
  }

  getScrollerSubjectAsObservable(): Observable<void> {
    return this.scrollerSubject$
  }

  onReachBottom() {
    this.scrollerSubject$.next()
  }

  ngOnDestroy() {
    this._unsubscribeSubject.next()
  }
}
