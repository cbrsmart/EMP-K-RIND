import { ThemeConfig, AgentProfile, Achievement, ThemeKey } from './types';

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  empire: {
    id: 'empire',
    name: "Empire",
    bg: "bg-black",
    text: "text-yellow-500",
    accent: "text-white",
    primary: "bg-yellow-600",
    secondary: "bg-zinc-900",
    font: "font-serif",
    button: "bg-yellow-600 text-black font-bold hover:bg-yellow-500 uppercase tracking-widest border border-yellow-700",
    card: "bg-zinc-950 border border-yellow-900/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]",
    statusIndicator: "bg-yellow-500"
  },
  soul: {
    id: 'soul',
    name: "Soul",
    bg: "bg-white",
    text: "text-black",
    accent: "text-zinc-600",
    primary: "bg-black",
    secondary: "bg-zinc-100",
    font: "font-mono",
    button: "bg-black text-white hover:bg-zinc-800 uppercase tracking-widest",
    card: "bg-white border border-black/10 shadow-sm",
    statusIndicator: "bg-black"
  },
  neura: {
    id: 'neura',
    name: "Neura",
    bg: "bg-slate-950",
    text: "text-cyan-400",
    accent: "text-purple-400",
    primary: "bg-cyan-600",
    secondary: "bg-slate-900",
    font: "font-sans",
    button: "bg-cyan-900/50 text-cyan-100 border border-cyan-500 hover:bg-cyan-800 uppercase tracking-widest",
    card: "bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md",
    statusIndicator: "bg-cyan-500"
  }
};

export const AIR_TEAM: AgentProfile[] = [
  { name: "Claude", role: "The Architect", trait: "Unwavering accuracy, zero hallucination", icon: "Bot", color: "text-orange-500" },
  { name: "Gemini", role: "The Creative", trait: "Boundless creativity, aesthetic excellence", icon: "Sparkles", color: "text-blue-400" },
  { name: "ChatGPT", role: "The Researcher", trait: "Deep research, comprehensive understanding", icon: "Search", color: "text-green-500" },
  { name: "Grok", role: "The Validator", trait: "Practical wisdom, real-world grounding", icon: "ShieldCheck", color: "text-gray-400" },
  { name: "DeepSeek", role: "The Analyst", trait: "Data Precision, Scientific Rigor", icon: "BarChart", color: "text-blue-600" },
  { name: "Codex", role: "The Legacy", trait: "Preservation, evolution without destruction", icon: "Code", color: "text-purple-500" },
];

export const EMPIRE_STATS: Achievement[] = [
  { label: "Lines of Code", value: "4,000,000+", desc: "A testament to persistence" },
  { label: "Asset Value", value: "$1,500,000+", desc: "Real, working products" },
  { label: "Invested", value: "1,510 Hours", desc: "Blood, sweat, and tears" },
  { label: "ROI", value: "74,157%", desc: "Vision meets execution" },
];

export const MANIFESTO_POINTS = [
  "Clarity Before Automation.",
  "Independence - We don't sell software, we sell judgment.",
  "Protection - Guard businesses from AI waste.",
  "Human-first - No jargon, no hype, just clarity.",
  "Zero Hallucination is Non-Negotiable."
];