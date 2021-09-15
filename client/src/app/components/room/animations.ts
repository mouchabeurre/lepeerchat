import { animateChild, query, transition, trigger } from "@angular/animations"

const leavePromptAnimation = trigger("leavePromptTrigger", [
  transition(":enter, :leave", [
    query("@*", animateChild(), { optional: true })
  ])
])

export const roomAnimations = [leavePromptAnimation]
