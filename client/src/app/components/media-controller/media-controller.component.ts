import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  NgZone,
  AfterViewChecked
} from "@angular/core"
import {
  Observable,
  Subscription,
  Subject,
  ReplaySubject,
  BehaviorSubject
} from "rxjs"
import { CacheManagerService } from "src/app/injectables/cache-manager.service"
import { FormBuilder, FormGroup, FormControl } from "@angular/forms"
import { takeUntil, first } from "rxjs/operators"

const NoneKey = "none" as const

enum MediaVideoType {
  SCREEN_CAPTURE = "capture",
  CAMERA = "camera"
}

enum DisplayMediaSurfaceType {
  APPLICATION = "application",
  BROWSER = "browser",
  MONITOR = "monitor",
  WINDOW = "window"
}

interface AvailableMediaDevices {
  audio$: BehaviorSubject<MediaDeviceInfo[]>
  video$: BehaviorSubject<MediaDeviceInfo[]>
}
interface ShareState {
  audio: typeof NoneKey | { device: MediaDeviceInfo }
  video:
    | typeof NoneKey
    | {
        type: MediaVideoType.SCREEN_CAPTURE
        surfaceType: DisplayMediaSurfaceType
      }
    | { type: MediaVideoType.CAMERA; device: MediaDeviceInfo }
}
type MediaStreamUpdate =
  | { update: "deleted" }
  | { update: "unchanged" }
  | { update: "replaced"; stream: Promise<MediaStream> }

function hasShareStateAudioDiff(
  a: ShareState["audio"],
  b: ShareState["audio"]
): boolean {
  if (a === NoneKey && b !== NoneKey) {
    return true
  }
  if (a !== NoneKey && b === NoneKey) {
    return true
  }
  if (a !== NoneKey && b !== NoneKey) {
    if (a.device.deviceId !== b.device.deviceId) {
      return true
    }
  }
  return false
}
function hasShareStateVideoDiff(
  a: ShareState["video"],
  b: ShareState["video"]
): boolean {
  if (a !== NoneKey && b === NoneKey) {
    return true
  }
  if (a === NoneKey && b !== NoneKey) {
    return true
  }
  if (a !== NoneKey && b !== NoneKey) {
    if (a.type !== b.type) {
      return true
    }
    if (a.type === b.type) {
      if (
        a.type === MediaVideoType.SCREEN_CAPTURE &&
        b.type === MediaVideoType.SCREEN_CAPTURE
      ) {
        if (a.surfaceType !== b.surfaceType) {
          return true
        }
      } else if (
        a.type === MediaVideoType.CAMERA &&
        b.type === MediaVideoType.CAMERA
      ) {
        if (a.device.deviceId !== b.device.deviceId) {
          return true
        }
      }
    }
  }
  return false
}

function getStreamFromShareState(
  newState: ShareState,
  oldState: ShareState
): { audio: MediaStreamUpdate; video: MediaStreamUpdate } {
  const getAudioStream = (deviceId: string) => {
    return navigator.mediaDevices.getUserMedia({ audio: { deviceId } })
  }
  const getUserVideoStream = (deviceId: string) => {
    return navigator.mediaDevices.getUserMedia({ video: { deviceId } })
  }
  const getDisplayVideoStream = (surfaceType: DisplayCaptureSurfaceType) => {
    return (navigator.mediaDevices as any).getDisplayMedia({
      video: {
        displaySurface: surfaceType
      }
    })
  }
  let audioStreamUpdate: MediaStreamUpdate = { update: "deleted" }
  let videoStreamUpdate: MediaStreamUpdate = { update: "deleted" }
  if (newState.audio !== NoneKey) {
    if (hasShareStateAudioDiff(newState.audio, oldState.audio)) {
      audioStreamUpdate = {
        update: "replaced",
        stream: getAudioStream(newState.audio.device.deviceId)
      }
    } else {
      audioStreamUpdate = {
        update: "unchanged"
      }
    }
  }
  if (newState.video !== NoneKey) {
    if (hasShareStateVideoDiff(newState.video, oldState.video)) {
      if (newState.video.type === MediaVideoType.CAMERA) {
        videoStreamUpdate = {
          update: "replaced",
          stream: getUserVideoStream(newState.video.device.deviceId)
        }
      } else if (newState.video.type === MediaVideoType.SCREEN_CAPTURE) {
        videoStreamUpdate = {
          update: "replaced",
          stream: getDisplayVideoStream(newState.video.surfaceType)
        }
      }
    } else {
      videoStreamUpdate = {
        update: "unchanged"
      }
    }
  }
  return { audio: audioStreamUpdate, video: videoStreamUpdate }
}

function hasShareStateDiff(a: ShareState, b: ShareState): boolean {
  return (
    hasShareStateAudioDiff(a.audio, b.audio) ||
    hasShareStateVideoDiff(a.video, b.video)
  )
}

@Component({
  selector: "app-media-controller",
  templateUrl: "./media-controller.component.html",
  styleUrls: ["./media-controller.component.sass"]
})
export class MediaControllerComponent implements OnInit, OnDestroy {
  private _unsubscribeSubject$: Subject<void>
  private _mediaDeviceList$: Subject<MediaDeviceInfo[]>
  private _localStream: MediaStream | null

