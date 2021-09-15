import {
  Directive,
  ElementRef,
  Input,
  AfterViewChecked,
  OnDestroy,
  Renderer2,
  AfterViewInit
} from "@angular/core"
import { Subscription, fromEvent, Observable, Subject } from "rxjs"
import { throttleTime, debounceTime } from "rxjs/operators"

@Directive({
  selector: "[appScroller]"
})
export class ScrollerDirective
  implements AfterViewChecked, OnDestroy, AfterViewInit {
  private _el: HTMLOListElement
  private _scrollSubscription: Subscription
  private _reachBottomSubscription: Subscription
  private _disableScroll: boolean
  private _childCount: number

  @Input() reachBottom$: Observable<void>

  constructor(
    private _elRef: ElementRef<HTMLOListElement>,
    private _renderer: Renderer2
  ) {
    this._disableScroll = false
  }

  ngAfterViewInit() {
    this._el = this._elRef.nativeElement
    this._childCount = this._el.childElementCount
    this._scrollSubscription = fromEvent(this._el, "scroll")
      .pipe(throttleTime(200, undefined, { trailing: true }), debounceTime(400))
      .subscribe({
        next: () => this._onScroll(this._el)
      })

    this._reachBottomSubscription = this.reachBottom$.subscribe({
      next: this._onReachBottom
    })
  }

  private _onScroll(el: HTMLOListElement) {
    const atBottom = el.scrollHeight - el.scrollTop === el.clientHeight
    this._disableScroll = atBottom ? false : true
  }

  private _onReachBottom() {
    try {
      this._renderer.setProperty(this._el, "scrollTop", this._el.scrollHeight)
    } catch (error) {
      console.error("couldn't scroll to bottom:", error)
    }
  }

  ngAfterViewChecked() {
    if (
      !this._disableScroll &&
      this._el.childElementCount !== this._childCount
    ) {
      this._childCount = this._el.childElementCount
      this._onReachBottom()
    }
  }

  ngOnDestroy() {
    this._scrollSubscription?.unsubscribe()
    this._reachBottomSubscription?.unsubscribe()
  }
}
