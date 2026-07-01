import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, HelpCircle, Activity, Sparkles, Info, Save, FolderOpen, Trash2 } from 'lucide-react';

import Header from './components/Header';
import NatalChart from './components/NatalChart';
import ControlPanel from './components/ControlPanel';
import AspectsList from './components/AspectsList';

import { PLANETS, SCALE_PRESETS, CELESTIAL_PRESETS, ZODIAC_SIGNS } from './constants';
import { getSynth, getFrequencyForAngle, CelestialSynth } from './synthesizer';
import { calculateAspects, getZodiacSignForAngle, getZodiacPositionLabel } from './utils';
import { Planet, Aspect, CelestialPreset, SynthParams } from './types';

// Generate safe background star positions once
const STARS = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 2 + 1,
  delay: Math.random() * 5,
  duration: Math.random() * 4 + 3
}));

export default function App() {
  const [planets, setPlanets] = useState<Planet[]>(() => {
    // Standard initialization
    return PLANETS;
  });

  const [scaleId, setScaleId] = useState<string>('lydian');
  const [rootNote, setRootNote] = useState<string>('C');
  const [customPresets, setCustomPresets] = useState<CelestialPreset[]>(() => {
    try {
      const saved = localStorage.getItem('astro_harmonics_custom_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load custom presets', e);
      return [];
    }
  });
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>('sun');
  const [audioState, setAudioState] = useState<'suspended' | 'running' | 'closed' | 'uninitialized'>('uninitialized');
  
  // Synthesizer parameters state
  const [synthParams, setSynthParams] = useState<SynthParams>({
    masterVolume: 0.4,
    filterCutoff: 1800,
    filterQ: 2.5,
    delayTime: 0.45,
    delayFeedback: 0.55,
    reverbWet: 0.45,
    lfoRate: 0.25,
    lfoDepth: 450
  });

  // Astrological Ascendant and Midheaven states
  const [ascendantAngle, setAscendantAngle] = useState<number>(224); // Scorpio 14°
  const [mcAngle, setMcAngle] = useState<number>(134); // Leo 14°
  const [ascendantDroneActive, setAscendantDroneActive] = useState<boolean>(true);
  const [mcDroneActive, setMcDroneActive] = useState<boolean>(true);
  const [isSynthesisActive, setIsSynthesisActive] = useState<boolean>(false);

  // States and helpers for floating Save Alignment flow in Celestial Orbit Sphere
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [loadModalTab, setLoadModalTab] = useState<'custom' | 'celestial'>('custom');
  const [presetName, setPresetName] = useState('');
  const [presetDesc, setPresetDesc] = useState('');

  const handleOpenSaveForm = () => {
    setIsLoadOpen(false);
    const currentScale = SCALE_PRESETS.find(s => s.id === scaleId) || SCALE_PRESETS[0];
    const activePlanetCount = planets.filter(p => p.active).length;
    const defaultName = `${rootNote} ${currentScale.name} Alignment (${activePlanetCount} Planets)`;
    setPresetName(defaultName);
    setPresetDesc(`Custom ambient configuration tuned to the ${currentScale.name} scale in the key of ${rootNote}.`);
    setIsSaving(true);
  };

  const handleConfirmSave = () => {
    if (!presetName.trim()) return;
    handleSavePreset(presetName.trim(), presetDesc.trim());
    setIsSaving(false);
    setPresetName('');
    setPresetDesc('');
  };

  // Get active synthesizer instance
  const synth = useMemo(() => getSynth(), []);

  // Listen for audio context state transitions
  useEffect(() => {
    synth.onStateChange = (state) => {
      setAudioState(state);
    };
    if (synth.ctx) {
      setAudioState(synth.ctx.state);
    }
    return () => {
      synth.onStateChange = null;
    };
  }, [synth]);

  // Sync active voices whenever planets, scale, rootNote, audioState, or isSynthesisActive changes
  useEffect(() => {
    if (audioState === 'running' && isSynthesisActive) {
      const scale = SCALE_PRESETS.find(s => s.id === scaleId) || SCALE_PRESETS[0];
      
      // Update normal planet voices
      planets.forEach(p => {
        if (p.active) {
          const { frequency } = getFrequencyForAngle(p.angle, p.baseOctave, rootNote, scale.intervals);
          const sign = getZodiacSignForAngle(p.angle);
          synth.triggerPlanet(p.id, frequency, sign.element);
        } else {
          synth.silencePlanet(p.id);
        }
      });

      // Update interactive Ascendant drone at a lower sub-octave (baseOctave = 1)
      if (ascendantDroneActive) {
        const { frequency } = getFrequencyForAngle(ascendantAngle, 1, rootNote, scale.intervals);
        const sign = getZodiacSignForAngle(ascendantAngle);
        synth.triggerPlanet('ascendant', frequency, sign.element);
      } else {
        synth.silencePlanet('ascendant');
      }

      // Update interactive Midheaven drone at a mid-octave (baseOctave = 2)
      if (mcDroneActive) {
        const { frequency } = getFrequencyForAngle(mcAngle, 2, rootNote, scale.intervals);
        const sign = getZodiacSignForAngle(mcAngle);
        synth.triggerPlanet('mc', frequency, sign.element);
      } else {
        synth.silencePlanet('mc');
      }
    } else {
      // If audio is suspended/paused or synthesis is inactive, silence continuous drones
      planets.forEach(p => {
        synth.silencePlanet(p.id);
      });
      synth.silencePlanet('ascendant');
      synth.silencePlanet('mc');
    }
  }, [planets, scaleId, rootNote, audioState, isSynthesisActive, synth, ascendantAngle, ascendantDroneActive, mcAngle, mcDroneActive]);

  // Sync synthesizer effects parameters
  useEffect(() => {
    synth.updateParams(synthParams);
  }, [synthParams, synth]);

  // Calculate real-time aspects between active planets
  const activeAspects = useMemo(() => {
    return calculateAspects(planets);
  }, [planets]);

  const ascSign = useMemo(() => getZodiacSignForAngle(ascendantAngle), [ascendantAngle]);
  const mcSign = useMemo(() => getZodiacSignForAngle(mcAngle), [mcAngle]);

  // Handler: Drag and update planet angle
  const handleUpdatePlanetAngle = (id: string, angle: number) => {
    if (id === 'ascendant') {
      setAscendantAngle(angle);
    } else if (id === 'mc') {
      setMcAngle(angle);
    } else {
      setPlanets(prev => prev.map(p => p.id === id ? { ...p, angle } : p));
    }
  };

  // Handler: Toggle planet on/off
  const handleTogglePlanet = (id: string) => {
    if (id === 'ascendant') {
      setAscendantDroneActive(prev => !prev);
    } else if (id === 'mc') {
      setMcDroneActive(prev => !prev);
    } else {
      setPlanets(prev => prev.map(p => {
        if (p.id === id) {
          const nextActive = !p.active;
          return { ...p, active: nextActive };
        }
        return p;
      }));
    }
  };

  // Handler: Adjust single synthesizer parameter
  const handleUpdateParams = (newParams: Partial<SynthParams>) => {
    setSynthParams(prev => ({ ...prev, ...newParams }));
  };

  // Handler: Apply cosmic alignment preset
  const handleApplyPreset = (preset: CelestialPreset) => {
    setScaleId(preset.scaleId);
    setRootNote(preset.rootNote);
    
    setPlanets(prev => prev.map(p => {
      const presetPlanet = preset.planets.find(pp => pp.id === p.id);
      if (presetPlanet) {
        return {
          ...p,
          angle: presetPlanet.angle,
          active: presetPlanet.active
        };
      }
      // If planet is not defined in preset, mute it to focus the sound
      return { ...p, active: false };
    }));

    if (preset.ascendantAngle !== undefined) {
      setAscendantAngle(preset.ascendantAngle);
    }
    if (preset.mcAngle !== undefined) {
      setMcAngle(preset.mcAngle);
    }
    if (preset.ascendantDroneActive !== undefined) {
      setAscendantDroneActive(preset.ascendantDroneActive);
    }
    if (preset.mcDroneActive !== undefined) {
      setMcDroneActive(preset.mcDroneActive);
    }

    // Select first active preset planet for user focus
    const firstActive = preset.planets.find(pp => pp.active);
    if (firstActive) {
      setSelectedPlanetId(firstActive.id);
    }
  };

  // Handler: Save custom cosmic alignment preset
  const handleSavePreset = (name: string, description: string) => {
    const newPreset: CelestialPreset = {
      id: `custom_${Date.now()}`,
      name,
      description,
      planets: planets.map(p => ({ id: p.id, angle: p.angle, active: p.active })),
      scaleId,
      rootNote,
      ascendantAngle,
      mcAngle,
      ascendantDroneActive,
      mcDroneActive
    };

    setCustomPresets(prev => {
      const updated = [...prev, newPreset];
      localStorage.setItem('astro_harmonics_custom_presets', JSON.stringify(updated));
      return updated;
    });
  };

  // Handler: Delete custom cosmic alignment preset
  const handleDeletePreset = (id: string) => {
    setCustomPresets(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('astro_harmonics_custom_presets', JSON.stringify(updated));
      return updated;
    });
  };

  // Handler: Activate/Toggle browser Audio Context and ambient planetary synthesis
  const handleToggleAudio = async () => {
    if (isSynthesisActive) {
      setIsSynthesisActive(false);
      synth.suspend();
      setAudioState('suspended');
    } else {
      await synth.resume();
      setAudioState('running');
      setIsSynthesisActive(true);
    }
  };

  // Helper: Retrieve formatted note name
  const getPlanetNoteName = (planet: Planet) => {
    const scale = SCALE_PRESETS.find(s => s.id === scaleId) || SCALE_PRESETS[0];
    const { noteName } = getFrequencyForAngle(planet.angle, planet.baseOctave, rootNote, scale.intervals);
    return noteName;
  };

  // Helper: Retrieve element name
  const getPlanetElementName = (planet: Planet) => {
    const sign = getZodiacSignForAngle(planet.angle);
    return sign.element;
  };

  const scaleName = SCALE_PRESETS.find(s => s.id === scaleId)?.name || 'Cosmic';

  return (
    <div 
      className="text-slate-100 min-h-screen font-sans antialiased relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200"
      style={{ background: 'radial-gradient(circle at 50% 50%, #1a0b2e 0%, #080810 100%)' }}
    >
      
      {/* Dynamic Ambient Pulsing Starfield */}
      <div id="starfield" className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {STARS.map((star) => (
          <div
            key={star.id}
            style={{
              position: 'absolute',
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              opacity: 0.15,
              animation: `pulse ${star.duration}s infinite ease-in-out`
            }}
            className="shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          />
        ))}
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Elegant Header */}
        <Header 
          ascendantLabel={getZodiacPositionLabel(ascendantAngle)} 
          mcLabel={getZodiacPositionLabel(mcAngle)} 
        />

        {/* Dynamic Warning if Audio is Uninitialized/Suspended */}
        <AnimatePresence>
          {audioState !== 'running' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-7xl mx-auto px-4 sm:px-6 mb-4"
            >
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>Audio Engine is currently paused. Connecting allows the Web Audio API to stream celestial harmonics.</span>
                </div>
                <button
                  onClick={handleToggleAudio}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-1.5 rounded-lg transition-all duration-200 cursor-pointer text-[11px]"
                >
                  Connect to Cosmos
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Dashboard Grid */}
        <main id="app-main-grid" className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-6">
          
          {/* Top Row: Chart and Live Aspects */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Box (Interactive Natal Wheel) */}
            <div className="md:col-span-7 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-center items-center relative overflow-hidden">
              <div className="w-full flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  Celestial Orbit Sphere
                </h2>
                <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const section = document.getElementById('tuning-scales-section');
                      if (section) {
                        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="text-[10px] text-slate-500 hover:text-indigo-300 transition-all duration-200 font-mono hidden sm:block mr-2 cursor-pointer group border border-white/5 hover:border-indigo-500/20 bg-white/5 hover:bg-indigo-950/30 px-2.5 py-1 rounded-lg"
                    title="Scroll to Tuning & Scales"
                  >
                    Scale: <span className="text-indigo-400 font-bold group-hover:text-indigo-300">{scaleName}</span> ({rootNote})
                  </button>

                  <button
                    onClick={() => {
                      if (isSaving) {
                        setIsSaving(false);
                      } else {
                        handleOpenSaveForm();
                      }
                    }}
                    className={`border text-[11px] font-mono font-semibold py-1 px-2.5 rounded-lg transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                      isSaving 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                        : 'bg-indigo-600/20 hover:bg-indigo-600/40 border-indigo-500/30 text-indigo-200'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5 text-indigo-300" />
                    Save
                  </button>

                  <button
                    onClick={() => {
                      setIsLoadOpen(prev => !prev);
                      setIsSaving(false);
                    }}
                    className={`border text-[11px] font-mono font-semibold py-1 px-2.5 rounded-lg transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                      isLoadOpen
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                        : 'bg-emerald-600/20 hover:bg-emerald-600/40 border-emerald-500/30 text-emerald-200'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-emerald-300" />
                    Load
                  </button>
                </div>
                </div>
              </div>

              <NatalChart
                planets={planets}
                activeAspects={activeAspects}
                selectedPlanetId={selectedPlanetId}
                onUpdatePlanetAngle={handleUpdatePlanetAngle}
                onSelectPlanet={setSelectedPlanetId}
                onTogglePlanet={handleTogglePlanet}
                rootNote={rootNote}
                scaleName={scaleName}
                getPlanetNoteName={getPlanetNoteName}
                ascendantAngle={ascendantAngle}
                mcAngle={mcAngle}
                ascendantActive={ascendantDroneActive}
                mcActive={mcDroneActive}
              />

              {/* ASC and MC Informational Control Blocks */}
              <div className="w-full mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-5 z-10">
                {/* ASC Block */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Ascendant (ASC)
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-300">
                        {getZodiacPositionLabel(ascendantAngle)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-lg">{ascSign.symbol}</span>
                      <span className="text-xs font-semibold text-slate-200">{ascSign.name}</span>
                      <span className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border ${
                        ascSign.element === 'fire' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        ascSign.element === 'earth' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        ascSign.element === 'air' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {ascSign.element}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-slate-400 leading-relaxed mb-4">
                      {ascSign.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/5">
                    {/* Controls */}
                    <div className="grid grid-cols-1 gap-2.5">
                      <div>
                        <div className="flex justify-between text-[9px] uppercase font-mono tracking-wider text-slate-500 mb-1">
                          <span>ASC Sign Position</span>
                        </div>
                        <select
                          value={Math.floor(ascendantAngle / 30) * 30}
                          onChange={(e) => {
                            const baseAngle = parseInt(e.target.value);
                            const currentOffset = ascendantAngle % 30;
                            setAscendantAngle(baseAngle + currentOffset);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          {ZODIAC_SIGNS.map(sign => (
                            <option key={sign.id} value={sign.startAngle}>
                              {sign.symbol} {sign.name} ({sign.element})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between text-[9px] uppercase font-mono tracking-wider text-slate-500 mb-1">
                          <span>Precise Degree: {ascendantAngle}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="359"
                          step="1"
                          value={ascendantAngle}
                          onChange={(e) => setAscendantAngle(parseInt(e.target.value))}
                          className="w-full accent-amber-500 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Ethereal Drone</span>
                      <button
                        onClick={() => setAscendantDroneActive(prev => !prev)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          ascendantDroneActive
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-500'
                        }`}
                      >
                        {ascendantDroneActive ? '● ACTIVE' : '○ MUTED'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* MC Block */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                        Midheaven (MC)
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-300">
                        {getZodiacPositionLabel(mcAngle)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-lg">{mcSign.symbol}</span>
                      <span className="text-xs font-semibold text-slate-200">{mcSign.name}</span>
                      <span className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border ${
                        mcSign.element === 'fire' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        mcSign.element === 'earth' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        mcSign.element === 'air' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {mcSign.element}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-slate-400 leading-relaxed mb-4">
                      {mcSign.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/5">
                    {/* Controls */}
                    <div className="grid grid-cols-1 gap-2.5">
                      <div>
                        <div className="flex justify-between text-[9px] uppercase font-mono tracking-wider text-slate-500 mb-1">
                          <span>MC Sign Position</span>
                        </div>
                        <select
                          value={Math.floor(mcAngle / 30) * 30}
                          onChange={(e) => {
                            const baseAngle = parseInt(e.target.value);
                            const currentOffset = mcAngle % 30;
                            setMcAngle(baseAngle + currentOffset);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          {ZODIAC_SIGNS.map(sign => (
                            <option key={sign.id} value={sign.startAngle}>
                              {sign.symbol} {sign.name} ({sign.element})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between text-[9px] uppercase font-mono tracking-wider text-slate-500 mb-1">
                          <span>Precise Degree: {mcAngle}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="359"
                          step="1"
                          value={mcAngle}
                          onChange={(e) => setMcAngle(parseInt(e.target.value))}
                          className="w-full accent-purple-500 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Resonance Drone</span>
                      <button
                        onClick={() => setMcDroneActive(prev => !prev)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          mcDroneActive
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-500'
                        }`}
                      >
                        {mcDroneActive ? '● ACTIVE' : '○ MUTED'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save / Load Alignment Overlays & Modals */}
              <div>
                <AnimatePresence>
                  {isSaving && (
                    <div className="absolute bottom-4 right-4 z-25">
                      <motion.div 
                        key="save-popup"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-slate-950/95 border border-indigo-500/40 rounded-xl p-4 w-[280px] space-y-3 shadow-2xl backdrop-blur-md text-left font-sans"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-semibold text-indigo-300 font-mono flex items-center gap-1.5">
                            <Save className="w-3.5 h-3.5" />
                            Save Current Configuration
                          </h3>
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase font-mono tracking-wider text-slate-500 mb-1">Alignment Name</label>
                          <input
                            type="text"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            placeholder="E.g., Autumn Equinox Drone"
                            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase font-mono tracking-wider text-slate-500 mb-1">Description (Optional)</label>
                          <textarea
                            value={presetDesc}
                            onChange={(e) => setPresetDesc(e.target.value)}
                            placeholder="What cosmic energy does this alignment express?"
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none transition-all resize-none"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            onClick={() => setIsSaving(false)}
                            className="px-3 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 transition font-medium cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleConfirmSave}
                            disabled={!presetName.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-[11px] transition font-semibold cursor-pointer"
                          >
                            Confirm Save
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isLoadOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      {/* Dim Translucent Backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsLoadOpen(false)}
                        className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm"
                      />

                      {/* Centered Modal Window */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        className="relative bg-slate-950/95 border border-emerald-500/30 rounded-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl backdrop-blur-md text-left font-sans z-10 overflow-hidden"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-white/10">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                              <FolderOpen className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-100 tracking-wide">
                                Cosmic Alignment Presets
                              </h3>
                              <p className="text-[11px] text-slate-400 leading-none mt-1">
                                Load or manage celestial configurations
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsLoadOpen(false)}
                            className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg text-xs font-mono cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Interactive Tab Selector */}
                        <div className="flex p-1 bg-slate-900/80 border border-white/5 rounded-xl my-4">
                          <button
                            onClick={() => setLoadModalTab('custom')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                              loadModalTab === 'custom'
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${loadModalTab === 'custom' ? 'text-white' : 'text-emerald-400'}`} />
                            My Saved Alignments
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                              loadModalTab === 'custom' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {customPresets.length}
                            </span>
                          </button>
                          
                          <button
                            onClick={() => setLoadModalTab('celestial')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                              loadModalTab === 'celestial'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                          >
                            <Compass className={`w-3.5 h-3.5 ${loadModalTab === 'celestial' ? 'text-white' : 'text-indigo-400'}`} />
                            Celestial Presets
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                              loadModalTab === 'celestial' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {CELESTIAL_PRESETS.length}
                            </span>
                          </button>
                        </div>

                        {/* Scrolling Content Block */}
                        <div className="overflow-y-auto flex-1 pr-1 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                          {loadModalTab === 'custom' ? (
                            <div>
                              {customPresets.length === 0 ? (
                                <div className="border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3 bg-slate-900/10">
                                  <Sparkles className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                                  <h4 className="text-xs font-semibold text-slate-300">No Custom Alignments Yet</h4>
                                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                                    Arrange the planets above, tune scales, and click the <strong className="text-indigo-400 font-semibold">Save</strong> button in the header to preserve your harmonic setups!
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {customPresets.map((preset) => {
                                    const scaleName = SCALE_PRESETS.find(s => s.id === preset.scaleId)?.name || preset.scaleId;
                                    const activeCount = preset.planets.filter(p => p.active).length;
                                    return (
                                      <div 
                                        key={preset.id}
                                        className="group relative flex items-center justify-between p-3.5 bg-slate-900/40 hover:bg-emerald-950/25 border border-slate-900 hover:border-emerald-500/30 rounded-xl transition-all duration-200"
                                      >
                                        <button
                                          onClick={() => {
                                            handleApplyPreset(preset);
                                            setIsLoadOpen(false);
                                          }}
                                          className="flex-1 text-left cursor-pointer mr-2"
                                        >
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[12px] font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                                              {preset.name}
                                            </span>
                                            <span className="text-[9px] font-mono font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/10 rounded-full">
                                              {preset.rootNote} {scaleName}
                                            </span>
                                          </div>
                                          {preset.description && (
                                            <p className="text-[10.5px] text-slate-400 group-hover:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                                              {preset.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-3 mt-2 text-[9px] text-slate-500 font-mono">
                                            <span>Active: <strong className="text-slate-400">{activeCount} planets</strong></span>
                                            {preset.ascendantDroneActive && <span className="text-indigo-400/80">✦ ASC Drone</span>}
                                            {preset.mcDroneActive && <span className="text-violet-400/80">✦ MC Drone</span>}
                                          </div>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePreset(preset.id);
                                          }}
                                          className="text-slate-600 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors cursor-pointer"
                                          title="Delete Saved Alignment"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {CELESTIAL_PRESETS.map((preset) => {
                                const scaleName = SCALE_PRESETS.find(s => s.id === preset.scaleId)?.name || preset.scaleId;
                                const activeCount = preset.planets.filter(p => p.active).length;
                                return (
                                  <button
                                    key={preset.id}
                                    onClick={() => {
                                      handleApplyPreset(preset);
                                      setIsLoadOpen(false);
                                    }}
                                    className="w-full text-left p-3.5 bg-slate-900/30 hover:bg-indigo-950/20 border border-slate-900 hover:border-indigo-500/30 rounded-xl transition-all duration-200 group cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[12px] font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                                        {preset.name}
                                      </span>
                                      <span className="text-[9px] font-mono font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/10 rounded-full">
                                        {preset.rootNote} {scaleName}
                                      </span>
                                    </div>
                                    <p className="text-[10.5px] text-slate-400 group-hover:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                                      {preset.description}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-[9px] text-slate-500 font-mono">
                                      <span>Active: <strong className="text-slate-400">{activeCount} planets</strong></span>
                                      {preset.ascendantDroneActive && <span className="text-indigo-400/80">✦ ASC Drone</span>}
                                      {preset.mcDroneActive && <span className="text-violet-400/80">✦ MC Drone</span>}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Box (Aspects List & Interpretation) */}
            <div className="md:col-span-5">
              <AspectsList
                aspects={activeAspects}
                planets={planets}
              />
            </div>

          </div>

          {/* Bottom Row: Full Interactive Synthesizer Settings */}
          <div>
            <ControlPanel
              planets={planets}
              scaleId={scaleId}
              rootNote={rootNote}
              synthParams={synthParams}
              audioState={audioState}
              isSynthesisActive={isSynthesisActive}
              onTogglePlanet={handleTogglePlanet}
              onUpdateParams={handleUpdateParams}
              onChangeScale={setScaleId}
              onChangeRootNote={setRootNote}
              onApplyPreset={handleApplyPreset}
              onToggleAudio={handleToggleAudio}
              getPlanetNoteName={getPlanetNoteName}
              getPlanetElementName={getPlanetElementName}
              customPresets={customPresets}
              onSavePreset={handleSavePreset}
              onDeletePreset={handleDeletePreset}
            />
          </div>

        </main>

        {/* Humble and elegant footer */}
        <footer className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 text-center text-[10px] text-slate-600 border-t border-slate-950 font-mono">
          <div>Astrology Harmonic Synthesizer • Single-Screen Spatial Ambient Engine • 2026</div>
          <div className="mt-1">Built with Web Audio API, Framer Motion, and Tailwind CSS.</div>
        </footer>

      </div>
    </div>
  );
}
