import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import { Aspect, Planet } from '../types';

interface AspectsListProps {
  aspects: Aspect[];
  planets: Planet[];
}

export default function AspectsList({ aspects, planets }: AspectsListProps) {
  // Helper to find planet details
  const getPlanet = (id: string) => planets.find(p => p.id === id);

  // Astrological & Musical translations for aspects
  const getAspectDetails = (type: string) => {
    switch (type) {
      case 'conjunction':
        return {
          astrology: 'Merged energies, extreme focus, and subjective force. Planets amplify each other in the same degree.',
          music: 'Produces a tight unison or microtonal beating (chorus) when frequencies blend closely.'
        };
      case 'sextile':
        return {
          astrology: 'Cooperative flow, excitement, and supportive opportunities. Friendly connection.',
          music: 'Generates beautiful consonant minor/major thirds, enriching the ambient background chord.'
        };
      case 'square':
        return {
          astrology: 'Inherent tension, obstacles, crisis, and dynamic action. Forces adaptation and growth.',
          music: 'Triggers sharp, dissonant, or unresolved intervals (such as Tritones or Minor Seconds) for organic tension.'
        };
      case 'trine':
        return {
          astrology: 'Effortless harmony, luck, natural talents, and grace. The most auspicious cosmic flow.',
          music: 'Creates perfect major and minor triad chords, yielding an incredibly rich, consonant ambient bed.'
        };
      case 'opposition':
        return {
          astrology: 'Polarity, external conflict, projection, and realization. Dynamic tug-of-war.',
          music: 'Produces sweeping split octaves or fifths, spreading the sonic frequencies across a vast spatial range.'
        };
      default:
        return { astrology: '', music: '' };
    }
  };

  return (
    <div id="aspects-list-root" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl h-full flex flex-col justify-between">
      
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Active Celestial Aspects
          </h2>
          <span className="font-mono text-xs text-slate-500">
            {aspects.length} alignment{aspects.length !== 1 ? 's' : ''} detected
          </span>
        </div>

        {aspects.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed border-white/10 rounded-xl bg-white/5">
            <Info className="w-8 h-8 text-slate-600 mb-2.5" />
            <p className="text-xs text-slate-400 font-medium">No Major Aspects Formed</p>
            <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-normal">
              Drag planets around the orbit wheel. Align them near same angle (0°), 60°, 90°, 120°, or 180° to construct musical and celestial harmonics.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
            {aspects.map((aspect) => {
              const p1 = getPlanet(aspect.planet1Id);
              const p2 = getPlanet(aspect.planet2Id);
              if (!p1 || !p2) return null;

              const details = getAspectDetails(aspect.type);

              return (
                <div 
                  key={aspect.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-white/20 transition-all duration-200"
                >
                  {/* Aspect Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-mono text-xs font-semibold text-slate-200">
                        <span style={{ color: p1.color }}>{p1.symbol}</span> {p1.name}
                      </span>
                      <span className="text-slate-600 font-mono text-[10px]">↔</span>
                      <span className="flex items-center gap-1 font-mono text-xs font-semibold text-slate-200">
                        <span style={{ color: p2.color }}>{p2.symbol}</span> {p2.name}
                      </span>
                    </div>

                    <span 
                      style={{ color: aspect.color, borderColor: `${aspect.color}20` }} 
                      className="text-[9px] font-mono tracking-wider uppercase font-semibold px-2 py-0.5 rounded border bg-slate-950"
                    >
                      {aspect.type}
                    </span>
                  </div>

                  {/* Distance specs */}
                  <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1.5">
                    <span>Angle Difference: <strong className="text-slate-300">{aspect.actualDiff}°</strong></span>
                    <span className="text-slate-700">|</span>
                    <span>Exact: <strong className="text-slate-300">{aspect.angleDiff}°</strong></span>
                  </div>

                  {/* Interpretations */}
                  <div className="mt-2.5 space-y-1.5 border-t border-white/10 pt-2">
                    <div className="text-[10px] leading-relaxed text-slate-400">
                      <strong className="text-indigo-400/80 font-mono text-[9px] uppercase tracking-wider block mb-0.5">Astrological Influence</strong>
                      {details.astrology}
                    </div>
                    <div className="text-[10px] leading-relaxed text-slate-400">
                      <strong className="text-rose-400/80 font-mono text-[9px] uppercase tracking-wider block mb-0.5">Acoustic Mapping</strong>
                      {details.music}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-white/10 pt-4 flex items-center gap-2">
        <div className="text-[10px] text-slate-500 font-mono leading-relaxed">
          Aspect Orbs calculated within standard bounds (Conjunction 10°, Sextile 6°, Square 8°, Trine 8°, Opposition 10°).
        </div>
      </div>

    </div>
  );
}
