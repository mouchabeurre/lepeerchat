import { BrowserModule } from "@angular/platform-browser"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { NgModule } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"

import { AppRoutingModule } from "./routing/app-routing.module"
import { AppComponent } from "./app.component"
import { HomeComponent } from "./components/home/home.component"
import { CreateRoomComponent } from "./components/create-room/create-room.component"
import { RoomComponent } from "./components/room/room.component"
import { CachedRoomsComponent } from "./components/cached-rooms/cached-rooms.component"
import { JoinRoomComponent } from "./components/join-room/join-room.component"
import { ChatComponent } from "./components/chat/chat.component"
import { MediaControllerComponent } from "./components/media-controller/media-controller.component"
import { MediaPlayerComponent } from "./components/media-player/media-player.component"
import { ScrollerDirective } from "./components/chat/scroller.directive"
import { RichMessageContentComponent } from "./components/rich-message-content/rich-message-content.component"
import { AboutComponent } from "./components/about/about.component"
import { RoomInfoComponent } from "./components/room-info/room-info.component"
import { NavbarComponent } from "./components/navbar/navbar.component"
import { RoomManagerComponent } from "./components/room-manager/room-manager.component"
import { BackdropOverlayComponent } from "./components/backdrop-overlay/backdrop-overlay.component"
import { LeaveRoomPromptComponent } from "./components/leave-room-prompt/leave-room-prompt.component"
import { TimeFromPipe } from "./pipes/time-from.pipe"
import { OrderByPipe } from "./pipes/order-by.pipe"
import { MediaPlayerGridComponent } from "./components/media-player-grid/media-player-grid.component"

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CreateRoomComponent,
    RoomComponent,
    CachedRoomsComponent,
    JoinRoomComponent,
    ChatComponent,
    MediaControllerComponent,
    MediaPlayerComponent,
    ScrollerDirective,
    RichMessageContentComponent,
    AboutComponent,
    RoomInfoComponent,
    NavbarComponent,
    RoomManagerComponent,
    BackdropOverlayComponent,
    LeaveRoomPromptComponent,
    TimeFromPipe,
    OrderByPipe,
    MediaPlayerGridComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
