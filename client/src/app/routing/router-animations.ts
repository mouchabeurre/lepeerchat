import { trigger, transition, style, query, animate } from "@angular/animations"
import { routesData } from "./app-routing.module"

const _durationDefault = 300
const _durationLong = 400
const animateEaseIn = `${_durationDefault}ms ease-in`
const animateEaseOut = `${_durationDefault}ms ease-out`
const animateEaseEnter = `${_durationLong}ms cubic-bezier(0.18, 0.79, 0.54, 0.93)`
const animateEaseLeave = `${_durationLong}ms cubic-bezier(0.79, 0.18, 0.93, 0.54)`
const translateValOutStar = 30
const translateValOutAbout = 70
const translateValIn = 0

export const routeTransitionAnimations = [
  trigger("routerAnimation", [
    transition(`* => ${routesData.aboutPage.transitionKey}`, [
      style({ position: "relative" }),
      query(
        ":enter",
        [
          style({
            transform: `translateY(${translateValOutAbout}vh)`,
            opacity: 0
          })
        ],
        {
          optional: true
        }
      ),
      query(
        ":leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            opacity: 1
          }),
          animate(
            animateEaseLeave,
            style({
              transform: `translateY(-${translateValOutStar}vh)`,
              opacity: 0
            })
          )
        ],
        { optional: true }
      ),
      query(
        ":enter",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            transform: `translateY(${translateValOutAbout}vh)`,
            width: "100%",
            opacity: 0
          }),
          animate(
            animateEaseEnter,
            style({ transform: `translateY(${translateValIn})`, opacity: 1 })
          )
        ],
        { optional: true }
      )
    ]),
    transition(`${routesData.aboutPage.transitionKey} => *`, [
      style({ position: "relative" }),
      query(
        ":enter",
        [
          style({
            transform: `translateY(-${translateValOutStar}vh)`,
            opacity: 0
          })
        ],
        {
          optional: true
        }
      ),
      query(
        ":leave",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            opacity: 1
          }),
          animate(
            animateEaseLeave,
            style({
              transform: `translateY(${translateValOutAbout}vh)`,
              opacity: 0
            })
          )
        ],
        { optional: true }
      ),
      query(
        ":enter",
        [
          style({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            opacity: 0
          }),
          animate(
            animateEaseEnter,
            style({ transform: `translateY(${translateValIn})`, opacity: 1 })
          )
        ],
        { optional: true }
      )
    ]),
    transition("* => *", [
      style({ position: "relative" }),
      query(":enter", [style({ opacity: 0 })], { optional: true }),
      query(
        ":leave",
        [
          style({
            opacity: 1,
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%"
          }),
          animate(animateEaseIn, style({ opacity: 0 }))
        ],
        { optional: true }
      ),
      query(
        ":enter",
        [
          style({
            opacity: 0,
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%"
          }),
          animate(animateEaseOut, style({ opacity: 1 }))
        ],
        { optional: true }
      )
    ])
  ])
]
