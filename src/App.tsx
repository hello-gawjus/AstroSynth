import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, HelpCircle, Activity, Sparkles, Info } from 'lucide-react';

import Header from './components/Header';
import NatalChart from './components/NatalChart';
import ControlPanel from './components/ControlPanel';
import AspectsList from './components/AspectsList';

import { PLANETS, SCALE_PRESETS, CELESTIAL_PRESETS } from './constants';
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

    // Select first active preset planet for user focus
    const firstActive = preset.planets.find(pp => pp.active);
    if (firstActive) {
      setSelectedPlanetId(firstActive.id);
    }
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
            <div className="md:col-span-7 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-center items-center">
              <div className="w-full flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  Celestial Orbit Sphere
                </h2>
                <div className="text-[10px] text-slate-500 font-mono">
                  Scale: <span className="text-indigo-400 font-bold">{scaleName}</span> ({rootNote})
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
              ascendantAngle={ascendantAngle}
              onChangeAscendantAngle={setAscendantAngle}
              mcAngle={mcAngle}
              onChangeMcAngle={setMcAngle}
              ascendantDroneActive={ascendantDroneActive}
              onToggleAscendantDrone={() => setAscendantDroneActive(prev => !prev)}
              mcDroneActive={mcDroneActive}
              onToggleMcDrone={() => setMcDroneActive(prev => !prev)}
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
