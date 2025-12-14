// Audio System for Get Poul A Beer
// Manages all sound effects and background music

// Audio context and state
let audioContext = null;
let masterGainNode = null;
let sfxGainNode = null;
let musicGainNode = null;

// Settings state
let soundEnabled = true;
let musicEnabled = true;

// Sound buffers cache
const soundBuffers = {};

// Currently playing sounds (for loops and tracking)
let backgroundMusic = null;
let activePowerupLoops = {};
let lowBeerWarningLoop = null;

// Sound definitions with Web Audio oscillator-based generation
// (No external files needed - all sounds generated procedurally)
const SOUNDS = {
  // High Priority
  jump: { type: 'generated', generator: 'jump' },
  land: { type: 'generated', generator: 'land' },
  slide: { type: 'generated', generator: 'slide' },
  laneSwitch: { type: 'generated', generator: 'laneSwitch' },
  obstacleHit: { type: 'generated', generator: 'obstacleHit' },
  beerCollect: { type: 'generated', generator: 'beerCollect' },
  powerupCollect: { type: 'generated', generator: 'powerupCollect' },
  gameOver: { type: 'generated', generator: 'gameOver' },

  // Medium Priority
  shieldBreak: { type: 'generated', generator: 'shieldBreak' },
  powerupExpire: { type: 'generated', generator: 'powerupExpire' },
  beerSpill: { type: 'generated', generator: 'beerSpill' },

  // Powerup loops
  goldenBeerLoop: { type: 'generated', generator: 'goldenBeerLoop', loop: true },
  magnetLoop: { type: 'generated', generator: 'magnetLoop', loop: true },
  shieldLoop: { type: 'generated', generator: 'shieldLoop', loop: true },
  speedSurgeLoop: { type: 'generated', generator: 'speedSurgeLoop', loop: true },
  slowMoLoop: { type: 'generated', generator: 'slowMoLoop', loop: true },
  ghostLoop: { type: 'generated', generator: 'ghostLoop', loop: true },
  doubleScoreLoop: { type: 'generated', generator: 'doubleScoreLoop', loop: true },

  // Warning
  lowBeerWarning: { type: 'generated', generator: 'lowBeerWarning', loop: true },

  // Music
  backgroundMusic: { type: 'generated', generator: 'backgroundMusic', loop: true },
};

// Initialize audio system
export function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create gain nodes for volume control
    masterGainNode = audioContext.createGain();
    masterGainNode.connect(audioContext.destination);
    masterGainNode.gain.value = 0.7;

    sfxGainNode = audioContext.createGain();
    sfxGainNode.connect(masterGainNode);
    sfxGainNode.gain.value = 0.8;

    musicGainNode = audioContext.createGain();
    musicGainNode.connect(masterGainNode);
    musicGainNode.gain.value = 0.4;

    console.log('Audio system initialized');
    return true;
  } catch (e) {
    console.warn('Web Audio API not supported:', e);
    return false;
  }
}

