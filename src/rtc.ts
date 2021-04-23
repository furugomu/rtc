import EventEmitter from "eventemitter3";

export class RTCClient {
  pc: RTCPeerConnection;
  emitter: EventEmitter;
  dataChannel?: RTCDataChannel;

  constructor() {
    this.pc = new RTCPeerConnection({ iceServers: [] });
    this.pc.onicecandidate = this.onIceCandidate.bind(this);
    this.pc.onconnectionstatechange = this.onConnectionStateChange.bind(this);
    this.pc.ondatachannel = this.onDataChannel.bind(this);
    this.pc.onsignalingstatechange = this.onSignalingStateChange.bind(this);
    this.pc.oniceconnectionstatechange = this.onIceConnectionStateChange.bind(
      this
    );
    this.pc.ontrack = this.onTrack.bind(this);

    this.emitter = new EventEmitter();
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async receiveOffer(
    offer: RTCSessionDescription | RTCSessionDescriptionInit
  ): Promise<void> {
    console.log("receiveOffer", this.pc.signalingState);
    return this.pc.setRemoteDescription(offer);
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async receiveAnswer(
    answer: RTCSessionDescription | RTCSessionDescriptionInit
  ): Promise<void> {
    console.log("receiveAnswer", this.pc.signalingState);
    return this.pc.setRemoteDescription(answer);
  }

  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    console.log("addIceCandidate", candidate);
    return this.pc.addIceCandidate(candidate);
  }

  addTrack(track: MediaStreamTrack, ...streams: MediaStream[]) {
    this.pc.addTrack(track, ...streams);
  }

  createDataChannel(label: string): RTCDataChannel {
    this.dataChannel = this.pc.createDataChannel(label);
    return this.dataChannel;
  }

  // events
  on<T extends keyof Events>(event: T, listener: Events[T]) {
    return this.emitter.on(event, listener);
  }

  emit<T extends keyof Events>(event: T, ...args: Parameters<Events[T]>) {
    return this.emitter.emit(event, ...args);
  }

  onIceCandidate(event: RTCPeerConnectionIceEvent) {
    console.log("onIceCandidate", event);
    if (event.candidate) this.emit("icecandidate", event.candidate);
  }
  onConnectionStateChange(event: Event) {
    console.log("onConnectionStateChange", this.pc.connectionState, event);
    this.emit("connectionStateChange", this.pc.connectionState);
  }
  onIceConnectionStateChange(event: Event) {
    console.log(
      "onIceConnectionStateChange",
      this.pc.iceConnectionState,
      event
    );
    this.emit("iceConnectionStateChange", this.pc.iceConnectionState);
  }
  onSignalingStateChange(event: Event) {
    console.log("onSignalingStateChange", this.pc.signalingState, event);
    this.emit("signalingStateChange", this.pc.signalingState);
  }
  onDataChannel(event: RTCDataChannelEvent) {
    console.log("onDataChannel", event);
    this.emit("datachannel", event.channel);
  }
  onTrack(event: RTCTrackEvent) {
    console.log("onTrack", event);
    this.emit("track", event.streams);
  }
}

export type Events = {
  icecandidate: (candidate: RTCIceCandidate) => void;
  datachannel: (channel: RTCDataChannel) => void;
  connectionStateChange: (state: RTCPeerConnectionState) => void;
  iceConnectionStateChange: (state: RTCIceConnectionState) => void;
  signalingStateChange: (state: RTCSignalingState) => void;
  track: (streams: readonly MediaStream[]) => void;
};
