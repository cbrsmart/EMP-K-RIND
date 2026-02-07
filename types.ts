export interface ThemeConfig {
  id: string;
  name: string;
  bg: string;
  text: string;
  accent: string;
  primary: string;
  secondary: string;
  font: string;
  button: string;
  card: string;
  statusIndicator: string;
}

export interface AgentProfile {
  name: string;
  role: string;
  trait: string;
  icon: string;
  color: string;
}

export interface Achievement {
  label: string;
  value: string;
  desc: string;
}

export type ThemeKey = 'soul' | 'empire' | 'neura';