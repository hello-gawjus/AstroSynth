import { NOTES } from './constants';
import { ZodiacElement, SynthParams } from './types';

export class CelestialSynth {
  ctx: AudioContext | null = null;
  onStateChange: ((state: 'suspended' | 'running' | 'closed' | 'uninitialized') => void) | null = null;
  masterGain: GainNode | null = null;
  filterNode: BiquadFilterNode | null = null;
  delayNode: DelayNode | null = null;
  delayFeedbackGain: GainNode | null = null;
  reverbNode: ConvolverNode | null = null;
  reverbWetGain: GainNode | null = null;
  reverbDryGain: GainNode | null = null;
  lfoNode: OscillatorNode | null = null;
  lfoGainNode: GainNode | null = null;
  
  // Noise buffer for the Air element
  noiseBuffer: AudioBuffer | null = null;
  
  // Map of active planet voices
  // Key: planetId, Value: Voice nodes
  voices: Map<string, {
    oscillator: OscillatorNode;
    noiseSource: AudioBufferSourceNode | null;
    noiseFilter: BiquadFilterNode | null;
    noiseGain: GainNode;
    voiceGain: GainNode;
    filterNode: BiquadFilterNode;
  }> = new Map();

  isPlaying: boolean = false;
  params: SynthParams = {
    masterVolume: 0.5,
    filterCutoff: 1500,
    filterQ: 3.0,
    delayTime: 0.4,
    delayFeedback: 0.5,
    reverbWet: 0.4,
    lfoRate: 0.3,
    lfoDepth: 400
  };

  constructor() {
    // Lazy initialisation on first user interaction
  }

