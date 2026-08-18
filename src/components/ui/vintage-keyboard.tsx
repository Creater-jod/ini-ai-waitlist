"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

interface KeyConfig {
  id: string;
  label: string;
  shiftLabel?: string;
  width?: number;
  muted?: boolean;
  align?: "left" | "center";
  small?: boolean;
}

type KeyRow = KeyConfig[];
type SoundCategory = "normal" | "spacebar" | "modifier";
type KeyTrigger = { press: () => void; release: () => void };

const ROWS: KeyRow[] = [
  [
    { id: "esc", label: "Esc", small: true, align: "left" },
    { id: "1", label: "1", shiftLabel: "!" },
    { id: "2", label: "2", shiftLabel: "@" },
    { id: "3", label: "3", shiftLabel: "#" },
    { id: "4", label: "4", shiftLabel: "$" },
    { id: "5", label: "5", shiftLabel: "%" },
    { id: "6", label: "6", shiftLabel: "^" },
    { id: "7", label: "7", shiftLabel: "&" },
    { id: "8", label: "8", shiftLabel: "*" },
    { id: "9", label: "9", shiftLabel: "(" },
    { id: "0", label: "0", shiftLabel: ")" },
    { id: "minus", label: "-", shiftLabel: "_" },
    { id: "equal", label: "=", shiftLabel: "+" },
    {
      id: "backspace",
      label: "Backspace",
      width: 2,
      small: true,
      align: "left",
    },
  ],
  [
    { id: "tab", label: "Tab", width: 1.5, align: "left", small: true },
    { id: "q", label: "Q" },
    { id: "w", label: "W" },
    { id: "e", label: "E" },
    { id: "r", label: "R" },
    { id: "t", label: "T" },
    { id: "y", label: "Y" },
    { id: "u", label: "U" },
    { id: "i", label: "I" },
    { id: "o", label: "O" },
    { id: "p", label: "P" },
    { id: "lbracket", label: "[", shiftLabel: "{" },
    { id: "rbracket", label: "]", shiftLabel: "}" },
    { id: "backslash", label: "\\", shiftLabel: "|", width: 1.5 },
  ],
  [
    { id: "caps", label: "CapsLock", width: 1.75, align: "left", small: true },
    { id: "a", label: "A" },
    { id: "s", label: "S" },
    { id: "d", label: "D" },
    { id: "f", label: "F" },
    { id: "g", label: "G" },
    { id: "h", label: "H" },
    { id: "j", label: "J" },
    { id: "k", label: "K" },
    { id: "l", label: "L" },
    { id: "semicolon", label: ";", shiftLabel: ":" },
    { id: "quote", label: "'", shiftLabel: '"' },
    { id: "enter", label: "Enter", width: 2.25, align: "left", small: true },
  ],
  [
    { id: "lshift", label: "Shift", width: 2.25, align: "left", small: true },
    { id: "z", label: "Z" },
    { id: "x", label: "X" },
    { id: "c", label: "C" },
    { id: "v", label: "V" },
    { id: "b", label: "B" },
    { id: "n", label: "N" },
    { id: "m", label: "M" },
    { id: "comma", label: ",", shiftLabel: "<" },
    { id: "period", label: ".", shiftLabel: ">" },
    { id: "slash", label: "/", shiftLabel: "?" },
    { id: "rshift", label: "Shift", width: 2.75, align: "left", small: true },
  ],
  [
    {
      id: "lctrl",
      label: "Ctrl",
      width: 1.25,
      small: true,
      muted: true,
      align: "left",
    },
    {
      id: "lwin",
      label: "Cmd",
      width: 1.25,
      small: true,
      muted: true,
      align: "left",
    },
    {
      id: "lalt",
      label: "Alt",
      width: 1.25,
      small: true,
      muted: true,
      align: "left",
    },
    { id: "space", label: "", width: 6.25 },
    {
      id: "ralt",
      label: "Alt",
      width: 1.25,
      small: true,
      muted: true,
      align: "left",
    },
    {
      id: "rwin",
      label: "Cmd",
      width: 1.25,
      small: true,
      muted: true,
      align: "left",
    },
    {
      id: "fn",
      label: "Fn",
      width: 1.25,
      small: true,
      muted: true,
      align: "left",
    },
  ],
];

const PAN_STRENGTH = 0.3;
const ROW_UNITS = 15;

const KEY_PAN: Record<string, number> = (() => {
  const pans: Record<string, number> = {};
  for (const row of ROWS) {
    let cursor = 0;
    for (const key of row) {
      const width = key.width ?? 1;
      const center = cursor + width / 2;
      pans[key.id] = ((center / ROW_UNITS) * 2 - 1) * PAN_STRENGTH;
      cursor += width;
    }
  }
  return pans;
})();

const ALL_KEYS_BY_ID: Record<string, KeyConfig> = (() => {
  const map: Record<string, KeyConfig> = {};
  for (const row of ROWS) {
    for (const key of row) {
      map[key.id] = key;
    }
  }
  return map;
})();

const MODIFIER_KEY_IDS = new Set([
  "esc",
  "tab",
  "caps",
  "enter",
  "backspace",
  "lshift",
  "rshift",
  "lctrl",
  "lwin",
  "lalt",
  "ralt",
  "rwin",
  "fn",
]);

function getSoundCategory(id: string): SoundCategory {
  if (id === "space") return "spacebar";
  if (MODIFIER_KEY_IDS.has(id)) return "modifier";
  return "normal";
}



function shiftLightness(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const adj = amount * 2.2;
  const rr = clamp(r + adj);
  const gg = clamp(g + adj);
  const bb = clamp(b + adj);
  return `rgb(${rr}, ${gg}, ${bb})`;
}

function hashKeyId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

interface KeyVariance {
  hueShift: number;
  lightnessShift: number;
  specularShiftX: number;
  specularShiftY: number;
  wearAngle: number;
  wearAmount: number;
  dust: boolean;
  dustX: number;
  dustY: number;
  microTilt: number;
  rimBias: number;
}

