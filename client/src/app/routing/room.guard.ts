import { Injectable } from "@angular/core"
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from "@angular/router"
import { SocketService } from "../injectables/socket.service"
import { CacheManagerService } from "../injectables/cache-manager.service"
import { MessageInErr, ErrorType } from "./api"

@Injectable({
  providedIn: "root"
})
export class RoomGuard implements CanActivate {
  constructor(
    private _router: Router,
    private _socketService: SocketService,
    private _cacheManagerService: CacheManagerService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> | UrlTree {
    const roomId = next.paramMap.get("id")
    const redirectToHome: UrlTree = this._router.createUrlTree(["/"])
    if (!roomId) {
      return redirectToHome
    }
    const token = this._cacheManagerService.getRoom(roomId)?.token
    if (!token) {
      return redirectToHome
    }
    return new Promise(resolve => {
      this._socketService.send
        .guard({ token, roomId })
        .then(() => {
          resolve(true)
        })
        .catch(err => {
          if (
            (err as MessageInErr).error?.type === ErrorType.DoesntBelongRoom
          ) {
            this._router.navigate(["/join", roomId], {
              skipLocationChange: true
            })
            resolve(false)
          } else {
            console.error("couldn't navigate to room", roomId, err)
            resolve(redirectToHome)
          }
        })
    })
  }
}
