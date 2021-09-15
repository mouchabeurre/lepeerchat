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

const routes: Routes = [
  {
    path: "",
    component: HomeComponent,
    data: { animationState: "Home" }
  },
  {
    path: "create",
    component: CreateRoomComponent,
    data: { animationState: "Create" }
  },
  {
    path: "room/:id",
    component: RoomComponent,
    canActivate: [RoomGuard],
    canDeactivate: [ComponentDeactivateGuard],
    data: { animationState: "Room" }
  },
  {
    path: "join/:id",
    component: JoinRoomComponent,
    canActivate: [JoinGuard],
    data: { animationState: "Join" }
  },
  {
    path: "about",
    component: AboutComponent,
    data: { animationState: "About" }
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
    relativeLinkResolution: 'legacy'
})
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
