"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */
interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
  ip?: string;
  userAgent?: string;
}

interface WaitlistData {
  totalSubscribers: number;
  maxCapacity: number;
  isFull: boolean;
  subscribers: Subscriber[];
}

/* ────────────────────────────────────────────────
   Animated Progress Ring
   ──────────────────────────────────────────────── */
function ProgressRing({
  value,
  max,
  size = 80,
  stroke = 6,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
      />
      {/* Fill */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#ringGradient)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
      <defs>
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ────────────────────────────────────────────────
   Glassmorphic Card wrapper
   ──────────────────────────────────────────────── */
function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(24px) saturate(180%)",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2)",
      }}
    >
      {/* Top edge shine */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
        }}
      />
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────
   Login Screen
   ──────────────────────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid password.");
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setIsLoading(false);
        return;
      }

      onLogin();
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 relative">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 rounded-full blur-[120px] opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at center, #6366f1 0%, #a855f7 40%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          x: shake ? [0, -12, 12, -8, 8, -4, 4, 0] : 0,
        }}
        transition={
          shake
            ? { duration: 0.5, ease: "easeInOut" }
            : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
        }
        className="w-full max-w-sm"
      >
        <GlassCard className="p-8">
          {/* ini AI branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
                  boxShadow: "0 0 20px rgba(168,85,247,0.4)",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-5 h-5"
                >
                  <path
                    d="M12 2C12.3 7 16 10.7 21 11C16 11.3 12.3 15 12 20C11.7 15 8 11.3 3 11C8 10.7 11.7 7 12 2Z"
                    fill="white"
                  />
                </svg>
              </div>
              <span
                className="text-xl font-black tracking-tight"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #38bdf8, #818cf8, #c084fc, #f43f5e)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ini AI
              </span>
            </div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Enter your password to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Input */}
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Password"
                className="w-full px-4 py-3 pr-12 text-sm text-zinc-100 placeholder-zinc-500 rounded-xl focus:outline-none transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: error
                    ? "1px solid rgba(244,63,94,0.6)"
                    : "1px solid rgba(255,255,255,0.12)",
                  boxShadow: error
                    ? "0 0 20px rgba(244,63,94,0.15)"
                    : "inset 0 1px 2px rgba(0,0,0,0.3)",
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-rose-400 font-medium"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background:
                  "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
                boxShadow:
                  "0 0 20px rgba(168,85,247,0.35), inset 0 1px 1px rgba(255,255,255,0.4)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Access Dashboard</span>
              )}
            </button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Stats Card
   ──────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon,
  accent,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard className="p-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${accent}22 0%, ${accent}11 100%)`,
              border: `1px solid ${accent}33`,
              boxShadow: `0 0 16px ${accent}18`,
            }}
          >
            {icon}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium font-(family-name:--font-roboto-condensed)">
              {label}
            </p>
            <p className="text-2xl font-bold text-white tracking-tight mt-0.5">
              {value}
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────
   Dashboard Screen
   ──────────────────────────────────────────────── */
