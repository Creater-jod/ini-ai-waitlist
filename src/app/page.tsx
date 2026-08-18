"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Component as VintageKeyboard } from "@/components/ui/vintage-keyboard";

function StarburstLogo({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        filter:
          "drop-shadow(0 0 12px rgba(129, 140, 248, 0.85)) drop-shadow(0 0 4px rgba(236, 72, 153, 0.6))",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full animate-[spin_10s_linear_infinite]"
        style={{ transformOrigin: "50% 50%" }}
      >
        <defs>
          <linearGradient id="starburstGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="30%" stopColor="#818cf8" />
            <stop offset="65%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
        {/* Main 4-pointed organic starburst */}
        <path
          d="M12.5 2.5C12.8 7.5 16.5 11.2 21.5 11.5C16.5 11.8 12.8 15.5 12.5 20.5C12.2 15.5 8.5 11.8 3.5 11.5C8.5 11.2 12.2 7.5 12.5 2.5Z"
          fill="url(#starburstGrad)"
        />
        {/* Top-left companion sparkle */}
        <path
          d="M4.5 3.5C4.7 5.5 6 6.8 8 7C6 7.2 4.7 8.5 4.5 10.5C4.3 8.5 3 7.2 1 7C3 6.8 4.3 5.5 4.5 3.5Z"
          fill="url(#starburstGrad)"
          opacity="0.9"
        />
        {/* Bottom-left companion sparkle */}
        <path
          d="M5.5 15.5C5.7 17 6.7 18 8.2 18.2C6.7 18.4 5.7 19.4 5.5 20.9C5.3 19.4 4.3 18.4 2.8 18.2C4.3 18 5.3 17 5.5 15.5Z"
          fill="url(#starburstGrad)"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}

function IniAiWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-black tracking-tight inline-block select-none ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, #38bdf8 0%, #818cf8 25%, #c084fc 50%, #f43f5e 75%, #38bdf8 100%)",
        backgroundSize: "220% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: "iniGradientShift 4s ease-in-out infinite alternate",
        textShadow: "0 0 24px rgba(168, 85, 247, 0.3)",
      }}
    >
      ini AI
    </span>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spotNumber, setSpotNumber] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [volume] = useState(0.85);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize typing from vintage mechanical keyboard directly into the waitlist email
  const handleKeyInput = useCallback(
    (char: string, action?: "char" | "backspace" | "enter" | "tab" | "space" | "clear") => {
      if (document.activeElement === inputRef.current) {
        return;
      }
      if (action === "backspace") {
        setEmail((prev) => prev.slice(0, -1));
      } else if (action === "enter") {
        if (inputRef.current?.form) {
          inputRef.current.form.requestSubmit();
        }
      } else if (action === "space") {
        setEmail((prev) => prev + " ");
      } else if (char) {
        setEmail((prev) => prev + char);
      }
    },
    []
  );

  const triggerConfetti = () => {
    const count = 130;
    const defaults = { origin: { y: 0.4 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 30,
      startVelocity: 55,
      colors: ["#38bdf8", "#818cf8", "#c084fc", "#f43f5e"],
    });
    fire(0.2, {
      spread: 60,
      colors: ["#818cf8", "#f43f5e", "#fef3c7"],
    });
    fire(0.35, {
      spread: 90,
      decay: 0.91,
      scalar: 0.85,
      colors: ["#ffffff", "#38bdf8", "#c084fc"],
    });
    fire(0.2, {
      spread: 120,
      startVelocity: 40,
      colors: ["#818cf8", "#f43f5e"],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to join waitlist. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSpotNumber(data.spotNumber || null);
      setSubmitted(true);
      setIsSubmitting(false);
      triggerConfetti();
    } catch (err) {
      console.error("Waitlist submit error:", err);
      setErrorMessage("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-x-hidden bg-[#070608] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200 px-4 sm:px-6 py-4 sm:py-6 font-(family-name:--font-roboto)">
      {/* Custom Keyframe Animations & Autofill Theme Override */}
      <style>{`
        @keyframes iniGradientShift {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
        .font-editorial-slab {
          font-family: var(--font-roboto-slab), serif;
        }
        .font-editorial-italic {
          font-family: var(--font-roboto-slab), Georgia, serif;
          font-style: italic;
        }
        /* Override Chrome / Safari / Edge white background on email autofill */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #15121e inset !important;
          -webkit-text-fill-color: #f4f4f5 !important;
          caret-color: #f4f4f5 !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* --- Rich Luxury Ambient Lighting Atmosphere --- */}
      {/* Top Ambient Electric Indigo/Violet Glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-250 h-125 rounded-full blur-[150px] opacity-45"
        style={{
          background:
            "radial-gradient(ellipse at center, #6366f1 0%, #a855f7 35%, #ec4899 65%, transparent 80%)",
        }}
      />

      {/* Center Studio Spotlight for Keyboard Area */}
      <div
        className="pointer-events-none absolute top-[54%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-275 h-125 rounded-full blur-[160px] opacity-35"
        style={{
          background:
            "radial-gradient(ellipse at center, #9333ea 0%, #4338ca 45%, #1e1b4b 70%, transparent 85%)",
        }}
      />

      {/* Warm Ground Wood Reflection */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-225 h-75 rounded-full blur-[140px] opacity-25"
        style={{
          background:
            "radial-gradient(ellipse at center, #b45309 0%, #78350f 45%, transparent 75%)",
        }}
      />

      {/* Ultra-subtle Studio Micro Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.45) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Soft Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(5,4,6,0.92)_100%)]" />

      {/* --- Top Header: Left-Aligned ini AI Brand Capsule --- */}
      <header className="relative z-20 w-full max-w-4xl flex items-center justify-start shrink-0 mb-4 sm:mb-6 px-1 sm:px-0">
        <div
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full transition-all duration-300 hover:border-indigo-500/40 hover:shadow-[0_0_20px_rgba(129,140,248,0.25)] cursor-default"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(24px)",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.2)",
          }}
        >
          <StarburstLogo size={19} />
          <div className="flex items-center gap-1.5">
            <IniAiWordmark className="text-xs sm:text-sm tracking-wide font-(family-name:--font-roboto)" />
            <span className="text-zinc-500 font-normal text-[11px] tracking-normal font-(family-name:--font-roboto-condensed)">/ Studio</span>
          </div>
        </div>
      </header>

      {/* --- Main Hero: Reference Structure (Badge + Editorial Headline + Subtitle + Input Card) --- */}
      <section className="relative z-10 w-full flex-1 flex flex-col items-center justify-center max-w-4xl my-auto py-1 sm:py-2">
        {/* Top Badge: ⚡ Early Access — Limited to 100 Users (Roboto Condensed) */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-purple-200 mb-4 sm:mb-5 cursor-default transition-all duration-300 hover:border-purple-500/50 font-(family-name:--font-roboto-condensed) tracking-wider uppercase"
          style={{
            background:
              "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(99,102,241,0.08) 100%)",
            border: "1px solid rgba(168,85,247,0.3)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 2px 14px rgba(168,85,247,0.15)",
          }}
        >
          <span className="text-amber-400">⚡</span>
          <span>Early Access — Limited to 100 Users</span>
        </motion.div>

        {/* Editorial Headline: Something Extraordinary Is Coming Soon (Roboto Slab) */}
        <div className="text-center max-w-3xl px-3 mb-3 sm:mb-4">
          <h1 className="font-editorial-slab text-3xl sm:text-4xl lg:text-[3.25rem] font-medium tracking-tight text-white leading-[1.14] drop-shadow-[0_2px_24px_rgba(0,0,0,0.9)]">
            Something{" "}
            <span className="font-editorial-italic font-normal bg-linear-to-r from-cyan-300 via-indigo-300 to-pink-400 bg-clip-text text-transparent tracking-normal text-[1.12em] inline-block mr-1">
              Extraordinary
            </span>{" "}
            Is
            <br />
            Coming Soon
          </h1>

          {/* Subtitle (Roboto) */}
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed font-normal font-(family-name:--font-roboto)">
            Be the first to know when we launch. Join our community of early supporters and get exclusive updates.
          </p>
        </div>

        {/* --- Reference Input Box (Rounded Card with 'Your Email Address' + Action Button) --- */}
        <div className="w-full max-w-md px-3 mb-1 sm:mb-1.5 flex flex-col items-center z-20">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="waitlist-input-box"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full"
              >
                <div
                  className="relative flex items-center rounded-xl p-1.5 transition-all duration-300"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(28, 24, 38, 0.85) 0%, rgba(14, 12, 20, 0.95) 100%)",
                    border: isFocused
                      ? "1px solid rgba(168,85,247,0.7)"
                      : "1px solid rgba(255, 255, 255, 0.14)",
                    boxShadow: isFocused
                      ? "0 0 30px rgba(168,85,247,0.35), inset 0 1.5px 1px rgba(255,255,255,0.25), 0 10px 30px rgba(0,0,0,0.6)"
                      : "inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 10px 25px rgba(0,0,0,0.5)",
                    backdropFilter: "blur(24px)",
                  }}
                >
                  <input
                    ref={inputRef}
                    type="email"
                    value={email}
                    disabled={isSubmitting}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    placeholder="Your Email Address"
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 bg-transparent focus:outline-none w-full font-normal font-(family-name:--font-roboto) disabled:opacity-50"
                    required
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg px-5 py-2 text-xs sm:text-sm font-semibold text-white whitespace-nowrap cursor-pointer transition-all hover:brightness-110 active:scale-[0.98] shrink-0 font-(family-name:--font-roboto-condensed) tracking-wider disabled:opacity-60 flex items-center gap-1.5"
                    style={{
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
                      boxShadow:
                        "0 0 18px rgba(168,85,247,0.45), inset 0 1px 1px rgba(255,255,255,0.6)",
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Notify me</span>
                    )}
                  </button>
                </div>

                {errorMessage && (
                  <motion.p
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-rose-400 mt-1.5 text-center font-medium font-(family-name:--font-roboto)"
                  >
                    {errorMessage}
                  </motion.p>
                )}
              </motion.form>
            ) : (
              <motion.div
                key="waitlist-confirmed-box"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex items-center justify-between px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-purple-200 font-(family-name:--font-roboto)"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(236,72,153,0.1) 100%)",
                  border: "1px solid rgba(168,85,247,0.45)",
                  boxShadow: "0 0 25px rgba(168,85,247,0.25), inset 0 1px 1px rgba(255,255,255,0.3)",
                  backdropFilter: "blur(24px)",
                }}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-purple-400">✨</span>
                  <span className="truncate">
                    VIP Spot {spotNumber ? `#${spotNumber}/100 ` : ""}Reserved for{" "}
                    <span className="text-white font-semibold">{email}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                    setSpotNumber(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-purple-300 underline ml-3 shrink-0 cursor-pointer"
                >
                  Change
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3D Walnut Mechanical Keyboard (Docked directly and snugly below the input card) */}
        <div className="w-full flex justify-center -mt-6 sm:-mt-8 shrink-0 z-10">
          <VintageKeyboard
            onKeyInput={handleKeyInput}
            soundProfile="clicky"
            volume={volume}
          />
        </div>
      </section>
    </main>
  );
}
