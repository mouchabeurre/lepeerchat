import { environment } from "src/environments/environment"
import {
  MessageOfferInOk,
  MessageCandidateInOk,
  MessageAnswerInOk
} from "./api"
import { DataOfferOut, DataPushOfferInOk } from "./interfaces/offer"
import { DataCandidateOut, DataPushCandidateInOk } from "./interfaces/candidate"
import { DataAnswerOut, DataPushAnswerInOk } from "./interfaces/answer"
import { Observable, Subscription, Subject, Observer } from "rxjs"
import {
  DataChatMessageProof,
  DataPingMessageProof,
  baseMessageValidShape,
  DataChannelMessageType,
  DataAckChatMessageProof,
  DataOfferMessageProof,
  DataCandidateMessageProof,
  DataAnswerMessageProof
} from "./message-validator"
import { isProved } from "ts-prove"

interface CanvasElement extends HTMLCanvasElement {
  captureStream: () => MediaStream
}

export type ChatMessage = DataChatMessageProof
export type PingMessage = DataPingMessageProof
export type AckMessage = DataAckChatMessageProof
export type OfferMessage = DataOfferMessageProof
export type CandidateMessage = DataCandidateMessageProof
export type AnswerMessage = DataAnswerMessageProof

export type DataChannelInternalMessage =
  | ChatMessage
  | PingMessage
  | AckMessage
  | OfferMessage
  | CandidateMessage
  | AnswerMessage

export enum DataChannelEventType {
  OPEN,
  CLOSE,
  MESSAGE
}
interface DataChannelOpen {
  type: DataChannelEventType.OPEN
}
interface DataChannelClose {
  type: DataChannelEventType.CLOSE
}
interface DataChannelMessage {
  type: DataChannelEventType.MESSAGE
  message: DataChannelInternalMessage
}

export type DataChannelEvent =
  | DataChannelClose
  | DataChannelOpen
  | DataChannelMessage

class OtherPeer {
  private _peerConnection: RTCPeerConnection
  private _signalingEmitters: SignalingEmitters
  private _dataChannel: RTCDataChannel
  private _eventEmitter$: Observer<OtherPeerEvent>
  private _outStream: StreamRef
  private _inStream: StreamRef
  private _isPolite: boolean
  private _makingOffer: boolean
  private _ignoreOffer: boolean
  private _abortedOwnOffer: boolean
  readonly userId: string

  constructor(
    id: string,
    outStream: StreamRef,
    socketEmitters: SignalingEmitters,
    eventEmitter$: Observer<OtherPeerEvent>,
    initiate: boolean = false
  ) {
    this.userId = id
    this._isPolite = !initiate
    this._makingOffer = false
    this._ignoreOffer = false
    this._abortedOwnOffer = false
    this._outStream = outStream
    this._inStream = { stream: null }
    this._eventEmitter$ = eventEmitter$
    this._signalingEmitters = socketEmitters
    this._peerConnection = new RTCPeerConnection({
      iceServers: environment.iceServers
    })

    this._peerConnection.onicecandidate = event => {
      // console.log("recieved icecandidate for", this.userId)
      if (event.candidate) {
        if (this._dataChannel?.readyState === "open") {
          this.sendDataChannel({
            type: DataChannelMessageType.CANDIDATE,
            candidate: event.candidate
          })
        } else {
          this._signalingEmitters
            .candidate({
              id: this.userId,
              candidate: event.candidate
            })
            .catch(err => {
              console.error("error while sending icecandidate:", err)
            })
        }
      }
    }
    this._peerConnection.oniceconnectionstatechange = event => {
      this._log(
        "got iceconnection state:",
        this._peerConnection?.iceConnectionState
      )
      this._eventEmitter$.next({
        from: this.userId,
        data: {
          type: OtherPeerEventType.CONNECTION_EVENT,
          state: this._peerConnection?.iceConnectionState
        }
      })
      if (this._peerConnection?.iceConnectionState === "connected") {
        if (this._abortedOwnOffer) {
          this._log("retrying postponed offer")
          this._abortedOwnOffer = false
          this._startNegotiation()
        }
      }
    }
    this._peerConnection.onsignalingstatechange = event => {
      this._log("got signaling state:", this._peerConnection?.signalingState)
    }
    this._peerConnection.onicegatheringstatechange = event => {
      // console.log(
      //   "PeerConnection event: icegathering state:",
      //   this._peerConnection.iceGatheringState
      // )
    }
    this._peerConnection.onnegotiationneeded = event => {
      this._log("negotiationneeded")
      if (
        !this._makingOffer &&
        !this._abortedOwnOffer &&
        !(this._isPolite && this._dataChannel?.readyState !== "open")
      ) {
        this._startNegotiation()
      } else {
        this._log("prevented offer creation")
      }
    }
    this._peerConnection.onconnectionstatechange = event => {
      // console.log(
      //   "PeerConnection event: connection state:",
      //   this._peerConnection.connectionState
      // )
      // this._eventEmitter$.next({
      //   from: this.userId,
      //   data: {
      //     type: OtherPeerEventType.CONNECTION_EVENT,
      //     state: this._peerConnection.connectionState
      //   }
      // })
    }
    this._peerConnection.ondatachannel = event => {
      this._log("got datachannel")
      this._dataChannel = event.channel
      this._listenDataChannelEvents()
    }
    this._peerConnection.ontrack = event => {
      this._updateInStreamRef(event.streams[0])
      this._eventEmitter$.next({
        from: this.userId,
        data: {
          type: OtherPeerEventType.STREAM,
          stream: event.streams[0]
        }
      })
    }

    if (outStream.stream) {
      this.mergeStream(outStream.stream)
    }

    if (initiate) {
      this._log("initiate")
      // console.log("creating dataChannel")
      this._dataChannel = this._peerConnection.createDataChannel(this.userId)
      this._listenDataChannelEvents()
    }
  }

