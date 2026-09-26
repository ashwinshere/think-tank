import { PeerId } from "./types";

interface PeerStyle {
  text: string;
  bg: string;
  border: string;
  dot: string;
  solidBg: string;
  initial: string;
}

export const PEER_STYLES: Record<PeerId, PeerStyle> = {
  explorer: {
    text: "text-peer-explorer",
    bg: "bg-peer-explorerBg",
    border: "border-peer-explorer/25",
    dot: "bg-peer-explorer",
    solidBg: "bg-peer-explorer",
    initial: "E",
  },
  challenger: {
    text: "text-peer-challenger",
    bg: "bg-peer-challengerBg",
    border: "border-peer-challenger/25",
    dot: "bg-peer-challenger",
    solidBg: "bg-peer-challenger",
    initial: "C",
  },
  critic: {
    text: "text-peer-critic",
    bg: "bg-peer-criticBg",
    border: "border-peer-critic/25",
    dot: "bg-peer-critic",
    solidBg: "bg-peer-critic",
    initial: "C",
  },
  mentor: {
    text: "text-peer-mentor",
    bg: "bg-peer-mentorBg",
    border: "border-peer-mentor/25",
    dot: "bg-peer-mentor",
    solidBg: "bg-peer-mentor",
    initial: "M",
  },
  devils_advocate: {
    text: "text-peer-devil",
    bg: "bg-peer-devilBg",
    border: "border-peer-devil/25",
    dot: "bg-peer-devil",
    solidBg: "bg-peer-devil",
    initial: "D",
  },
};
