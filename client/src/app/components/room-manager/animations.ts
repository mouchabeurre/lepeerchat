import { trigger, transition, query, animateChild } from "@angular/animations"

const showManagerAnimation = trigger("managerOverlayTrigger", [
  transition(":enter, :leave", [
    query("@*", animateChild(), { optional: true })
  ])
])

export const managerAnimations = [showManagerAnimation]
