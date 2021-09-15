import { trigger, transition, query, animateChild } from "@angular/animations"

const leavePromptAnimation = trigger("trig1", [
  transition(":enter, :leave", [
    query("@*", animateChild(), { optional: true })
  ])
])

export const leavePromptAnimations = [leavePromptAnimation]
