import { ZODIAC_SIGNS } from './constants';
import { ZodiacSign, Planet, Aspect, AspectType } from './types';

// Detects which Zodiac Sign an angle (0-360) belongs to
export function getZodiacSignForAngle(angle: number): ZodiacSign {
  const normAngle = ((angle % 360) + 360) % 360;
  const sign = ZODIAC_SIGNS.find(s => normAngle >= s.startAngle && normAngle < s.endAngle);
  return sign || ZODIAC_SIGNS[0];
}

// Formats an angle (0-360) into a clean zodiac degree/sign name, e.g. "Scorpio 14°"
export function getZodiacPositionLabel(angle: number): string {
  const normAngle = ((angle % 360) + 360) % 360;
  const sign = getZodiacSignForAngle(normAngle);
  const degree = Math.floor(normAngle - sign.startAngle);
  return `${sign.name} ${degree}°`;
}

// Calculates absolute difference in angles
export function getAngleDiff(angle1: number, angle2: number): number {
  const diff = Math.abs(angle1 - angle2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// Map aspect configurations
interface AspectConfig {
  type: AspectType;
  targetAngle: number;
  orb: number;
  color: string;
  label: string;
}

const ASPECT_CONFIGS: AspectConfig[] = [
  {
    type: 'conjunction',
    targetAngle: 0,
    orb: 10,
    color: '#A855F7', // purple
    label: 'Conjunction (0° - Focus & Singularity)'
  },
  {
    type: 'sextile',
    targetAngle: 60,
    orb: 6,
    color: '#06B6D4', // cyan
    label: 'Sextile (60° - Opportunity & Flow)'
  },
  {
    type: 'square',
    targetAngle: 90,
    orb: 8,
    color: '#EF4444', // red - tense
    label: 'Square (90° - Challenge & Dynamic Energy)'
  },
  {
    type: 'trine',
    targetAngle: 120,
    orb: 8,
    color: '#F59E0B', // amber - harmony
    label: 'Trine (120° - Grace & Consonants)'
  },
  {
    type: 'opposition',
    targetAngle: 180,
    orb: 10,
    color: '#F97316', // orange - polarity
    label: 'Opposition (180° - Tension & Realization)'
  }
];

// Evaluates aspects between all active planets
export function calculateAspects(planets: Planet[]): Aspect[] {
  const activePlanets = planets.filter(p => p.active);
  const aspects: Aspect[] = [];

  for (let i = 0; i < activePlanets.length; i++) {
    for (let j = i + 1; j < activePlanets.length; j++) {
      const p1 = activePlanets[i];
      const p2 = activePlanets[j];

      const actualDiff = getAngleDiff(p1.angle, p2.angle);

      for (const config of ASPECT_CONFIGS) {
        if (Math.abs(actualDiff - config.targetAngle) <= config.orb) {
          aspects.push({
            id: `${p1.id}-${p2.id}-${config.type}`,
            planet1Id: p1.id,
            planet2Id: p2.id,
            type: config.type,
            angleDiff: config.targetAngle,
            actualDiff: Number(actualDiff.toFixed(1)),
            color: config.color,
            label: config.label
          });
          break; // Avoid double aspects
        }
      }
    }
  }

  return aspects;
}
