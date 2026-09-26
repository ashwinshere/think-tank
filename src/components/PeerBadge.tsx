import { PEERS, PeerId } from "@/lib/types";
import { PEER_STYLES } from "@/lib/peerStyles";

export function PeerBadge({
  peer,
  size = "md",
  showName = true,
}: {
  peer: PeerId;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}) {
  const style = PEER_STYLES[peer];
  const info = PEERS[peer];
  const dims =
    size === "sm" ? "w-6 h-6 text-[11px]" : size === "lg" ? "w-11 h-11 text-base" : "w-8 h-8 text-sm";

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`${dims} ${style.solidBg} rounded-full flex items-center justify-center text-white font-display font-semibold shrink-0`}
        aria-hidden
      >
        {style.initial}
      </span>
      {showName && (
        <span className={`font-semibold text-sm ${style.text}`}>{info.name}</span>
      )}
    </div>
  );
}