// Resume audio context (needed after user interaction)
export function resumeAudio() {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

// Sound generators using Web Audio API oscillators and noise
const generators = {
  // Jump sound - quick ascending tone
  jump: () => {
    if (!audioContext || !soundEnabled) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start();
    osc.stop(audioContext.currentTime + 0.15);
  },

  // Land sound - soft thud
  land: () => {
    if (!audioContext || !soundEnabled) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);

    gain.gain.setValueAtTime(0.4, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start();
    osc.stop(audioContext.currentTime + 0.1);
  },

  // Slide sound - swoosh
  slide: () => {
    if (!audioContext || !soundEnabled) return;

    // Create noise for swoosh
    const bufferSize = audioContext.sampleRate * 0.2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.2);
    filter.Q.value = 1;

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGainNode);

    noise.start();
  },

  // Lane switch - subtle swipe
  laneSwitch: () => {
    if (!audioContext || !soundEnabled) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(350, audioContext.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start();
    osc.stop(audioContext.currentTime + 0.08);
  },

  // Obstacle hit - impact crash
  obstacleHit: () => {
    if (!audioContext || !soundEnabled) return;

    // Low thump
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.3);

    const oscGain = audioContext.createGain();
    oscGain.gain.setValueAtTime(0.5, audioContext.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    osc.connect(oscGain);
    oscGain.connect(sfxGainNode);

    // Noise burst
    const bufferSize = audioContext.sampleRate * 0.2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.3, audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    noise.connect(noiseGain);
    noiseGain.connect(sfxGainNode);

    osc.start();
    osc.stop(audioContext.currentTime + 0.3);
    noise.start();
  },

  // Beer collect - satisfying clink + fizz
  beerCollect: () => {
    if (!audioContext || !soundEnabled) return;

    // Glass clink
    const osc1 = audioContext.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, audioContext.currentTime);

    const osc2 = audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1800, audioContext.currentTime);

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.25, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(sfxGainNode);

    osc1.start();
    osc1.stop(audioContext.currentTime + 0.15);
    osc2.start();
    osc2.stop(audioContext.currentTime + 0.15);

    // Fizz
    setTimeout(() => {
      if (!audioContext) return;
      const bufferSize = audioContext.sampleRate * 0.15;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.1 * (1 - i / bufferSize);
      }

      const noise = audioContext.createBufferSource();
      noise.buffer = buffer;

      const filter = audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;

      const noiseGain = audioContext.createGain();
      noiseGain.gain.value = 0.15;

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(sfxGainNode);

      noise.start();
    }, 50);
  },

  // Powerup collect - magical chime
  powerupCollect: () => {
    if (!audioContext || !soundEnabled) return;

    const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6

    frequencies.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = audioContext.createGain();
      const startTime = audioContext.currentTime + i * 0.05;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      osc.connect(gain);
      gain.connect(sfxGainNode);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  },

  // Game over - sad descending tone
  gameOver: () => {
    if (!audioContext || !soundEnabled) return;

    const frequencies = [400, 350, 300, 200];

    frequencies.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;

      const gain = audioContext.createGain();
      const startTime = audioContext.currentTime + i * 0.2;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
      gain.gain.setValueAtTime(0.15, startTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(sfxGainNode);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  },

  // Shield break - glass shatter
  shieldBreak: () => {
    if (!audioContext || !soundEnabled) return;

    // High pitched crack
    const osc = audioContext.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2000, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);

    const oscGain = audioContext.createGain();
    oscGain.gain.setValueAtTime(0.2, audioContext.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    osc.connect(oscGain);
    oscGain.connect(sfxGainNode);

    // Shatter noise
    const bufferSize = audioContext.sampleRate * 0.3;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 1.5);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.value = 0.25;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(sfxGainNode);

    osc.start();
    osc.stop(audioContext.currentTime + 0.1);
    noise.start();
  },

  // Powerup expire - fade out tone
  powerupExpire: () => {
    if (!audioContext || !soundEnabled) return;

    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start();
    osc.stop(audioContext.currentTime + 0.3);
  },

  // Beer spill - liquid splash
  beerSpill: () => {
    if (!audioContext || !soundEnabled) return;

    const bufferSize = audioContext.sampleRate * 0.15;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 0.5);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;

    const gain = audioContext.createGain();
    gain.gain.value = 0.15;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGainNode);

    noise.start();
  },
};

