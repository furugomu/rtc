import { Events, RTCClient } from "./rtc";
import { io, Socket } from "socket.io-client";
import type { ClientEvents, ServerEvents } from "./socketio";

export class RTCSocket {
  rtc: RTCClient;
  socket: Socket<ClientEvents, ServerEvents>;
  id: string;
  opponent?: string;

  constructor() {
    this.rtc = new RTCClient();
    this.socket = io();
    this.id = "";
    this.initializeRtc();
    this.initializeSocket();
  }

  addTrack(...args: Parameters<RTCClient["addTrack"]>) {
    return this.rtc.addTrack(...args);
  }

  // onnegotiationneeded でやるほうが良いかもしれない
  async sendOffer(id: string) {
    console.log("sendOffer");
    this.opponent = id;
    this.socket.emit("offer", id, await this.rtc.createOffer());
  }

  on<T extends keyof Events>(event: T, listener: Events[T]) {
    return this.rtc.on(event, listener);
  }

  get signalingState() {
    return this.rtc.pc.signalingState;
  }

  get connectionState() {
    return this.rtc.pc.connectionState;
  }

  get iceConnectionState() {
    return this.rtc.pc.iceConnectionState;
  }

  private initializeRtc() {
    this.rtc.on("icecandidate", (candidate) => {
      console.log("> icecandidate", candidate);
      if (!this.opponent) return;
      this.socket.emit("icecandidate", this.opponent, candidate);
    });
  }

  private initializeSocket() {
    const socket = this.socket;
    socket.on("connect", () => {
      console.log("connect", socket.id);
      this.id = socket.id;
    });

    socket.on("offer", async (id, offer) => {
      console.log("offer", id, offer);
      this.opponent = id;
      await this.rtc.receiveOffer(offer);
      const answer = await this.rtc.createAnswer();
      socket.emit("answer", id, answer);
    });

    socket.on("answer", (id, answer) => {
      console.log("answer", id, answer);
      this.opponent = id;
      this.rtc.receiveAnswer(answer);
    });

    socket.on("icecandidate", (id, candidate) => {
      console.log("< icecandidate", id, candidate);
      this.rtc.addIceCandidate(candidate);
    });

    // socket.on("members", (members) => {
    //   const filtered = members.filter((member) => member.id !== socket.id);
    //   setMembers(filtered);
    // });
  }
}