  init() {
    if (this.ctx) return;

    // Create Audio Context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.ctx.addEventListener('statechange', () => {
      if (this.onStateChange && this.ctx) {
        this.onStateChange(this.ctx.state);
      }
    });

    const ctx = this.ctx;

    // Create Nodes
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.params.masterVolume, ctx.currentTime);

    // Filter Node (Lowpass)
    this.filterNode = ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(this.params.filterCutoff, ctx.currentTime);
    this.filterNode.Q.setValueAtTime(this.params.filterQ, ctx.currentTime);

    // Delay Node
    this.delayNode = ctx.createDelay(2.0);
    this.delayNode.delayTime.setValueAtTime(this.params.delayTime, ctx.currentTime);
    this.delayFeedbackGain = ctx.createGain();
    this.delayFeedbackGain.gain.setValueAtTime(this.params.delayFeedback, ctx.currentTime);

    // Connect Delay loop
    this.delayNode.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);

    // Reverb Convolver Node (using custom white noise response)
    this.reverbNode = ctx.createConvolver();
    this.reverbNode.buffer = this.createReverbBuffer(ctx);
    
    this.reverbWetGain = ctx.createGain();
    this.reverbWetGain.gain.setValueAtTime(this.params.reverbWet, ctx.currentTime);
    this.reverbDryGain = ctx.createGain();
    this.reverbDryGain.gain.setValueAtTime(1 - this.params.reverbWet, ctx.currentTime);

    // Generate White Noise Buffer for Air element
    this.noiseBuffer = this.createWhiteNoiseBuffer(ctx);

    // LFO modulation for filter cutoff
    this.lfoNode = ctx.createOscillator();
    this.lfoNode.type = 'sine';
    this.lfoNode.frequency.setValueAtTime(this.params.lfoRate, ctx.currentTime);
    
    this.lfoGainNode = ctx.createGain();
    this.lfoGainNode.gain.setValueAtTime(this.params.lfoDepth, ctx.currentTime);

    // Connections
    // LFO -> LFOGain -> Filter Cutoff frequency parameter
    this.lfoNode.connect(this.lfoGainNode);
    this.lfoGainNode.connect(this.filterNode.frequency);

    // Main Synth Path:
    // Voices connect to masterGain.
    // masterGain -> filterNode
    // filterNode splits to:
    // 1. Dry path -> reverbDryGain -> destination
    // 2. Wet path -> reverbNode -> reverbWetGain -> destination
    // 3. Delay path -> delayNode -> masterGain (creates infinite feedback echo)
    // Wait, let's route cleanly:
    // filterNode -> reverbDryGain -> destination
    // filterNode -> reverbNode -> reverbWetGain -> destination
    // filterNode -> delayNode -> destination (and back to delayNode)
    
    this.filterNode.connect(this.masterGain);
    
    this.masterGain.connect(this.reverbDryGain);
    this.masterGain.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbWetGain);
    
    // Connect delays
    this.masterGain.connect(this.delayNode);
    
    // Final gains to destination
    this.reverbDryGain.connect(ctx.destination);
    this.reverbWetGain.connect(ctx.destination);
    this.delayNode.connect(ctx.destination);

    // Start LFO
    this.lfoNode.start();
    
    this.isPlaying = true;
  }

  async resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  private createReverbBuffer(ctx: AudioContext): AudioBuffer {
    const rate = ctx.sampleRate;
    const len = rate * 2.5; // 2.5 seconds reverb tail
    const buffer = ctx.createBuffer(2, len, rate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < len; i++) {
        const percent = i / len;
        // Exponentially decaying white noise for classic smooth reverb
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - percent, 2.5) * 0.5;
      }
    }
    return buffer;
  }

  private createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const rate = ctx.sampleRate;
    const len = rate * 3; // 3 second looping white noise
    const buffer = ctx.createBuffer(1, len, rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  updateParams(newParams: Partial<SynthParams>) {
    this.params = { ...this.params, ...newParams };
    if (!this.ctx) return;

    const ctx = this.ctx;
    const time = ctx.currentTime;

    if (newParams.masterVolume !== undefined && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.params.masterVolume, time, 0.05);
    }

    if (newParams.filterCutoff !== undefined && this.filterNode) {
      // Offset base level, LFO modulates relative to it
      this.filterNode.frequency.setTargetAtTime(this.params.filterCutoff, time, 0.05);
    }

    if (newParams.filterQ !== undefined && this.filterNode) {
      this.filterNode.Q.setTargetAtTime(this.params.filterQ, time, 0.05);
    }

    if (newParams.delayTime !== undefined && this.delayNode) {
      this.delayNode.delayTime.setTargetAtTime(this.params.delayTime, time, 0.1);
    }

    if (newParams.delayFeedback !== undefined && this.delayFeedbackGain) {
      this.delayFeedbackGain.gain.setTargetAtTime(this.params.delayFeedback, time, 0.05);
    }

    if (newParams.reverbWet !== undefined && this.reverbWetGain && this.reverbDryGain) {
      this.reverbWetGain.gain.setTargetAtTime(this.params.reverbWet, time, 0.05);
      this.reverbDryGain.gain.setTargetAtTime(1 - this.params.reverbWet, time, 0.05);
    }

    if (newParams.lfoRate !== undefined && this.lfoNode) {
      this.lfoNode.frequency.setTargetAtTime(this.params.lfoRate, time, 0.1);
    }

    if (newParams.lfoDepth !== undefined && this.lfoGainNode) {
      this.lfoGainNode.gain.setTargetAtTime(this.params.lfoDepth, time, 0.1);
    }
  }

  // Starts or updates a planet's oscillator voice
  triggerPlanet(planetId: string, frequency: number, element: ZodiacElement) {
    if (!this.ctx || !this.filterNode || !this.masterGain) return;

    const ctx = this.ctx;
    const time = ctx.currentTime;

    let voice = this.voices.get(planetId);

    if (!voice) {
      // Create components of a new voice
      const osc = ctx.createOscillator();
      const voiceGain = ctx.createGain();
      const localFilter = ctx.createBiquadFilter();

      // Initial gain is 0 to avoid clicks
      voiceGain.gain.setValueAtTime(0, time);

      // Connect standard Oscillator
      osc.connect(localFilter);
      localFilter.connect(voiceGain);
      voiceGain.connect(this.filterNode);

      // Start the oscillator
      osc.start(time);

      // Setup Air Noise elements (always pre-constructed, gain controlled)
      let noiseSrc: AudioBufferSourceNode | null = null;
      let noiseFilt: BiquadFilterNode | null = null;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, time);
      noiseGain.connect(this.filterNode);

      if (this.noiseBuffer) {
        noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = this.noiseBuffer;
        noiseSrc.loop = true;
        
        noiseFilt = ctx.createBiquadFilter();
        noiseFilt.type = 'bandpass';
        noiseFilt.frequency.setValueAtTime(frequency, time);
        noiseFilt.Q.setValueAtTime(25, time); // High resonance for pitched wind sound

        noiseSrc.connect(noiseFilt);
        noiseFilt.connect(noiseGain);
        noiseSrc.start(time);
      }

      voice = {
        oscillator: osc,
        noiseSource: noiseSrc,
        noiseFilter: noiseFilt,
        noiseGain: noiseGain,
        voiceGain: voiceGain,
        filterNode: localFilter
      };

      this.voices.set(planetId, voice);
    }

    // Now update parameters based on current element & frequency
    // Waveform mappings
    let oscType: OscillatorType = 'sine';
    let filterType: BiquadFilterType = 'lowpass';
    let filterQ = 1.0;
    let oscVolume = 0.0;
    let noiseVolume = 0.0;

    switch (element) {
      case 'fire': // Bright sawtooth
        oscType = 'sawtooth';
        filterType = 'lowpass';
        filterQ = 2.0;
        oscVolume = 0.12; // lower since saws are naturally louder
        noiseVolume = 0.0;
        break;
      case 'earth': // Resonant triangle
        oscType = 'triangle';
        filterType = 'lowpass';
        filterQ = 4.0;
        oscVolume = 0.28;
        noiseVolume = 0.0;
        break;
      case 'water': // Warm, pure sine
        oscType = 'sine';
        filterType = 'allpass'; // leave it warm and pure
        oscVolume = 0.35;
        noiseVolume = 0.0;
        break;
      case 'air': // Complex bandpass-filtered noise + soft sine
        oscType = 'sine';
        filterType = 'highpass';
        filterQ = 1.0;
        oscVolume = 0.08; // quiet sine base
        noiseVolume = 0.18; // lush breathing bandpass noise
        break;
    }

    // Smoothly transition oscillator type & parameters
    voice.oscillator.type = oscType;
    voice.filterNode.type = filterType;
    voice.filterNode.Q.setTargetAtTime(filterQ, time, 0.05);

    // Apply frequency sweeps smoothly
    voice.oscillator.frequency.setTargetAtTime(frequency, time, 0.15);
    
    if (voice.noiseFilter) {
      voice.noiseFilter.frequency.setTargetAtTime(frequency, time, 0.15);
    }

    // Apply volume envelopes
    // We want to avoid volume clicks. Reduce volume slightly based on how many planets are playing (auto-headroom)
    const activeCount = Array.from(this.voices.values()).filter(v => v.voiceGain.gain.value > 0.01).length || 1;
    const headroomMultiplier = Math.max(0.4, 1.2 / Math.sqrt(activeCount + 1));

    const isKeyboard = planetId.startsWith('keyboard_');
    const attackTime = isKeyboard ? 0.02 : 0.2;

    voice.voiceGain.gain.setTargetAtTime(oscVolume * headroomMultiplier, time, attackTime);
    voice.noiseGain.gain.setTargetAtTime(noiseVolume * headroomMultiplier, time, attackTime);
  }

  // Fades out and releases a planet voice
  silencePlanet(planetId: string) {
    const voice = this.voices.get(planetId);
    if (!voice || !this.ctx) return;

    const time = this.ctx.currentTime;
    
    const isKeyboard = planetId.startsWith('keyboard_');
    const releaseTime = isKeyboard ? 0.05 : 0.15;

    // Smoothly fade out to 0 to prevent clicks
    voice.voiceGain.gain.setTargetAtTime(0, time, releaseTime);
    voice.noiseGain.gain.setTargetAtTime(0, time, releaseTime);

    // Keep nodes alive in Map for fast reactivation (avoids creating/destroying nodes constantly)
  }

  // Completely destroys all nodes (for cleanup on unmount)
  dispose() {
    this.voices.forEach((voice) => {
      try {
        voice.oscillator.stop();
        if (voice.noiseSource) {
          voice.noiseSource.stop();
        }
      } catch (e) {
        // already stopped or not started
      }
    });

    this.voices.clear();

    if (this.lfoNode) {
      try { this.lfoNode.stop(); } catch(e) {}
    }

    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }

    this.isPlaying = false;
  }
}

