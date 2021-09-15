import {
  trigger,
  transition,
  animate,
  keyframes,
  style,
  state
} from "@angular/animations"

const messageTrigger = trigger("messageTrigger", [
  transition(":enter", [
    animate(
      "250ms ease-out",
      keyframes([
        style({
          transform: "scaleX(0.9) scaleY(0.7)",
          opacity: 0,
          offset: 0
        }),
        style({
          transform: "scaleX(1.01) scaleY(1)",
          opacity: 1,
          offset: 0.4
        }),
        style({
          transform: "scaleX(1) scaleY(1)",
          opacity: 1,
          offset: 1
        })
      ])
    )
  ])
])

const _seen_animationDuration = 200
const seenTrigger = trigger("seenTrigger", [
  transition(":enter", [
    style({
      opacity: 0
    }),
    animate(
      `${_seen_animationDuration}ms ease-out`,
      style({
        opacity: 1
      })
    )
  ]),
  transition(":leave", [
    animate(
      `${_seen_animationDuration}ms ease-in`,
      style({
        opacity: 0
      })
    )
  ])
])
export const chatAnimations = [messageTrigger, seenTrigger]