function getKeyVariance(id: string, small?: boolean): KeyVariance {
  const a = hashKeyId(id);
  const b = hashKeyId(id + "_b");
  const c = hashKeyId(id + "_c");
  const d = hashKeyId(id + "_d");
  const e = hashKeyId(id + "_e");
  return {
    hueShift: (a - 0.5) * 3,
    lightnessShift: (b - 0.5) * 4,
    specularShiftX: (c - 0.5) * 16,
    specularShiftY: (a * c - 0.5) * 12,
    wearAngle: b * 360,
    wearAmount: small ? 0.08 + c * 0.06 : 0.1 + d * 0.1,
    dust: false,
    dustX: 15 + c * 70,
    dustY: 15 + a * 70,
    microTilt: (e - 0.5) * 0.32,
    rimBias: 0.85 + e * 0.25,
  };
}

const CODE_TO_KEY_ID: Record<string, string> = {
  Escape: "esc",
  Digit1: "1",
  Digit2: "2",
  Digit3: "3",
  Digit4: "4",
  Digit5: "5",
  Digit6: "6",
  Digit7: "7",
  Digit8: "8",
  Digit9: "9",
  Digit0: "0",
  Minus: "minus",
  Equal: "equal",
  Backspace: "backspace",
  Tab: "tab",
  KeyQ: "q",
  KeyW: "w",
  KeyE: "e",
  KeyR: "r",
  KeyT: "t",
  KeyY: "y",
  KeyU: "u",
  KeyI: "i",
  KeyO: "o",
  KeyP: "p",
  BracketLeft: "lbracket",
  BracketRight: "rbracket",
  Backslash: "backslash",
  CapsLock: "caps",
  KeyA: "a",
  KeyS: "s",
  KeyD: "d",
  KeyF: "f",
  KeyG: "g",
  KeyH: "h",
  KeyJ: "j",
  KeyK: "k",
  KeyL: "l",
  Semicolon: "semicolon",
  Quote: "quote",
  Enter: "enter",
  ShiftLeft: "lshift",
  KeyZ: "z",
  KeyX: "x",
  KeyC: "c",
  KeyV: "v",
  KeyB: "b",
  KeyN: "n",
  KeyM: "m",
  Comma: "comma",
  Period: "period",
  Slash: "slash",
  ShiftRight: "rshift",
  ControlLeft: "lctrl",
  MetaLeft: "lwin",
  AltLeft: "lalt",
  Space: "space",
  AltRight: "ralt",
  MetaRight: "rwin",
};

const svgDataUri = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const WOOD_GRAIN_URI = svgDataUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='460' height='460'>
  <filter id='g'>
    <feTurbulence type='fractalNoise' baseFrequency='0.14 0.0032' numOctaves='6' seed='23' stitchTiles='stitch' result='n'/>
    <feColorMatrix in='n' type='matrix' values='0 0 0 0 0.27  0 0 0 0 0.15  0 0 0 0 0.065  0 0 0 1.0 0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#g)'/>
</svg>`);

const WOOD_GRAIN_FINE_URI = svgDataUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
  <filter id='gf'>
    <feTurbulence type='fractalNoise' baseFrequency='0.28 0.01' numOctaves='4' seed='71' stitchTiles='stitch' result='n'/>
    <feColorMatrix in='n' type='matrix' values='0 0 0 0 0.35  0 0 0 0 0.21  0 0 0 0 0.1  0 0 0 0.55 0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#gf)'/>
</svg>`);

const WOOD_TONE_URI = svgDataUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='520' height='520'>
  <filter id='t'>
    <feTurbulence type='fractalNoise' baseFrequency='0.0045' numOctaves='2' seed='11' result='n'/>
    <feColorMatrix in='n' type='matrix' values='0 0 0 0 0.22  0 0 0 0 0.115  0 0 0 0 0.045  0 0 0 0.5 0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#t)'/>
</svg>`);

const PBT_NOISE_URI = svgDataUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='4' result='t'/>
    <feColorMatrix in='t' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.045 0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#n)'/>
</svg>`);

const END_GRAIN_URI = svgDataUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
  <filter id='e'>
    <feTurbulence type='turbulence' baseFrequency='0.24' numOctaves='3' seed='2' result='t'/>
    <feColorMatrix in='t' type='matrix' values='0 0 0 0 0.12  0 0 0 0 0.07  0 0 0 0 0.026  0 0 0 0.55 0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#e)'/>
</svg>`);

const WOOD_PORE_URI = svgDataUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'>
  <filter id='p'>
    <feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' seed='31' result='t'/>
    <feColorMatrix in='t' type='matrix' values='0 0 0 0 0.05  0 0 0 0 0.025  0 0 0 0 0.008  0 0 0 0.075 0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#p)'/>
</svg>`);

const WOOD_MICROSCRATCH_URI = svgDataUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='620' height='420'>
  <defs>
    <filter id='s'>
      <feTurbulence type='fractalNoise' baseFrequency='0.012 0.09' numOctaves='2' seed='58' result='n'/>
      <feColorMatrix in='n' type='matrix' values='0 0 0 0 1  0 0 0 0 0.97  0 0 0 0 0.9  0 0 0 0.035 0'/>
    </filter>
  </defs>
  <rect width='100%' height='100%' filter='url(#s)'/>
