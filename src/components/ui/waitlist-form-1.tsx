"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import confetti from "canvas-confetti";

const SMALL_BREAKPOINT = 570;

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.12,
    },
  },
};

const childVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(6px)", y: 8 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.45 },
  },
};

function useWindowWidth() {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("resize", onStoreChange);
      return () => window.removeEventListener("resize", onStoreChange);
    },
    () => window.innerWidth,
    () => 1200
  );
}

export interface WaitlistFormProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmitSuccess?: (email: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  productName?: string;
  badgeText?: string;
  className?: string;
  hideHeader?: boolean;
  compact?: boolean;
}

const WaitlistForm = ({
  value: controlledEmail,
  onChange: controlledOnChange,
  onSubmitSuccess,
  inputRef,
  productName = "Walnut Mechanical",
  badgeText = "✨ Live Typing: Use physical keyboard or click 3D keys below",
  className = "",
  hideHeader = false,
  compact = false,
}: WaitlistFormProps = {}) => {
  const [internalEmail, setInternalEmail] = useState("");
  const isControlled = controlledEmail !== undefined;
  const email = isControlled ? controlledEmail : internalEmail;
  const [isFocused, setIsFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const width = useWindowWidth();

  const handleEmailChange = (val: string) => {
    if (!isControlled) {
      setInternalEmail(val);
    }
    controlledOnChange?.(val);
  };

  const triggerConfetti = () => {
    const count = 130;
    const defaults = { origin: { y: 0.65 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 28,
      startVelocity: 55,
      colors: ["#f59e0b", "#fbbf24", "#ffffff"],
    });
    fire(0.2, {
      spread: 65,
      colors: ["#d97706", "#b45309", "#fef3c7"],
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.85,
      colors: ["#ffffff", "#fef08a", "#d97706"],
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 30,
      decay: 0.93,
    });
    fire(0.1, {
      spread: 130,
      startVelocity: 45,
      colors: ["#f59e0b", "#fbbf24"],
    });
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim()) return;
      setSubmitted(true);
      triggerConfetti();
      onSubmitSuccess?.(email);
    },
    [email, onSubmitSuccess]
  );

  const ThankYouMessage = (
    <motion.div
      layout
      key="thank-you"
      initial={{ opacity: 0, filter: "blur(12px)", scale: 0.96 }}
      animate={{
        opacity: 1,
        filter: "blur(0px)",
        scale: 1,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      }}
      exit={{
        opacity: 0,
        filter: "blur(10px)",
        transition: { duration: 0.3 },
      }}
      className="w-full flex flex-col items-center justify-center text-center py-4 sm:py-6 relative z-10"
    >
      {/* Liquid Glass Badge Icon */}
      <div
        className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full mb-3.5 sm:mb-4 text-amber-300"
        style={{
          background:
            "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.08) 100%)",
          border: "1px solid rgba(245,158,11,0.35)",
          boxShadow:
            "0 0 25px rgba(245,158,11,0.25), inset 0 1.5px 1px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.5)",
          backdropFilter: "blur(20px)",
        }}
      >
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
        You&apos;re on the VIP List!
      </h2>
      <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm lg:text-base text-zinc-300 max-w-md">
        We reserved early access for{" "}
        <span className="text-amber-300 font-semibold underline decoration-amber-500/40 underline-offset-4">
          {email}
        </span>
        . Production batch drop alerts will be sent straight to your inbox.
      </p>

      <button
        type="button"
        onClick={() => {
          setSubmitted(false);
          handleEmailChange("");
        }}
        className="mt-4 sm:mt-5 text-xs text-zinc-400 hover:text-amber-300 transition underline underline-offset-4 cursor-pointer"
      >
        Register another email
      </button>
    </motion.div>
  );

  const FormContent = (
    <motion.div
      layout
      key="form"
      className="w-full relative z-10"
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.5 },
      }}
      exit={{
        opacity: 0,
        filter: "blur(10px)",
        transition: { duration: 0.3 },
      }}
    >
      {!hideHeader && badgeText && (
        <motion.div variants={childVariants} className="flex justify-center mb-2.5 sm:mb-3.5">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium text-amber-200/90 tracking-wide select-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(245,158,11,0.08) 100%)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.35)",
              backdropFilter: "blur(16px)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {badgeText}
          </span>
        </motion.div>
      )}

      {!hideHeader && (
        <motion.div
          className={` ${
            width <= SMALL_BREAKPOINT ? "text-left mb-3.5" : "text-center mb-4 sm:mb-5"
          }`}
          variants={childVariants}
        >
          <h1 className="text-2xl sm:text-3xl lg:text-[2.25rem] leading-tight font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            Join the waitlist for the{" "}
            <span className="bg-linear-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent font-bold">
              {productName}
            </span>
          </h1>
          <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-zinc-300/80 max-w-lg mx-auto">
            Solid American walnut chassis, analog acoustic tuning &amp; custom mechanical switches.
          </p>
        </motion.div>
      )}

      <motion.form
        onSubmit={handleSubmit}
        className={
          width <= SMALL_BREAKPOINT
            ? "flex flex-col gap-2.5 items-start w-full"
            : "relative w-full max-w-xl mx-auto"
        }
        variants={childVariants}
      >
        {/* Liquid Glass Input Pill */}
        <div
          className={`transition-all duration-300 w-full ${
            width <= SMALL_BREAKPOINT
              ? "flex flex-col gap-2.5"
              : "flex flex-row items-center space-x-2 rounded-full p-1.5"
          }`}
          style={{
            background:
              width <= SMALL_BREAKPOINT
                ? "transparent"
                : "linear-gradient(145deg, rgba(10,9,8,0.7) 0%, rgba(20,18,16,0.6) 100%)",
            border:
              width <= SMALL_BREAKPOINT
                ? "none"
                : isFocused
                ? "1px solid rgba(245,158,11,0.65)"
                : "1px solid rgba(255,255,255,0.16)",
            boxShadow:
              width <= SMALL_BREAKPOINT
                ? "none"
                : isFocused
                ? "0 0 25px rgba(245,158,11,0.25), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.6)"
                : "inset 0 1px 1px rgba(255,255,255,0.18), inset 0 -1px 2px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.4)",
            backdropFilter: "blur(24px) saturate(180%)",
          }}
        >
          <div className="relative flex-1 flex items-center">
            <svg
              className="absolute left-3.5 sm:left-4 w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-400 pointer-events-none transition-colors"
              style={{ color: isFocused ? "#f59e0b" : "rgba(255,255,255,0.4)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <input
              ref={inputRef}
              type="email"
              value={email}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="Enter your email address..."
              className={`${
                width <= SMALL_BREAKPOINT
                  ? "pl-10 pr-4 py-3 w-full text-sm rounded-full text-zinc-100 placeholder-zinc-500 focus:outline-none"
                  : "pl-10 sm:pl-11 pr-4 py-2.5 text-sm sm:text-base text-zinc-100 placeholder-zinc-500 bg-transparent focus:outline-none w-full"
              }`}
              style={
                width <= SMALL_BREAKPOINT
                  ? {
                      background: "rgba(15,14,13,0.7)",
                      border: isFocused
                        ? "1px solid rgba(245,158,11,0.65)"
                        : "1px solid rgba(255,255,255,0.16)",
                      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)",
                      backdropFilter: "blur(20px)",
                    }
                  : undefined
              }
              required
            />
          </div>

          {/* Liquid Amber Button */}
          <button
            type="submit"
            className={`${
              width <= SMALL_BREAKPOINT
                ? "rounded-full px-5 py-3 text-sm font-semibold text-zinc-950 w-full cursor-pointer transition-all active:scale-[0.98]"
                : "rounded-full px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-zinc-950 whitespace-nowrap cursor-pointer transition-all hover:brightness-110 active:scale-[0.98]"
            }`}
            style={{
              background:
                "linear-gradient(180deg, #fcd34d 0%, #f59e0b 45%, #d97706 100%)",
              boxShadow:
                "0 0 20px rgba(245,158,11,0.4), inset 0 1px 1.5px rgba(255,255,255,0.75), inset 0 -1.5px 2px rgba(180,83,9,0.5)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            Join Waitlist
          </button>
        </div>
      </motion.form>
    </motion.div>
  );

  return (
    <motion.div
      layout
      className={`w-[96%] max-w-xl ${
        compact
          ? "rounded-2xl sm:rounded-full p-1.5 sm:p-2"
          : width <= SMALL_BREAKPOINT
          ? "rounded-3xl p-4 sm:p-5"
          : "rounded-3xl p-5 sm:p-6"
      } relative overflow-hidden flex items-center justify-center ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        // Apple Liquid Glass Refraction Styling
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 40%, rgba(245,158,11,0.025) 70%, rgba(255,255,255,0.04) 100%)",
        border: "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(36px) saturate(200%) brightness(112%)",
        WebkitBackdropFilter: "blur(36px) saturate(200%) brightness(112%)",
        boxShadow:
          "0 25px 70px -15px rgba(0,0,0,0.85), 0 0 45px rgba(245,158,11,0.07), inset 0 1.5px 1px 0 rgba(255,255,255,0.55), inset 0 -1.5px 2px 0 rgba(0,0,0,0.65), inset 1.5px 0 1.5px 0 rgba(255,255,255,0.15), inset -1.5px 0 1.5px 0 rgba(255,255,255,0.1)",
      }}
    >
      {/* Prismatic Top Edge Light Dispersion */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 20%, rgba(254,240,138,0.75) 50%, rgba(255,255,255,0.2) 80%, transparent 100%)",
        }}
      />

      {/* Liquid Convex Corner Refraction Highlights */}
      <div
        className="pointer-events-none absolute -top-12 -left-12 w-32 h-32 rounded-full opacity-40 blur-xl"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-xl"
        style={{
          background: "radial-gradient(circle, rgba(245,158,11,0.5) 0%, transparent 70%)",
        }}
      />

      <AnimatePresence mode="wait">
        {!submitted ? FormContent : ThankYouMessage}
      </AnimatePresence>
    </motion.div>
  );
};

export { WaitlistForm };
