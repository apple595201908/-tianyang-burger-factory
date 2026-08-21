import type { ReactNode } from "react";

export function WorkerArms({
  left,
  right,
  extra,
}: {
  left: string;
  right: string;
  extra?: ReactNode;
}) {
  return (
    <>
      <g className="arm-group arm-left">
        <path className="arm" d={left} />
        <circle className="hand" cx={-42} cy={14} r={8} />
      </g>
      <g className="arm-group arm-right">
        <path className="arm" d={right} />
        <circle className="hand" cx={42} cy={14} r={8} />
        {extra}
      </g>
    </>
  );
}

export function BunCrate() {
  return (
    <g className="station-prop bun-crate" transform="translate(-62 18)">
      <rect className="crate" x="-18" y="0" width="36" height="22" rx="4" />
      <rect className="crate-lid" x="-16" y="-8" width="32" height="10" rx="3" />
      <ellipse className="held-bottom-bun" cx="0" cy="-4" rx="12" ry="5" />
    </g>
  );
}

export function FillTray() {
  return (
    <g className="station-prop fill-tray" transform="translate(58 20)">
      <rect className="tray" x="-20" y="0" width="40" height="16" rx="6" />
      <path className="tray-bits" d="M-12 4Q-6-2 0 4Q6-2 12 4L10 10H-10Z" />
    </g>
  );
}

export function HeldBaseBun() {
  return (
    <g className="held-prop held-base-bun">
      <rect className="held-bottom-bun" x="28" y="-8" width="28" height="12" rx="6" />
    </g>
  );
}

export function HeldScoop() {
  return (
    <g className="held-prop held-scoop">
      <path className="scoop-bowl" d="M28-6H52L48 10H32Z" />
      <path className="scoop-lettuce" d="M32-8Q40-16 48-8L46 2H34Z" />
      <rect className="scoop-patty" x="32" y="-2" width="16" height="6" rx="2" />
      <path className="scoop-cheese" d="M32-4H48L44 2H34Z" />
    </g>
  );
}

export function HeldTopBun() {
  return (
    <g className="held-prop held-top-bun">
      <path className="held-bun-shape" d="M24-8Q32-28 44-30Q56-28 64-8Q56-2 44-2Q32-2 24-8Z" />
      <ellipse cx="36" cy="-18" rx="3" ry="1.4" fill="#fff0bd" />
      <ellipse cx="46" cy="-24" rx="3" ry="1.4" fill="#fff0bd" />
      <ellipse cx="54" cy="-16" rx="3" ry="1.4" fill="#fff0bd" />
    </g>
  );
}

export function PushStreaks() {
  return (
    <g className="push-streaks" transform="translate(-20 8)">
      <path d="M-70-8 H-28" />
      <path d="M-78 6 H-32" />
      <path d="M-64 18 H-24" />
    </g>
  );
}