  private _updateInStreamRef(stream: MediaStream) {
    stream.onremovetrack = event => {
      if (this._inStream.stream?.getTracks().length === 0) {
        this._inStream.stream = null
        this._eventEmitter$.next({
          from: this.userId,
          data: {
            type: OtherPeerEventType.STREAM,
            stream: null
          }
        })
      } else {
        this._eventEmitter$.next({
          from: this.userId,
          data: {
            type: OtherPeerEventType.STREAM,
            stream: this._inStream.stream
          }
        })
      }
    }
    this._inStream.stream = stream
  }

  private _log(...args: any) {
    // console.log("PC", this.userId, ":", ...args)
  }

  private _startNegotiation() {
    this._makingOffer = true
    const viaDataChannel = this._dataChannel?.readyState === "open"
    this._peerConnection
      .createOffer()
      .then(sdp => this._peerConnection.setLocalDescription(sdp))
      .then(() => {
        this._log(
          "sending offer via",
          viaDataChannel ? "dataChannel" : "WebSocket"
        )
        if (viaDataChannel) {
          this.sendDataChannel({
            type: DataChannelMessageType.OFFER,
            description: this._peerConnection.localDescription!
          })
        } else {
          this._signalingEmitters
            .offer({
              id: this.userId,
              description: this._peerConnection.localDescription!
            })
            .catch(err => {
              console.error("error while sending offer:", err)
            })
        }
      })
      .catch(err => {
        this._makingOffer = false
        console.error("error while creating offer:", err)
      })
  }

  private _listenDataChannelEvents() {
    this._dataChannel.onopen = () => {
      // console.log("datachannel with", this.userId, "opened")
      this._eventEmitter$.next({
        from: this.userId,
        data: {
          type: OtherPeerEventType.DATA_CHANNEL_EVENT,
          state: {
            type: DataChannelEventType.OPEN
          }
        }
      })
      if (this._isPolite) {
        // eager negotiation
        this._startNegotiation()
      }
    }
    this._dataChannel.onclose = () => {
      // console.log("datachannel with", this.userId, "closed")
      this._eventEmitter$.next({
        from: this.userId,
        data: {
          type: OtherPeerEventType.DATA_CHANNEL_EVENT,
          state: {
            type: DataChannelEventType.CLOSE
          }
        }
      })
    }
    this._dataChannel.onmessage = event => {
      if (typeof event.data === "string") {
        let message: DataChannelInternalMessage
        try {
          message = JSON.parse(event.data) as DataChannelInternalMessage
        } catch (error) {
          console.error("Couldn't parse DataChannel message:", error)
          return
        }
        const anyMessageProof = baseMessageValidShape(message)
        if (!isProved(anyMessageProof)) {
          console.log(
            "message",
            JSON.parse(event.data),
            "from",
            this.userId,
            "didn't pass validation:",
            anyMessageProof[0]
          )
        } else {
          switch (anyMessageProof[1].type) {
            case DataChannelMessageType.PING:
              this._eventEmitter$.next({
                from: this.userId,
                data: {
                  type: OtherPeerEventType.DATA_CHANNEL_EVENT,
                  state: {
                    type: DataChannelEventType.MESSAGE,
                    message: anyMessageProof[1]
                  }
                }
              })
              break
            case DataChannelMessageType.CHAT:
              this._eventEmitter$.next({
                from: this.userId,
                data: {
                  type: OtherPeerEventType.DATA_CHANNEL_EVENT,
                  state: {
                    type: DataChannelEventType.MESSAGE,
                    message: anyMessageProof[1]
                  }
                }
              })
              break
            case DataChannelMessageType.ACK_CHAT:
              this._eventEmitter$.next({
                from: this.userId,
                data: {
                  type: OtherPeerEventType.DATA_CHANNEL_EVENT,
                  state: {
                    type: DataChannelEventType.MESSAGE,
                    message: anyMessageProof[1]
                  }
                }
              })
              break
            case DataChannelMessageType.OFFER:
              this.onRemoteOffer(anyMessageProof[1].description, true)
              break
            case DataChannelMessageType.CANDIDATE:
              this.onRemoteIceCandidate(anyMessageProof[1].candidate)
              break
            case DataChannelMessageType.ANSWER:
              this.onRemoteAnswer(anyMessageProof[1].description)
              break
          }
        }
      } else {
        console.warn(
          "DataChannel has no handler for message of type",
          typeof event.data
        )
      }
    }
  }

