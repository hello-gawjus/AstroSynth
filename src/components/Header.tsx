import React from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';

interface HeaderProps {
  ascendantLabel?: string;
  mcLabel?: string;
}

export default function Header({ ascendantLabel = 'Scorpio 14°', mcLabel = 'Leo 14°' }: HeaderProps) {
  return (
    <header id="app-header" className="relative w-full max-w-7xl mx-auto pt-8 pb-4 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        
        {/* Branding Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] uppercase tracking-[0.3em] text-indigo-300">
            <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
            Universal Frequency: 432.18 Hz
          </div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-widest uppercase text-slate-100 font-sans">
            Harmonic <span className="font-bold text-indigo-400">Astro-Synth</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            An interactive client-side soundscape engine. Drag planets across the circular natal orbit to scan sign elements, trigger custom oscillators, and map geometric aspects to chords.
          </p>
        </div>

        {/* Legend & Stats Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          
          {/* Astrology Stats */}
          <div className="flex gap-4 text-[11px] uppercase tracking-widest bg-white/5 border border-white/10 backdrop-blur-md px-4 py-3 rounded-xl">
            <div className="flex flex-col items-end">
              <span className="text-indigo-400 text-[8px] tracking-widest font-semibold">Ascendant (ASC)</span>
              <span className="text-xs font-bold text-slate-200">{ascendantLabel}</span>
            </div>
            <div className="w-px bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-purple-400 text-[8px] tracking-widest font-semibold">Midheaven (MC)</span>
              <span className="text-xs font-bold text-slate-200">{mcLabel}</span>
            </div>
            <div className="w-px bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-indigo-400 text-[8px] tracking-widest font-semibold">Master Clock</span>
              <span className="text-xs font-bold text-slate-200">120 BPM</span>
            </div>
          </div>

          {/* Legend / Quick Reference */}
          <div className="flex flex-col justify-center gap-2.5 max-w-md bg-white/5 border border-white/10 backdrop-blur-md p-3.5 rounded-xl text-[10px] font-mono leading-normal text-slate-400">
            <div className="w-full flex items-center gap-1 text-slate-300 font-semibold uppercase text-[9px] tracking-wider">
              <HelpCircle className="w-3 h-3 text-indigo-400" />
              Synthesizer Waveform Guide
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-slate-300 font-medium">Fire:</span> Saw (Sawtooth)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                <span className="text-slate-300 font-medium">Air:</span> Noise (Wind Pad)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300 font-medium">Earth:</span> Triangle (Sub)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-slate-300 font-medium">Water:</span> Sine (Fluid Warm)
              </div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
