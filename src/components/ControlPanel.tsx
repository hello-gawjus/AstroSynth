import React from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Pause, 
  Music, 
  Sliders, 
  Activity, 
  Sparkles, 
  Volume2, 
  Compass,
  Save,
  Trash2,
  Plus
} from 'lucide-react';
import { Planet, ScalePreset, CelestialPreset, SynthParams } from '../types';
import { SCALE_PRESETS, NOTES, CELESTIAL_PRESETS, ZODIAC_SIGNS } from '../constants';
import { getSynth } from '../synthesizer';

interface ControlPanelProps {
  planets: Planet[];
  scaleId: string;
  rootNote: string;
  synthParams: SynthParams;
  audioState: 'suspended' | 'running' | 'closed' | 'uninitialized';
  isSynthesisActive: boolean;
  onTogglePlanet: (id: string) => void;
  onUpdateParams: (params: Partial<SynthParams>) => void;
  onChangeScale: (scaleId: string) => void;
  onChangeRootNote: (note: string) => void;
  onApplyPreset: (preset: CelestialPreset) => void;
  onToggleAudio: () => void;
  getPlanetNoteName: (planet: Planet) => string;
  getPlanetElementName: (planet: Planet) => string;
  customPresets: CelestialPreset[];
  onSavePreset: (name: string, description: string) => void;
  onDeletePreset: (id: string) => void;
}