</svg>`);

const WOOD_DENT_URI = svgDataUri(`
<svg xmlns='http://www.w3.org/2000/svg' width='700' height='500'>
  <defs>
    <radialGradient id='d1' cx='50%' cy='40%' r='60%'>
      <stop offset='0%' stop-color='#000' stop-opacity='0.13'/>
      <stop offset='55%' stop-color='#000' stop-opacity='0.04'/>
      <stop offset='100%' stop-color='#000' stop-opacity='0'/>
    </radialGradient>
    <radialGradient id='d2' cx='50%' cy='40%' r='60%'>
      <stop offset='0%' stop-color='#fff' stop-opacity='0.18'/>
      <stop offset='100%' stop-color='#fff' stop-opacity='0'/>
    </radialGradient>
  </defs>
  <ellipse cx='118' cy='72' rx='4.5' ry='2.1' fill='url(#d1)'/>
  <ellipse cx='120' cy='70' rx='1.6' ry='0.7' fill='url(#d2)'/>
  <ellipse cx='562' cy='410' rx='5.5' ry='2.5' fill='url(#d1)' transform='rotate(18 562 410)'/>
  <ellipse cx='564' cy='407' rx='1.9' ry='0.8' fill='url(#d2)' transform='rotate(18 564 407)'/>
  <ellipse cx='612' cy='58' rx='3.2' ry='1.4' fill='url(#d1)'/>
  <ellipse cx='34' cy='330' rx='2.7' ry='1.2' fill='url(#d1)'/>