  sendDataChannel(message: DataChannelInternalMessage) {
    if (this._dataChannel?.readyState === "open") {
      this._dataChannel.send(JSON.stringify(message))
    } else {
      console.error(
        "cannot sendDataChannel with readyState:",
        this._dataChannel?.readyState
      )
    }
  }

  mergeStream(stream: MediaStream | null) {
    const replacedTracks: MediaStreamTrack[] = []
    const streamTracksIterator = stream?.getTracks() ?? []
    for (const tranciever of this._peerConnection.getTransceivers()) {
      let replaced = false
      for (const track of streamTracksIterator) {
        if (
          tranciever.sender.track?.kind === track.kind &&
          tranciever.sender.track?.label === track.label
        ) {
          tranciever.sender.replaceTrack(track)
          replaced = true
          replacedTracks.push(track)
          break
        }
      }
      if (!replaced) {
        this._peerConnection.removeTrack(tranciever.sender)
      }
    }
    stream
      ?.getTracks()
      .filter(track => {
        return !replacedTracks.find(replacedTrack => replacedTrack === track)
      })
      .forEach(track => {
        this._peerConnection.addTrack(track, stream)
      })
  }

  onRemoteOffer(
    description: RTCSessionDescriptionInit,
    viaDataChannel = false
  ) {
    this._log("remote offer")
    const offerCollision =
      this._makingOffer || this._peerConnection.signalingState !== "stable"
    this._ignoreOffer = !this._isPolite && offerCollision
    if (this._ignoreOffer) {
      this._log("ignoring remote offer")
    } else {
      let rollbackLocalDescription = Promise.resolve()
      if (
        this._isPolite &&
        this._makingOffer &&
        this._peerConnection.signalingState !== "stable"
      ) {
        this._log("postponning own offer")
        this._makingOffer = false
        this._abortedOwnOffer = true
        rollbackLocalDescription = this._peerConnection.setLocalDescription({
          type: "rollback"
        })
      }
      rollbackLocalDescription
        .then(() => this._peerConnection.setRemoteDescription(description))
        .then(() => this._peerConnection.createAnswer())
        .then(sdp => this._peerConnection.setLocalDescription(sdp))
        .then(() => {
          this._log(
            "answering via",
            viaDataChannel ? "dataChannel" : "WebSocket"
          )
          if (viaDataChannel) {
            this.sendDataChannel({
              type: DataChannelMessageType.ANSWER,
              description: this._peerConnection.localDescription!
            })
          } else {
            this._signalingEmitters
              .answer({
                id: this.userId,
                description: this._peerConnection.localDescription!
              })
              .catch(err => {
                console.error("error while sending answer:", err)
              })
          }
        })
        .catch(err => {
          console.error("error while answering:", err)
        })
    }
  }

  onRemoteIceCandidate(candidate: RTCIceCandidate) {
    // console.log("recieving remote icecandidate from", this.userId)
    if (
      this._peerConnection.currentRemoteDescription !== null &&
      !this._ignoreOffer
    ) {
      this._peerConnection.addIceCandidate(candidate).catch(err => {
        console.error("error while adding ice candidate", err)
      })
    }
  }

  onRemoteAnswer(description: RTCSessionDescriptionInit) {
    this._log("remote answer")
    if (this._peerConnection.signalingState !== "stable") {
      this._makingOffer = false
      this._peerConnection
        .setRemoteDescription(description)
        .then(() => {})
        .catch(err => {
          console.error("error while setting remote description", err)
        })
    }
  }

  destroy() {
    this._peerConnection.close()
  }
}