// Powerup loop generators (return stop functions)
const loopGenerators = {
  // Golden beer - shimmering
  goldenBeerLoop: () => {
    if (!audioContext || !soundEnabled) return null;

    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = 800;
    osc2.frequency.value = 805; // Slight detune for shimmer

    const gain = audioContext.createGain();
    gain.gain.value = 0.08;

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(sfxGainNode);

    osc1.start();
    osc2.start();

    return () => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      setTimeout(() => {
        osc1.stop();
        osc2.stop();
      }, 100);
    };
  },

  // Magnet - electric hum
  magnetLoop: () => {
    if (!audioContext || !soundEnabled) return null;

    const osc = audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 60;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    const gain = audioContext.createGain();
    gain.gain.value = 0.06;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGainNode);

    osc.start();

    return () => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      setTimeout(() => osc.stop(), 100);
    };
  },

  // Shield - forcefield hum
  shieldLoop: () => {
    if (!audioContext || !soundEnabled) return null;

    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 200;

    const lfo = audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 4;

    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 30;

    const gain = audioContext.createGain();
    gain.gain.value = 0.07;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start();
    lfo.start();

    return () => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      setTimeout(() => {
        osc.stop();
        lfo.stop();
      }, 100);
    };
  },

  // Speed surge - turbo whoosh
  speedSurgeLoop: () => {
    if (!audioContext || !soundEnabled) return null;

    const bufferSize = audioContext.sampleRate * 2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 0.5;

    const gain = audioContext.createGain();
    gain.gain.value = 0.08;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGainNode);

    noise.start();

    return () => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      setTimeout(() => noise.stop(), 100);
    };
  },

  // Slow-mo - deep pitch-shifted tone
  slowMoLoop: () => {
    if (!audioContext || !soundEnabled) return null;

    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 80;

    const lfo = audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;

    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 10;

    const gain = audioContext.createGain();
    gain.gain.value = 0.1;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start();
    lfo.start();

    return () => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      setTimeout(() => {
        osc.stop();
        lfo.stop();
      }, 100);
    };
  },

  // Ghost - ethereal whoosh
  ghostLoop: () => {
    if (!audioContext || !soundEnabled) return null;

    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = 300;
    osc2.frequency.value = 450;

    const lfo = audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 2;

    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 0.04;

    const gain = audioContext.createGain();
    gain.gain.value = 0.06;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(sfxGainNode);

    osc1.start();
    osc2.start();
    lfo.start();

    return () => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
      setTimeout(() => {
        osc1.stop();
        osc2.stop();
        lfo.stop();
      }, 200);
    };
  },

  // Double score - triumphant loop
  doubleScoreLoop: () => {
    if (!audioContext || !soundEnabled) return null;

    const osc = audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 500;

    const lfo = audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 6;

    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 50;

    const gain = audioContext.createGain();
    gain.gain.value = 0.06;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start();
    lfo.start();

    return () => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      setTimeout(() => {
        osc.stop();
        lfo.stop();
      }, 100);
    };
  },

  // Low beer warning - heartbeat pulse
  lowBeerWarning: () => {
    if (!audioContext || !soundEnabled) return null;

    const beatInterval = setInterval(() => {
      if (!audioContext || !soundEnabled) return;

      // First beat (louder)
      const osc1 = audioContext.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = 60;

      const gain1 = audioContext.createGain();
      gain1.gain.setValueAtTime(0.15, audioContext.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

      osc1.connect(gain1);
      gain1.connect(sfxGainNode);

      osc1.start();
      osc1.stop(audioContext.currentTime + 0.15);

      // Second beat (softer)
      setTimeout(() => {
        if (!audioContext || !soundEnabled) return;

        const osc2 = audioContext.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 50;

        const gain2 = audioContext.createGain();
        gain2.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        osc2.connect(gain2);
        gain2.connect(sfxGainNode);

        osc2.start();
        osc2.stop(audioContext.currentTime + 0.1);
      }, 150);
    }, 800);

    return () => {
      clearInterval(beatInterval);
    };
  },

  // Background music - procedural electronic track with multiple sections
  backgroundMusic: () => {
    if (!audioContext || !musicEnabled) return null;

    const BPM = 128;
    const beatDuration = 60 / BPM;
    const sixteenthNote = beatDuration / 4;

    // Track state
    let currentSection = 0;
    let barCount = 0;
    let beatInBar = 0;
    const intervals = [];
    const oscillators = [];

    // Chord progressions for different sections (in semitones from A)
    // Section 0: Am - F - C - G (verse)
    // Section 1: Am - G - F - E (pre-chorus)
    // Section 2: F - G - Am - Am (chorus)
    // Section 3: Dm - Am - E - Am (bridge)
    const chordProgressions = [
      [[0, 3, 7], [-4, 0, 3], [-9, -5, -2], [-14, -10, -7]],  // Am, F, C, G
      [[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-5, -1, 3]],       // Am, G, F, E
      [[-4, 0, 3], [-2, 2, 5], [0, 3, 7], [0, 3, 7]],         // F, G, Am, Am
      [[-7, -4, 0], [0, 3, 7], [-5, -1, 3], [0, 3, 7]],       // Dm, Am, E, Am
    ];

    // Arpeggio patterns (indices into chord + octave shifts)
    const arpPatterns = [
      [0, 1, 2, 1, 0, 1, 2, 12],           // Basic up-down with octave
      [0, 2, 1, 2, 0, 12, 2, 1],           // Varied
      [0, 0, 2, 2, 1, 1, 12, 12],          // Doubled notes
      [12, 2, 1, 0, 12, 2, 1, 0],          // Descending from octave
      [0, 1, 2, 12, 14, 12, 2, 1],         // Up to high octave and back
      [0, 2, 0, 1, 0, 2, 12, 7],           // Rhythmic variation
    ];

    // Bass patterns (rhythm in 16th notes, 1 = play, 0 = rest)
    const bassPatterns = [
      [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],  // Standard
      [1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1],  // Driving
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],  // Sparse
      [1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0],  // Syncopated
    ];

    // Melody phrases (relative semitones, -99 = rest)
    const melodyPhrases = [
      [0, -99, 3, -99, 5, 7, 5, 3, 0, -99, -2, -99, 0, -99, -99, -99],
      [7, -99, 5, 3, 5, -99, 3, 0, -2, -99, 0, 3, 5, -99, 7, -99],
      [12, 10, 7, -99, 5, 3, 5, 7, 10, -99, 7, 5, 3, 0, -2, 0],
      [0, 3, 5, 7, 10, 7, 5, 3, 0, -99, -99, 3, 5, 7, 10, 12],
      [-99, -99, 0, 3, 5, -99, 7, 10, 12, 10, 7, -99, 5, 3, 0, -99],
      [5, 7, 10, 12, 10, 7, 5, 3, 0, 3, 5, 7, 5, 3, 0, -2],
    ];

    // Root note (A2 = 110 Hz)
    const rootFreq = 110;

    // Convert semitones to frequency
    const semiToFreq = (semi, baseFreq = rootFreq) => {
      return baseFreq * Math.pow(2, semi / 12);
    };

    // Create bass oscillator
    const bassOsc = audioContext.createOscillator();
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.value = rootFreq / 2;

    const bassFilter = audioContext.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 250;
    bassFilter.Q.value = 2;

    const bassGain = audioContext.createGain();
    bassGain.gain.value = 0;

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(musicGainNode);
    bassOsc.start();
    oscillators.push(bassOsc);

    // Create arpeggio oscillator
    const arpOsc = audioContext.createOscillator();
    arpOsc.type = 'square';

    const arpFilter = audioContext.createBiquadFilter();
    arpFilter.type = 'lowpass';
    arpFilter.frequency.value = 2000;

    const arpGain = audioContext.createGain();
    arpGain.gain.value = 0;

    arpOsc.connect(arpFilter);
    arpFilter.connect(arpGain);
    arpGain.connect(musicGainNode);
    arpOsc.start();
    oscillators.push(arpOsc);

    // Create pad oscillators (for chords)
    const padOscs = [];
    const padGains = [];
    for (let i = 0; i < 3; i++) {
      const osc = audioContext.createOscillator();
      osc.type = 'sine';

      const gain = audioContext.createGain();
      gain.gain.value = 0;

      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(musicGainNode);
      osc.start();

      padOscs.push(osc);
      padGains.push(gain);
      oscillators.push(osc);
    }

    // Create melody oscillator
    const melodyOsc = audioContext.createOscillator();
    melodyOsc.type = 'triangle';

    const melodyFilter = audioContext.createBiquadFilter();
    melodyFilter.type = 'lowpass';
    melodyFilter.frequency.value = 3000;

    const melodyGain = audioContext.createGain();
    melodyGain.gain.value = 0;

    melodyOsc.connect(melodyFilter);
    melodyFilter.connect(melodyGain);
    melodyGain.connect(musicGainNode);
    melodyOsc.start();
    oscillators.push(melodyOsc);

    // Create kick drum (low sine burst)
    const kickOsc = audioContext.createOscillator();
    kickOsc.type = 'sine';
    kickOsc.frequency.value = 55;

    const kickGain = audioContext.createGain();
    kickGain.gain.value = 0;

    kickOsc.connect(kickGain);
    kickGain.connect(musicGainNode);
    kickOsc.start();
    oscillators.push(kickOsc);

    // Current pattern selections
    let currentArpPattern = 0;
    let currentBassPattern = 0;
    let currentMelodyPhrase = 0;
    let arpNoteIndex = 0;
    let sixteenthCount = 0;

    // Main sequencer - runs every 16th note
    const sequencerInterval = setInterval(() => {
      if (!audioContext || !musicEnabled) return;

      const now = audioContext.currentTime;
      const chordIndex = Math.floor(beatInBar / 4) % 4;
      const chord = chordProgressions[currentSection][chordIndex];
      const bassPattern = bassPatterns[currentBassPattern];
      const arpPattern = arpPatterns[currentArpPattern];
      const melodyPhrase = melodyPhrases[currentMelodyPhrase];

      // Bass line
      if (bassPattern[sixteenthCount % 16]) {
        const bassNote = semiToFreq(chord[0] - 12, rootFreq);
        bassOsc.frequency.setValueAtTime(bassNote, now);
        bassGain.gain.setValueAtTime(0.18, now);
        bassGain.gain.exponentialRampToValueAtTime(0.08, now + sixteenthNote * 2);
      }

      // Kick on beats 1 and 3
      if (sixteenthCount % 8 === 0) {
        kickOsc.frequency.setValueAtTime(150, now);
        kickOsc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        kickGain.gain.setValueAtTime(0.25, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      }

      // Hi-hat on off-beats (simple noise burst simulation with high osc)
      if (sixteenthCount % 4 === 2) {
        // Using arp filter sweep as pseudo hi-hat
        arpFilter.frequency.setValueAtTime(4000, now);
        arpFilter.frequency.exponentialRampToValueAtTime(1500, now + sixteenthNote);
      }

      // Arpeggio (every 16th note)
      const arpPatternNote = arpPattern[arpNoteIndex % arpPattern.length];
      let arpSemi;
      if (arpPatternNote >= 12) {
        arpSemi = chord[arpPatternNote - 12] + 12;
      } else if (arpPatternNote < 3) {
        arpSemi = chord[arpPatternNote];
      } else {
        arpSemi = chord[0] + arpPatternNote;
      }
      const arpFreq = semiToFreq(arpSemi + 12, rootFreq);
      arpOsc.frequency.setValueAtTime(arpFreq, now);
      arpGain.gain.setValueAtTime(0.06, now);
      arpGain.gain.exponentialRampToValueAtTime(0.02, now + sixteenthNote * 0.8);
      arpNoteIndex++;

      // Pad chords (update on chord changes)
      if (sixteenthCount % 16 === 0) {
        for (let i = 0; i < 3; i++) {
          const padFreq = semiToFreq(chord[i], rootFreq);
          padOscs[i].frequency.setValueAtTime(padFreq, now);
          padGains[i].gain.setValueAtTime(0.04, now);
        }
      }
      // Slight pad fade
      for (let i = 0; i < 3; i++) {
        padGains[i].gain.setValueAtTime(0.035, now + sixteenthNote * 0.5);
      }

      // Melody (every 16th note, with rests)
      const melodyNote = melodyPhrase[sixteenthCount % 16];
      if (melodyNote !== -99) {
        const melodyFreq = semiToFreq(melodyNote + 12, rootFreq);
        melodyOsc.frequency.setValueAtTime(melodyFreq, now);
        melodyGain.gain.setValueAtTime(0.07, now);
        melodyGain.gain.exponentialRampToValueAtTime(0.02, now + sixteenthNote * 1.5);
      } else {
        melodyGain.gain.setValueAtTime(0.001, now);
      }

      // Advance counters
      sixteenthCount++;
      if (sixteenthCount % 4 === 0) {
        beatInBar++;
        if (beatInBar >= 16) {
          // End of 4-bar phrase
          beatInBar = 0;
          barCount++;

          // Change patterns every few bars for variation
          if (barCount % 2 === 0) {
            currentArpPattern = (currentArpPattern + 1) % arpPatterns.length;
          }
          if (barCount % 3 === 0) {
            currentMelodyPhrase = (currentMelodyPhrase + 1) % melodyPhrases.length;
          }
          if (barCount % 4 === 0) {
            currentBassPattern = (currentBassPattern + 1) % bassPatterns.length;
          }

          // Change section every 8 bars (32 beats)
          if (barCount % 8 === 0) {
            currentSection = (currentSection + 1) % chordProgressions.length;
          }
        }
      }
    }, sixteenthNote * 1000);

    intervals.push(sequencerInterval);

    // Return cleanup function
    return () => {
      intervals.forEach(clearInterval);

      // Fade out all gains
      const now = audioContext.currentTime;
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      melodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      padGains.forEach(g => g.gain.exponentialRampToValueAtTime(0.001, now + 0.5));

      setTimeout(() => {
        oscillators.forEach(osc => {
          try { osc.stop(); } catch (e) {}
        });
      }, 600);
    };
  },
};