</svg>`);

import {
  keyboardAudio,
  type SwitchProfileId,
} from "@/lib/keyboard-sound-engine";


const KEYCAP_BASE = "#DFD2C3";
const LEGEND_INK = "#413e38";
const LEGEND_INK_SOFT = "#726d64";

type DeviceTier = "mobile" | "tablet" | "desktop";

const MOBILE_BREAKPOINT = "(max-width: 639px)";
const TABLET_BREAKPOINT = "(max-width: 1023px)";

function resolveTier(): DeviceTier {
  if (typeof window === "undefined") return "desktop";
  if (window.matchMedia(MOBILE_BREAKPOINT).matches) return "mobile";
  if (window.matchMedia(TABLET_BREAKPOINT).matches) return "tablet";
  return "desktop";
}

function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>("desktop");

  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_BREAKPOINT);
    const tabletQuery = window.matchMedia(TABLET_BREAKPOINT);
    const update = () => setTier(resolveTier());
    update();
    mobileQuery.addEventListener("change", update);
    tabletQuery.addEventListener("change", update);
    return () => {
      mobileQuery.removeEventListener("change", update);
      tabletQuery.removeEventListener("change", update);
    };
  }, []);

  return tier;
}

const RADIUS_TIERS: Record<DeviceTier, { wall: number; top: number }> = {
  desktop: { wall: 8, top: 6.5 },
  tablet: { wall: 7, top: 5.5 },
  mobile: { wall: 5.5, top: 4 },
};

const NOISE_OPACITY_TIERS: Record<DeviceTier, { wall: number; top: number }> = {
  desktop: { wall: 0.05, top: 0.06 },
  tablet: { wall: 0.05, top: 0.06 },
  mobile: { wall: 0.045, top: 0.05 },
};

const NOISE_SIZE_TIERS: Record<DeviceTier, { wall: number; top: number }> = {
  desktop: { wall: 90, top: 40 },
  tablet: { wall: 68, top: 30 },
  mobile: { wall: 48, top: 22 },
};

interface RowSculpt {
  insetTop: number;
  insetSide: number;
  insetBottom: number;
}

const ROW_SCULPT_TIERS: Record<DeviceTier, RowSculpt[]> = {
  desktop: [
    { insetTop: 4, insetSide: 4.5, insetBottom: 11 },
    { insetTop: 4, insetSide: 4.5, insetBottom: 9.5 },
    { insetTop: 4, insetSide: 4.5, insetBottom: 8.5 },
    { insetTop: 4, insetSide: 4.5, insetBottom: 9 },
    { insetTop: 3.5, insetSide: 4, insetBottom: 7 },
  ],
  tablet: [
    { insetTop: 3.2, insetSide: 3.6, insetBottom: 8.8 },
    { insetTop: 3.2, insetSide: 3.6, insetBottom: 7.6 },
    { insetTop: 3.2, insetSide: 3.6, insetBottom: 6.8 },
    { insetTop: 3.2, insetSide: 3.6, insetBottom: 7.2 },
    { insetTop: 2.8, insetSide: 3.2, insetBottom: 5.6 },
  ],
  mobile: [
    { insetTop: 2.2, insetSide: 2.4, insetBottom: 5.8 },
    { insetTop: 2.2, insetSide: 2.4, insetBottom: 5 },
    { insetTop: 2.2, insetSide: 2.4, insetBottom: 4.4 },
    { insetTop: 2.2, insetSide: 2.4, insetBottom: 4.7 },
    { insetTop: 2, insetSide: 2.2, insetBottom: 3.6 },
  ],
};

const LEGEND_SHARED = {
  shiftTopOffset: "13%",
  shiftLeftOffset: "18%",
  primaryBottomOffset: "14.5%",
  primaryLeftOffset: "0.85em",

  opticalCenterShift: "1.4%",
  shiftOpacity: 0.66,
  primaryOpacity: 0.96,
} as const;

const LEGEND_FONT_TIERS: Record<
  DeviceTier,
  { shift: string; normal: string; small: string }
> = {
  desktop: {
    shift: "clamp(0.46rem, 0.74vw, 0.58rem)",
    normal: "clamp(0.74rem, 1.38vw, 0.95rem)",
    small: "clamp(0.56rem, 1.02vw, 0.7rem)",
  },
  tablet: {
    shift: "clamp(0.48rem, 1.12vw, 0.58rem)",
    normal: "clamp(0.7rem, 2.05vw, 0.86rem)",
    small: "clamp(0.55rem, 1.58vw, 0.68rem)",
  },
  mobile: {
    shift: "clamp(0.43rem, 2.05vw, 0.51rem)",
    normal: "clamp(0.62rem, 3.65vw, 0.78rem)",
    small: "clamp(0.51rem, 2.85vw, 0.63rem)",
  },
};

const CONTACT_SHADOW_TIERS: Record<DeviceTier, string> = {
  desktop:
    "0 0.5px 0.5px rgba(12,8,4,0.14), 0 2px 3px rgba(12,8,4,0.1), 0 5px 9px rgba(12,8,4,0.07), 0 10px 16px rgba(12,8,4,0.045)",

  tablet:
    "0 0.4px 0.4px rgba(12,8,4,0.14), 0 1.5px 2.2px rgba(12,8,4,0.1), 0 3.5px 6px rgba(12,8,4,0.07), 0 6.5px 10px rgba(12,8,4,0.04)",
  mobile:
    "0 0.3px 0.3px rgba(12,8,4,0.13), 0 1px 1.6px rgba(12,8,4,0.1), 0 2.2px 4px rgba(12,8,4,0.06)",
};

const KEY_HEIGHT_TIERS: Record<DeviceTier, string> = {
  desktop: "clamp(2.15rem, min(4.15vw, 7.5vh), 2.95rem)",
  tablet: "clamp(1.95rem, min(5.4vw, 7vh), 2.6rem)",
  mobile: "clamp(1.75rem, min(8vw, 6vh), 2.2rem)",
};

const KEY_GAP_TIERS: Record<DeviceTier, string> = {
  desktop: "3px",
  tablet: "2.5px",
  mobile: "2px",
};

const CONTAINER_TIERS: Record<
  DeviceTier,
  { padding: string; maxWidth: string }
> = {
  desktop: { padding: "0 clamp(0.5rem, 2vw, 1rem)", maxWidth: "48rem" },
  tablet: { padding: "0 clamp(0.4rem, 1.5vw, 0.8rem)", maxWidth: "38rem" },
  mobile: { padding: "0 clamp(0.3rem, 1.2vw, 0.6rem)", maxWidth: "26rem" },
};

const CASE_TIERS: Record<
  DeviceTier,
  {
    caseRadius: string;
    bezelRadius: string;
    casePadding: string;
    bezelPadding: string;
  }
> = {
  desktop: {
    caseRadius: "0.32rem",
    bezelRadius: "0.24rem",
    casePadding: "1.15% 1.3%",
    bezelPadding: "0.28%",
  },
  tablet: {
    caseRadius: "0.3rem",
    bezelRadius: "0.22rem",
    casePadding: "1.3% 1.5%",
    bezelPadding: "0.32%",
  },
  mobile: {
    caseRadius: "0.26rem",
    bezelRadius: "0.2rem",
    casePadding: "1.6% 1.9%",
    bezelPadding: "0.4%",
  },
};

const MOBILE_LABEL_OVERRIDES: Record<string, string> = {
  backspace: "",
  caps: "Caps",
};

const KEY_STYLE_TAG = `
.kb-key {
  --tilt: 0deg;
  will-change: transform;
  contain: layout style paint;
  backface-visibility: hidden;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  transform: translateY(0) scale(1) rotate(var(--tilt));
  transition: transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.kb-key[data-pressed="true"] {
  transform: translateY(4.5px) scale(0.975) rotate(calc(var(--tilt) * 0.3));
  transition: transform 15ms linear;
}

.kb-viewport {
  min-height: 100vh;
  min-height: 100dvh;
}
`;

const MIN_VISIBLE_PRESS_MS = 55;

function usePressState(): [boolean, () => void, () => void] {
  const [pressed, setPressed] = useState(false);
  const pressedAtRef = useRef(0);
  const releaseTimeoutRef = useRef<number | null>(null);

  const clearPendingRelease = useCallback(() => {
    if (releaseTimeoutRef.current !== null) {
      window.clearTimeout(releaseTimeoutRef.current);
      releaseTimeoutRef.current = null;
    }
  }, []);

  const press = useCallback(() => {
    clearPendingRelease();
    pressedAtRef.current = performance.now();
    setPressed(true);
  }, [clearPendingRelease]);

  const release = useCallback(() => {
    const elapsed = performance.now() - pressedAtRef.current;
    const remaining = MIN_VISIBLE_PRESS_MS - elapsed;
    if (remaining > 0) {
      clearPendingRelease();
      releaseTimeoutRef.current = window.setTimeout(() => {
        releaseTimeoutRef.current = null;
        setPressed(false);
      }, remaining);
    } else {
      setPressed(false);
    }
  }, [clearPendingRelease]);

  useEffect(() => clearPendingRelease, [clearPendingRelease]);

  return [pressed, press, release];
}

const Key = memo(function Key({
  config,
  rowIndex,
  tier,
  registerTrigger,
  onActivate,
  onDeactivate,
}: {
  config: KeyConfig;
  rowIndex: number;
  tier: DeviceTier;
  registerTrigger: (id: string, trigger: KeyTrigger) => () => void;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
}) {
  const {
    id,
    label,
    shiftLabel,
    width = 1,
    align = "center",
    small,
    muted,
  } = config;
  const [pointerPressed, pressPointer, releasePointer] = usePressState();
  const [physicallyPressed, pressPhysical, releasePhysical] = usePressState();
  const sculptRows = ROW_SCULPT_TIERS[tier];
  const sculpt = sculptRows[rowIndex] ?? sculptRows[1];
  const radius = RADIUS_TIERS[tier];
  const noiseOpacity = NOISE_OPACITY_TIERS[tier];
  const noiseSize = NOISE_SIZE_TIERS[tier];
  const legendFont = LEGEND_FONT_TIERS[tier];
  const contactShadow = CONTACT_SHADOW_TIERS[tier];
  const keyHeight = KEY_HEIGHT_TIERS[tier];
  const displayLabel =
    tier === "mobile" ? (MOBILE_LABEL_OVERRIDES[id] ?? label) : label;
  const pressed = pointerPressed || physicallyPressed;
  const variance = useMemo(() => getKeyVariance(id, small), [id, small]);

  const primaryAlign: "left" | "center" = align;

  useEffect(() => {
    return registerTrigger(id, {
      press: pressPhysical,
      release: releasePhysical,
    });
  }, [id, registerTrigger, pressPhysical, releasePhysical]);

  const layers = useMemo(() => {
    const insetTRBL = `${sculpt.insetTop}px ${sculpt.insetSide}px ${sculpt.insetBottom}px ${sculpt.insetSide}px`;
    return {
      insetTRBL,

      wallGradient: `linear-gradient(180deg, ${shiftLightness(
        "#f0e4d1",
        variance.lightnessShift,
      )} 0%, ${shiftLightness(
        "#e0cead",
        variance.lightnessShift,
      )} 18%, ${shiftLightness("#c8b394", variance.lightnessShift)} 46%, ${shiftLightness(
        "#a68e70",
        variance.lightnessShift * 0.7,
      )} 78%, ${shiftLightness("#8c7458", variance.lightnessShift * 0.5)} 100%)`,
      wallFilter: `hue-rotate(${variance.hueShift}deg)`,
      wallNoisePosition: `${variance.specularShiftX}px ${variance.specularShiftY}px`,

      wallShadow: `inset 0 1px 0 rgba(255,255,255,0.4), inset 0.6px 0.4px 0 rgba(255,255,255,0.14), inset 0 -1.5px 2px rgba(15,9,4,0.16), inset 0 0 0 0.5px rgba(15,9,4,0.06)`,

      topGradient: `radial-gradient(115% 125% at ${23 + variance.specularShiftX * 0.4}% 9%, rgba(255,255,255,${
        0.4 - variance.wearAmount * 0.06
      }), rgba(255,255,255,0) 44%), radial-gradient(150% 120% at 50% 118%, rgba(15,9,4,${
        0.07 + variance.wearAmount * 0.02
      }), transparent 60%), ${shiftLightness(KEYCAP_BASE, variance.lightnessShift * 0.6)}`,
      topFilter: `hue-rotate(${variance.hueShift * 0.4}deg)`,
      topNoisePosition: `${variance.specularShiftY}px ${variance.specularShiftX}px`,
      topShadow: `inset 0 0 0 0.75px rgba(96,70,42,0.28), inset 0 0.6px 0 rgba(255,250,238,0.4), inset 0 -0.8px 1.2px rgba(15,9,4,0.04)`,
      topShadowPressed: `inset 0 0 0 0.75px rgba(96,70,42,0.34), inset 0 0.5px 0 rgba(255,250,238,0.22), inset 0 1px 2px rgba(15,10,5,0.1)`,
      rimOpacityUp: 0.55 * variance.rimBias,
      rimOpacityDown: 0.22 * variance.rimBias,
    };
  }, [sculpt, variance]);

  const isPointerDownRef = useRef(false);

  const handlePress = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      isPointerDownRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      pressPointer();
      onActivate(id);
      keyboardAudio.playKeyDown(getSoundCategory(id), KEY_PAN[id] ?? 0, !!muted);
    },
    [id, muted, pressPointer, onActivate],
  );

  const handleRelease = useCallback(() => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    releasePointer();
    onDeactivate(id);
    keyboardAudio.playKeyUp(getSoundCategory(id), KEY_PAN[id] ?? 0, !!muted);
  }, [releasePointer, onDeactivate, id, muted]);

  const handlePointerEnter = useCallback(() => {
    if (!isPointerDownRef.current) {
      keyboardAudio.playKeyHover(KEY_PAN[id] ?? 0);
    }
  }, [id]);

  return (
    <button
      type="button"
      aria-label={label || "Space"}
      data-pressed={pressed}
      onPointerDown={handlePress}
      onPointerUp={handleRelease}
      onPointerCancel={handleRelease}
      onPointerLeave={handleRelease}
      onPointerEnter={handlePointerEnter}
      style={
        {
          flexGrow: width,
          flexBasis: 0,

          minWidth: 0,
          height: keyHeight,
          "--tilt": `${variance.microTilt}deg`,
        } as CSSProperties
      }
      className="kb-key relative select-none outline-none"
    >
      {}
      <span
        className="pointer-events-none absolute"
        style={{
          inset: 0,
          borderRadius: radius.wall,
          boxShadow: pressed
            ? "0 0.5px 1px rgba(15,9,4,0.2), 0 2px 4px rgba(15,9,4,0.12)"
            : contactShadow,
          transition: "box-shadow 140ms ease-out",
          zIndex: 0,
        }}
      />
      {}
      <span
        className="absolute inset-0"
        style={{
          borderRadius: radius.wall,
          background: layers.wallGradient,
          filter: layers.wallFilter,
          boxShadow: layers.wallShadow,
          zIndex: 1,
        }}
      />
      <span
        className="pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{
          borderRadius: radius.wall,
          backgroundImage: `url("${PBT_NOISE_URI}")`,
          backgroundSize: `${noiseSize.wall}px ${noiseSize.wall}px`,
          backgroundPosition: layers.wallNoisePosition,
          opacity: noiseOpacity.wall,
          zIndex: 1,
        }}
      />
      {}
      <span
        className="absolute"
        style={{
          borderRadius: radius.top,
          inset: layers.insetTRBL,
          background: layers.topGradient,
          filter: layers.topFilter,
          boxShadow: pressed ? layers.topShadowPressed : layers.topShadow,
          transition: "box-shadow 140ms ease-out, background 140ms ease-out",
          zIndex: 3,
        }}
      />
      <span
        className="pointer-events-none absolute mix-blend-overlay"
        style={{
          borderRadius: radius.top,
          inset: layers.insetTRBL,
          backgroundImage: `url("${PBT_NOISE_URI}")`,
          backgroundSize: `${noiseSize.top}px ${noiseSize.top}px`,
          backgroundPosition: layers.topNoisePosition,
          opacity: noiseOpacity.top,
          zIndex: 3,
        }}
      />
      {}
      <span
        className="pointer-events-none absolute"
        style={{
          borderRadius: radius.top,
          inset: layers.insetTRBL,
          background:
            "radial-gradient(55% 50% at 26% 18%, rgba(255,252,244,0.28), transparent 70%)",
          opacity: pressed ? 0.4 : 1,
          transition: "opacity 140ms ease-out",
          zIndex: 4,
        }}
      />
      {}
      <span
        className="pointer-events-none absolute"
        style={{
          borderRadius: radius.top,
          inset: layers.insetTRBL,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, transparent 14%), linear-gradient(100deg, rgba(255,255,255,0.09) 0%, transparent 9%)",
          opacity: pressed ? layers.rimOpacityDown : layers.rimOpacityUp,
          transition: "opacity 140ms ease-out",
          zIndex: 4,
        }}
      />
      <span
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 5 }}
      >
        {shiftLabel && (
          <span
            className="absolute font-medium leading-none"
            style={{
              top: `calc(${sculpt.insetTop}px + ${LEGEND_SHARED.shiftTopOffset})`,
              left: LEGEND_SHARED.shiftLeftOffset,
              fontSize: legendFont.shift,
              color: LEGEND_INK_SOFT,
              opacity: LEGEND_SHARED.shiftOpacity,
              letterSpacing: "0.01em",

              textShadow:
                "0 0.4px 0 rgba(255,255,255,0.32), 0 0 0.3px rgba(35,28,18,0.3)",
            }}
          >
            {shiftLabel}
          </span>
        )}
        {label && (
          <span
            className={`absolute leading-none ${
              small ? "font-semibold" : "font-bold"
            } ${primaryAlign === "left" ? "text-left" : "text-center"}`}
            style={{
              bottom: `calc(${sculpt.insetBottom}px + ${LEGEND_SHARED.primaryBottomOffset})`,
              left:
                primaryAlign === "left"
                  ? LEGEND_SHARED.primaryLeftOffset
                  : shiftLabel
                    ? `calc(50% - ${LEGEND_SHARED.opticalCenterShift})`
                    : "50%",
              transform:
                primaryAlign === "left" ? undefined : "translateX(-50%)",
              fontSize: small ? legendFont.small : legendFont.normal,
              color: LEGEND_INK,
              opacity: LEGEND_SHARED.primaryOpacity,
              letterSpacing: small ? "0.015em" : "-0.01em",
              textShadow:
                "0 0.4px 0 rgba(255,255,255,0.28), 0 0 0.35px rgba(30,24,16,0.35)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "clip",
              maxWidth: "100%",
            }}
          >
            {displayLabel}
          </span>
        )}
      </span>
    </button>
  );
});

const MODIFIER_FAMILIES: Array<{ modifier: string; ids: string[] }> = [
  { modifier: "Alt", ids: ["lalt", "ralt"] },
  { modifier: "Control", ids: ["lctrl"] },
  { modifier: "Shift", ids: ["lshift", "rshift"] },
  { modifier: "Meta", ids: ["lwin", "rwin"] },
];

const KEY_CHAR_MAP: Record<
  string,
  { normal: string; shift?: string; action?: "backspace" | "enter" | "tab" | "space" }
> = {
  "1": { normal: "1", shift: "!" },
  "2": { normal: "2", shift: "@" },
  "3": { normal: "3", shift: "#" },
  "4": { normal: "4", shift: "$" },
  "5": { normal: "5", shift: "%" },
  "6": { normal: "6", shift: "^" },
  "7": { normal: "7", shift: "&" },
  "8": { normal: "8", shift: "*" },
  "9": { normal: "9", shift: "(" },
  "0": { normal: "0", shift: ")" },
  minus: { normal: "-", shift: "_" },
  equal: { normal: "=", shift: "+" },
  backspace: { normal: "", action: "backspace" },
  tab: { normal: "  ", action: "tab" },
  q: { normal: "q", shift: "Q" },
  w: { normal: "w", shift: "W" },
  e: { normal: "e", shift: "E" },
  r: { normal: "r", shift: "R" },
  t: { normal: "t", shift: "T" },
  y: { normal: "y", shift: "Y" },
  u: { normal: "u", shift: "U" },
  i: { normal: "i", shift: "I" },
  o: { normal: "o", shift: "O" },
  p: { normal: "p", shift: "P" },
  lbracket: { normal: "[", shift: "{" },
  rbracket: { normal: "]", shift: "}" },
  backslash: { normal: "\\", shift: "|" },
  a: { normal: "a", shift: "A" },
  s: { normal: "s", shift: "S" },
  d: { normal: "d", shift: "D" },
  f: { normal: "f", shift: "F" },
  g: { normal: "g", shift: "G" },
  h: { normal: "h", shift: "H" },
  j: { normal: "j", shift: "J" },
  k: { normal: "k", shift: "K" },
  l: { normal: "l", shift: "L" },
  semicolon: { normal: ";", shift: ":" },
  quote: { normal: "'", shift: '"' },
  enter: { normal: "", action: "enter" },
  z: { normal: "z", shift: "Z" },
  x: { normal: "x", shift: "X" },
  c: { normal: "c", shift: "C" },
  v: { normal: "v", shift: "V" },
  b: { normal: "b", shift: "B" },
  n: { normal: "n", shift: "N" },
  m: { normal: "m", shift: "M" },
  comma: { normal: ",", shift: "<" },
  period: { normal: ".", shift: ">" },
  slash: { normal: "/", shift: "?" },
  space: { normal: " ", action: "space" },
};

export interface VintageKeyboardProps {
  onKeyInput?: (char: string, action?: "char" | "backspace" | "enter" | "tab" | "space" | "clear") => void;
  className?: string;
  soundProfile?: SwitchProfileId;
  volume?: number;
  isMuted?: boolean;
}

export const Component = ({
  onKeyInput,
  className = "",
  soundProfile,
  volume,
  isMuted,
}: VintageKeyboardProps = {}) => {
  const rows = useMemo(() => ROWS, []);
  const keyTriggersRef = useRef<Record<string, KeyTrigger>>({});
  const tier = useDeviceTier();
  const container = CONTAINER_TIERS[tier];
  const caseTier = CASE_TIERS[tier];
  const gap = KEY_GAP_TIERS[tier];
  const onKeyInputRef = useRef(onKeyInput);

  useEffect(() => {
    if (soundProfile) keyboardAudio.setProfile(soundProfile);
  }, [soundProfile]);

  useEffect(() => {
    if (typeof volume === "number") keyboardAudio.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (typeof isMuted === "boolean") keyboardAudio.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    onKeyInputRef.current = onKeyInput;
  }, [onKeyInput]);

  const registerTrigger = useCallback((id: string, trigger: KeyTrigger) => {
    keyTriggersRef.current[id] = trigger;
    return () => {
      if (keyTriggersRef.current[id] === trigger)
        delete keyTriggersRef.current[id];
    };
  }, []);

  const activeKeyIdsRef = useRef<Set<string>>(new Set());

  const triggerKeyInput = useCallback((id: string, isShift: boolean) => {
    if (!onKeyInputRef.current) return;
    const mapping = KEY_CHAR_MAP[id];
    if (mapping) {
      if (mapping.action) {
        onKeyInputRef.current(mapping.normal, mapping.action);
      } else {
        const char = isShift && mapping.shift ? mapping.shift : mapping.normal;
        onKeyInputRef.current(char, "char");
      }
    }
  }, []);

  const activateKey = useCallback((id: string) => {
    const isShift = activeKeyIdsRef.current.has("lshift") || activeKeyIdsRef.current.has("rshift");
    triggerKeyInput(id, isShift);
    activeKeyIdsRef.current.add(id);
  }, [triggerKeyInput]);

  const deactivateKey = useCallback((id: string) => {
    activeKeyIdsRef.current.delete(id);
  }, []);

  useEffect(() => {
    const held = new Set<string>();

    const isTypingTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return tag === "input" || tag === "textarea" || el.isContentEditable;
    };

    const releaseKey = (id: string) => {
      if (!held.has(id)) return;
      held.delete(id);
      keyTriggersRef.current[id]?.release();
      deactivateKey(id);
      const config = ALL_KEYS_BY_ID[id];
      keyboardAudio.playKeyUp(getSoundCategory(id), KEY_PAN[id] ?? 0, !!config?.muted);
    };

    const releaseAllHeld = () => {
      held.forEach((id) => {
        keyTriggersRef.current[id]?.release();
        deactivateKey(id);
        const config = ALL_KEYS_BY_ID[id];
        keyboardAudio.playKeyUp(getSoundCategory(id), KEY_PAN[id] ?? 0, !!config?.muted);
      });
      held.clear();
    };

    const reconcileModifiers = (event: KeyboardEvent) => {
      if (typeof event.getModifierState !== "function") return;
      for (const { modifier, ids } of MODIFIER_FAMILIES) {
        if (!event.getModifierState(modifier)) {
          for (const id of ids) releaseKey(id);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      reconcileModifiers(event);

      if (event.code === "AltLeft" || event.code === "AltRight") {
        event.preventDefault();
      }

      const id = CODE_TO_KEY_ID[event.code];
      const isTarget = isTypingTarget(event.target);

      // If user is typing in an input, still animate the key & sound, but let browser handle native input char
      if (isTarget) {
        if (id && !held.has(id)) {
          held.add(id);
          keyTriggersRef.current[id]?.press();
          const config = ALL_KEYS_BY_ID[id];
          keyboardAudio.playKeyDown(getSoundCategory(id), KEY_PAN[id] ?? 0, !!config?.muted);
          activeKeyIdsRef.current.add(id);
        }
        return;
      }

      if (event.repeat) return;

      if (!id || held.has(id)) return;

      held.add(id);
      keyTriggersRef.current[id]?.press();
      activateKey(id);

      const config = ALL_KEYS_BY_ID[id];
      keyboardAudio.playKeyDown(getSoundCategory(id), KEY_PAN[id] ?? 0, !!config?.muted);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      reconcileModifiers(event);

      const id = CODE_TO_KEY_ID[event.code];
      if (!id) return;
      releaseKey(id);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) releaseAllHeld();
    };

    const handleFocus = () => releaseAllHeld();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", releaseAllHeld);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", releaseAllHeld);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activateKey, deactivateKey]);

  return (
    <div
      className={`kb-viewport flex w-full items-center justify-center overflow-x-hidden bg-transparent ${className}`}
      style={{
        padding: container.padding,
      }}
    >
      <style>{KEY_STYLE_TAG}</style>
      <div
        className="flex flex-col items-center"
        style={{ width: "100%", maxWidth: container.maxWidth }}
      >
        <div
          style={{
            perspective: "1800px",
            width: "100%",
          }}
        >
          <div
            className="relative w-full"
            style={{ transform: "rotateX(7deg)", transformOrigin: "50% 100%" }}
          >
            <div
              className="absolute inset-x-[16%] top-[99%] -z-10 h-1 rounded-full blur-[1.5px]"
              style={{ background: "rgba(15,10,6,0.2)" }}
            />
            <div
              className="absolute -inset-x-2 top-14 bottom-0 -z-10 rounded-3xl blur-lg"
              style={{
                background:
                  "radial-gradient(55% 70% at 50% 82%, rgba(15,10,6,0.06), transparent 72%)",
              }}
            />
            <div
              className="relative rounded-(--kb-case-radius)"
              style={
                {
                  padding: caseTier.casePadding,
                  background: `
                linear-gradient(180deg, rgba(255,255,255,0.045) 0%, transparent 9%),
                repeating-linear-gradient(180deg, rgba(70,42,16,0.08) 0px, transparent 2px, transparent 6px, rgba(70,42,16,0.055) 8px, transparent 13px),
                linear-gradient(178deg, #ad7440 0%, #9d6636 26%, #895128 55%, #764a24 78%, #63391a 100%)
              `,

                  boxShadow:
                    "0 0.5px 0 rgba(255,222,185,0.18) inset, 0 -2px 4.5px rgba(35,19,6,0.32) inset, 0.4px 0.4px 0.8px rgba(255,232,200,0.14) inset, 0 3px 6px rgba(15,8,3,0.22), 0 1px 2px rgba(15,8,3,0.2)",
                  "--kb-case-radius": caseTier.caseRadius,
                  "--kb-bezel-radius": caseTier.bezelRadius,
                } as CSSProperties
              }
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-(--kb-case-radius) mix-blend-multiply"
                style={{
                  backgroundImage: `url("${WOOD_TONE_URI}")`,
                  backgroundSize: "520px 520px",
                  opacity: 0.46,
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-(--kb-case-radius) mix-blend-multiply"
                style={{
                  backgroundImage: `url("${WOOD_GRAIN_URI}")`,
                  backgroundSize: "460px 460px",
                  opacity: 0.5,
                }}
              />

              <div
                className="pointer-events-none absolute inset-0 rounded-(--kb-case-radius) mix-blend-multiply"
                style={{
                  backgroundImage: `url("${WOOD_GRAIN_FINE_URI}")`,
                  backgroundSize: "300px 300px",
                  backgroundPosition: "23px 11px",
                  opacity: 0.24,
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-(--kb-case-radius) mix-blend-overlay"
                style={{
                  background:
                    "repeating-linear-gradient(179deg, rgba(255,228,192,0.065) 0px, transparent 3px, transparent 17px, rgba(45,23,7,0.1) 20px, transparent 29px), repeating-linear-gradient(183deg, rgba(255,228,192,0.032) 0px, transparent 7px, transparent 41px, rgba(45,23,7,0.055) 44px, transparent 59px)",
                  opacity: 0.58,
                }}
              />

              <div
                className="pointer-events-none absolute inset-0 rounded-(--kb-case-radius) mix-blend-multiply"
                style={{
                  backgroundImage: `url("${WOOD_PORE_URI}")`,
                  backgroundSize: "130px 130px",
                  opacity: 0.34,
                }}
              />

              <div
                className="pointer-events-none absolute inset-0 rounded-(--kb-case-radius) mix-blend-screen"
                style={{
                  backgroundImage: `url("${WOOD_MICROSCRATCH_URI}")`,
                  backgroundSize: "620px 420px",
                  opacity: 0.5,
                }}
              />

              <div
                className="pointer-events-none absolute inset-0 rounded-(--kb-case-radius)"
                style={{
                  backgroundImage: `url("${WOOD_DENT_URI}")`,
                  backgroundSize: "100% 100%",
                  opacity: 0.28,
                }}
              />

              <div
                className="pointer-events-none absolute inset-0 rounded-(--kb-case-radius)"
                style={{
                  background:
                    "linear-gradient(112deg, transparent 30%, rgba(255,244,222,0.06) 44%, rgba(255,244,222,0.1) 49%, rgba(255,244,222,0.05) 54%, transparent 68%)",
                  mixBlendMode: "screen",
                }}
              />
              <div
                className="pointer-events-none absolute rounded-tl-(--kb-case-radius) mix-blend-multiply"
                style={{
                  left: 0,
                  top: 0,
                  width: "9%",
                  height: "18%",
                  backgroundImage: `url("${END_GRAIN_URI}")`,
                  backgroundSize: "80px 80px",
                  opacity: 0.56,
                  maskImage:
                    "radial-gradient(ellipse at top left, black, transparent 75%)",
                }}
              />
              <div
                className="pointer-events-none absolute rounded-br-(--kb-case-radius) mix-blend-multiply"
                style={{
                  right: 0,
                  bottom: 0,
                  width: "10%",
                  height: "20%",
                  backgroundImage: `url("${END_GRAIN_URI}")`,
                  backgroundSize: "80px 80px",
                  opacity: 0.5,
                  maskImage:
                    "radial-gradient(ellipse at bottom right, black, transparent 75%)",
                }}
              />

              <div
                className="pointer-events-none absolute inset-0 rounded-(--kb-case-radius)"
                style={{
                  background:
                    "radial-gradient(85% 50% at 38% -8%, rgba(255,240,210,0.15), transparent 42%)",
                }}
              />

              <div
                className="pointer-events-none absolute inset-0 rounded-(--kb-case-radius)"
                style={{
                  background:
                    "radial-gradient(70% 45% at 82% 108%, rgba(255,225,180,0.05), transparent 46%)",
                }}
              />

              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-(--kb-case-radius)"
                style={{
                  height: "14%",
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(250,248,244,0.05) 100%)",
                  mixBlendMode: "screen",
                }}
              />

              <div
                className="pointer-events-none absolute inset-0 rounded-(--kb-case-radius)"
                style={{
                  boxShadow:
                    "inset 0 1px 0 rgba(255,246,224,0.6), inset 0 -1px 0 rgba(10,6,2,0.55), inset 1px 0 0 rgba(255,246,224,0.26), inset -1px 0 0 rgba(10,6,2,0.36)",
                }}
              />
              <div className="pointer-events-none absolute inset-px rounded-[calc(var(--kb-case-radius)-0.06rem)] border-t border-l border-[#f6dfae]/22" />
              <div className="pointer-events-none absolute inset-px rounded-[calc(var(--kb-case-radius)-0.06rem)] border-b border-r border-[#3f2811]/34" />
              <div
                className="relative rounded-(--kb-bezel-radius)"
                style={{
                  padding: caseTier.bezelPadding,
                  background:
                    "linear-gradient(155deg, #15120e 0%, #0e0c08 50%, #0a0805 100%)",

                  boxShadow:
                    "inset 0 2.5px 6px rgba(0,0,0,0.55), inset 0 4px 8px rgba(0,0,0,0.28), inset 0 -1px 0 rgba(255,255,255,0.04), inset 0 0.5px 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(0,0,0,0.32), 0 1px 0 rgba(255,236,204,0.1)",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-(--kb-bezel-radius)"
                  style={{
                    background:
                      "radial-gradient(140% 60% at 44% 0%, rgba(180,120,70,0.1), transparent 45%)",
                    zIndex: 0,
                  }}
                />
                <div className="relative z-10 flex flex-col" style={{ gap }}>
                  {rows.map((row, i) => (
                    <div key={i} className="flex" style={{ gap }}>
                      {row.map((key) => (
                        <Key
                          key={key.id}
                          config={key}
                          rowIndex={i}
                          tier={tier}
                          registerTrigger={registerTrigger}
                          onActivate={activateKey}
                          onDeactivate={deactivateKey}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
