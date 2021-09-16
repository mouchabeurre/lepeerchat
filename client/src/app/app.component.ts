import {
  Component,
  OnInit,
  ChangeDetectorRef,
  AfterViewChecked,
  OnDestroy
} from "@angular/core"
import { SocketService } from "./injectables/socket.service"
import {
  SocketErrorType,
  SocketError,
  EventType
} from "./utils/web-socket-proxy"
import { routeTransitionAnimations } from "./routing/router-animations"
import { Router, RouterOutlet } from "@angular/router"
import { takeUntil } from "rxjs/operators"
import { Subject } from "rxjs"

enum ConnectionStatus {
  SUCCESS,
  ERROR
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"],
  animations: routeTransitionAnimations
})
export class AppComponent implements OnInit, AfterViewChecked, OnDestroy {
  private _unsubscribeSubject: Subject<void>
  private _restoreRoute: string | null
  connectionState: {
    pending: boolean
    response:
      | null
      | { status: ConnectionStatus.ERROR; error: SocketErrorType }
      | {
          status: ConnectionStatus.SUCCESS
          error: void
        }
  }
  connectionStatus: Record<keyof typeof ConnectionStatus, number>
  socketErrorType: Record<keyof typeof SocketErrorType, number>

  constructor(
    private _socketService: SocketService,
    private _router: Router,
    private _changeRef: ChangeDetectorRef
  ) {
    this._unsubscribeSubject = new Subject()
    this._restoreRoute = null
    this.connectionState = { pending: false, response: null }
    this.connectionStatus = ConnectionStatus
    this.socketErrorType = SocketErrorType
  }

  private _connect() {
    this.connectionState = {
      pending: true,
      response: null
    }
    this._socketService
      .connect()
      .then(() => {
        if (this._restoreRoute) {
          this._router
            .navigateByUrl(this._restoreRoute)
            .catch(error => {
              console.error("navigation error:", error)
            })
            .finally(() => {
              this._restoreRoute = null
              this.connectionState = {
                pending: false,
                response: {
                  status: ConnectionStatus.SUCCESS,
                  error: undefined
                }
              }
            })
        } else {
          this.connectionState = {
            pending: false,
            response: {
              status: ConnectionStatus.SUCCESS,
              error: undefined
            }
          }
        }
        this._socketService
          .getEventObservable()
          .pipe(takeUntil(this._unsubscribeSubject))
          .subscribe({
            next: event => {
              if (
                event.type === EventType.CLOSE ||
                event.type === EventType.ERROR
              ) {
                this._restoreRoute = this._router.url
                this.connectionState = {
                  pending: false,
                  response: {
                    status: ConnectionStatus.ERROR,
                    error: SocketErrorType.CLOSED
                  }
                }
              } else if (event.type === EventType.OPEN) {
              }
            }
          })
      })
      .catch((error: SocketError) => {
        console.error(error)
        this.connectionState = {
          pending: false,
          response: {
            status: ConnectionStatus.ERROR,
            error: error.type
          }
        }
      })
  }

  ngOnInit() {
    this._connect()
  }

  ngAfterViewChecked() {
    this._changeRef.detectChanges()
  }

  reconnect() {
    this._router
      .navigateByUrl("/", { skipLocationChange: true })
      .then(() => {
        this._unsubscribeSubject.next()
        this._connect()
      })
      .catch(console.error)
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.animationState
  }

  ngOnDestroy() {
    this._unsubscribeSubject.next()
  }
}
