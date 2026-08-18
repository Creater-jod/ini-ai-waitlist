// Advanced Physical Acoustic Sound Engine for Mechanical Keyboards
// Synthesizes authentic multi-layer switch acoustics, chassis resonance, keycap transients & upstrokes using Web Audio API

export type SwitchProfileId = "thock" | "creamy" | "clicky";

export interface SwitchProfile {
  id: SwitchProfileId;
  name: string;
  tagline: string;
  icon: string;
}

export const SWITCH_PROFILES: SwitchProfile[] = [
  {
    id: "thock",
    name: "Deep Walnut Thock",
    tagline: "Custom lubed linear • Solid walnut chamber resonance",
    icon: "🪵",
  },
  {
    id: "creamy",
    name: "Creamy Marble",
    tagline: "Holy Panda tactile pop • Acoustic marble clack",
    icon: "🥛",
  },
  {
    id: "clicky",
    name: "Vintage Clicky",
    tagline: "Buckling spring snap • Crisp tactile leaf click",
    icon: "⚡",
  },
];

type KeyCategory = "normal" | "spacebar" | "modifier";

class KeyboardAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private currentProfile: SwitchProfileId = "clicky";
  private volume: number = 0.85;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  private initContext() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === "suspended") {
        void this.ctx.resume();
      }
      return this.ctx;
    }

    if (typeof window === "undefined") return null;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioCtx) return null;

      const ctx = new AudioCtx();
      this.ctx = ctx;

      // Master Dynamics Compressor / Limiter to prevent clipping and keep sound warm & punchy
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, ctx.currentTime);
      compressor.knee.setValueAtTime(8, ctx.currentTime);
      compressor.ratio.setValueAtTime(4, ctx.currentTime);
      compressor.attack.setValueAtTime(0.001, ctx.currentTime);
      compressor.release.setValueAtTime(0.04, ctx.currentTime);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, ctx.currentTime);
      this.masterGain = masterGain;

      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Pre-generate 1-second white/pink noise buffer for zero-latency micro-transients
      const bufferSize = ctx.sampleRate * 1;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise approximation for warm organic acoustic texture
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        const pink = b0 + b1 + b2 + white * 0.5362;
        output[i] = pink * 0.15;
      }
      this.noiseBuffer = noiseBuffer;
      this.isInitialized = true;

      return ctx;
    } catch {
      return null;
    }
  }

  public setProfile(profile: SwitchProfileId) {
    this.currentProfile = profile;
  }

  public getProfile(): SwitchProfileId {
    return this.currentProfile;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        muted ? 0 : this.volume,
        this.ctx.currentTime
      );
    }
  }

  public playKeyHover(pan = 0) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    let panNode: StereoPannerNode | null = null;
    if (typeof ctx.createStereoPanner === "function") {
      panNode = ctx.createStereoPanner();
      panNode.pan.setValueAtTime(pan, now);
      panNode.connect(this.masterGain);
    }

    const keyBus = ctx.createGain();
    if (panNode) {
      keyBus.connect(panNode);
    } else {
      keyBus.connect(this.masterGain);
    }

    // Warm, joyful, whisper-quiet micro wooden chime tick
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pitch = 580 + Math.random() * 90;

    osc.type = "sine";
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.72, now + 0.016);

    // Extremely low, happy whisper volume (0.018)
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.018, now + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

    osc.connect(gain);
    gain.connect(keyBus);

    osc.start(now);
    osc.stop(now + 0.022);
  }

  public playKeyDown(category: KeyCategory, pan = 0, mutedKey = false) {
    if (this.isMuted || mutedKey) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const profile = this.currentProfile;

    // Jitter / micro-variations for authentic organic feeling
    const pitchJitter = 1 + (Math.random() - 0.5) * 0.04; // +/- 2%
    const velJitter = 0.94 + Math.random() * 0.12; // +/- 6%
    const panJitter = Math.max(-1, Math.min(1, pan + (Math.random() - 0.5) * 0.06));

    // Panner
    let panNode: StereoPannerNode | null = null;
    if (typeof ctx.createStereoPanner === "function") {
      panNode = ctx.createStereoPanner();
      panNode.pan.setValueAtTime(panJitter, now);
      panNode.connect(this.masterGain);
    }

    const keyBus = ctx.createGain();
    if (panNode) {
      keyBus.connect(panNode);
    } else {
      keyBus.connect(this.masterGain);
    }

    // --- Profile Specific Physical Synthesis ---
    if (profile === "thock") {
      this.synthesizeDeepThock(ctx, keyBus, now, category, pitchJitter, velJitter);
    } else if (profile === "creamy") {
      this.synthesizeCreamyMarble(ctx, keyBus, now, category, pitchJitter, velJitter);
    } else {
      this.synthesizeVintageClicky(ctx, keyBus, now, category, pitchJitter, velJitter);
    }
  }

  public playKeyUp(category: KeyCategory, pan = 0, mutedKey = false) {
    if (this.isMuted || mutedKey) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const pitchJitter = 1 + (Math.random() - 0.5) * 0.05;
    const vel = 0.38 * (0.92 + Math.random() * 0.15); // Upstroke is quieter than downstroke

    const panJitter = Math.max(-1, Math.min(1, pan + (Math.random() - 0.5) * 0.05));
    let panNode: StereoPannerNode | null = null;
    if (typeof ctx.createStereoPanner === "function") {
      panNode = ctx.createStereoPanner();
      panNode.pan.setValueAtTime(panJitter, now);
      panNode.connect(this.masterGain);
    }

    const keyBus = ctx.createGain();
    if (panNode) {
      keyBus.connect(panNode);
    } else {
      keyBus.connect(this.masterGain);
    }

    // Key upstroke (top-out clack)
    const baseFreq = category === "spacebar" ? 340 : category === "modifier" ? 420 : 520;
    const decay = category === "spacebar" ? 0.024 : 0.016;

    // Upstroke sine pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq * pitchJitter * 1.3, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * pitchJitter * 0.6, now + decay);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vel * 0.6, now + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.connect(gain);
    gain.connect(keyBus);

    osc.start(now);
    osc.stop(now + decay + 0.01);

    // Subtle upstroke friction noise
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      noise.playbackRate.setValueAtTime(pitchJitter, now);

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2800 * pitchJitter, now);
      filter.Q.setValueAtTime(2.0, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(vel * 0.35, now + 0.001);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(keyBus);

      noise.start(now);
      noise.stop(now + 0.02);
    }
  }

  // --- Profile 1: Deep Walnut Thock (Lubed Linear in Heavy Walnut Chassis) ---
  private synthesizeDeepThock(
    ctx: AudioContext,
    bus: GainNode,
    now: number,
    cat: KeyCategory,
    pitchJitter: number,
    vel: number
  ) {
    const isSpace = cat === "spacebar";
    const isMod = cat === "modifier";

    // Frequencies tuned to authentic walnut keyboard cavity resonance
    const startFreq = (isSpace ? 115 : isMod ? 150 : 175) * pitchJitter;
    const endFreq = (isSpace ? 44 : isMod ? 56 : 62) * pitchJitter;
    const duration = isSpace ? 0.065 : isMod ? 0.048 : 0.042;

    // Layer 1: Solid Walnut Bottom-Out Body (Pitch-dropping pure sub & low-mid)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle"; // Warm harmonic content
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    // Warm wood body filter (340Hz - 420Hz peak)
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = "bandpass";
    bodyFilter.frequency.setValueAtTime((isSpace ? 260 : 360) * pitchJitter, now);
    bodyFilter.Q.setValueAtTime(2.2, now);

    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.linearRampToValueAtTime(vel * (isSpace ? 1.15 : 0.95), now + 0.001);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(bodyFilter);
    bodyFilter.connect(oscGain);
    oscGain.connect(bus);

    osc.start(now);
    osc.stop(now + duration + 0.01);

    // Layer 2: Deep Sub Thud (Chassis inertia)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime((isSpace ? 68 : 95) * pitchJitter, now);
    subOsc.frequency.exponentialRampToValueAtTime((isSpace ? 35 : 48) * pitchJitter, now + duration);

    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(vel * (isSpace ? 0.9 : 0.65), now + 0.001);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.9);

    subOsc.connect(subGain);
    subGain.connect(bus);

    subOsc.start(now);
    subOsc.stop(now + duration + 0.01);

    // Layer 3: Stem / Keycap Contact Clack (Damped PBT plastic on housing)
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      noise.playbackRate.setValueAtTime(pitchJitter, now);

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime((isSpace ? 1600 : 2300) * pitchJitter, now);
      noiseFilter.Q.setValueAtTime(1.4, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(vel * (isSpace ? 0.35 : 0.42), now + 0.0006);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + (isSpace ? 0.009 : 0.006));

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(bus);

      noise.start(now);
      noise.stop(now + 0.02);
    }

    // Layer 4: Spacebar / Stabilizer wire acoustics
    if (isSpace || isMod) {
      const stabOsc = ctx.createOscillator();
      const stabGain = ctx.createGain();
      stabOsc.type = "sine";
      stabOsc.frequency.setValueAtTime((isSpace ? 820 : 1100) * pitchJitter, now);
      stabOsc.frequency.exponentialRampToValueAtTime(300, now + 0.008);

      stabGain.gain.setValueAtTime(0.0001, now);
      stabGain.gain.linearRampToValueAtTime(vel * 0.16, now + 0.0008);
      stabGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.009);

      stabOsc.connect(stabGain);
      stabGain.connect(bus);

      stabOsc.start(now);
      stabOsc.stop(now + 0.015);
    }
  }

  // --- Profile 2: Creamy Marble (Holy Panda Tactile Pop) ---
  private synthesizeCreamyMarble(
    ctx: AudioContext,
    bus: GainNode,
    now: number,
    cat: KeyCategory,
    pitchJitter: number,
    vel: number
  ) {
    const isSpace = cat === "spacebar";
    const isMod = cat === "modifier";

    const startFreq = (isSpace ? 145 : isMod ? 190 : 230) * pitchJitter;
    const endFreq = (isSpace ? 60 : isMod ? 78 : 88) * pitchJitter;
    const duration = isSpace ? 0.055 : 0.038;

    // Tactile "marble pop" bump
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = "sine";
    popOsc.frequency.setValueAtTime(startFreq * 1.5, now);
    popOsc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    const marbleFilter = ctx.createBiquadFilter();
    marbleFilter.type = "bandpass";
    marbleFilter.frequency.setValueAtTime((isSpace ? 380 : 540) * pitchJitter, now);
    marbleFilter.Q.setValueAtTime(3.2, now); // High Q for bright marble resonance

    popGain.gain.setValueAtTime(0.0001, now);
    popGain.gain.linearRampToValueAtTime(vel * 1.1, now + 0.0008);
    popGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    popOsc.connect(marbleFilter);
    marbleFilter.connect(popGain);
    popGain.connect(bus);

    popOsc.start(now);
    popOsc.stop(now + duration + 0.01);

    // Creamy transient snap
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      noise.playbackRate.setValueAtTime(pitchJitter * 1.2, now);

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime((isSpace ? 2400 : 3200) * pitchJitter, now);
      filter.Q.setValueAtTime(2.2, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(vel * 0.52, now + 0.0005);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.007);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(bus);

      noise.start(now);
      noise.stop(now + 0.02);
    }
  }

  // --- Profile 3: Vintage Clicky (Buckling Spring / Crisp Click Leaf) ---
  private synthesizeVintageClicky(
    ctx: AudioContext,
    bus: GainNode,
    now: number,
    cat: KeyCategory,
    pitchJitter: number,
    vel: number
  ) {
    const isSpace = cat === "spacebar";
    const duration = isSpace ? 0.045 : 0.032;

    // 1. Sharp metallic leaf click
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = "sine";
    clickOsc.frequency.setValueAtTime(3100 * pitchJitter, now);
    clickOsc.frequency.exponentialRampToValueAtTime(1400 * pitchJitter, now + 0.0035);

    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.linearRampToValueAtTime(vel * 0.95, now + 0.0003);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.004);

    clickOsc.connect(clickGain);
    clickGain.connect(bus);

    clickOsc.start(now);
    clickOsc.stop(now + 0.01);

    // 2. Crisp burst
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      noise.playbackRate.setValueAtTime(pitchJitter, now);

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(2600 * pitchJitter, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(vel * 0.65, now + 0.0004);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.006);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(bus);

      noise.start(now);
      noise.stop(now + 0.015);
    }

    // 3. Vintage bottom-out body
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = "triangle";
    bodyOsc.frequency.setValueAtTime((isSpace ? 130 : 190) * pitchJitter, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(65 * pitchJitter, now + duration);

    bodyGain.gain.setValueAtTime(0.0001, now + 0.001); // Delay slightly for tactile click
    bodyGain.gain.linearRampToValueAtTime(vel * 0.7, now + 0.002);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(bus);

    bodyOsc.start(now);
    bodyOsc.stop(now + duration + 0.01);
  }
}

// Global Singleton Engine
export const keyboardAudio = new KeyboardAudioEngine();
