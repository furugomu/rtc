import { Server, ServerOptions } from "socket.io";
import http from "http";

type Member = { id: string };

type ListenEvents = {
  offer: (id: string, offer: RTCSessionDescription) => void;
  answer: (id: string, offer: RTCSessionDescription) => void;
  icecandidate: (id: string, candidate: RTCIceCandidate) => void;
};

type EmitEvents = {
  offer: (id: string, offer: RTCSessionDescription) => void;
  answer: (id: string, offer: RTCSessionDescription) => void;
  icecandidate: (id: string, candidate: RTCIceCandidate) => void;
  members: (members: Member[]) => void;
};

export default function createSocketServer(
  httpServer: http.Server,
  options?: Partial<ServerOptions>
) {
  const io = new Server<ListenEvents, EmitEvents>(httpServer, options);

  io.on("connection", (socket) => {
    socket.on("offer", (id: string, offer: RTCSessionDescription) => {
      console.log("onoffer", socket.id, "=>", id, offer);
      io.to(id).emit("offer", socket.id, offer);
    });

    socket.on("answer", (id: string, answer: RTCSessionDescription) => {
      console.log("onanswer", socket.id, "=>", id, answer);
      io.to(id).emit("answer", socket.id, answer);
    });

    socket.on("icecandidate", (id: string, candidate: RTCIceCandidate) => {
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
const emitMembers = async (io: Server<ListenEvents, EmitEvents>) => {
  const sockets = await io.fetchSockets();
  const members = sockets.map((socket) => ({ id: socket.id }));
  io.emit("members", members);
};
