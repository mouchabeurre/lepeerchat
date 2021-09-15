import { trigger, transition, style, animate, query } from "@angular/animations"

const _overlay_animationDuration = 500
const overlayAnimation = trigger("overlayTrigger", [
  transition(":enter", [
    style({
      opacity: 0
    }),
    animate(
      `${_overlay_animationDuration}ms ease-out`,
      style({
        opacity: 1
      })
    )
  ]),
  transition(":leave", [
    animate(
      `${_overlay_animationDuration}ms ease-in`,
      style({
        opacity: 0
      })
    )
  ])
])

export const overlayAnimations = [overlayAnimation]
