import { createServer } from "http";
import { Server, Socket } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: "*" } });

// const members = new Map<string, Socket>();

io.on("connection", (socket: Socket) => {
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
    emitMembers();
  });
  emitMembers();
});

const emitMembers = async () => {
  const sockets = await io.fetchSockets();
  const members = sockets.map((socket) => ({ id: socket.id }));
  io.emit("members", members);
};

httpServer.listen(3001, "0.0.0.0");
