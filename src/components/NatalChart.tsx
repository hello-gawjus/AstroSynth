import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Planet, ZodiacSign, Aspect } from '../types';
import { ZODIAC_SIGNS } from '../constants';
import { getZodiacSignForAngle } from '../utils';

interface NatalChartProps {
  planets: Planet[];
  activeAspects: Aspect[];
  selectedPlanetId: string | null;
  onUpdatePlanetAngle: (id: string, angle: number) => void;
  onSelectPlanet: (id: string) => void;
  onTogglePlanet: (id: string) => void;
  rootNote: string;
  scaleName: string;
  getPlanetNoteName: (planet: Planet) => string;
  ascendantAngle?: number;
  mcAngle?: number;
  ascendantActive?: boolean;
  mcActive?: boolean;
}

export default function NatalChart({
  planets,
  activeAspects,
  selectedPlanetId,
  onUpdatePlanetAngle,
  onSelectPlanet,
  onTogglePlanet,
  rootNote,
  scaleName,
  getPlanetNoteName,
  ascendantAngle = 224,
  mcAngle = 134,
  ascendantActive = true,
  mcActive = true
}: NatalChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingPlanetId, setDraggingPlanetId] = useState<string | null>(null);
  const [hoveredPlanetId, setHoveredPlanetId] = useState<string | null>(null);

  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

  // SVG Center and Radius Configurations
  const center = 250;
  const orbitRadius = 150;
  const outerRingRadius = 220;
  const innerRingRadius = 180;

  // Handle Dragging
  const handlePointerDown = (planetId: string, e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingPlanetId(planetId);
    
    // Map dsc/ic to ascendant/mc for selection
    const selectId = planetId === 'dsc' ? 'ascendant' : planetId === 'ic' ? 'mc' : planetId;
    onSelectPlanet(selectId);
    
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingPlanetId || !svgRef.current) return;

    if (dragStartPosRef.current) {
      const dist = Math.hypot(e.clientX - dragStartPosRef.current.x, e.clientY - dragStartPosRef.current.y);
      if (dist > 4) {
        hasDraggedRef.current = true;
      }
    }

    const rect = svgRef.current.getBoundingClientRect();
    const svgCenterX = rect.left + rect.width / 2;
    const svgCenterY = rect.top + rect.height / 2;

    const dx = e.clientX - svgCenterX;
    const dy = e.clientY - svgCenterY;

    // Calculate angle in radians, standard math has 0 at right.
    // We adjust by +90 so 0 deg starts at top (12 o'clock) going clockwise.
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = (angleRad * (180 / Math.PI) + 450) % 360;

    if (draggingPlanetId === 'dsc') {
      onUpdatePlanetAngle('ascendant', Math.round((angleDeg + 180) % 360));
    } else if (draggingPlanetId === 'ic') {
      onUpdatePlanetAngle('mc', Math.round((angleDeg + 180) % 360));
    } else {
      onUpdatePlanetAngle(draggingPlanetId, Math.round(angleDeg));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingPlanetId) {
      if (!hasDraggedRef.current) {
        // It's a click, toggle active state
        if (draggingPlanetId === 'dsc') {
          onTogglePlanet('ascendant');
        } else if (draggingPlanetId === 'ic') {
          onTogglePlanet('mc');
        } else {
          onTogglePlanet(draggingPlanetId);
        }
      }
      setDraggingPlanetId(null);
    }
    dragStartPosRef.current = null;
  };

  // Convert planet angle to (x, y) coordinates
  const getPlanetCoords = (angle: number, radius: number) => {
    // Offset by -90 degrees so 0 degrees is at 12 o'clock
    const rad = (angle - 90) * (Math.PI / 180);
    const x = center + radius * Math.cos(rad);
    const y = center + radius * Math.sin(rad);
    return { x, y };
  };

  // Helper to generate SVG segment paths for zodiac signs
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = getPlanetCoords(startAngle, radius);
    const end = getPlanetCoords(endAngle, radius);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y,
      "L", x, y,
      "Z"
    ].join(" ");
  };

  return (
    <div id="natal-chart-container" className="relative w-full max-w-[500px] aspect-square mx-auto">
      {/* Glow Backdrop */}
      <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <svg
        id="celestial-orbit-svg"
        ref={svgRef}
        viewBox="0 0 500 500"
        className="w-full h-full select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
          {/* Glowing filter for aspects */}
          <filter id="glow-heavy" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-light" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Radial Gradient for central cosmos */}
          <radialGradient id="cosmos-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0B0F19" />
            <stop offset="75%" stopColor="#070A10" />
            <stop offset="100%" stopColor="#030406" />
          </radialGradient>
        </defs>

        {/* Central Background */}
        <circle cx={center} cy={center} r={outerRingRadius} fill="url(#cosmos-bg)" />

        {/* Zodiac segments rendering */}
        <g id="zodiac-segments">
          {ZODIAC_SIGNS.map((sign) => {
            const midAngle = sign.startAngle + 15;
            const textCoords = getPlanetCoords(midAngle, (outerRingRadius + innerRingRadius) / 2);
            
            // Highlight seg background depending on elements
            let colorString = "rgba(255,255,255,0.02)";
            if (sign.element === 'fire') colorString = "rgba(239, 68, 68, 0.04)";
            else if (sign.element === 'earth') colorString = "rgba(16, 185, 129, 0.04)";
            else if (sign.element === 'air') colorString = "rgba(6, 182, 212, 0.04)";
            else if (sign.element === 'water') colorString = "rgba(59, 130, 246, 0.04)";

            // Check if any active planet is in this sign to light it up!
            const isAnyPlanetHere = planets.some(p => p.active && getZodiacSignForAngle(p.angle).id === sign.id);
            const segmentBorderColor = isAnyPlanetHere ? sign.color : 'rgba(255,255,255,0.1)';

            return (
              <g key={sign.id} id={`zodiac-sec-${sign.id}`}>
                {/* Segment slice background */}
                <path
                  d={describeArc(center, center, outerRingRadius, sign.startAngle, sign.endAngle)}
                  fill={isAnyPlanetHere ? sign.bgColor : colorString}
                  className="transition-colors duration-300"
                />

                {/* Segment dividing lines */}
                <line
                  x1={center}
                  y1={center}
                  x2={getPlanetCoords(sign.startAngle, outerRingRadius).x}
                  y2={getPlanetCoords(sign.startAngle, outerRingRadius).y}
                  stroke={segmentBorderColor}
                  strokeWidth={isAnyPlanetHere ? 1.5 : 0.5}
                  strokeOpacity={isAnyPlanetHere ? 0.7 : 0.2}
                  className="transition-colors duration-300"
                />

                {/* Zodiac Symbol and Name */}
                <text
                  x={textCoords.x}
                  y={textCoords.y}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={isAnyPlanetHere ? sign.color : 'rgba(255,255,255,0.4)'}
                  fontSize="12"
                  fontWeight={isAnyPlanetHere ? "bold" : "normal"}
                  className="font-sans transition-all duration-300 pointer-events-none"
                  transform={`rotate(${(midAngle > 90 && midAngle < 270) ? midAngle + 180 : midAngle}, ${textCoords.x}, ${textCoords.y})`}
                >
                  <tspan fontSize="13" dy="-1">{sign.symbol}</tspan>
                  <tspan fontSize="8" dx="3" className="hidden sm:inline" fill="rgba(255,255,255,0.3)">{sign.name.substring(0,3)}</tspan>
                </text>
              </g>
            );
          })}
        </g>

        {/* Orbit Lines */}
        <circle
          cx={center}
          cy={center}
          r={orbitRadius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle
          cx={center}
          cy={center}
          r={innerRingRadius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1"
        />
        <circle
          cx={center}
          cy={center}
          r={outerRingRadius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1.5"
        />

        {/* Central Aspect Harmonic Lines */}
        <g id="aspect-lines">
          {activeAspects.map((aspect) => {
            const p1 = planets.find(p => p.id === aspect.planet1Id);
            const p2 = planets.find(p => p.id === aspect.planet2Id);
            if (!p1 || !p2) return null;

            const c1 = getPlanetCoords(p1.angle, orbitRadius);
            const c2 = getPlanetCoords(p2.angle, orbitRadius);

            return (
              <g key={aspect.id}>
                {/* Glowing glow backdrop of the line */}
                <line
                  x1={c1.x}
                  y1={c1.y}
                  x2={c2.x}
                  y2={c2.y}
                  stroke={aspect.color}
                  strokeWidth="4"
                  strokeOpacity="0.3"
                  filter="url(#glow-heavy)"
                  className="transition-all duration-300"
                />
                {/* Fine central sharp line */}
                <line
                  x1={c1.x}
                  y1={c1.y}
                  x2={c2.x}
                  y2={c2.y}
                  stroke={aspect.color}
                  strokeWidth="1.5"
                  strokeOpacity="0.85"
                  className="transition-all duration-300"
                />
                {/* Small indicator circle in the exact midpoint */}
                <circle
                  cx={(c1.x + c2.x) / 2}
                  cy={(c1.y + c2.y) / 2}
                  r="3.5"
                  fill={aspect.color}
                  className="animate-pulse"
                  filter="url(#glow-light)"
                />
              </g>
            );
          })}
        </g>

        {/* Astrological Chart Angular Crosses (ASC/DSC & MC/IC) */}
        <g id="astrological-axes">
          {/* ASC - DSC line */}
          {(() => {
            const asc = getPlanetCoords(ascendantAngle, outerRingRadius);
            const dsc = getPlanetCoords((ascendantAngle + 180) % 360, outerRingRadius);
            const ascBadge = getPlanetCoords(ascendantAngle, outerRingRadius + 18);
            const dscBadge = getPlanetCoords((ascendantAngle + 180) % 360, outerRingRadius + 18);
            
            const lineStroke = ascendantActive ? "#FBBF24" : "rgba(148, 163, 184, 0.25)";
            const lineDash = ascendantActive ? "4 6" : "2 8";
            const lineOpacity = ascendantActive ? 0.6 : 0.3;
            
            const isAscDragging = draggingPlanetId === 'ascendant' || draggingPlanetId === 'dsc';
            const isHovered = hoveredPlanetId === 'ascendant' || hoveredPlanetId === 'dsc';
            
            return (
              <g className={`transition-all duration-300 ${!ascendantActive ? 'opacity-40 hover:opacity-80' : ''}`}>
                <line
                  x1={asc.x}
                  y1={asc.y}
                  x2={dsc.x}
                  y2={dsc.y}
                  stroke={lineStroke}
                  strokeWidth={ascendantActive ? "1.5" : "1"}
                  strokeDasharray={lineDash}
                  strokeOpacity={lineOpacity}
                />
                
                {/* Visual feedback glow ring when active / hovering */}
                {ascendantActive && (
                  <line
                    x1={asc.x}
                    y1={asc.y}
                    x2={dsc.x}
                    y2={dsc.y}
                    stroke="#FBBF24"
                    strokeWidth="4"
                    strokeOpacity="0.08"
                    filter="url(#glow-heavy)"
                  />
                )}

                 {/* ASC Label badge */}
                <g 
                  transform={`translate(${ascBadge.x}, ${ascBadge.y})`} 
                  className="cursor-grab active:cursor-grabbing select-none"
                  onPointerDown={(e) => handlePointerDown('ascendant', e)}
                  onPointerEnter={() => setHoveredPlanetId('ascendant')}
                  onPointerLeave={() => setHoveredPlanetId(null)}
                >
                  {/* Invisible larger hit target to prevent jitter */}
                  <circle r="22" fill="transparent" className="cursor-grab active:cursor-grabbing" />
                  <circle 
                    r={hoveredPlanetId === 'ascendant' ? "16" : "13"} 
                    fill="#111827" 
                    stroke={ascendantActive ? "#FBBF24" : "#475569"} 
                    strokeWidth={isAscDragging ? "2" : "1.5"} 
                    className="shadow-lg transition-all duration-200" 
                    filter={ascendantActive ? "url(#glow-light)" : undefined}
                  />
                  <text 
                    textAnchor="middle" 
                    alignmentBaseline="middle" 
                    fill={ascendantActive ? "#FBBF24" : "#94a3b8"} 
                    fontSize={hoveredPlanetId === 'ascendant' ? "9" : "8"} 
                    fontWeight="bold" 
                    className="font-sans pointer-events-none transition-all duration-200"
                    dy="0.5"
                  >
                    ASC
                  </text>
                  {isAscDragging && (
                    <circle r="18" fill="none" stroke="#FBBF24" strokeWidth="1" strokeOpacity="0.3" className="animate-ping" />
                  )}
                </g>

                {/* DSC Label badge */}
                <g 
                  transform={`translate(${dscBadge.x}, ${dscBadge.y})`} 
                  className="cursor-grab active:cursor-grabbing select-none"
                  onPointerDown={(e) => handlePointerDown('dsc', e)}
                  onPointerEnter={() => setHoveredPlanetId('dsc')}
                  onPointerLeave={() => setHoveredPlanetId(null)}
                >
                  {/* Invisible larger hit target to prevent jitter */}
                  <circle r="22" fill="transparent" className="cursor-grab active:cursor-grabbing" />
                  <circle 
                    r={hoveredPlanetId === 'dsc' ? "16" : "13"} 
                    fill="#111827" 
                    stroke={ascendantActive ? "rgba(251, 191, 36, 0.6)" : "#475569"} 
                    strokeWidth="1.2" 
                    className="shadow-lg transition-all duration-200" 
                  />
                  <text 
                    textAnchor="middle" 
                    alignmentBaseline="middle" 
                    fill={ascendantActive ? "rgba(251, 191, 36, 0.8)" : "#94a3b8"} 
                    fontSize={hoveredPlanetId === 'dsc' ? "9" : "8"} 
                    fontWeight="bold" 
                    className="font-sans pointer-events-none transition-all duration-200"
                    dy="0.5"
                  >
                    DSC
                  </text>
                </g>
              </g>
            );
          })()}

          {/* MC - IC line */}
          {(() => {
            const mc = getPlanetCoords(mcAngle, outerRingRadius);
            const ic = getPlanetCoords((mcAngle + 180) % 360, outerRingRadius);
            const mcBadge = getPlanetCoords(mcAngle, outerRingRadius + 18);
            const icBadge = getPlanetCoords((mcAngle + 180) % 360, outerRingRadius + 18);
            
            const lineStroke = mcActive ? "#A855F7" : "rgba(148, 163, 184, 0.25)";
            const lineDash = mcActive ? "4 6" : "2 8";
            const lineOpacity = mcActive ? 0.6 : 0.3;
            
            const isMcDragging = draggingPlanetId === 'mc' || draggingPlanetId === 'ic';
            const isHovered = hoveredPlanetId === 'mc' || hoveredPlanetId === 'ic';
            
            return (
              <g className={`transition-all duration-300 ${!mcActive ? 'opacity-40 hover:opacity-80' : ''}`}>
                <line
                  x1={mc.x}
                  y1={mc.y}
                  x2={ic.x}
                  y2={ic.y}
                  stroke={lineStroke}
                  strokeWidth={mcActive ? "1.5" : "1"}
                  strokeDasharray={lineDash}
                  strokeOpacity={lineOpacity}
                />
                
                {/* Visual feedback glow ring when active / hovering */}
                {mcActive && (
                  <line
                    x1={mc.x}
                    y1={mc.y}
                    x2={ic.x}
                    y2={ic.y}
                    stroke="#A855F7"
                    strokeWidth="4"
                    strokeOpacity="0.08"
                    filter="url(#glow-heavy)"
                  />
                )}

                 {/* MC Label badge */}
                <g 
                  transform={`translate(${mcBadge.x}, ${mcBadge.y})`} 
                  className="cursor-grab active:cursor-grabbing select-none"
                  onPointerDown={(e) => handlePointerDown('mc', e)}
                  onPointerEnter={() => setHoveredPlanetId('mc')}
                  onPointerLeave={() => setHoveredPlanetId(null)}
                >
                  {/* Invisible larger hit target to prevent jitter */}
                  <circle r="22" fill="transparent" className="cursor-grab active:cursor-grabbing" />
                  <circle 
                    r={hoveredPlanetId === 'mc' ? "16" : "13"} 
                    fill="#111827" 
                    stroke={mcActive ? "#A855F7" : "#475569"} 
                    strokeWidth={isMcDragging ? "2" : "1.5"} 
                    className="shadow-lg transition-all duration-200" 
                    filter={mcActive ? "url(#glow-light)" : undefined}
                  />
                  <text 
                    textAnchor="middle" 
                    alignmentBaseline="middle" 
                    fill={mcActive ? "#A855F7" : "#94a3b8"} 
                    fontSize={hoveredPlanetId === 'mc' ? "9" : "8"} 
                    fontWeight="bold" 
                    className="font-sans pointer-events-none transition-all duration-200"
                    dy="0.5"
                  >
                    MC
                  </text>
                  {isMcDragging && (
                    <circle r="18" fill="none" stroke="#A855F7" strokeWidth="1" strokeOpacity="0.3" className="animate-ping" />
                  )}
                </g>

                {/* IC Label badge */}
                <g 
                  transform={`translate(${icBadge.x}, ${icBadge.y})`} 
                  className="cursor-grab active:cursor-grabbing select-none"
                  onPointerDown={(e) => handlePointerDown('ic', e)}
                  onPointerEnter={() => setHoveredPlanetId('ic')}
                  onPointerLeave={() => setHoveredPlanetId(null)}
                >
                  {/* Invisible larger hit target to prevent jitter */}
                  <circle r="22" fill="transparent" className="cursor-grab active:cursor-grabbing" />
                  <circle 
                    r={hoveredPlanetId === 'ic' ? "16" : "13"} 
                    fill="#111827" 
                    stroke={mcActive ? "rgba(168, 85, 247, 0.6)" : "#475569"} 
                    strokeWidth="1.2" 
                    className="shadow-lg transition-all duration-200" 
                  />
                  <text 
                    textAnchor="middle" 
                    alignmentBaseline="middle" 
                    fill={mcActive ? "rgba(168, 85, 247, 0.8)" : "#94a3b8"} 
                    fontSize={hoveredPlanetId === 'ic' ? "9" : "8"} 
                    fontWeight="bold" 
                    className="font-sans pointer-events-none transition-all duration-200"
                    dy="0.5"
                  >
                    IC
                  </text>
                </g>
              </g>
            );
          })()}
        </g>

        {/* Interactive Draggable Planet Handles */}
        <g id="draggable-planets">
          {planets.map((planet) => {
            const isActive = planet.active;
            const coords = getPlanetCoords(planet.angle, orbitRadius);
            const isSelected = selectedPlanetId === planet.id;
            const isHovered = hoveredPlanetId === planet.id;

            return (
              <g
                key={planet.id}
                id={`planet-node-${planet.id}`}
                transform={`translate(${coords.x}, ${coords.y})`}
                className={`cursor-grab active:cursor-grabbing transition-opacity duration-200 ${!isActive ? 'opacity-40 hover:opacity-80' : ''}`}
                onPointerDown={(e) => handlePointerDown(planet.id, e)}
                onPointerEnter={() => setHoveredPlanetId(planet.id)}
                onPointerLeave={() => setHoveredPlanetId(null)}
              >
                {/* Outer halo / Selection Ring */}
                <circle
                  r={isSelected ? "18" : isHovered ? "16" : "12"}
                  fill="none"
                  stroke={isActive ? planet.color : "#475569"}
                  strokeWidth="1.5"
                  strokeOpacity={isSelected ? "0.9" : isHovered ? "0.6" : "0"}
                  className="transition-all duration-200"
                  filter={isActive ? "url(#glow-light)" : undefined}
                />

                {/* Pulse wave indicator when dragging */}
                {draggingPlanetId === planet.id && isActive && (
                  <circle
                    r="24"
                    fill="none"
                    stroke={planet.color}
                    strokeWidth="1"
                    strokeOpacity="0.3"
                    className="animate-ping"
                  />
                )}

                {/* Solid background */}
                <circle
                  r="10"
                  fill={isActive ? "#111827" : "#0f172a"}
                  stroke={isActive ? planet.color : "#475569"}
                  strokeWidth="1.5"
                  strokeDasharray={isActive ? "none" : "2 2"}
                  className="transition-colors duration-200"
                />

                {/* Colored Core */}
                {isActive && (
                  <circle
                    r="8"
                    fill={planet.color}
                    opacity="0.15"
                  />
                )}

                {/* Astrological Glyph */}
                <text
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={isActive ? planet.color : "#94a3b8"}
                  fontSize="12"
                  fontWeight="bold"
                  className="font-sans pointer-events-none"
                  dy="1"
                >
                  {planet.symbol}
                </text>
              </g>
            );
          })}
        </g>

        {/* Central Core Sun / Astrolabe Emblem */}
        <g id="central-astrolabe" className="pointer-events-none">
          <circle cx={center} cy={center} r="25" fill="#040609" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <circle cx={center} cy={center} r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          
          {/* Tiny central pointer crosshair */}
          <line x1={center - 8} y1={center} x2={center + 8} y2={center} stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.5" />
          <line x1={center} y1={center - 8} x2={center} y2={center + 8} stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.5" />
          
          {/* Aspect Count Badge in Center */}
          {activeAspects.length > 0 && (
            <g>
              <circle cx={center} cy={center} r="10" fill="#1E1B4B" stroke="rgba(129, 140, 248, 0.5)" strokeWidth="0.75" />
              <text
                x={center}
                y={center + 0.5}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill="#C7D2FE"
                fontSize="9"
                fontWeight="bold"
                dy="0.5"
              >
                {activeAspects.length}
              </text>
            </g>
          )}
        </g>
      </svg>

      {/* Real-time floating HUD Tooltip for hovered/dragged planet */}
      <AnimatePresence>
        {(hoveredPlanetId || draggingPlanetId) && (
          (() => {
            const currentId = draggingPlanetId || hoveredPlanetId;
            const planet = planets.find(p => p.id === currentId);
            if (!planet) return null;
            
            const sign = getZodiacSignForAngle(planet.angle);
            const noteName = getPlanetNoteName(planet);
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 bg-slate-950/95 backdrop-blur-md border border-slate-800/80 rounded-xl px-4 py-2 text-center text-xs w-[240px] shadow-2xl z-20 pointer-events-none"
              >
                <div className="font-semibold text-slate-100 flex items-center justify-center gap-1.5">
                  <span style={{ color: planet.color }}>{planet.symbol}</span>
                  <span>{planet.name}</span>
                  <span className="text-slate-500 font-mono text-[10px]">({Math.round(planet.angle)}°)</span>
                </div>
                <div className="text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                  <span>In</span>
                  <span style={{ color: sign.color }} className="font-medium">{sign.symbol} {sign.name}</span>
                  <span className="text-slate-600">•</span>
                  <span className="uppercase text-[9px] font-mono tracking-wider" style={{ color: sign.color }}>
                    {sign.element}
                  </span>
                </div>
                <div className="mt-1 border-t border-slate-900/80 pt-1 flex justify-between items-center px-1 font-mono text-[10px]">
                  <span className="text-slate-500">Celestial Scale</span>
                  <span className="text-indigo-400 font-bold">{noteName}</span>
                </div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>
    </div>
  );
}
