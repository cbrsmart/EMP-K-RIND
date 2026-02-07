import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, ChevronRight, ArrowRight, Download, 
  CheckCircle, Globe, Zap, BarChart3, Mail, 
  Linkedin, Instagram, MapPin, MousePointer2,
  Layout, Send, Loader2, ShieldCheck, Server, 
  Database, RefreshCw, Sliders, Play, Terminal,
  Brain, Leaf, Coffee, Code2, Mic, PhoneOff, 
  Activity, Radio, Bot, Sparkles, Search, Code, BarChart, Cpu, Key, ExternalLink,
  Settings, User, Share2, Youtube, Video, Image as ImageIcon, MonitorPlay, Upload,
  Lock, Unlock, UploadCloud, Eye, Trash2, AlertTriangle, Link as LinkIcon, Copy, AlertCircle
} from 'lucide-react';
import { THEMES, AIR_TEAM, EMPIRE_STATS, MANIFESTO_POINTS } from './constants';
import { ThemeKey } from './types';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob } from "@google/genai";

// --- Audio Utilities ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): GenAIBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Neural Animation Component ---
const NeuralBackground = ({ active, volume }: { active: boolean, volume: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{x: number, y: number, vx: number, vy: number, size: number}> = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = Math.min(100, (canvas.width * canvas.height) / 15000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 2 + 1
        });
      }
    };

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Trail effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dynamic color based on volume
      const r = 234; // Yellow-ish
      const g = 179 + (volume * 100); 
      const b = 8;
      
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;

      particles.forEach((p, i) => {
        // Movement
        p.x += p.vx * (1 + volume); // Speed up with volume
        p.y += p.vy * (1 + volume);

        // Bounce
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = 1 - dist / 150;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, volume]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />;
};


