import { ZodiacSign, Planet, ScalePreset, CelestialPreset } from './types';

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    id: 'aries',
    name: 'Aries',
    symbol: '♈',
    element: 'fire',
    startAngle: 0,
    endAngle: 30,
    color: '#EF4444', // red
    bgColor: 'rgba(239, 68, 68, 0.1)',
    description: 'Energetic, pioneering, bold. Associated with a bright, dynamic sawtooth waveform with a short, punchy attack.'
  },
  {
    id: 'taurus',
    name: 'Taurus',
    symbol: '♉',
    element: 'earth',
    startAngle: 30,
    endAngle: 60,
    color: '#10B981', // green
    bgColor: 'rgba(16, 185, 129, 0.1)',
    description: 'Grounded, patient, sensual. Associated with a resonant triangle waveform providing rich, deep low-end stability.'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    symbol: '♊',
    element: 'air',
    startAngle: 60,
    endAngle: 90,
    color: '#06B6D4', // cyan
    bgColor: 'rgba(6, 182, 212, 0.1)',
    description: 'Curious, versatile, expressive. Associated with a dual-oscillator FM-like airy frequency modulated sine wave.'
  },
  {
    id: 'cancer',
    name: 'Cancer',
    symbol: '♋',
    element: 'water',
    startAngle: 90,
    endAngle: 120,
    color: '#3B82F6', // blue
    bgColor: 'rgba(59, 130, 246, 0.1)',
    description: 'Intuitive, nurturing, fluid. Associated with a pure, warm sine wave filtered through a slow chorus and delay.'
  },
  {
    id: 'leo',
    name: 'Leo',
    symbol: '♌',
    element: 'fire',
    startAngle: 120,
    endAngle: 150,
    color: '#F59E0B', // amber
    bgColor: 'rgba(245, 158, 11, 0.1)',
    description: 'Proud, charismatic, creative. Associated with a bright, heroic pulse-width modulated (PWM) sawtooth wave.'
  },
  {
    id: 'virgo',
    name: 'Virgo',
    symbol: '♍',
    element: 'earth',
    startAngle: 150,
    endAngle: 180,
    color: '#047857', // emerald
    bgColor: 'rgba(4, 120, 87, 0.1)',
    description: 'Analytical, helpful, modest. Associated with a focused, filtered triangle wave with precise sub-harmonics.'
  },
  {
    id: 'libra',
    name: 'Libra',
    symbol: '♎',
    element: 'air',
    startAngle: 180,
    endAngle: 210,
    color: '#14B8A6', // teal
    bgColor: 'rgba(20, 184, 166, 0.1)',
    description: 'Harmonious, diplomatic, artistic. Associated with a shimmering, bandpass-filtered noise cloud pad.'
  },
  {
    id: 'scorpio',
    name: 'Scorpio',
    symbol: '♏',
    element: 'water',
    startAngle: 210,
    endAngle: 240,
    color: '#6366F1', // indigo
    bgColor: 'rgba(99, 102, 241, 0.1)',
    description: 'Intense, passionate, profound. Associated with a deep sub-bass sine wave combined with subtle phase modulation.'
  },
  {
    id: 'sagittarius',
    name: 'Sagittarius',
    symbol: '♐',
    element: 'fire',
    startAngle: 240,
    endAngle: 270,
    color: '#EC4899', // pink
    bgColor: 'rgba(236, 72, 153, 0.1)',
    description: 'Optimistic, philosophical, free. Associated with a rich, brassy sawtooth wave sweeping upward.'
  },
  {
    id: 'capricorn',
    name: 'Capricorn',
    symbol: '♑',
    element: 'earth',
    startAngle: 270,
    endAngle: 300,
    color: '#78350F', // brown
    bgColor: 'rgba(120, 53, 15, 0.1)',
    description: 'Disciplined, ambitious, structured. Associated with a solid, narrow triangle wave with steep low-pass filtering.'
  },
  {
    id: 'aquarius',
    name: 'Aquarius',
    symbol: '♒',
    element: 'air',
    startAngle: 300,
    endAngle: 330,
    color: '#0EA5E9', // sky
    bgColor: 'rgba(14, 165, 233, 0.1)',
    description: 'Original, humanitarian, cosmic. Associated with a futuristic digital frequency-modulated (FM) metallic sound.'
  },
  {
    id: 'pisces',
    name: 'Pisces',
    symbol: '♓',
    element: 'water',
    startAngle: 330,
    endAngle: 360,
    color: '#8B5CF6', // purple
    bgColor: 'rgba(139, 92, 246, 0.1)',
    description: 'Dreamy, spiritual, mystical. Associated with an ultra-warm sine wave with lush reverberant spaces.'
  }
];

