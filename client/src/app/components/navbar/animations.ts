import {
  trigger,
  transition,
  animate,
  keyframes,
  style,
  query,
  group
} from "@angular/animations"

const _overlay_animationDuration = 150
const overlayAnimation = trigger("overlayTrigger", [
  transition(":enter", [
    style({
      opacity: 0
    }),
    animate(
      `${_overlay_animationDuration}ms ease-out`,
      style({
        opacity: 0.6
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

const _menu_animationDuration = {
  container: 250,
  content: 100
}
const _menu_animationEasing = "cubic-bezier(0.7, 0, 0.3, 1)"
const _menu_containerScale = {
  x: 0.01,
  y: 0.01
}
const menuAnimation = trigger("menuTrigger", [
  transition(":enter", [
    query("li", [
      style({
        opacity: 0
      })
    ]),
    query(":self", [
      style({
        transform: `scale(${_menu_containerScale.x}, ${_menu_containerScale.y})`,
        boxShadow: "none"
      })
    ]),
    query(":self", [
      animate(
        `${_menu_animationDuration.container}ms ${_menu_animationEasing}`,
        style({
          transform: `scale(${_menu_containerScale.x}, 1)`
        })
      ),
      group([
        animate(
          `${_menu_animationDuration.container}ms ${_menu_animationEasing}`,
          style({
            transform: `scale(1, 1)`
          })
        ),
        animate(
          `150ms ${_menu_animationDuration.container}ms`,
          style({
            boxShadow: "0px 3px 10px black"
          })
        )
      ])
    ]),
    query("li", [
      animate(
        `${_menu_animationDuration.content}ms ease-out`,
        style({ opacity: 1 })
      )
    ])
  ]),
  transition(":leave", [
    query("li", [
      animate(
        `${_menu_animationDuration.content}ms ease-in`,
        style({ opacity: 0 })
      )
    ]),
    query(":self", [
      group([
        animate(
          `100ms`,
          style({
            boxShadow: "none"
          })
        ),
        animate(
          `${_menu_animationDuration.container}ms ${_menu_animationEasing}`,
          style({
            transform: `scale(1, ${_menu_containerScale.y})`
          })
        )
      ]),
      animate(
        `200ms`,
        style({
          backgroundColor: "white"
        })
      ),
      animate(
        `${_menu_animationDuration.container}ms ${_menu_animationEasing}`,
        style({
          transform: `scale(${_menu_containerScale.x}, ${_menu_containerScale.y})`
        })
      )
    ])
  ])
])

export const navAnimations = [overlayAnimation, menuAnimation]
