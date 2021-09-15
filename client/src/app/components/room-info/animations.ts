import { trigger, transition, query, animateChild } from "@angular/animations"

const showManagerAnimation = trigger("roomInfoManagerTrigger", [
  transition(":enter, :leave", [
    query("@*", animateChild(), { optional: true })
  ])
])

export const roomInfoAnimations = [showManagerAnimation]