// Play a one-shot sound
export function playSound(soundName) {
  if (!audioContext || !soundEnabled) return;

  resumeAudio();

  const generator = generators[soundName];
  if (generator) {
    generator();
  }
}

// Start a looping sound (returns stop function)
export function startLoop(loopName) {
  if (!audioContext) return null;

  // For music, check musicEnabled
  if (loopName === 'backgroundMusic' && !musicEnabled) return null;

  // For SFX loops, check soundEnabled
  if (loopName !== 'backgroundMusic' && !soundEnabled) return null;

  resumeAudio();

  const generator = loopGenerators[loopName];
  if (generator) {
    return generator();
  }
  return null;
}

// Start background music
export function startMusic() {
  if (backgroundMusic) return; // Already playing

  backgroundMusic = startLoop('backgroundMusic');
}

// Stop background music
export function stopMusic() {
  if (backgroundMusic) {
    backgroundMusic();
    backgroundMusic = null;
  }
}

// Start a powerup loop
export function startPowerupLoop(powerupType) {
  const loopName = `${powerupType}Loop`;

  // Stop existing loop if any
  stopPowerupLoop(powerupType);

  const stopFn = startLoop(loopName);
  if (stopFn) {
    activePowerupLoops[powerupType] = stopFn;
  }
}