  showSelector: boolean
  readonly availableMediaDevices: AvailableMediaDevices
  readonly noneKey: string
  readonly mediaVideoType: Record<keyof typeof MediaVideoType, string>
  readonly displayMediaSurfaceType: Record<
    keyof typeof DisplayMediaSurfaceType,
    string
  >
  readonly fg_mediaDeviceSelector: FormGroup
  readonly showSelfPlayerControl: FormControl
  shareState: ShareState

  @Output() showSelfPlayer = new EventEmitter<boolean>()
  @Output() streamSelfMedia = new EventEmitter<MediaStream | null>()

  get has_stream(): boolean {
    return this._localStream !== null
  }
  get audio_source_device(): MediaDeviceInfo | null {
    const audio = this.fg_mediaDeviceSelector.get("audio")
    if (!audio) {
      return null
    }
    if (audio.value === NoneKey) {
      return null
    }
    return audio.value
  }
  get video_source_type(): MediaVideoType | null {
    const videoControlGroup = this.fg_mediaDeviceSelector.get("fg_video")
    return videoControlGroup?.get("source")?.value ?? null
  }
  get video_source_device(): MediaDeviceInfo | null {
    const videoControlGroup = this.fg_mediaDeviceSelector.get("fg_video")
    if (videoControlGroup) {
      const videoTypeControl = videoControlGroup?.get("source")
      const videoCameraControl = videoControlGroup?.get("camera")
      if (
        videoTypeControl?.value === MediaVideoType.CAMERA &&
        videoCameraControl?.value
      ) {
        return videoCameraControl.value
      }
    }
    return null
  }
  get video_source_capture(): string | null {
    const videoControlGroup = this.fg_mediaDeviceSelector.get("fg_video")
    if (videoControlGroup) {
      const videoTypeControl = videoControlGroup?.get("source")
      const videoCaptureControl = videoControlGroup?.get("capture")
      if (
        videoTypeControl?.value === MediaVideoType.SCREEN_CAPTURE &&
        videoCaptureControl?.value
      ) {
        return videoCaptureControl.value
      }
    }
    return null
  }

  constructor(
    private _fb: FormBuilder,
    private _cacheManagerService: CacheManagerService
  ) {
    this._unsubscribeSubject$ = new Subject()
    this._mediaDeviceList$ = new Subject()
    this._localStream = null
    this.showSelector = false
    this.availableMediaDevices = this._createAvailableMediaDevices()
    this.noneKey = NoneKey
    this.mediaVideoType = MediaVideoType
    this.displayMediaSurfaceType = DisplayMediaSurfaceType
    this._listenMediaDeviceChanges()
    this.shareState = {
      audio: NoneKey,
      video: NoneKey
    }
    this.fg_mediaDeviceSelector = this._createSelectorForm()
    this.showSelfPlayerControl = new FormControl(false)
    this.showSelfPlayerControl.valueChanges
      .pipe(takeUntil(this._unsubscribeSubject$))
      .subscribe({
        next: (show: boolean) => {
          this.showSelfPlayer.next(show)
        }
      })
  }

  private _listenMediaDeviceChanges() {
    const enumerateError = (error: any) => {
      console.error("Error while enumerating media devices:", error)
    }
    const notifyDeviceList = (devices: MediaDeviceInfo[]) => {
      this._mediaDeviceList$.next(devices)
    }
    navigator.mediaDevices
      .enumerateDevices()
      .then(notifyDeviceList)
      .catch(enumerateError)
    navigator.mediaDevices.ondevicechange = () => {
      navigator.mediaDevices
        .enumerateDevices()
        .then(notifyDeviceList)
        .catch(enumerateError)
    }
  }

  private _createAvailableMediaDevices(): AvailableMediaDevices {
    const audio$ = new BehaviorSubject<MediaDeviceInfo[]>([])
    const video$ = new BehaviorSubject<MediaDeviceInfo[]>([])
    this._mediaDeviceList$
      .pipe(takeUntil(this._unsubscribeSubject$))
      .subscribe({
        next: devices => {
          const audioDevices = devices.filter(
            deviceInfo => deviceInfo.kind === "audioinput"
          )
          if (audioDevices.length > 0) {
            audio$.next(audioDevices)
          }
          const videoDevices = devices.filter(
            deviceInfo => deviceInfo.kind === "videoinput"
          )
          if (videoDevices.length > 0) {
            video$.next(videoDevices)
          }
        }
      })
    return {
      audio$,
      video$
    }
  }

  private _createSelectorForm() {
    return this._fb.group(
      {
        audio: this._fb.control(NoneKey),
        fg_video: this._fb.group({
          source: this._fb.control(NoneKey),
          camera: this._fb.control(null),
          capture: this._fb.control(DisplayMediaSurfaceType.BROWSER)
        })
      },
      {
        validators: (formGroup: FormGroup) => {
          const currentShareState = this._getShareStateFromForm(formGroup)
          if (!hasShareStateDiff(currentShareState, this.shareState)) {
            return { identicalStates: true }
          }
          return null
        }
      }
    )
  }

