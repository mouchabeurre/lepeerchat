# lepeerchat client

This directory is home to the **client application** of the *lepeerchat* project.

## Description

This frontend application is a single page application powered by the [angular](angular.io) framework. It takes advantage of the [RxJS](https://rxjs.dev/) library for internal data reactivity.

Application state (*chat-room* state mostly) is stored in a shared service ([room.service](src/app/injectables/room.service.ts)).
The service exposes *state selectors* (topics) that consumers can subscribe to.
This way, components only get relevant updates of state changes and can compose their own stream of topics (typically by [merging](https://rxjs.dev/api/index/function/merge) subscriptions).

In order to abstract the complexity of the **WebRTC** stack away from the presentation components, a [*transparent negotioation pattern*](https://w3c.github.io/webrtc-pc/#perfect-negotiation-example) is implemented.


## Features

- Password-less rooms.
- Seamless **WebRTC** negotiations (works everytime 80% of the time).
- Keyboard friendly.
- **UTF-8** proof.
- Access previously joined rooms from list on homepage.
- Access previously issued invitations in the "room manager" popup (gear button). Automatically updated on expiration.
- Adjust the screen share of the *media container* and *chat log* with a draggable handle.
- Rich chat messages (link detection).
- "seen" indicators on messages recieved by other peers.
- Feedback for your shared stream (by toggling the "View own stream" checkbox in the stream managment popup).

## Usage

In order to communicate with other people, one must:
1. Create a room (under `/create`).
2. Generate an invitation (*gear* button next room name (top-left)) and **copy it**.
3. Share the invitation with your guest(s) via a third-party mean of communication.
4. Once the guest(s) joined, you should be able to chat textually.
    1. To **start** streaming, open the strem manager by clicking the "STREAM" button (center bottom).
    2. Select either or both audio and video devices, then confirm with "SHARE STREAM".
    3. Others should be able to hear/see your stream.
    4. To **stop** streaming, click the "RESET" button of the stream type you want to stop and confirm with "SHARE STREAM" (very intuitive).

## Build

Download the package dependecies:
```
(pnpm|yarn|npm) install
```
Build the application with:
```
(pnpm|yarn|npm) run build:prod
```

## Limitations

### Responsiveness

Although the application maximizes the space on most horizontal viewports, it is not responsive enough to be used on vertical devices.

### Media Stream quality

By default, the WebRTC Media Stream tries to match as best as possible the quality of the original stream. For that reason, recieving and sending streams can quickly show its toll on the CPU as well as the outbound network bandwidth. 

### Code coverage

As per the "*Self-reliance*" entry of the *Swanson Pyramid of Greatness*, I trust myself, therefore I don't need any test challenging this claim in my codebase. /s