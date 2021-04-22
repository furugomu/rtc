import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
} from "@chakra-ui/accordion";
import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Box, Stack } from "@chakra-ui/layout";
import { Select } from "@chakra-ui/select";
import { Stat, StatGroup, StatLabel, StatNumber } from "@chakra-ui/stat";
import { chakra } from "@chakra-ui/system";
import { RefObject, useEffect, useRef, useState } from "react";
import Layout from "./Layout";
import { RTCSocket } from "./rtcsocket";

type Member = { id: string };

export default function Page() {
  const rtcRef = useRef<RTCSocket>();
  const [members, setMembers] = useState<Member[]>([]);
  const [receiver, setReceiver] = useState("");
  const [signalingState, setSignalingState] = useState("");
  const [connectionState, setConnectionState] = useState("");
  const [iceConnectionState, setIceConnectionState] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // rtc しょきか
  useEffect(() => {
    const rtc = new RTCSocket();
    (window as any).hoge = rtc;
    rtcRef.current = rtc;

    rtc.socket.on("members", (members: Member[]) => {
      const filtered = members.filter((member) => member.id !== rtc.id);
      setMembers(filtered);
    });

    rtc.on("track", (streams) => {
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = streams[0];
    });

    // 状態を表示する
    setSignalingState(rtc.signalingState);
    rtc.on("signalingStateChange", (state) => setSignalingState(state));

    setConnectionState(rtc.connectionState);
    rtc.on("connectionStateChange", (state) => setConnectionState(state));

    setIceConnectionState(rtc.iceConnectionState);
    rtc.on("iceConnectionStateChange", (state) => setIceConnectionState(state));

    return () => {
      rtc.socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!members.some(({ id }) => id === receiver)) setReceiver(members[0]?.id);
  }, [members, receiver]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  usePika(canvasRef);

  const onClick = async () => {
    const rtc = rtcRef.current;
    if (!rtc) return;
    if (!receiver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.hidden = false;
    // @ts-ignore
    const stream: MediaStream = canvas.captureStream();
    for (const track of stream.getTracks()) {
      rtc.addTrack(track, stream);
    }

    rtc.sendOffer(receiver);
  };
  return (
    <Layout>
      <Stack direction="column">
        <Stack direction="row">
          <FormControl>
            <FormLabel>送信する相手:</FormLabel>
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
          </FormControl>
        </Stack>
        <Box>あなた: {rtcRef.current?.id}</Box>
        <Button onClick={() => onClick()}>押す</Button>

        <StatGroup>
          <Stat>
            <StatLabel>connectionState</StatLabel>
            <StatNumber>{connectionState}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>iceConnectionState</StatLabel>
            <StatNumber>{iceConnectionState}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>signalingState</StatLabel>
            <StatNumber>{signalingState}</StatNumber>
          </Stat>
        </StatGroup>
        <Accordion allowMultiple defaultIndex={[1]}>
          <AccordionItem>
            <AccordionButton>
              <Box>送る動画</Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <canvas ref={canvasRef} />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionButton>
              <Box>送られた動画</Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <video ref={videoRef} controls autoPlay />
              <Box>(自動再生はできないので適宜再生して)</Box>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Stack>
    </Layout>
  );
}

// ピカピカする
const usePika = (canvasRef: RefObject<HTMLCanvasElement>) => {
  useEffect(() => {
    let hue = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      hue += 23;
      if (hue >= 360) hue = 0;
      // const rgb = [(color >> 16) & 255, (color >> 8) & 255, color & 255];
      // ctx.fillStyle = `rgb(${rgb.join(",")})`;
      ctx.fillStyle = `hsl(${hue}deg, 90%, 80%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    draw();
    const t = setInterval(draw, 500);
    return () => {
      clearInterval(t);
    };
  });
};
