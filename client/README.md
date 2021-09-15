# lepeerchat client

This directory is home to the **client application** of the *lepeerchat* project.

## Description

This frontend application is a single page application powered by the [angular](angular.io) framework.

The **client** holds a fair share of the overall project complexity since it essentially becomes a **server** itself once the peer-to-peer negotiation is initiated.

The logic responsible for the seamless paring (which works everytime 70% of the time) is located in [peer-controller.ts](src/app/utils/peer-controller.ts).

## Limitations
### Responsiveness

Although the application maximizes the space on most horizontal viewports, it is not responsive enough to be used on vertical devices.

### Media Stream quality

By default, the WebRTC Media Stream tries to match as best as possible the quality of the original stream. For that reason, recieving and sending streams can quickly show its toll on the CPU as well as the outbound network bandwidth. 

### Code coverage

As per the "*Self-reliance*" entry of the *Swanson Pyramid of Greatness*, I trust myself, therefore I don't need no test challenging this claim in my codebase! /s