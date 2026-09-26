import { Card, SectionHeader } from "./ui/Card";
import { PEERS, PeerId } from "@/lib/types";
import { PEER_STYLES } from "@/lib/peerStyles";
import { Compass, Swords, Search, Heart, Shuffle } from "lucide-react";

const ICONS: Record<PeerId, any> = {
  explorer: Compass,
  challenger: Swords,
  critic: Search,
  mentor: Heart,
  devils_advocate: Shuffle,
};

export function PeerTeam() {
  const order: PeerId[] = ["explorer", "challenger", "critic", "mentor", "devils_advocate"];
  return (
    <div className="max-w-5xl mx-auto">
      <SectionHeader
        eyebrow="Your Study Group"
        title="Meet the AI Peer Team"
        description="Five different thinking styles, one goal: help you reach the answer through your own reasoning instead of handing it to you."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {order.map((id) => {
          const info = PEERS[id];
          const style = PEER_STYLES[id];
          const Icon = ICONS[id];
          return (
            <Card key={id} className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl2 ${style.bg} flex items-center justify-center`}>
                  <Icon size={18} className={style.text} />
                </div>
                <div>
                  <p className="font-display font-semibold text-ink">{info.name}</p>
                  <p className={`text-xs font-medium ${style.text}`}>{info.tagline}</p>
                </div>
              </div>
              <p className="text-sm text-subink leading-relaxed">{info.description}</p>
            </Card>
          );
        })}
        <Card className="p-5 bg-paper border-dashed flex flex-col justify-center">
          <p className="font-display font-semibold text-ink mb-1.5">How they take turns</p>
          <p className="text-sm text-subink leading-relaxed">
            An Orchestrator layer reads the conversation and usage patterns to decide who speaks
            next — Explorer opens things up, Challenger and Critic pressure-test your thinking,
            Mentor steps in if you&apos;re stuck, and Devil&apos;s Advocate shows up when you take a position.
          </p>
        </Card>
      </div>
    </div>
  );
}