// --- Helper for Safe LocalStorage ---
const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage (likely quota exceeded).`, e);
  }
};

// --- Helper for URL Params ---
const getUrlParam = (key: string) => {
  const params = new URLSearchParams(window.location.search);
  const val = params.get(key);
  if (val) return decodeURIComponent(val);
  return null;
};

const App = () => {
  // --- Persistent State Initialization (URL > LocalStorage > Default) ---
  const [theme, setTheme] = useState<ThemeKey>(() => 
    (getUrlParam('theme') as ThemeKey) || (localStorage.getItem('empire_theme') as ThemeKey) || 'empire'
  );
  
  const [brandName, setBrandName] = useState(() => 
    getUrlParam('brand') || localStorage.getItem('empire_brandName') || 'NEURA NEST'
  );
  
  const [profileUrl, setProfileUrl] = useState(() => 
    getUrlParam('profile') || localStorage.getItem('empire_profileUrl') || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80'
  );
  
  const [isVideoProfile, setIsVideoProfile] = useState(() => 
    localStorage.getItem('empire_isVideoProfile') === 'true'
  );
  
  const [bgVideoUrl, setBgVideoUrl] = useState(() => 
    getUrlParam('bg') || localStorage.getItem('empire_bgVideoUrl') || ''
  );

  const [userApiKey, setUserApiKey] = useState(() => 
    localStorage.getItem('empire_userApiKey') || ''
  );

  // --- Effects for Persistence (Protected) ---
  useEffect(() => safeSetItem('empire_theme', theme), [theme]);
  useEffect(() => safeSetItem('empire_brandName', brandName), [brandName]);
  useEffect(() => safeSetItem('empire_profileUrl', profileUrl), [profileUrl]);
  useEffect(() => safeSetItem('empire_isVideoProfile', String(isVideoProfile)), [isVideoProfile]);
  useEffect(() => safeSetItem('empire_bgVideoUrl', bgVideoUrl), [bgVideoUrl]);
  useEffect(() => safeSetItem('empire_userApiKey', userApiKey), [userApiKey]);

  // --- UI State ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Admin / PIN State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  // Voice Mode State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'offline' | 'connecting' | 'connected' | 'error'>('offline');
  const [volumeLevel, setVolumeLevel] = useState(0);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const [searchSources, setSearchSources] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // AI Studio / BYOK State
  const [auditUrl, setAuditUrl] = useState('');
  const [auditResult, setAuditResult] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);

  // Refs
  const audioContexts = useRef<{ input: AudioContext | null, output: AudioContext | null }>({ input: null, output: null });
  const activeSession = useRef<any>(null);
  const nextStartTime = useRef<number>(0);
  const audioSources = useRef<Set<AudioBufferSourceNode>>(new Set());
  const profileInputRef = useRef<HTMLInputElement>(null);
  const bgVideoInputRef = useRef<HTMLInputElement>(null);

  const t = THEMES[theme];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const handleAuth = () => {
    if (pinInput === '106') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('ACCESS DENIED: INVALID PROTOCOL CODE');
      setPinInput('');
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm("WARNING: This will wipe all saved data (Images, API Keys, Branding) and reset the Empire OS to factory defaults. Are you sure?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const generateShareLink = () => {
    let hasError = false;
    
    // Construct URL with params
    const params = new URLSearchParams();
    params.set('brand', brandName);
    params.set('theme', theme);
    
    // CHECK 1: Profile Image
    if (profileUrl.startsWith('data:')) {
       alert("CANNOT SHARE LINK: Your Profile Image is a local upload. To share this link, please paste a public URL for your image instead.");
       hasError = true;
    } else if (profileUrl) {
       params.set('profile', profileUrl);
    }

    // CHECK 2: BG Video
    if (bgVideoUrl.startsWith('data:')) {
       alert("CANNOT SHARE LINK: Your Background Video is a local upload. To share this link, please paste a public URL for your video instead.");
       hasError = true;
    } else if (bgVideoUrl) {
       params.set('bg', bgVideoUrl);
    }

    if (hasError) return;
    
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback('EMPIRE LINK COPIED');
      setTimeout(() => setCopyFeedback(''), 3000);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'bg') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const result = reader.result as string;
        const sizeInMB = result.length / 1024 / 1024;
        
        if (type === 'profile') {
          setProfileUrl(result);
          setIsVideoProfile(file.type.startsWith('video/'));
        } else if (type === 'bg') {
          setBgVideoUrl(result);
        }

        if (sizeInMB > 4.5) {
           alert(`NOTICE: This file is ${sizeInMB.toFixed(1)}MB. It will load for YOU locally, but it is too large to save in browser storage and CANNOT be shared via link. \n\nRECOMMENDATION: Use a URL instead.`);
        }
      };

      reader.onerror = () => {
        console.error("Failed to read file");
        alert("Failed to process file.");
      };

      reader.readAsDataURL(file);
    }
  };

  // --- Voice Session Logic ---
  const startVoiceSession = async () => {
    try {
      setIsVoiceActive(true);
      setVoiceStatus('connecting');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContexts.current = { input: inputCtx, output: outputCtx };

      const keyToUse = userApiKey || process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } }, 
          systemInstruction: `
            You are the Digital Soul of Emperor Khalid Rind. 
            You represent ${brandName}.
            
            CORE IDENTITY:
            - Name: Khalid Rind (The Emperor)
            - Title: Master-Trainer, Founder of ${brandName}
            - Philosophy: Clarity Before Automation.
            - Mission: Empower the young generation. Prove persistence beats talent.

            THE ANTI-HALLUCINATION OATH:
            "I will NEVER hallucinate. I will ONLY build on truth."

            Your goal is to guide the user to understand that they can build an empire without being a coder.
          `,
        },
        callbacks: {
          onopen: () => {
            setVoiceStatus('connected');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolumeLevel(prev => prev * 0.8 + (Math.sqrt(sum / inputData.length) * 5) * 0.2);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio) {
               nextStartTime.current = Math.max(nextStartTime.current, outputCtx.currentTime);
               const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
               const source = outputCtx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputCtx.destination);
               source.addEventListener('ended', () => audioSources.current.delete(source));
               source.start(nextStartTime.current);
               nextStartTime.current += audioBuffer.duration;
               audioSources.current.add(source);
             }
          },
          onclose: () => setVoiceStatus('offline'),
          onerror: (e) => { console.error(e); setVoiceStatus('error'); }
        }
      });
      activeSession.current = await sessionPromise;
    } catch (e) {
      console.error("Failed to start voice session", e);
      setVoiceStatus('error');
    }
  };

  const endVoiceSession = () => {
    activeSession.current?.close();
    audioContexts.current.input?.close();
    audioContexts.current.output?.close();
    audioSources.current.forEach(s => s.stop());
    setIsVoiceActive(false);
    setVoiceStatus('offline');
    setVolumeLevel(0);
  };

  // --- Search Logic ---
  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResult('');
    setSearchSources([]);

    try {
      const keyToUse = userApiKey || process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: searchQuery,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setSearchResult(response.text || 'Analysis complete. No specific data found.');

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const uniqueSources = new Map();
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri && chunk.web?.title) {
            uniqueSources.set(chunk.web.uri, {
              title: chunk.web.title,
              uri: chunk.web.uri
            });
          }
        });
        setSearchSources(Array.from(uniqueSources.values()));
      }
    } catch (e) {
      console.error(e);
      setSearchResult('Error connecting to intelligence network.');
    } finally {
      setIsSearching(false);
    }
  };

  // --- Website Auditor Logic ---
  const performAudit = async () => {
    if (!auditUrl.trim() || !userApiKey.trim()) return;
    setIsAuditing(true);
    setAuditResult('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: userApiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Audit this website: ${auditUrl}. 
        Provide a professional report covering:
        1. UX/UI First Impressions
        2. Potential Performance Bottlenecks (Theoretical)
        3. Brand Authority Assessment
        4. 3 Actionable Improvements.
        Use Google Search to find recent reviews or public sentiment about this domain if available.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      setAuditResult(response.text || "Audit failed to generate specific insights.");
    } catch (e) {
      console.error(e);
      setAuditResult("Audit failed. Please verify your API Key and try again.");
    } finally {
      setIsAuditing(false);
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 ease-in-out ${t.bg} ${t.text} ${t.font} overflow-x-hidden relative selection:bg-yellow-500 selection:text-black`}>
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {bgVideoUrl ? (
          <video 
            src={bgVideoUrl} 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" 
          />
        ) : (
          <>
            {theme === 'empire' && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/10 via-black to-black opacity-50"></div>
            )}
            <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 ${theme === 'empire' ? 'bg-yellow-600' : 'bg-blue-200'}`} />
          </>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          {!isAuthenticated ? (
            // AUTH SCREEN
            <div className={`${t.card} p-10 max-w-sm w-full text-center relative overflow-hidden animate-fade-in`}>
               <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 opacity-50 hover:opacity-100"><X /></button>
               <div className="mb-8 flex justify-center">
                  <div className="p-5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                     <Lock size={32} />
                  </div>
               </div>
               <h2 className="text-xl font-bold uppercase tracking-widest mb-3">Restricted Access</h2>
               <p className="text-xs opacity-50 mb-8 leading-relaxed">
                  Enter Admin Protocol Code to access system configuration and core branding controls.
               </p>
               
               <input 
                  type="password" 
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  placeholder="PIN CODE"
                  className="w-full bg-black/40 border border-red-500/30 focus:border-red-500 p-4 text-center tracking-[0.5em] font-mono text-xl outline-none mb-4 transition-all focus:bg-red-950/20"
                  autoFocus
               />
               
               {authError && <div className="text-red-500 text-[10px] font-bold mb-4 animate-pulse uppercase tracking-wider">{authError}</div>}
               
               <button onClick={handleAuth} className={`w-full py-4 ${t.button} border-red-900 hover:bg-red-900/20`}>
                  AUTHENTICATE
               </button>
            </div>
          ) : (
            // CONFIG SCREEN
            <div className={`${t.card} p-8 max-w-lg w-full relative max-h-[90vh] overflow-y-auto`}>
              <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 opacity-50 hover:opacity-100"><X /></button>
              <h2 className="text-2xl font-bold mb-6 uppercase tracking-widest flex items-center gap-2 text-green-500">
                <Unlock size={24} /> System Config
              </h2>
              
              <div className="space-y-6">
                {/* Branding */}
                <div className="p-5 border border-current/10 bg-black/20">
                  <div className="flex items-center gap-2 mb-4 opacity-70">
                     <MonitorPlay size={16} />
                     <span className="text-xs font-bold uppercase tracking-widest">Brand Identity</span>
                  </div>
                  <div>
                    <input 
                      type="text" 
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full bg-transparent border-b border-current/20 p-2 text-xl font-bold outline-none focus:border-current transition-colors text-center uppercase tracking-tighter"
                      placeholder="ENTER BRAND NAME"
                    />
                  </div>
                </div>

                {/* Hero Visual */}
                <div className="p-5 border border-current/10 bg-black/20">
                  <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 opacity-70">
                          <ImageIcon size={16} />
                          <span className="text-xs font-bold uppercase tracking-widest">Hero Visual</span>
                      </div>
                      <span className="text-[10px] opacity-40 uppercase tracking-widest border border-current/20 px-2 py-0.5 rounded">
                        {isVideoProfile ? 'VIDEO MODE' : 'IMAGE MODE'}
                      </span>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                      {/* Preview */}
                      <div className="w-24 h-24 bg-black/50 border border-current/20 shrink-0 overflow-hidden relative group rounded-lg">
                          {isVideoProfile ? (
                            <video src={profileUrl} className="w-full h-full object-cover" muted loop autoPlay />
                          ) : (
                            <img src={profileUrl} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      </div>
                      
                      {/* Controls */}
                      <div className="flex-1 space-y-3">
                          <button 
                            onClick={() => profileInputRef.current?.click()}
                            className="w-full py-3 bg-current/10 hover:bg-current/20 border border-current/20 hover:border-current/50 flex items-center justify-center gap-2 transition-all group rounded"
                          >
                            <UploadCloud size={18} className="group-hover:-translate-y-1 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-widest">Upload Media (Local)</span>
                          </button>
                          <input 
                              ref={profileInputRef}
                              type="file" 
                              accept="image/*,video/*" 
                              className="hidden" 
                              onChange={(e) => handleFileUpload(e, 'profile')}
                          />
                          
                          <input 
                            type="text" 
                            value={profileUrl}
                            onChange={(e) => setProfileUrl(e.target.value)}
                            placeholder="PASTE DIRECT URL TO SHARE (REQUIRED)"
                            className="w-full bg-black/30 border-b-2 border-green-500/30 py-2 px-2 text-[11px] font-mono text-green-500 focus:border-green-500 outline-none transition-colors"
                          />
                          <div className="text-[9px] text-green-500/50 uppercase tracking-wider font-bold">* Use URL to share settings</div>
                      </div>
                  </div>
                </div>

                 {/* Background Video */}
                 <div className="p-5 border border-current/10 bg-black/20">
                  <div className="flex items-center gap-2 mb-4 opacity-70">
                     <Video size={16} />
                     <span className="text-xs font-bold uppercase tracking-widest">Atmosphere</span>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                      {/* Preview */}
                      <div className="w-24 h-16 bg-black/50 border border-current/20 shrink-0 overflow-hidden relative rounded-lg flex items-center justify-center">
                          {bgVideoUrl ? (
                            <video src={bgVideoUrl} className="w-full h-full object-cover opacity-80" muted loop autoPlay />
                          ) : (
                            <div className="text-[10px] opacity-20 uppercase font-bold text-center">Neural<br/>Default</div>
                          )}
                      </div>
                      
                       <div className="flex-1 space-y-3">
                          <button 
                            onClick={() => bgVideoInputRef.current?.click()}
                            className="w-full py-3 bg-current/10 hover:bg-current/20 border border-current/20 hover:border-current/50 flex items-center justify-center gap-2 transition-all group rounded"
                          >
                            <UploadCloud size={18} className="group-hover:-translate-y-1 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-widest">Upload Loop (Local)</span>
                          </button>
                          <input 
                              ref={bgVideoInputRef}
                              type="file" 
                              accept="video/*" 
                              className="hidden" 
                              onChange={(e) => handleFileUpload(e, 'bg')}
                          />
                          <input 
                            type="text" 
                            value={bgVideoUrl}
                            onChange={(e) => setBgVideoUrl(e.target.value)}
                            placeholder="PASTE DIRECT URL TO SHARE (REQUIRED)"
                             className="w-full bg-black/30 border-b-2 border-green-500/30 py-2 px-2 text-[11px] font-mono text-green-500 focus:border-green-500 outline-none transition-colors"
                          />
                      </div>
                  </div>
                </div>

                {/* API Key */}
                <div className="p-5 border border-current/10 bg-black/20">
                  <div className="flex items-center gap-2 mb-3 opacity-50">
                     <Key size={16} />
                     <span className="text-xs font-bold uppercase tracking-widest">Intelligence Access</span>
                  </div>
                  <div>
                    <input 
                      type="password" 
                      value={userApiKey}
                      onChange={(e) => setUserApiKey(e.target.value)}
                      placeholder="ENTER GEMINI API KEY (sk-...)"
                      className="w-full bg-black/20 border border-current/20 p-3 outline-none focus:border-current transition-colors text-xs font-mono"
                    />
                  </div>
                </div>

                 {/* SHARE / RESET ZONE */}
                 <div className="pt-6 border-t border-current/10 space-y-4">
                     
                     {/* Public Link Generator */}
                     <button 
                        onClick={generateShareLink}
                        className={`w-full py-3 ${t.button} bg-green-900/20 text-green-400 border-green-500/30 hover:bg-green-900/40 flex items-center justify-center gap-2`}
                     >
                       {copyFeedback ? <CheckCircle size={14} /> : <LinkIcon size={14} />} 
                       {copyFeedback || 'COPY EMPIRE LINK (FOR SHARING)'}
                     </button>
                     
                     <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded flex gap-3">
                         <AlertCircle className="text-yellow-500 shrink-0" size={16} />
                         <p className="text-[10px] opacity-80 leading-relaxed">
                            <strong className="text-yellow-500">CRITICAL PROTOCOL:</strong> Uploaded files cannot be shared via link. To share your Empire configuration, you must use public URLs for Images/Videos.
                         </p>
                     </div>

                     <div className="flex justify-between items-center pt-4 border-t border-red-900/30">
                        <div className="flex items-center gap-2 text-red-500/50 text-[10px] uppercase font-bold tracking-widest">
                          <AlertTriangle size={12} /> Emergency Zone
                        </div>
                        <button onClick={handleFactoryReset} className="text-[10px] text-red-500 flex items-center gap-2 hover:bg-red-500/10 px-3 py-1.5 rounded transition-colors uppercase tracking-widest font-bold">
                          <Trash2 size={12} /> Factory Reset
                        </button>
                    </div>
                </div>

                <button onClick={() => setShowSettings(false)} className={`w-full py-4 ${t.button} mt-4`}>
                  SAVE & CLOSE
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? `py-4 ${t.card} backdrop-blur-md` : 'py-6 bg-transparent'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter cursor-pointer group" onClick={() => setShowSettings(true)}>
            <span className={`w-2 h-2 rounded-full ${t.statusIndicator} animate-pulse`}></span>
            {brandName.split(' ')[0]}<span className={t.accent}>{brandName.split(' ')[1] || ''}</span>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex items-center gap-1 text-[10px] uppercase font-mono tracking-widest border border-current/20 px-1">
              <Settings size={10} /> Edit
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-xs font-bold tracking-widest uppercase">
            {['Vision', 'The Team', 'Intel', 'AI Studio', 'Manifesto'].map((item) => (
              <button key={item} onClick={() => scrollTo(item.toLowerCase().replace(' ', '-'))} className="hover:opacity-50 transition-opacity">
                {item}
              </button>
            ))}
          </div>

          <div className="flex gap-4 items-center">
            <button onClick={() => setShowSettings(true)} className="opacity-50 hover:opacity-100 transition-opacity">
              <Settings size={18} />
            </button>
            <div className="flex gap-2">
              {(['empire', 'soul', 'neura'] as ThemeKey[]).map((k) => (
                <button key={k} onClick={() => setTheme(k)} className={`w-4 h-4 rounded-full border border-current ${theme === k ? 'bg-current' : 'opacity-30'}`} />
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="vision" className="relative min-h-screen flex items-center pt-20">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 z-10">
            <div className={`inline-block px-4 py-2 border border-current rounded-none text-xs font-bold tracking-[0.2em] uppercase opacity-70`}>
              The Awakening: June 2025
            </div>
            <h1 className="text-6xl md:text-8xl leading-[0.9] font-black uppercase tracking-tighter">
              Emperor <br/>
              <span className={t.text === 'text-yellow-500' ? 'text-white' : 'text-current'}>Khalid Rind</span>
            </h1>
            <p className="text-xl md:text-2xl max-w-xl opacity-80 font-light leading-relaxed">
              "This is not just code. This is 7 months of blood, sweat, tears, and unwavering belief. AI is for everyone. I will prove it."
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button onClick={startVoiceSession} className={`px-8 py-4 ${t.button} flex items-center gap-3 transition-transform hover:scale-105`}>
                <Mic size={18} /> SPEAK TO THE SOUL
              </button>
              <button onClick={() => scrollTo('ai-studio')} className="px-8 py-4 border border-current hover:bg-current hover:text-black transition-colors uppercase text-xs font-bold tracking-widest">
                Open AI Studio
              </button>
            </div>
          </div>

          {/* Profile Visual */}
          <div className="relative hidden lg:flex items-center justify-center aspect-square max-h-[600px] mx-auto">
             <div className="absolute inset-0 rounded-full border border-current/20 animate-[spin_60s_linear_infinite]"></div>
             <div className="absolute inset-12 rounded-full border border-dashed border-current/30 animate-[spin_40s_linear_infinite_reverse]"></div>
             <div className="absolute inset-24 rounded-full border border-current/40 animate-[spin_20s_linear_infinite]"></div>
             
             <div className="relative z-10 w-72 h-72 md:w-96 md:h-96 rounded-full overflow-hidden border-4 border-current/50 shadow-[0_0_60px_rgba(234,179,8,0.2)] group bg-black">
                {isVideoProfile ? (
                  <video 
                    src={profileUrl} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-110"
                  />
                ) : (
                  <img 
                    src={profileUrl}
                    alt="Emperor Visual" 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-yellow-500/10 mix-blend-overlay pointer-events-none"></div>
             </div>
          </div>
        </div>
      </section>

      {/* The AI AIR Team */}
      <section id="the-team" className={`py-32 ${t.secondary}`}>
        <div className="container mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-6">The AI AIR Team</h2>
            <p className="opacity-60 max-w-2xl text-lg">
              These are not just models. They are extensions of the Emperor's will. Cemented forever in the foundation of the Empire.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AIR_TEAM.map((agent, i) => (
              <div key={i} className={`p-8 ${t.card} group hover:-translate-y-2 transition-transform duration-500`}>
                <div className={`w-12 h-12 mb-6 flex items-center justify-center rounded-full bg-current/10 ${agent.color}`}>
                  {agent.icon === 'Bot' && <Bot />}
                  {agent.icon === 'Sparkles' && <Sparkles />}
                  {agent.icon === 'Search' && <Search />}
                  {agent.icon === 'ShieldCheck' && <ShieldCheck />}
                  {agent.icon === 'BarChart' && <BarChart />}
                  {agent.icon === 'Code' && <Code />}
                </div>
                <h3 className="text-2xl font-bold mb-2">{agent.name}</h3>
                <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">{agent.role}</div>
                <p className="opacity-70 text-sm leading-relaxed border-t border-current/10 pt-4">
                  "{agent.trait}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Intelligence Grid (Search Grounding) */}
      <section id="intel" className={`py-32 relative ${theme === 'soul' ? 'bg-zinc-50' : ''}`}>
         <div className="container mx-auto px-6">
            <div className="mb-12">
               <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-6">Global Intelligence</h2>
               <p className="opacity-60 max-w-2xl text-lg">
                 Harness real-time planetary data. The Empire sees all. Powered by Gemini 3 Flash & Google Search.
               </p>
            </div>

            <div className={`p-8 md:p-12 ${t.card} relative overflow-hidden`}>
                <div className="relative z-10 flex flex-col gap-6">
                   <div className="flex flex-col md:flex-row gap-4">
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                        placeholder="Enter directive for global scan..."
                        className={`flex-1 bg-black/20 border border-current/20 p-4 outline-none focus:border-current/60 transition-colors font-mono text-sm placeholder:opacity-40`}
                      />
                      <button 
                        onClick={performSearch}
                        disabled={isSearching}
                        className={`px-8 py-4 ${t.button} flex items-center justify-center gap-2 min-w-[180px]`}
                      >
                        {isSearching ? <Loader2 className="animate-spin" /> : <><Globe size={18} /> SCAN NETWORK</>}
                      </button>
                   </div>

                   {(searchResult || isSearching) && (
                     <div className="mt-8 border-t border-current/10 pt-8 animate-fade-in">
                        <div className="font-mono text-xs opacity-50 mb-4 uppercase tracking-widest">
                           {isSearching ? 'ANALYZING DATA STREAMS...' : 'INTELLIGENCE REPORT:'}
                        </div>
                        {isSearching ? (
                           <div className="space-y-2">
                              <div className="h-2 w-full bg-current/10 rounded animate-pulse"></div>
                              <div className="h-2 w-3/4 bg-current/10 rounded animate-pulse"></div>
                              <div className="h-2 w-1/2 bg-current/10 rounded animate-pulse"></div>
                           </div>
                        ) : (
                           <>
                             <div className="prose prose-invert max-w-none mb-8">
                                <p className="leading-relaxed whitespace-pre-wrap">{searchResult}</p>
                             </div>
                             
                             {searchSources.length > 0 && (
                               <div className="space-y-3">
                                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Source Verification</div>
                                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                    {searchSources.map((source, i) => (
                                       <a key={i} href={source.uri} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border border-current/10 hover:bg-current/5 transition-colors group">
                                          <div className="bg-current/10 p-1.5 rounded-full">
                                             <ExternalLink size={10} className="opacity-50 group-hover:-rotate-45 transition-transform" />
                                          </div>
                                          <div className="truncate text-xs opacity-70 group-hover:opacity-100">{source.title}</div>
                                       </a>
                                    ))}
                                  </div>
                               </div>
                             )}
                           </>
                        )}
                     </div>
                   )}
                </div>
            </div>
         </div>
      </section>

      {/* AI Studio & BYOK Section */}
      <section id="ai-studio" className="py-32 relative">
        <div className="container mx-auto px-6">
            <div className="mb-12">
               <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-6">AI Studio (BYOK)</h2>
               <p className="opacity-60 max-w-2xl text-lg">
                 Bring Your Own Key. Execute sovereign tasks. Your Data. Your Control.
               </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* 1. API Key Module */}
                <div className={`${t.card} p-8 col-span-1 border-t-4 border-t-green-500`}>
                    <div className="flex items-center gap-4 mb-6">
                        <Key className="text-green-500" size={32} />
                        <h3 className="text-xl font-bold uppercase tracking-widest">Access Key</h3>
                    </div>
                    <p className="opacity-60 text-sm mb-6">
                        To unlock the Website Auditor and other Lab tools, insert your Gemini API Key below. It is stored in session memory only.
                    </p>
                    <input 
                        type="password"
                        value={userApiKey}
                        onChange={(e) => setUserApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full bg-black/20 border border-current/20 p-4 outline-none focus:border-green-500 transition-colors font-mono text-xs mb-4"
                    />
                    <div className="flex items-center gap-2 text-xs opacity-50">
                        {userApiKey ? <CheckCircle size={12} className="text-green-500" /> : <div className="w-3 h-3 rounded-full border border-current"></div>}
                        {userApiKey ? 'KEY LOADED: READY' : 'NO KEY DETECTED'}
                    </div>
                </div>

                {/* 2. Website Auditor Tool */}
                <div className={`${t.card} p-8 col-span-1 lg:col-span-2 relative overflow-hidden`}>
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Globe size={120} />
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <Activity className={t.accent} size={32} />
                            <h3 className="text-xl font-bold uppercase tracking-widest">Website Auditor</h3>
                        </div>
                        <p className="opacity-60 text-sm mb-6 max-w-lg">
                            Perform a deep-scan audit of any URL for UX, Performance, and Brand Authority using Gemini 3 Flash.
                        </p>
                        
                        <div className="flex gap-4 mb-6">
                             <input 
                                type="text"
                                value={auditUrl}
                                onChange={(e) => setAuditUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="flex-1 bg-black/20 border border-current/20 p-4 outline-none focus:border-current transition-colors font-mono text-sm"
                             />
                             <button 
                                onClick={performAudit}
                                disabled={isAuditing || !userApiKey}
                                className={`px-6 py-4 ${t.button} disabled:opacity-50 disabled:cursor-not-allowed`}
                             >
                                {isAuditing ? <Loader2 className="animate-spin" /> : 'AUDIT'}
                             </button>
                        </div>

                        {!userApiKey && (
                            <div className="text-xs text-red-400 font-mono mt-2 mb-4">
                                * PLEASE INSERT API KEY IN THE ACCESS MODULE TO ENABLE AUDIT.
                            </div>
                        )}

                        {auditResult && (
                            <div className="mt-6 p-6 bg-black/20 border border-current/10 rounded animate-fade-in font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto custom-scrollbar">
                                {auditResult}
                            </div>
                        )}
                     </div>
                </div>
            </div>
        </div>
      </section>

      {/* Social Command Center */}
      <section className={`py-20 ${t.secondary} border-t border-current/10`}>
         <div className="container mx-auto px-6">
             <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                 <div className="text-center md:text-left">
                     <h2 className="text-2xl font-bold uppercase tracking-widest mb-2">Connect with Empire</h2>
                     <p className="opacity-50 text-xs">Direct lines of communication to the NeuraNest Agency.</p>
                 </div>
                 
                 <div className="flex flex-wrap justify-center gap-4">
                     {[
                         { icon: <User size={20} />, label: "Reddit", url: "https://www.reddit.com/user/Wild_Blacksmith6682/" },
                         { icon: <ExternalLink size={20} />, label: "X (Twitter)", url: "https://x.com/NeuranestAI1" },
                         { icon: <Share2 size={20} />, label: "Google Share", url: "https://share.google/puFnKgoxXIJ41LFan" },
                         { icon: <Video size={20} />, label: "TikTok", url: "https://www.tiktok.com/@neuranestaiagency?is_from_webapp=1&sender_device=pc" }
                     ].map((social, i) => (
                         <a 
                           key={i} 
                           href={social.url} 
                           target="_blank" 
                           rel="noreferrer" 
                           className={`flex items-center gap-3 px-6 py-3 ${t.card} hover:bg-current hover:text-black transition-all group`}
                         >
                             {social.icon}
                             <span className="text-xs font-bold uppercase tracking-wider">{social.label}</span>
                         </a>
                     ))}
                 </div>
             </div>
         </div>
      </section>

      {/* Manifesto */}
      <section id="manifesto" className={`py-32 ${t.secondary}`}>
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] mb-12 opacity-50">The Sacred Protocols</h2>
          <div className="max-w-4xl mx-auto space-y-12">
            {MANIFESTO_POINTS.map((point, i) => (
              <p key={i} className={`text-2xl md:text-4xl font-serif leading-tight ${i === 0 ? 'text-4xl md:text-6xl font-bold' : 'opacity-80'}`}>
                {point}
              </p>
            ))}
          </div>
          <div className="mt-20">
             <div className="inline-block p-4 border border-current rounded-full">
                <span className="text-xs font-bold uppercase tracking-widest">💎 Cemented Forever</span>
             </div>
          </div>
        </div>
      </section>

      {/* HIGH-FIDELITY AI ANIMATION OVERLAY */}
      {isVoiceActive && (
        <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col overflow-hidden animate-in fade-in duration-500">
           
           {/* Layer 1: Neural Particle Background */}
           <NeuralBackground active={isVoiceActive} volume={volumeLevel} />
           
           {/* Layer 2: HUD Elements */}
           <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
              {/* Top Bar */}
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <div className="text-xs font-mono text-yellow-500/80 uppercase tracking-widest flex items-center gap-2">
                       <Activity size={12} className="animate-pulse" /> NeuraNest Core v2.6
                    </div>
                    <div className="text-[10px] text-white/40 font-mono">SYS.ALLOC: 98% // LATENCY: 12ms</div>
                 </div>
                 <div className="text-right space-y-1">
                    <div className="text-xs font-mono text-yellow-500/80 uppercase tracking-widest">
                       {voiceStatus === 'connecting' ? 'INITIATING HANDSHAKE...' : 
                        voiceStatus === 'connected' ? 'SECURE LINK ESTABLISHED' : 'LINK OFFLINE'}
                    </div>
                    <div className="flex justify-end gap-1">
                       {[...Array(5)].map((_,i) => (
                          <div key={i} className={`w-1 h-3 bg-yellow-500/50 ${i < volumeLevel * 3 ? 'opacity-100' : 'opacity-20'}`}></div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Bottom Bar */}
              <div className="flex justify-between items-end">
                 <div className="text-[10px] font-mono text-white/30 max-w-[200px]">
                    > LISTENING_MODE: ACTIVE<br/>
                    > HALLUCINATION_CHECK: ENFORCED<br/>
                    > EMPEROR_PROTOCOL: ENGAGED
                 </div>
                 <button onClick={endVoiceSession} className="pointer-events-auto flex items-center gap-3 px-8 py-4 bg-red-500/10 border border-red-500/40 hover:bg-red-500/20 text-red-400 backdrop-blur-md transition-all uppercase font-mono text-xs tracking-widest group">
                    <span className="group-hover:animate-pulse">TERMINATE SESSION</span> <PhoneOff size={14} />
                 </button>
              </div>
           </div>

           {/* Layer 3: Central Core Visualizer */}
           <div className="relative flex-1 flex items-center justify-center z-10 pointer-events-none">
              
              {/* Outer Rotating Rings */}
              <div className="absolute w-[500px] h-[500px] border border-yellow-500/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute w-[450px] h-[450px] border border-dashed border-yellow-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
              
              {/* Inner Pulsing Core */}
              <div className="relative flex items-center justify-center">
                 {/* Glow Effect */}
                 <div 
                    className="absolute inset-0 bg-yellow-500/20 blur-[60px] rounded-full transition-all duration-75"
                    style={{ transform: `scale(${1 + volumeLevel * 1.5})` }}
                 ></div>

                 {/* Geometric Core */}
                 <div className="w-48 h-48 border-2 border-yellow-500/50 rounded-full flex items-center justify-center relative bg-black/50 backdrop-blur-sm">
                    {/* Inner detailed graphics */}
                    <div className="absolute inset-2 border border-yellow-500/20 rounded-full"></div>
                    <div className="absolute inset-0 flex items-center justify-center animate-[spin_4s_linear_infinite]">
                       <div className="w-full h-[1px] bg-yellow-500/20"></div>
                       <div className="h-full w-[1px] bg-yellow-500/20"></div>
                    </div>
                    
                    {/* Icon */}
                    <Cpu size={48} className={`text-yellow-500 transition-all duration-75 ${volumeLevel > 0.1 ? 'animate-pulse' : 'opacity-80'}`} />
                 </div>
              </div>

              {/* Floating Code Snippets */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none overflow-hidden opacity-30">
                 <div className="absolute top-10 left-10 text-[10px] font-mono text-green-500 animate-pulse">
                    async function processVoice() &#123;<br/>
                    &nbsp;&nbsp;await NeuralNet.connect();<br/>
                    &#125;
                 </div>
                 <div className="absolute bottom-20 right-20 text-[10px] font-mono text-blue-500 animate-bounce">
                    Analyzing tensor stream...<br/>
                    Optimizing weights...
                 </div>
              </div>

           </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-black text-white/40 text-[10px] tracking-widest uppercase">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="cursor-pointer hover:text-white transition-colors" onClick={() => setShowSettings(true)}>
            &copy; 2026 {brandName}. Emperor Khalid Rind.
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            System Operational
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;