// Global reference for audio ease
let globalSynth: CelestialSynth | null = null;

export function getSynth(): CelestialSynth {
  if (!globalSynth) {
    globalSynth = new CelestialSynth();
  }
  return globalSynth;
}

// Converts a planet angle and scale rules to a frequency in Hz
export function getFrequencyForAngle(
  angle: number,
  baseOctave: number,
  rootNote: string,
  intervals: number[]
): { frequency: number; midiNote: number; noteName: string } {
  const normAngle = ((angle % 360) + 360) % 360;
  
  // Find root note starting index
  const rootMidiIndex = NOTES.indexOf(rootNote);
  // Root midi note for octave 0
  const rootMidi0 = 12 + rootMidiIndex;
  
  // Scale steps definition
  const scaleLength = intervals.length;
  // Span across 2 octaves depending on planetary position
  const maxMidiSteps = scaleLength * 2; 
  
  // Calculate specific step on the chart
  const step = Math.floor((normAngle / 360) * maxMidiSteps);
  const octaveOffset = Math.floor(step / scaleLength);
  const intervalIndex = step % scaleLength;
  
  const semitonesFromRoot = intervals[intervalIndex] + (octaveOffset * 12);
  const finalMidiNote = rootMidi0 + (baseOctave * 12) + semitonesFromRoot;
  
  const frequency = 440 * Math.pow(2, (finalMidiNote - 69) / 12);
  
  // Determine note name
  const noteName = NOTES[finalMidiNote % 12] + Math.floor(finalMidiNote / 12);

  return {
    frequency,
    midiNote: finalMidiNote,
    noteName
  };
}
