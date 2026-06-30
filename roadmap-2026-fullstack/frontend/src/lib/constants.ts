import type { Status } from '../types';

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const QUARTERS = ["Q1","Q2","Q3","Q4"];
export const Q_RANGE = ["Jan – Mar","Apr – Jun","Jul – Sep","Oct – Dec"];

export const pct  = (n: number) => `${(n / 12) * 100}%`;
export const barL = (s: number) => `calc(${pct(s)} + 3px)`;
export const barW = (s: number, e: number) => `calc(${pct(e - s + 1)} - 6px)`;
export const dateLabel = (s: number, e: number) => s === e ? MONTHS[s] : `${MONTHS[s]} – ${MONTHS[e]}`;

export const BAR_H = 34;
export const PAD = 9;
export const GAP = 5;
export const LANE = BAR_H + GAP;
export const LW = 190;

interface StatusCfg { fill: string; stroke: string; text: string; label: string; icon: string }

export const STATUS: Record<Status, StatusCfg> = {
  completed:       { fill: "#d1fae5", stroke: "#059669", text: "#065f46", label: "Completed",     icon: "✓" },
  "in-review":     { fill: "#ede9fe", stroke: "#7c3aed", text: "#5b21b6", label: "In Review",     icon: "◐" },
  "in-progress":   { fill: "#ffedd5", stroke: "#f97316", text: "#9a3412", label: "In Progress",   icon: "●" },
  "to-be-defined": { fill: "#e2e8f0", stroke: "#94a3b8", text: "#475569", label: "To Be Defined", icon: "?" },
};

interface ThemeIcon { emoji: string; color: string }

export const TICONS: Record<string, ThemeIcon> = {
  "Florist App":              { emoji: "📱", color: "#f59e0b" },
  "OMS & Operations":         { emoji: "🔄", color: "#3b82f6" },
  "Customer Service":         { emoji: "🎧", color: "#10b981" },
  "Inventory & WMS":          { emoji: "📦", color: "#14b8a6" },
  "Intelligence & AI":        { emoji: "⚡", color: "#6366f1" },
  "Design System & Research": { emoji: "🎨", color: "#8b5cf6" },
};

export const tColor = (name: string) => TICONS[name]?.color ?? "#6366f1";
export const tEmoji = (name: string) => TICONS[name]?.emoji ?? "📌";
