// All game audio is made here with the Web Audio API. There are no sound files:
// every note is an oscillator with a short volume envelope.
const Sound = {
  ctx: null,
  master: null,
  musicBus: null,
  sfxBus: null,
  pulseWave: null,
  muted: false,
  storageKey: 'procrastination-muted',

  //Music scheduler state
  musicTimer: null,
  musicStep: 0,
  nextStepTime: 0,
  tempo: 96,

  //Read the saved mute choice. Storage can be blocked, so it is optional.
  loadMuted() {
    try {
      this.muted = window.localStorage.getItem(this.storageKey) === '1';
    } catch (e) {
      this.muted = false;
    }
    return this.muted;
  },

  saveMuted() {
    try {
      window.localStorage.setItem(this.storageKey, this.muted ? '1' : '0');
    } catch (e) {
      //Nothing to do, the choice just is not remembered
    }
  },

  //Browsers only allow audio after a user gesture, so this runs on the start action
  unlock() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    if (!this.ctx) {
      this.ctx = new AudioContextClass();

      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.32;
      this.musicBus.connect(this.master);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.55;
      this.sfxBus.connect(this.master);

      this.pulseWave = this.createPulseWave(0.25);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  },

  //A 25% pulse wave sounds more like an old console than a plain square wave
  createPulseWave(duty) {
    const harmonics = 32;
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics);
    for (let n = 1; n < harmonics; n++) {
      real[n] = Math.sin(2 * Math.PI * n * duty) / (n * Math.PI);
      imag[n] = (1 - Math.cos(2 * Math.PI * n * duty)) / (n * Math.PI);
    }
    return this.ctx.createPeriodicWave(real, imag);
  },

  setMuted(muted) {
    this.muted = muted;
    this.saveMuted();
    if (this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.02);
    }
    document.dispatchEvent(new CustomEvent('SoundMuteChange', { detail: { muted } }));
  },

  toggleMute() {
    this.setMuted(!this.muted);
  },

  midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  },

  //Play one note: wave type, MIDI note, start time, length in seconds, volume, output bus
  playNote({ wave, midi, time, length, volume, bus }) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    if (wave === 'pulse') {
      osc.setPeriodicWave(this.pulseWave);
    } else {
      osc.type = wave;
    }
    osc.frequency.value = this.midiToFrequency(midi);

    //Quick attack, gentle decay, short release so notes do not click
    const attack = 0.008;
    const release = Math.min(0.08, length * 0.4);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + attack);
    gain.gain.exponentialRampToValueAtTime(volume * 0.6, time + Math.max(attack + 0.01, length - release));
    gain.gain.linearRampToValueAtTime(0, time + length);

    osc.connect(gain);
    gain.connect(bus || this.sfxBus);
    osc.start(time);
    osc.stop(time + length + 0.02);
  },

  // ---------- Background music ----------
  // 8 bars in C major, eighth note steps. Chords: C Am F G C Am Dm G.
  // Each melody bar lists [MIDI note, length in eighths], null is a rest.
  song: {
    melody: [
      [[76, 2], [79, 2], [84, 2], [79, 2]],
      [[81, 3], [79, 1], [76, 4]],
      [[77, 2], [81, 2], [84, 2], [81, 2]],
      [[79, 3], [77, 1], [76, 2], [74, 2]],
      [[76, 2], [79, 2], [84, 2], [79, 2]],
      [[81, 2], [84, 2], [83, 2], [81, 2]],
      [[77, 2], [76, 2], [74, 2], [77, 2]],
      [[74, 4], [71, 2], [null, 2]],
    ],
    bass: [36, 45, 41, 43, 36, 45, 38, 43],
    chords: [
      [60, 64, 67],
      [57, 60, 64],
      [57, 60, 65],
      [59, 62, 67],
      [60, 64, 67],
      [57, 60, 64],
      [57, 62, 65],
      [59, 62, 67],
    ],
  },

  //Turn the bars into a list of events per eighth note step
  buildSong() {
    const steps = [];
    const bars = this.song.melody.length;
    for (let i = 0; i < bars * 8; i++) steps.push([]);

    this.song.melody.forEach((bar, barIndex) => {
      let step = barIndex * 8;
      bar.forEach(([midi, eighths]) => {
        if (midi !== null) {
          steps[step].push({ part: 'melody', midi, eighths });
        }
        step += eighths;
      });
    });

    const arpeggio = [0, 1, 2, 1, 0, 1, 2, 1];
    for (let barIndex = 0; barIndex < bars; barIndex++) {
      const root = this.song.bass[barIndex];
      const chord = this.song.chords[barIndex];
      for (let i = 0; i < 8; i++) {
        const step = barIndex * 8 + i;
        //Bass on beats 1 to 4, root and octave
        if (i % 2 === 0) {
          steps[step].push({ part: 'bass', midi: i === 4 ? root + 12 : root, eighths: 2 });
        }
        steps[step].push({ part: 'arp', midi: chord[arpeggio[i]], eighths: 1 });
      }
    }
    return steps;
  },

  scheduleStep(events, time) {
    const eighth = 60 / this.tempo / 2;
    events.forEach((event) => {
      const length = event.eighths * eighth * 0.92;
      if (event.part === 'melody') {
        this.playNote({ wave: 'pulse', midi: event.midi, time, length, volume: 0.16, bus: this.musicBus });
      } else if (event.part === 'bass') {
        this.playNote({ wave: 'triangle', midi: event.midi, time, length, volume: 0.32, bus: this.musicBus });
      } else {
        this.playNote({ wave: 'square', midi: event.midi, time, length: length * 0.6, volume: 0.035, bus: this.musicBus });
      }
    });
  },

  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    this.songSteps = this.songSteps || this.buildSong();
    this.musicStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.1;

    //Look ahead scheduler: a timer wakes up often and books the notes that
    //start in the next 200ms on the audio clock, so timing stays steady
    const eighth = 60 / this.tempo / 2;
    this.musicTimer = setInterval(() => {
      while (this.nextStepTime < this.ctx.currentTime + 0.2) {
        this.scheduleStep(this.songSteps[this.musicStep], this.nextStepTime);
        this.nextStepTime += eighth;
        this.musicStep = (this.musicStep + 1) % this.songSteps.length;
      }
    }, 50);
  },

  stopMusic() {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
  },

  // ---------- Sound effects ----------

  //Bright two note chime for a finished task
  bling() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.01;
    this.playNote({ wave: 'pulse', midi: 88, time: t, length: 0.09, volume: 0.22 });
    this.playNote({ wave: 'pulse', midi: 93, time: t + 0.09, length: 0.4, volume: 0.22 });
    this.playNote({ wave: 'triangle', midi: 105, time: t + 0.09, length: 0.3, volume: 0.12 });
  },

  //Soft blip when a text message is closed
  blip() {
    if (!this.ctx) return;
    this.playNote({ wave: 'triangle', midi: 84, time: this.ctx.currentTime + 0.005, length: 0.05, volume: 0.18 });
  },

  //Short fanfare for the win screen
  victory() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.05;
    const notes = [
      [72, 0, 0.12],
      [76, 0.12, 0.12],
      [79, 0.24, 0.12],
      [84, 0.36, 0.24],
      [79, 0.6, 0.12],
      [84, 0.72, 0.9],
    ];
    notes.forEach(([midi, start, length]) => {
      this.playNote({ wave: 'pulse', midi, time: t + start, length, volume: 0.22 });
    });
    //Final chord under the last note
    [60, 64, 67].forEach((midi) => {
      this.playNote({ wave: 'triangle', midi, time: t + 0.72, length: 0.9, volume: 0.2 });
    });
  },

  //Slow falling notes for the midnight ending
  midnight() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.05;
    [67, 65, 64, 60].forEach((midi, i) => {
      this.playNote({ wave: 'triangle', midi, time: t + i * 0.22, length: i === 3 ? 0.7 : 0.2, volume: 0.3 });
    });
  },
};

window.Sound = Sound;
