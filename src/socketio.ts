import { Server, ServerOptions } from "socket.io";
import http from "http";

type Member = { id: string };

export type ServerEvents = {
  offer: (
    id: string,
    offer: RTCSessionDescription | RTCSessionDescriptionInit
  ) => void;
  answer: (
    id: string,
    offer: RTCSessionDescription | RTCSessionDescriptionInit
  ) => void;
  icecandidate: (id: string, candidate: RTCIceCandidate) => void;
};

export type ClientEvents = {
  offer: (
    id: string,
    offer: RTCSessionDescription | RTCSessionDescriptionInit
  ) => void;
  answer: (
    id: string,
    offer: RTCSessionDescription | RTCSessionDescriptionInit
  ) => void;
  icecandidate: (id: string, candidate: RTCIceCandidate) => void;
  members: (members: Member[]) => void;
};

export default function createSocketServer(
  httpServer: http.Server,
  options?: Partial<ServerOptions>
) {
  const io = new Server<ServerEvents, ClientEvents>(httpServer, options);

  io.on("connection", (socket) => {
    socket.on("offer", (id, offer) => {
      // console.log("onoffer", socket.id, "=>", id, offer);
      console.log("onoffer", socket.id, "=>", id);
      io.to(id).emit("offer", socket.id, offer);
    });

    socket.on("answer", (id, answer) => {
      // console.log("onanswer", socket.id, "=>", id, answer);
      console.log("onanswer", socket.id, "=>", id);
      io.to(id).emit("answer", socket.id, answer);
    });

    socket.on("icecandidate", (id, candidate) => {
      console.log("onicecandidate", socket.id, "=>", id, candidate);
      io.to(id).emit("icecandidate", socket.id, candidate);
    });
    socket.on("disconnect", () => {
      emitMembers(io);
    });
    emitMembers(io);
  });
  return io;
}
const emitMembers = async (io: Server<ServerEvents, ClientEvents>) => {
  const sockets = await io.fetchSockets();
  const members = sockets.map((socket) => ({ id: socket.id }));
  io.emit("members", members);
};
