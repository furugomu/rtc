import EventEmitter from "events";

export class RTCClient {
  con: RTCPeerConnection;
  emitter: EventEmitter;
  dataChannel?: RTCDataChannel;

  constructor() {
    this.con = new RTCPeerConnection({ iceServers: [] });
    this.con.onicecandidate = this.onIceCandidate.bind(this);
    this.con.onconnectionstatechange = this.onConnectionStateChange.bind(this);
    this.con.ondatachannel = this.onDataChannel.bind(this);
    this.con.onsignalingstatechange = this.onSignalingStateChange.bind(this);
    this.con.ontrack = this.onTrack.bind(this);

    this.emitter = new EventEmitter();
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.con.createOffer();
    await this.con.setLocalDescription(offer);
    return offer;
  }

  async receiveOffer(
    offer: RTCSessionDescription | RTCSessionDescriptionInit
  ): Promise<void> {
    console.log("receiveOffer", this.con.signalingState);
    return this.con.setRemoteDescription(offer);
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.con.createAnswer();
    await this.con.setLocalDescription(answer);
    return answer;
  }

  async receiveAnswer(
    answer: RTCSessionDescription | RTCSessionDescriptionInit
  ): Promise<void> {
    console.log("receiveAnswer", this.con.signalingState);
    return this.con.setRemoteDescription(answer);
  }

  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    return this.con.addIceCandidate(candidate);
  }

  addTrack(track: MediaStreamTrack, ...streams: MediaStream[]) {
    this.con.addTrack(track, ...streams);
  }

  createDataChannel(label: string): RTCDataChannel {
    this.dataChannel = this.con.createDataChannel(label);
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
    console.log("onConnectionStateChange", this.con.connectionState, event);
  }
  onDataChannel(event: RTCDataChannelEvent) {
    console.log("onDataChannel", event);
    this.emit("datachannel", event.channel);
  }
  onSignalingStateChange(event: Event) {
    console.log("onSignalingStateChange", this.con.signalingState);
    this.emit("signalingStateChange", this.con.signalingState);
  }
  onTrack(event: RTCTrackEvent) {
    console.log("onTrack", event);
    this.emit("track", event.streams);
  }
}

type Events = {
  icecandidate: (candidate: RTCIceCandidate) => void;
  datachannel: (channel: RTCDataChannel) => void;
  signalingStateChange: (state: RTCSignalingState) => void;
  track: (streams: readonly MediaStream[]) => void;
};
