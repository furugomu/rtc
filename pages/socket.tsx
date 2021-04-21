import { Button } from "@chakra-ui/button";
import { Box, Container, Stack } from "@chakra-ui/layout";
import { Select } from "@chakra-ui/select";
import { As, forwardRef } from "@chakra-ui/system";
import {
  MutableRefObject,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { RTCClient } from "../src/rtc";

type Member = { id: string };

export default function Page() {
  const socketRef = useRef<Socket>();
  const rtcRef = useRef<RTCClient>();
  const [members, setMembers] = useState<Member[]>([]);
  const [receiver, setReceiver] = useState("");
  const [signalingState, setSignalingState] = useState("");
  const opponentRef = useRef("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // socket.io しょきか
  useEffect(() => {
    const socket = io("http://tapi.local:3001");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("connect", socket.id);
    });
    socket.on("offer", async (id: string, offer: RTCSessionDescriptionInit) => {
      console.log("offer", id, offer);
      opponentRef.current = id;
      const rtc = rtcRef.current;
      if (!rtc) return;
      await rtc.receiveOffer(offer);
      const answer = await rtc.createAnswer();
      socket.emit("answer", id, answer);
    });
    socket.on("answer", (id: string, answer: RTCSessionDescriptionInit) => {
      console.log("answer", id, answer);
      opponentRef.current = id;
      const rtc = rtcRef.current;
      if (!rtc) return;
      rtc.receiveAnswer(answer);
    });
    socket.on("icecandidate", (...args) => {
      console.log("socket icecandidate", ...args);
    });
    socket.on("members", (members: Member[]) => {
      const filtered = members.filter((member) => member.id !== socket.id);
      setMembers(filtered);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // WebRTC しょきか
  useEffect(() => {
    const rtc = new RTCClient();
    (window as any).rtc = rtc;
    rtcRef.current = rtc;
    rtc.createDataChannel("hoge");
    rtc.on("icecandidate", (candidate) => {
      console.log("rtc icecandidate", candidate);
      const socket = socketRef.current;
      if (!socket) return;
      if (!opponentRef.current) return;
      socket.emit("icecandidate", opponentRef.current, candidate);
    });
    rtc.on("signalingStateChange", (signalingState) =>
      setSignalingState(signalingState)
    );
    rtc.on("track", (streams) => {
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = streams[0];
    });
  }, []);

  useEffect(() => {
    if (!members.some(({ id }) => id === receiver)) setReceiver(members[0]?.id);
  }, [members, receiver]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  usePika(canvasRef);

  const onClick = async () => {
    const socket = socketRef.current;
    const rtc = rtcRef.current;
    if (!socket || !rtc) return;
    if (!receiver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.hidden = false;
    // @ts-ignore
    const stream: MediaStream = canvas.captureStream();
    for (const track of stream.getTracks()) {
      rtc.addTrack(track, stream);
    }

    socket.emit("offer", receiver, await rtc.createOffer());
  };
  return (
    <Container>
      <Stack direction="column">
        <Box>
          あいて:
          <Select
            onChange={(e) => setReceiver(e.target.value)}
            value={receiver}
          >
            <option value="">選んで</option>
            {members.map(({ id }) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </Select>
        </Box>
        <Box>あなた: {socketRef.current?.id}</Box>
        <Box>signalingState: {signalingState}</Box>
        <Button onClick={() => onClick()}>push</Button>
        <canvas ref={canvasRef} hidden />
        <video ref={videoRef} controls autoPlay />
      </Stack>
    </Container>
  );
}

// ピカピカする
const usePika = (canvasRef: RefObject<HTMLCanvasElement>) => {
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rgb = [0, 0, 0].map(() => (Math.random() * 255) | 0);
      ctx.fillStyle = `rgb(${rgb.join(",")})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    draw();
    const t = setInterval(draw, 500);
    return () => {
      clearInterval(t);
    };
  });
};