export const PLANETS: Planet[] = [
  {
    id: 'sun',
    name: 'Sun',
    symbol: '☉',
    color: '#FBBF24', // golden yellow
    angle: 0,
    active: true,
    baseOctave: 3,
    description: 'The conscious self, ego, and vitality. Plays a central, grounding fundamental note.',
    governingSign: 'Leo'
  },
  {
    id: 'moon',
    name: 'Moon',
    symbol: '☽',
    color: '#CBD5E1', // silver gray
    angle: 120,
    active: true,
    baseOctave: 4,
    description: 'The subconscious, emotions, and intuition. Plays a soft, highly modulated reflective melody.',
    governingSign: 'Cancer'
  },
  {
    id: 'mercury',
    name: 'Mercury',
    symbol: '☿',
    color: '#60A5FA', // mercury blue
    angle: 45,
    active: false,
    baseOctave: 4,
    description: 'Communication, intellect, and reason. Plays quick, shimmering high-frequency notes.',
    governingSign: 'Gemini'
  },
  {
    id: 'venus',
    name: 'Venus',
    symbol: '♀',
    color: '#F472B6', // rose pink
    angle: 90,
    active: true,
    baseOctave: 4,
    description: 'Love, beauty, harmony, and art. Plays a sweet, consonant major-interval harmonic pitch.',
    governingSign: 'Libra'
  },
  {
    id: 'mars',
    name: 'Mars',
    symbol: '♂',
    color: '#F87171', // iron red
    angle: 270,
    active: false,
    baseOctave: 3,
    description: 'Action, drive, and energy. Plays a sharp, intense, slightly detuned carrier note.',
    governingSign: 'Aries'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    symbol: '♃',
    color: '#FB923C', // warm orange
    angle: 240,
    active: true,
    baseOctave: 3,
    description: 'Luck, expansion, and philosophy. Triggers spacious, layered major triads.',
    governingSign: 'Sagittarius'
  },
  {
    id: 'saturn',
    name: 'Saturn',
    symbol: '♄',
    color: '#D97706', // amber/bronze
    angle: 180,
    active: true,
    baseOctave: 2,
    description: 'Structure, karma, discipline, and limits. Plays a deep, resonant, filtered sub-octave drone.',
    governingSign: 'Capricorn'
  },
  {
    id: 'uranus',
    name: 'Uranus',
    symbol: '♅',
    color: '#2DD4BF', // electric teal
    angle: 315,
    active: false,
    baseOctave: 5,
    description: 'Awakening, change, innovation, and surprise. Triggers highly detuned electric harmonics.',
    governingSign: 'Aquarius'
  },
  {
    id: 'neptune',
    name: 'Neptune',
    symbol: '♆',
    color: '#818CF8', // mystical indigo
    angle: 150,
    active: false,
    baseOctave: 5,
    description: 'Dreams, illusions, spirituality, and art. Blends into a wide, heavily delayed reverbed cloud.',
    governingSign: 'Pisces'
  },
  {
    id: 'pluto',
    name: 'Pluto',
    symbol: '♇',
    color: '#C084FC', // deep purple
    angle: 210,
    active: false,
    baseOctave: 1,
    description: 'Transformation, power, rebirth, and the underworld. Creates an ultra-low, powerful rumbling rumble.',
    governingSign: 'Scorpio'
  }
];

