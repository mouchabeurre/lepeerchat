import {
  AfterViewInit,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild
} from "@angular/core"
import { timer } from "rxjs"
import { overlayAnimations } from "./animations"

@Component({
  selector: "app-backdrop-overlay",
  templateUrl: "./backdrop-overlay.component.html",
  styleUrls: ["./backdrop-overlay.component.sass"],
  animations: overlayAnimations
})
export class BackdropOverlayComponent
  implements OnInit, AfterViewInit, OnDestroy {
  private _unlistenClick: (() => void) | null
  private _unlistenEscape: (() => void) | null

  @Input() zIndex: number
  @ViewChild("overlay") overlayRef: ElementRef<HTMLElement>
  @ContentChild("modal") childRef: ElementRef<HTMLElement>

  @Output() closeEmitter: EventEmitter<void>

  constructor(private _renderer: Renderer2) {
    this._unlistenClick = null
    this._unlistenEscape = null
    this.closeEmitter = new EventEmitter()
  }

  private _listenClose(overlay: HTMLElement) {
    timer(500).subscribe({
      next: () => {
        this._unlistenClick = this._renderer.listen(
          overlay,
          "click",
          this._onClose
        )
        this._unlistenEscape = this._renderer.listen(
          overlay,
          "keyup",
          this._onClose
        )
      }
    })
  }
  private _unlistenClose() {
    this._unlistenClick && this._unlistenClick()
    this._unlistenEscape && this._unlistenEscape()
  }
  private _onClose = (event: Event) => {
    if (this.childRef.nativeElement.contains(event.target as HTMLElement)) {
      return
    }
    if (event.type === "keyup" && (event as KeyboardEvent).key !== "Escape") {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    this.closeEmitter.next()
  }
  ngOnInit(): void {}

  ngAfterViewInit() {
    this._listenClose(this.overlayRef.nativeElement)
    this.overlayRef.nativeElement.focus()
  }
  ngOnDestroy() {
    this._unlistenClose()
  }
}
