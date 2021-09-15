import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild
} from "@angular/core"
import { timer } from "rxjs"
import { navAnimations } from "./animations"
@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.sass"],
  animations: navAnimations
})
export class NavbarComponent implements OnInit {
  private _unlistenClick: (() => void) | null
  private _unlistenEscape: (() => void) | null

  opened: boolean
  @ViewChild("navBurger") navBurgerRef: ElementRef<HTMLButtonElement>
  @ViewChild("navMenu") navMenuRef: ElementRef<HTMLUListElement>

  constructor(private _renderer: Renderer2) {
    this._unlistenClick = null
    this._unlistenEscape = null
    this.opened = false
  }

  private _listenClose() {
    timer(500).subscribe({
      next: () => {
        this._unlistenClick = this._renderer.listen(
          "document",
          "click",
          this._onCloseMenu
        )
        this._unlistenEscape = this._renderer.listen(
          "document",
          "keyup",
          this._onCloseMenu
        )
      }
    })
  }

  private _unlistenClose() {
    this._unlistenClick && this._unlistenClick()
    this._unlistenEscape && this._unlistenEscape()
  }

  private _onCloseMenu = (event: Event) => {
    if (!this.opened) {
      this._unlistenClose()
      return
    }
    if (this.navMenuRef.nativeElement.contains(event.target as HTMLElement)) {
      return
    }
    if (event.type === "keyup" && (event as KeyboardEvent).key !== "Escape") {
      return
    } else {
      event.preventDefault()
    }
    this._unlistenClose()
    this.opened = false
    this.navBurgerRef?.nativeElement.blur()
  }

  ngOnInit(): void {}

  onOpenMenu() {
    if (!this.opened) {
      this._listenClose()
      this.opened = true
      this.navBurgerRef?.nativeElement.blur()
    }
  }

  onNavMenuClick(event: Event) {
    if ((event.target as HTMLElement)?.nodeName === "A") {
      this._unlistenClose()
      this.opened = false
    }
  }
}
