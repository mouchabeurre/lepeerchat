import { NgModule } from "@angular/core"
import { Routes, RouterModule } from "@angular/router"
import { HomeComponent } from "../components/home/home.component"
import { CreateRoomComponent } from "../components/create-room/create-room.component"
import { RoomComponent } from "../components/room/room.component"
import { RoomGuard } from "./room.guard"
import { JoinRoomComponent } from "../components/join-room/join-room.component"
import { JoinGuard } from "./join.guard"
import { AboutComponent } from "../components/about/about.component"
import { ComponentDeactivateGuard } from "./component-deactivate.guard"

export const enum PageName {
  HOME = "home",
  CREATE = "create",
  JOIN = "join",
  ROOM = "room",
  ABOUT = "about"
}
export interface PageData<T> {
  title: string
  transitionKey: T
}
export const routesData: {
  [key in PageName as `${key}Page`]: PageData<key>
} = {
  homePage: {
    title: "Home",
    transitionKey: PageName.HOME
  },
  createPage: {
    title: "Create new room",
    transitionKey: PageName.CREATE
  },
  joinPage: {
    title: "Joining a room",
    transitionKey: PageName.JOIN
  },
  roomPage: {
    title: "Room",
    transitionKey: PageName.ROOM
  },
  aboutPage: {
    title: "About",
    transitionKey: PageName.ABOUT
  }
}

const routes: Routes = [
  {
    path: "",
    component: HomeComponent,
    data: routesData.homePage
  },
  {
    path: "create",
    component: CreateRoomComponent,
    data: routesData.createPage
  },
  {
    path: "room/:id",
    component: RoomComponent,
    canActivate: [RoomGuard],
    canDeactivate: [ComponentDeactivateGuard],
    data: routesData.roomPage
  },
  {
    path: "join/:id",
    component: JoinRoomComponent,
    canActivate: [JoinGuard],
    data: routesData.joinPage
  },
  {
    path: "about",
    component: AboutComponent,
    data: routesData.aboutPage
  },
  {
    path: "**",
    redirectTo: ""
  }
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      anchorScrolling: "enabled",
      relativeLinkResolution: "legacy"
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