export const SCALE_PRESETS: ScalePreset[] = [
  {
    id: 'lydian',
    name: 'Cosmic Lydian',
    intervals: [0, 2, 4, 6, 7, 9, 11], // C, D, E, F#, G, A, B
    description: 'Ethereal, bright, and futuristic. The raised 4th creates an uplifting, space-like quality.'
  },
  {
    id: 'dorian',
    name: 'Mystic Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10], // C, D, Eb, F, G, A, Bb
    description: 'Contemplative, ancient, and melancholic with a hint of brightness.'
  },
  {
    id: 'pentatonic_major',
    name: 'Celestial Pentatonic',
    intervals: [0, 2, 4, 7, 9], // C, D, E, G, A
    description: 'Perfectly harmonious, airy, and open. No dissonant intervals can be made.'
  },
  {
    id: 'pentatonic_minor',
    name: 'Zen Nebula Pentatonic',
    intervals: [0, 3, 5, 7, 10], // C, Eb, F, G, Bb
    description: 'Deeply peaceful, reflective, and spacious. Evokes a sense of floating in deep space.'
  },
  {
    id: 'harmonic_minor',
    name: 'Kabbalah Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11], // C, D, Eb, F, G, Ab, B
    description: 'Dramatic, intense, and mysterious. Full of spiritual tension and emotional weight.'
  },
  {
    id: 'phrygian_dominant',
    name: 'Solar Eclipse Phrygian',
    intervals: [0, 1, 4, 5, 7, 8, 10], // C, Db, E, F, G, Ab, Bb
    description: 'Warm, exotic, and heavy. Captures the blazing power of stellar corona flares.'
  }
];

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const CELESTIAL_PRESETS: CelestialPreset[] = [
  {
    id: 'grand_trine',
    name: 'Water Grand Trine (Fluid Harmony)',
    description: 'An auspicious alignment of Moon, Venus, and Jupiter at exactly 120° offsets in Water signs. Produces three perfectly consonant, lush major/minor blended third chords.',
    scaleId: 'pentatonic_major',
    rootNote: 'F',
    planets: [
      { id: 'sun', angle: 0, active: false },
      { id: 'moon', angle: 90, active: true }, // Cancer (Water)
      { id: 'venus', angle: 210, active: true }, // Scorpio (Water)
      { id: 'jupiter', angle: 330, active: true }, // Pisces (Water)
      { id: 'saturn', angle: 180, active: false }
    ]
  },
  {
    id: 'grand_cross',
    name: 'The Cardinal Grand Cross (Tension & Rebirth)',
    description: 'A powerful, high-tension configuration with four planets forming four 90° squares and two 180° oppositions. Generates rich, tense, unresolved, dark space-ambient chords.',
    scaleId: 'harmonic_minor',
    rootNote: 'C',
    planets: [
      { id: 'sun', angle: 0, active: true }, // Aries (Fire)
      { id: 'moon', angle: 180, active: true }, // Libra (Air) - Opposition
      { id: 'venus', angle: 90, active: true }, // Cancer (Water) - Square
      { id: 'mars', angle: 270, active: true } // Capricorn (Earth) - Square
    ]
  },
  {
    id: 'mystic_conjunction',
    name: 'Stellium Conjunction (Singularity)',
    description: 'Multiple outer planets aligned very closely (within 10°) under the Pisces constellation. Triggers a chorus-like phasing, beating effect that slowly blooms.',
    scaleId: 'lydian',
    rootNote: 'A',
    planets: [
      { id: 'sun', angle: 345, active: true },
      { id: 'moon', angle: 348, active: true },
      { id: 'venus', angle: 352, active: true },
      { id: 'neptune', angle: 350, active: true }
    ]
  },
  {
    id: 'solstice_alignment',
    name: 'Summer Solstice Zenith',
    description: 'Sun and Mercury positioned at the peak of the chart, with Saturn anchoring the bottom, creating a vast 180° vertical opposition over a grounding sub-drone.',
    scaleId: 'dorian',
    rootNote: 'D',
    planets: [
      { id: 'sun', angle: 90, active: true }, // Cancer Peak
      { id: 'mercury', angle: 95, active: true }, // Quick high note
      { id: 'venus', angle: 135, active: true },
      { id: 'saturn', angle: 270, active: true } // Capricorn Base
    ]
  }
];
