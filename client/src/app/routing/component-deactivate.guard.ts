import { Injectable } from "@angular/core"
import { CanDeactivate } from "@angular/router"

type CanDeactivateResult = Promise<boolean> | boolean
export interface CanComponentDeactivate {
  canDeactivate: () => CanDeactivateResult
}

@Injectable({
  providedIn: "root"
})
export class ComponentDeactivateGuard
  implements CanDeactivate<CanComponentDeactivate> {
  canDeactivate(component: CanComponentDeactivate): CanDeactivateResult {
    return component?.canDeactivate() ?? true
  }
}