function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<WaitlistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/waitlist");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch waitlist data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      onLogout();
    } catch {
      setLoggingOut(false);
    }
  };

  const exportCSV = () => {
    if (!data?.subscribers?.length) return;

    const headers = ["#", "Email", "Joined Date", "IP Address", "User Agent"];
    const rows = data.subscribers.map((sub, i) => [
      i + 1,
      sub.email,
      new Date(sub.createdAt).toLocaleString(),
      sub.ip || "—",
      sub.userAgent || "—",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ini-ai-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredSubscribers = data?.subscribers?.filter((sub) =>
    sub.email.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const totalCount = data?.totalSubscribers ?? 0;
  const maxCapacity = data?.maxCapacity ?? 100;
  const remaining = Math.max(0, maxCapacity - totalCount);
  const fillPct = Math.round((totalCount / maxCapacity) * 100);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full px-4 sm:px-6 py-6 relative">
      {/* Ambient glows */}
      <div
        className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-200 h-100 rounded-full blur-[150px] opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at center, #6366f1 0%, #a855f7 35%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none fixed bottom-0 right-0 w-100 h-75 rounded-full blur-[120px] opacity-15"
        style={{
          background:
            "radial-gradient(ellipse at center, #ec4899 0%, transparent 70%)",
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
                boxShadow: "0 0 16px rgba(168,85,247,0.35)",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path
                  d="M12 2C12.3 7 16 10.7 21 11C16 11.3 12.3 15 12 20C11.7 15 8 11.3 3 11C8 10.7 11.7 7 12 2Z"
                  fill="white"
                />
              </svg>
            </div>
            <div>
              <h1
                className="text-lg font-black tracking-tight"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #38bdf8, #818cf8, #c084fc, #f43f5e)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ini AI
              </h1>
              <p className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase font-(family-name:--font-roboto-condensed) -mt-0.5">
                Admin Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </motion.header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Signups"
            value={totalCount}
            delay={0.1}
            accent="#818cf8"
            icon={
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatCard
            label="Remaining Spots"
            value={remaining}
            delay={0.2}
            accent="#34d399"
            icon={
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          />
          <StatCard
            label="Capacity Filled"
            value={`${fillPct}%`}
            delay={0.3}
            accent="#f472b6"
            icon={
              <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </div>

        {/* Progress Ring + Summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <ProgressRing value={totalCount} max={maxCapacity} size={90} stroke={7} />
                <div className="absolute inset-0 flex items-center justify-center rotate-0">
                  <span className="text-lg font-bold text-white">
                    {totalCount}
                    <span className="text-xs text-zinc-500 font-normal">/{maxCapacity}</span>
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Waitlist Capacity
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {data?.isFull
                    ? "🔒 Waitlist is full! All 100 spots have been claimed."
                    : `${remaining} spot${remaining !== 1 ? "s" : ""} remaining out of ${maxCapacity}. ${fillPct}% filled.`}
                </p>
                {/* Capacity bar */}
                <div className="mt-3 w-full max-w-xs h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${fillPct}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      background: "linear-gradient(90deg, #818cf8, #a855f7, #ec4899)",
                      boxShadow: "0 0 12px rgba(168,85,247,0.4)",
                    }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Subscriber Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <GlassCard className="p-0">
            {/* Table Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-white/6">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Subscribers
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {filteredSubscribers.length} of {totalCount} shown
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search emails..."
                    className="w-full sm:w-56 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 rounded-lg focus:outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                </div>
                {/* CSV Export */}
                <button
                  onClick={exportCSV}
                  disabled={!data?.subscribers?.length}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold font-(family-name:--font-roboto-condensed) w-12">
                      #
                    </th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold font-(family-name:--font-roboto-condensed)">
                      Email
                    </th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold font-(family-name:--font-roboto-condensed) hidden sm:table-cell">
                      Joined
                    </th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold font-(family-name:--font-roboto-condensed) hidden md:table-cell">
                      IP Address
                    </th>
                    <th className="px-5 py-3 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold font-(family-name:--font-roboto-condensed) hidden lg:table-cell">
                      User Agent
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-xs text-zinc-500">
                            {search
                              ? "No subscribers match your search."
                              : "No subscribers yet. Share your landing page!"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((sub, i) => {
                      const joinDate = new Date(sub.createdAt);
                      const formattedDate = joinDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      const formattedTime = joinDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <motion.tr
                          key={sub.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: Math.min(i * 0.03, 0.6),
                          }}
                          className="border-b border-white/3 hover:bg-white/3 transition-colors"
                        >
                          <td className="px-5 py-3.5 text-xs text-zinc-500 font-mono">
                            {i + 1}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-white font-medium">
                            {sub.email}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-zinc-400 hidden sm:table-cell">
                            <span>{formattedDate}</span>
                            <span className="text-zinc-600 ml-1.5">{formattedTime}</span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-zinc-500 font-mono hidden md:table-cell">
                            {sub.ip || "—"}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-zinc-600 hidden lg:table-cell max-w-50 truncate">
                            {sub.userAgent || "—"}
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-zinc-600">
            ini AI Admin · Waitlist data is stored locally in{" "}
            <code className="text-zinc-500">data/waitlist.json</code>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Main Admin Page
   ──────────────────────────────────────────────── */
export default function AdminPage() {
  const [authState, setAuthState] = useState<"loading" | "login" | "dashboard">(
    "loading"
  );

  useEffect(() => {
    fetch("/api/admin/verify")
      .then((res) => res.json())
      .then((data) => {
        setAuthState(data.authenticated ? "dashboard" : "login");
      })
      .catch(() => setAuthState("login"));
  }, []);

  if (authState === "loading") {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-[#070608] text-zinc-100 font-(family-name:--font-roboto)">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Verifying session...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#070608] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200 font-(family-name:--font-roboto)">
      {/* Subtle dot pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <AnimatePresence mode="wait">
        {authState === "login" ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoginScreen onLogin={() => setAuthState("dashboard")} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DashboardScreen onLogout={() => setAuthState("login")} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
