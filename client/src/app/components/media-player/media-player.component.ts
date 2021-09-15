import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy
} from "@angular/core"
import { FormControl } from "@angular/forms"
import { Subject, Subscription } from "rxjs"
import { debounceTime, distinctUntilChanged, takeUntil } from "rxjs/operators"
import { User } from "src/app/utils/room-state"

interface VolumeState {
  muted: boolean
  value: number
}

@Component({
  selector: "app-media-player",
  templateUrl: "./media-player.component.html",
  styleUrls: ["./media-player.component.sass"]
})
export class MediaPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  private _unsubscribeSubject$: Subject<void>
  volumeControl: FormControl
  volumeState: VolumeState
  @Input() peer: User
  @Input() isSelfUser: boolean = false
  @ViewChild("localStream") localStreamRef: ElementRef<HTMLVideoElement>

  get has_audio(): boolean {
    return this.peer.connectionState.media?.getAudioTracks().length !== 0
  }

  constructor() {
    this._unsubscribeSubject$ = new Subject()
  }

  private _onVolumeStateUpdate(newState: VolumeState) {
    this.volumeState = newState
    if (this.localStreamRef?.nativeElement) {
      this.localStreamRef.nativeElement.muted = this.volumeState.muted
      this.localStreamRef.nativeElement.volume = this.volumeState.value / 100
    }
  }

  onToggleMute() {
    if (this.volumeState.value !== 0) {
      this._onVolumeStateUpdate({
        muted: !this.volumeState.muted,
        value: this.volumeState.value
      })
    }
  }

  ngOnInit(): void {
    this.volumeState = {
      value: 75,
      muted: this.isSelfUser ? true : false
    }
    this.volumeControl = new FormControl(this.volumeState.value)
    this.volumeControl.valueChanges
      .pipe(
        takeUntil(this._unsubscribeSubject$),
        debounceTime(50),
        distinctUntilChanged()
      )
      .subscribe({
        next: (value: number) => {
          const newMuted = value === 0
          this._onVolumeStateUpdate({
            muted: newMuted,
            value
          })
        }
      })
  }

  ngAfterViewInit() {
    this._onVolumeStateUpdate(this.volumeState)
    this.localStreamRef.nativeElement.srcObject = this.peer.connectionState.media
  }

  ngOnDestroy() {
    this._unsubscribeSubject$.next()
  }
}