// Stop a powerup loop
export function stopPowerupLoop(powerupType) {
  if (activePowerupLoops[powerupType]) {
    activePowerupLoops[powerupType]();
    delete activePowerupLoops[powerupType];
    playSound('powerupExpire');
  }
}

// Stop all powerup loops
export function stopAllPowerupLoops() {
  for (const type in activePowerupLoops) {
    if (activePowerupLoops[type]) {
      activePowerupLoops[type]();
    }
  }
  activePowerupLoops = {};
}

// Start low beer warning
export function startLowBeerWarning() {
  if (lowBeerWarningLoop) return; // Already playing

  lowBeerWarningLoop = startLoop('lowBeerWarning');
}

// Stop low beer warning
export function stopLowBeerWarning() {
  if (lowBeerWarningLoop) {
    lowBeerWarningLoop();
    lowBeerWarningLoop = null;
  }
}

// Toggle sound effects
export function setSoundEnabled(enabled) {
  soundEnabled = enabled;

  if (!enabled) {
    stopLowBeerWarning();
    stopAllPowerupLoops();
  }
}

// Toggle music
export function setMusicEnabled(enabled) {
  musicEnabled = enabled;

  if (enabled && !backgroundMusic) {
    startMusic();
  } else if (!enabled && backgroundMusic) {
    stopMusic();
  }
}

// Get current sound state
export function isSoundEnabled() {
  return soundEnabled;
}

// Get current music state
export function isMusicEnabled() {
  return musicEnabled;
}

// Stop all audio (for game over / reset)
export function stopAllAudio() {
  stopMusic();
  stopAllPowerupLoops();
  stopLowBeerWarning();
}

// Reset audio for new game
export function resetAudio() {
  stopAllPowerupLoops();
  stopLowBeerWarning();
  // Music keeps playing if enabled
}