  private _getShareStateFromForm(formGroup: FormGroup): ShareState {
    const audioControl = formGroup.get("audio")
    const videoControlGroup = formGroup.get("fg_video")
    const videoTypeControl = videoControlGroup?.get("source")
    const videoCameraControl = videoControlGroup?.get("camera")
    const videoCaptureControl = videoControlGroup?.get("capture")
    let audio: ShareState["audio"] = NoneKey
    let video: ShareState["video"] = NoneKey
    if (audioControl && audioControl.value !== this.noneKey) {
      audio = {
        device: audioControl.value
      }
    }
    if (
      videoTypeControl?.value === MediaVideoType.CAMERA &&
      videoCameraControl?.value
    ) {
      video = {
        type: MediaVideoType.CAMERA,
        device: videoCameraControl.value
      }
    } else if (
      videoTypeControl?.value === MediaVideoType.SCREEN_CAPTURE &&
      videoCaptureControl?.value
    ) {
      video = {
        type: MediaVideoType.SCREEN_CAPTURE,
        surfaceType: videoCaptureControl.value
      }
    }

    return { audio, video }
  }

  private _updateLocalStream(stream: MediaStream | null) {
    this._localStream?.getTracks().forEach(track => track.stop())
    this._localStream = stream
    this.streamSelfMedia.next(stream)
  }

  private _resetFormToShareState(state: ShareState) {
    if (
      hasShareStateDiff(
        this._getShareStateFromForm(this.fg_mediaDeviceSelector),
        state
      )
    ) {
      this.onResetSelector("both", state)
    }
  }

  onOpenSelector() {
    this._resetFormToShareState(this.shareState)
    this.showSelector = true
  }
  onCloseSelector() {
    this.showSelector = false
  }

  onUpdateShareState() {
    const newShareState = this._getShareStateFromForm(
      this.fg_mediaDeviceSelector
    )
    const updates = getStreamFromShareState(newShareState, this.shareState)
    const newStream = this._localStream?.clone() ?? new MediaStream()
    let audioPromise: Promise<MediaStream | null> = Promise.resolve(null)
    if (updates.audio.update === "replaced") {
      audioPromise = updates.audio.stream
    }
    audioPromise
      .then(audioStream => {
        switch (updates.audio.update) {
          case "replaced":
            if (audioStream) {
              newStream.getAudioTracks().forEach(track => track.stop())
              audioStream
                .getAudioTracks()
                .forEach(track => newStream.addTrack(track))
            }
            break
          case "deleted":
            newStream.getAudioTracks().forEach(track => {
              track.stop()
              newStream.removeTrack(track)
            })
            break
          case "unchanged":
            break
        }
        let videoPromise: Promise<MediaStream | null> = Promise.resolve(null)
        if (updates.video.update === "replaced") {
          videoPromise = updates.video.stream
        }
        return videoPromise
      })
      .then(videoStream => {
        switch (updates.video.update) {
          case "replaced":
            if (videoStream) {
              newStream.getVideoTracks().forEach(track => track.stop())
              videoStream
                .getVideoTracks()
                .forEach(track => newStream.addTrack(track))
            }
            break
          case "deleted":
            newStream.getVideoTracks().forEach(track => {
              track.stop()
              newStream.removeTrack(track)
            })
            break
          case "unchanged":
            break
        }
        if (newStream.getTracks().length > 0) {
          this._updateLocalStream(newStream)
        } else {
          this._updateLocalStream(null)
        }
        this.shareState = newShareState
        this.onCloseSelector()
      })
      .catch(error => {
        console.error("Error durring media request:", error)
      })
  }

  onResetSelector(
    type: "audio" | "video" | "both",
    state: ShareState = { audio: NoneKey, video: NoneKey }
  ) {
    const rawFormState = {
      audio: state.audio !== NoneKey ? state.audio.device : NoneKey,
      fg_video: {
        source: state.video !== NoneKey ? state.video.type : NoneKey,
        camera:
          state.video !== NoneKey
            ? state.video.type === MediaVideoType.CAMERA
              ? state.video.device
              : null
            : null,
        capture:
          state.video !== NoneKey
            ? state.video.type === MediaVideoType.SCREEN_CAPTURE
              ? state.video.surfaceType
              : DisplayMediaSurfaceType.BROWSER
            : DisplayMediaSurfaceType.BROWSER
      }
    }
    if (type === "audio") {
      this.fg_mediaDeviceSelector.get("audio")?.reset(rawFormState.audio)
    } else if (type === "video") {
      this.fg_mediaDeviceSelector.get("fg_video")?.reset(rawFormState.fg_video)
    } else if (type === "both") {
      this.fg_mediaDeviceSelector.reset(rawFormState)
    }
  }

  ngOnInit() {
    this.showSelfPlayer.next(this.showSelfPlayerControl.value)
  }

  ngOnDestroy() {
    this._localStream?.getTracks().forEach(track => track.stop())
    this._unsubscribeSubject$.next()
  }
}