interface SignalingEmitters {
  offer: (data: DataOfferOut) => Promise<MessageOfferInOk>
  candidate: (data: DataCandidateOut) => Promise<MessageCandidateInOk>
  answer: (data: DataAnswerOut) => Promise<MessageAnswerInOk>
}

interface SignalingObservables {
  onOffer$: Observable<DataPushOfferInOk>
  onCandidate$: Observable<DataPushCandidateInOk>
  onAnswer$: Observable<DataPushAnswerInOk>
}

export enum OtherPeerEventType {
  CONNECTION_EVENT,
  DATA_CHANNEL_EVENT,
  ANY_ERROR,
  STREAM
}

interface OtherPeerConnectionStateEvent {
  type: OtherPeerEventType.CONNECTION_EVENT
  state: RTCIceConnectionState
}
interface OtherPeerDataChannelEvent {
  type: OtherPeerEventType.DATA_CHANNEL_EVENT
  state: DataChannelEvent
}
interface OtherPeerErrorData {
  type: OtherPeerEventType.ANY_ERROR
  error: any
}
interface OtherPeerStream {
  type: OtherPeerEventType.STREAM
  stream: MediaStream | null
}

type OtherPeerEventDataEvent =
  | OtherPeerConnectionStateEvent
  | OtherPeerDataChannelEvent
  | OtherPeerErrorData
  | OtherPeerStream

export interface OtherPeerEvent {
  from: string
  data: OtherPeerEventDataEvent
}

interface StreamRef {
  stream: MediaStream | null
}

export class PeerController {
  private _otherPeerConnections: Map<string, OtherPeer>
  private _signalingEmitters: SignalingEmitters
  private _signalingSubscriptions: {
    offer: Subscription
    candidate: Subscription
    answer: Subscription
  }
  private _ownStreamRef: StreamRef
  private _otherPeerSubject$: Subject<OtherPeerEvent>
  private _otherPeerEmitter$: Observer<OtherPeerEvent>

  constructor(
    participantIds: string[],
    signalingEmitters: SignalingEmitters,
    signalingObservables: SignalingObservables
  ) {
    this._ownStreamRef = { stream: null }
    this._otherPeerSubject$ = new Subject()
    this._signalingEmitters = signalingEmitters
    this._otherPeerEmitter$ = <Observer<OtherPeerEvent>>this._otherPeerSubject$
    this._otherPeerConnections = new Map(
      participantIds.map(id => {
        return [
          id,
          new OtherPeer(
            id,
            this._ownStreamRef,
            this._signalingEmitters,
            this._otherPeerEmitter$,
            true
          )
        ]
      })
    )
    this._signalingSubscriptions = {
      offer: signalingObservables.onOffer$.subscribe({
        next: data => {
          this._otherPeerConnections
            .get(data.id)
            ?.onRemoteOffer(data.description)
        }
      }),
      candidate: signalingObservables.onCandidate$.subscribe({
        next: data => {
          this._otherPeerConnections
            .get(data.id)
            ?.onRemoteIceCandidate(data.candidate)
        }
      }),
      answer: signalingObservables.onAnswer$.subscribe({
        next: data => {
          this._otherPeerConnections
            .get(data.id)
            ?.onRemoteAnswer(data.description)
        }
      })
    }
  }

  getPeerSubjectAsObservable(): Observable<OtherPeerEvent> {
    return this._otherPeerSubject$
  }

  sendMessageToPeer(peerId: string, message: DataChannelInternalMessage) {
    this._otherPeerConnections.get(peerId)?.sendDataChannel(message)
  }

  sendMessageToPeers(message: DataChannelInternalMessage) {
    for (const [_, peer] of this._otherPeerConnections) {
      peer.sendDataChannel(message)
    }
  }

  mergeStream(stream: MediaStream | null) {
    this._ownStreamRef.stream = stream
    for (const [_, peer] of this._otherPeerConnections) {
      peer.mergeStream(stream)
    }
  }

  addParticipant(participantId: string) {
    this._otherPeerConnections.set(
      participantId,
      new OtherPeer(
        participantId,
        this._ownStreamRef,
        this._signalingEmitters,
        this._otherPeerEmitter$
      )
    )
  }

  removeParticipant(participantId: string) {
    const peer = this._otherPeerConnections.get(participantId)
    if (peer) {
      peer.destroy()
      this._otherPeerConnections.delete(participantId)
    }
  }

  destroy() {
    this._signalingSubscriptions.offer?.unsubscribe()
    this._signalingSubscriptions.candidate?.unsubscribe()
    this._signalingSubscriptions.answer?.unsubscribe()
    for (const [_, peer] of this._otherPeerConnections) {
      peer.destroy()
    }
  }
}