export default function ControlPanel({
  planets,
  scaleId,
  rootNote,
  synthParams,
  audioState,
  isSynthesisActive,
  onTogglePlanet,
  onUpdateParams,
  onChangeScale,
  onChangeRootNote,
  onApplyPreset,
  onToggleAudio,
  getPlanetNoteName,
  getPlanetElementName,
  customPresets,
  onSavePreset,
  onDeletePreset
}: ControlPanelProps) {
  
  const currentScale = SCALE_PRESETS.find(s => s.id === scaleId) || SCALE_PRESETS[0];

  const [isSaving, setIsSaving] = React.useState(false);
  const [presetName, setPresetName] = React.useState('');
  const [presetDesc, setPresetDesc] = React.useState('');

  const handleOpenSaveForm = () => {
    const activePlanetCount = planets.filter(p => p.active).length;
    const defaultName = `${rootNote} ${currentScale.name} Alignment (${activePlanetCount} Planets)`;
    setPresetName(defaultName);
    setPresetDesc(`Custom ambient configuration tuned to the ${currentScale.name} scale in the key of ${rootNote}.`);
    setIsSaving(true);
  };

  const handleConfirmSave = () => {
    if (!presetName.trim()) return;
    onSavePreset(presetName.trim(), presetDesc.trim());
    setIsSaving(false);
    setPresetName('');
    setPresetDesc('');
  };

  const getScaleNotes = (intervals: number[]) => {
    const rootIndex = NOTES.indexOf(rootNote);
    if (rootIndex === -1) return '';
    return intervals
      .map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
      })
      .join(', ');
  };

  const [activeKeys, setActiveKeys] = React.useState<Record<number, boolean>>({});

  const playNote = async (k: number) => {
    const synthInstance = getSynth();
    if (!synthInstance.ctx || synthInstance.ctx.state !== 'running') {
      await synthInstance.resume();
    }
    
    // Play precise frequency of this key
    const midiNote = 60 + k;
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
    
    // Map standard semitones (0 to 12) to their corresponding astrological element timbres:
    // C: Aries (fire), C#: Taurus (earth), D: Gemini (air), D#: Cancer (water), ...
    const NOTE_ELEMENTS = ['fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water', 'fire'] as const;
    const element = NOTE_ELEMENTS[k];
    
    synthInstance.triggerPlanet(`keyboard_${k}`, frequency, element);
    setActiveKeys(prev => ({ ...prev, [k]: true }));
  };

  const stopNote = (k: number) => {
    const synthInstance = getSynth();
    synthInstance.silencePlanet(`keyboard_${k}`);
    setActiveKeys(prev => ({ ...prev, [k]: false }));
  };

  const handlePointerEnter = (e: React.PointerEvent, k: number) => {
    if (e.buttons === 1) {
      playNote(k);
    }
  };

  React.useEffect(() => {
    const handleGlobalPointerUp = () => {
      const synthInstance = getSynth();
      Object.keys(activeKeys).forEach(kStr => {
        const k = parseInt(kStr);
        if (activeKeys[k]) {
          synthInstance.silencePlanet(`keyboard_${k}`);
        }
      });
      setActiveKeys({});
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [activeKeys]);

  React.useEffect(() => {
    return () => {
      const synthInstance = getSynth();
      for (let k = 0; k <= 12; k++) {
        synthInstance.silencePlanet(`keyboard_${k}`);
      }
      setActiveKeys({});
    };
  }, [rootNote, scaleId, audioState]);

  const whiteKeys = [
    { semitone: 0, label: 'C', index: 0 },
    { semitone: 2, label: 'D', index: 1 },
    { semitone: 4, label: 'E', index: 2 },
    { semitone: 5, label: 'F', index: 3 },
    { semitone: 7, label: 'G', index: 4 },
    { semitone: 9, label: 'A', index: 5 },
    { semitone: 11, label: 'B', index: 6 },
    { semitone: 12, label: 'C', index: 7 },
  ];

  const blackKeys = [
    { semitone: 1, label: 'C#', boundaryIndex: 0 },
    { semitone: 3, label: 'D#', boundaryIndex: 1 },
    { semitone: 6, label: 'F#', boundaryIndex: 3 },
    { semitone: 8, label: 'G#', boundaryIndex: 4 },
    { semitone: 10, label: 'A#', boundaryIndex: 5 },
  ];

  return (
    <div id="control-panel-root" className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full h-full max-w-7xl mx-auto pb-12">
      
      {/* COLUMN 1: AUDIO MAIN, SCALES, AND ALIGNMENT PRESETS */}
      <div className="space-y-6 flex flex-col justify-between">
        
        {/* Module 1: Celestial Connection Station */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              Cosmic Connection
            </h2>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${
              isSynthesisActive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isSynthesisActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isSynthesisActive ? 'Online' : 'Connected (Paused)'}
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            The Astrology Synthesizer streams ambient harmonics continuously based on planet placements. Tap below to connect to the celestial audio grid.
          </p>

          <button
            id="synth-power-btn"
            onClick={onToggleAudio}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 cursor-pointer ${
              isSynthesisActive
                ? 'bg-slate-800/80 hover:bg-slate-700/80 text-rose-400 border border-slate-700'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30'
            }`}
          >
            {isSynthesisActive ? (
              <>
                <Pause className="w-4 h-4" />
                Pause Celestial Harmonics
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Begin Celestial Synthesis
              </>
            )}
          </button>
        </div>

        {/* Module 2: Scale and Tuning Settings */}
        <div id="tuning-scales-section" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl">
          <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2 mb-4">
            <Music className="w-4 h-4 text-indigo-400" />
            Tuning & Scales
          </h2>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="col-span-1">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1.5">Root Note</label>
              <select
                value={rootNote}
                onChange={(e) => onChangeRootNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {NOTES.map(note => (
                  <option key={note} value={note}>{note}</option>
                ))}
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1.5">Celestial Scale</label>
              <select
                value={scaleId}
                onChange={(e) => onChangeScale(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {SCALE_PRESETS.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} ({getScaleNotes(preset.intervals)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] leading-relaxed text-slate-400 mb-4">
            <span className="font-semibold text-slate-300">
              {currentScale.name} ({getScaleNotes(currentScale.intervals)}):{' '}
            </span>
            {currentScale.description}
          </div>

          {/* Interactive 12-Note Keyboard */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-medium">Interactive Tuning Keyboard</span>
              <span className="text-[9px] text-slate-500 font-mono">Octave 4 • Active scale highlighted</span>
            </div>
            
            <div className="relative h-28 w-full bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden select-none touch-none shadow-lg">
              {/* White Keys */}
              <div className="absolute inset-0 flex">
                {whiteKeys.map(({ semitone, label, index }) => {
                  const rootIndex = NOTES.indexOf(rootNote);
                  const scaleDegree = (semitone - rootIndex + 12) % 12;
                  const isInScale = currentScale.intervals.includes(scaleDegree);
                  const isPressed = !!activeKeys[semitone];
                  const isTonic = (semitone % 12) === rootIndex;

                  return (
                    <button
                      key={semitone}
                      onPointerDown={() => playNote(semitone)}
                      onPointerUp={() => stopNote(semitone)}
                      onPointerLeave={() => stopNote(semitone)}
                      onPointerEnter={(e) => handlePointerEnter(e, semitone)}
                      className={`relative flex-1 flex flex-col justify-end items-center pb-2.5 border-r last:border-r-0 border-slate-200 select-none cursor-pointer transition-all duration-150 ${
                        isPressed
                          ? 'bg-indigo-100 text-indigo-900 shadow-[inset_0_3px_8px_rgba(0,0,0,0.15)] scale-y-[0.97] z-0'
                          : 'bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                      style={{ height: '100%' }}
                    >
                      {/* Scale / Tonic Indicator dot */}
                      {isInScale && (
                        <span 
                          className={`absolute top-3 w-2.5 h-2.5 rounded-full ${
                            isTonic 
                              ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' 
                              : 'bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]'
                          }`} 
                        />
                      )}
                      
                      <span className={`text-[10px] font-mono font-bold tracking-tight ${isPressed ? 'text-indigo-900' : 'text-slate-500'}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Black Keys (Overlayed) */}
              {blackKeys.map(({ semitone, label, boundaryIndex }) => {
                const rootIndex = NOTES.indexOf(rootNote);
                const scaleDegree = (semitone - rootIndex + 12) % 12;
                const isInScale = currentScale.intervals.includes(scaleDegree);
                const isPressed = !!activeKeys[semitone];
                const isTonic = (semitone % 12) === rootIndex;
                const leftPos = `${(boundaryIndex + 1) * (100 / 8) - 4}%`;

                return (
                  <button
                    key={semitone}
                    onPointerDown={() => playNote(semitone)}
                    onPointerUp={() => stopNote(semitone)}
                    onPointerLeave={() => stopNote(semitone)}
                    onPointerEnter={(e) => handlePointerEnter(e, semitone)}
                    className={`absolute top-0 h-[60%] w-[8%] flex flex-col justify-end items-center pb-1.5 rounded-b-md select-none border-x border-b border-slate-950 cursor-pointer transition-all duration-150 shadow-md z-10 ${
                      isPressed
                        ? 'bg-indigo-800 text-white border-indigo-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] scale-y-[0.97]'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-200'
                    }`}
                    style={{ left: leftPos }}
                  >
                    {/* Scale / Tonic Indicator dot */}
                    {isInScale && (
                      <span 
                        className={`absolute top-2 w-1.5 h-1.5 rounded-full ${
                          isTonic 
                            ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' 
                            : 'bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.7)]'
                        }`} 
                      />
                    )}

                    <span className={`text-[8px] font-mono font-bold ${isPressed ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>



        {/* Module 3: Alignment Presets & Custom Alignments */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Cosmic Alignment Presets
              </h2>
              
              {false && (
                <button
                  onClick={handleOpenSaveForm}
                  className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono font-semibold py-1 px-3 rounded-lg transition-all duration-200 flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Alignment
                </button>
              )}
            </div>

            {/* Save Alignment Form */}
            {false && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4 mb-4 space-y-3 shadow-inner"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-indigo-300 font-mono flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5" />
                    Save Current Configuration
                  </h3>
                  <span className="text-[9px] text-slate-500 font-mono">Will persist in this browser</span>
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
            )}

            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Instantly arrange the planetary sphere into historical or mystical geometric aspects to trigger coordinated ambient movements.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CELESTIAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onApplyPreset(preset)}
                  className="text-left bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl p-3 transition-all duration-200 group cursor-pointer"
                >
                  <div className="font-semibold text-[11px] text-indigo-300 group-hover:text-indigo-200 flex items-center gap-1">
                    <span>{preset.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 group-hover:text-slate-400 mt-1 line-clamp-2 leading-normal">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom Presets Section */}
            {customPresets.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/5">
                <h3 className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-bold mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                  My Custom Saved Alignments
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="relative text-left bg-slate-950/90 border border-slate-800/80 hover:border-indigo-500/40 rounded-xl p-3 transition-all duration-200 group flex justify-between items-start gap-2"
                    >
                      <button
                        onClick={() => onApplyPreset(preset)}
                        className="flex-1 text-left cursor-pointer"
                      >
                        <div className="font-semibold text-[11px] text-indigo-300 group-hover:text-indigo-200 flex items-center gap-1">
                          <span>{preset.name}</span>
                          <span className="text-[8px] font-mono px-1.5 py-0.5 bg-indigo-500/15 text-indigo-300 rounded uppercase">
                            {preset.rootNote}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 group-hover:text-slate-400 mt-1 line-clamp-2 leading-normal">
                          {preset.description}
                        </p>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePreset(preset.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-slate-600 p-1 rounded hover:bg-white/5 transition-all duration-150 cursor-pointer"
                        title="Delete Alignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COLUMN 2: SYNTH PARAMETER SLIDERS */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2 mb-5">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Synthesizer Architect
          </h2>

          <div className="space-y-4">
            {/* Master Volume */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> Master Gain
                </span>
                <span className="font-mono text-slate-300">{Math.round(synthParams.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={synthParams.masterVolume}
                onChange={(e) => onUpdateParams({ masterVolume: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Filter Cutoff */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Cosmic Filter Cutoff</span>
                <span className="font-mono text-slate-300">{Math.round(synthParams.filterCutoff)} Hz</span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="10"
                value={synthParams.filterCutoff}
                onChange={(e) => onUpdateParams({ filterCutoff: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Filter Q */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Filter Resonance (Q)</span>
                <span className="font-mono text-slate-300">{synthParams.filterQ.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.1"
                value={synthParams.filterQ}
                onChange={(e) => onUpdateParams({ filterQ: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Space Delay Time */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Cosmic Delay Time</span>
                <span className="font-mono text-slate-300">{synthParams.delayTime.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={synthParams.delayTime}
                onChange={(e) => onUpdateParams({ delayTime: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Delay Feedback */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Echo Feedback</span>
                <span className="font-mono text-slate-300">{Math.round(synthParams.delayFeedback * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={synthParams.delayFeedback}
                onChange={(e) => onUpdateParams({ delayFeedback: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Reverb Wet */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Nebula Reverb Wet</span>
                <span className="font-mono text-slate-300">{Math.round(synthParams.reverbWet * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={synthParams.reverbWet}
                onChange={(e) => onUpdateParams({ reverbWet: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* LFO Rate */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Cosmic Breath Speed (LFO)</span>
                <span className="font-mono text-slate-300">{synthParams.lfoRate.toFixed(2)} Hz</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="3"
                step="0.05"
                value={synthParams.lfoRate}
                onChange={(e) => onUpdateParams({ lfoRate: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* LFO Depth */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Cosmic Breath Depth</span>
                <span className="font-mono text-slate-300">{synthParams.lfoDepth} Hz</span>
              </div>
              <input
                type="range"
                min="0"
                max="1200"
                step="10"
                value={synthParams.lfoDepth}
                onChange={(e) => onUpdateParams({ lfoDepth: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-800/60 pt-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <div className="text-[10px] text-slate-500 font-mono">
            Breathing filter sweeps are managed automatically by the LFO modulating the master lowpass filter.
          </div>
        </div>

      </div>

      {/* FULL WIDTH SECTION: INDIVIDUAL PLANET SECTOR ACTIVATIONS */}
      <div className="col-span-1 lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl">
        <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-indigo-400" />
          Planetary Synthesizer voices
        </h2>
        <p className="text-xs text-slate-400 mb-5 leading-normal">
          Activate or silence the planetary bodies. Placing planets in different sections of the sky automatically adapts their waveforms according to the constellation's Element (Fire = Saw, Earth = Triangle, Air = Bandpass Noise, Water = Sine).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {planets.map((planet) => {
            const isPlaying = planet.active;
            const element = getPlanetElementName(planet);
            const noteName = getPlanetNoteName(planet);

            // Colored theme classes based on elements
            let elementColor = 'text-slate-400';
            let elementBadgeBg = 'bg-slate-950 text-slate-400 border-slate-800';
            if (element === 'fire') {
              elementColor = 'text-red-400';
              elementBadgeBg = 'bg-red-500/10 text-red-400 border-red-500/20';
            } else if (element === 'earth') {
              elementColor = 'text-emerald-400';
              elementBadgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            } else if (element === 'air') {
              elementColor = 'text-cyan-400';
              elementBadgeBg = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
            } else if (element === 'water') {
              elementColor = 'text-blue-400';
              elementBadgeBg = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            }

            return (
              <div 
                key={planet.id} 
                className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                  isPlaying 
                    ? 'bg-slate-950/80 border-slate-800 shadow-sm' 
                    : 'bg-slate-950/10 border-slate-900/60 opacity-55'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span 
                      style={{ color: planet.color }} 
                      className="text-lg font-bold flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900/80 border border-slate-800"
                    >
                      {planet.symbol}
                    </span>
                    <div>
                      <h3 className="font-semibold text-xs text-slate-200">{planet.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border ${elementBadgeBg}`}>
                          {element}
                        </span>
                        {isPlaying && (
                          <span className="text-[10px] text-indigo-400 font-mono font-bold ml-1.5">
                            {noteName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onTogglePlanet(planet.id)}
                    className={`text-[10px] uppercase font-mono tracking-wider font-medium px-2.5 py-1 rounded-md border transition-all duration-200 cursor-pointer ${
                      isPlaying
                        ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/20'
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-500 border-slate-800'
                    }`}
                  >
                    {isPlaying ? 'Mute' : 'Activate'}
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 mt-2.5 leading-relaxed">
                  {planet.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
