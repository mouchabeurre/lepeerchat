import { Injectable } from "@angular/core"
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from "@angular/router"
import { CacheManagerService } from "../injectables/cache-manager.service"

@Injectable({
  providedIn: "root"
})
export class JoinGuard implements CanActivate {
  constructor(
    private _router: Router,
    private _cacheManagerService: CacheManagerService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): UrlTree | boolean {
    const roomId = next.paramMap.get("id")
    const redirectToHome: UrlTree = this._router.createUrlTree(["/"])
    if (!roomId) {
      return redirectToHome
    }
    const token = this._cacheManagerService.getRoom(roomId)
    if (token) {
      return true
    }
    if (next.queryParams.p && next.queryParams.k) {
      return true
    }
    return false
  }
}
