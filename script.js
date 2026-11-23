(() => {
  'use strict';

  const scenes = {
    backdrop: document.getElementById('backdrop'),
    ready: document.getElementById('ready'),
    countdown: document.getElementById('countdown'),
    revealed: document.getElementById('revealed')
  };
  const launchButton = document.getElementById('launch-button');
  const continueButton = document.getElementById('continue-button');
  const backdropButton = document.getElementById('backdrop-button');
  const countdownNumber = document.getElementById('countdown-number');
  const progressPips = document.getElementById('progress-pips');
  const particles = document.getElementById('celebration-particles');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsToggle = document.getElementById('settings-toggle');
  const paceSelect = document.getElementById('pace-select');
  const soundToggle = document.getElementById('sound-toggle');
  const soundLevel = document.getElementById('sound-level');
  const soundLevelValue = document.getElementById('sound-level-value');
  const fullscreenButton = document.getElementById('fullscreen-button');
  let phase = 'backdrop';
  let nextTick = null;
  let audioContext = null;
  let masterGain = null;
  let activeWave = null;

  for (let i = 10; i >= 1; i--) {
    const pip = document.createElement('span');
    pip.dataset.number = String(i);
    progressPips.appendChild(pip);
  }

  function showScene(name) {
    phase = name;
    Object.entries(scenes).forEach(([key, node]) => {
      const active = key === name;
      node.classList.toggle('is-active', active);
      node.inert = !active;
      node.setAttribute('aria-hidden', String(!active));
    });
    document.body.dataset.phase = name;
    continueButton.hidden = name !== 'backdrop';
    backdropButton.hidden = name !== 'ready';
  }

  function continueToLaunch() {
    if (phase !== 'backdrop') return;
    showScene('ready');
    setSettings(false);
  }

  function returnToBackdrop() {
    if (phase !== 'ready') return;
    showScene('backdrop');
    setSettings(false);
    continueButton.focus({preventScroll: true});
  }

  function audio() {
    if (!soundToggle.checked) return null;
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const limiter = audioContext.createDynamicsCompressor();
        limiter.threshold.value = -10;
        limiter.knee.value = 7;
        limiter.ratio.value = 5;
        limiter.attack.value = .004;
        limiter.release.value = .26;
        masterGain = audioContext.createGain();
        masterGain.connect(limiter).connect(audioContext.destination);
      }
      if (audioContext.state === 'suspended') audioContext.resume();
      updateSoundLevel();
      return audioContext;
    } catch (_) {
      return null;
    }
  }

  function updateSoundLevel() {
    soundLevelValue.textContent = `${soundLevel.value}%`;
    if (!audioContext || !masterGain) return;
    const requested = Number(soundLevel.value) / 100;
    const value = soundToggle.checked ? Math.min(1.5, requested) * .75 : 0;
    masterGain.gain.setTargetAtTime(value, audioContext.currentTime, .025);
  }

  function noiseSource(ctx, seconds) {
    const size = Math.ceil(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) channel[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  function filter(ctx, type, frequency, q = .6) {
    const node = ctx.createBiquadFilter();
    node.type = type;
    node.frequency.value = frequency;
    node.Q.value = q;
    return node;
  }

  function countdownBeep(number) {
    const ctx = audio();
    if (!ctx) return;
    const progress = (10 - number) / 8;
    const start = ctx.currentTime + .012;
    const duration = .84;

    // A firm, sustained countdown beep; no ringing or bell-like tail.
    const beep = ctx.createOscillator();
    beep.type = 'square';
    beep.frequency.value = 590;
    const beepLow = filter(ctx, 'lowpass', 1700);
    const beepGain = ctx.createGain();
    const peak = .57 + .16 * progress;
    beepGain.gain.setValueAtTime(.0001, start);
    beepGain.gain.linearRampToValueAtTime(peak, start + .025);
    beepGain.gain.setValueAtTime(peak, start + duration - .15);
    beepGain.gain.linearRampToValueAtTime(.0001, start + duration);
    beep.connect(beepLow).connect(beepGain).connect(masterGain);
    beep.start(start);
    beep.stop(start + duration);

    // A lower supporting tone gives the beep presence on event PA systems.
    const body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.value = 295;
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(.0001, start);
    bodyGain.gain.linearRampToValueAtTime(.21 + .05 * progress, start + .03);
    bodyGain.gain.setValueAtTime(.21 + .05 * progress, start + duration - .15);
    bodyGain.gain.linearRampToValueAtTime(.0001, start + duration);
    body.connect(bodyGain).connect(masterGain);
    body.start(start);
    body.stop(start + duration);
  }

  function countdownWave() {
    const ctx = audio();
    if (!ctx) return;
    // The final number is unmistakably louder than the preceding beeps.
    const strength = 2.4;
    const duration = Math.min(1.8, Math.max(1.3, Number(paceSelect.value) / 1000 - .2));
    const start = ctx.currentTime + .012;

    // A sharply breaking wave for number 1, with rushing water and heavy foam.
    const rush = noiseSource(ctx, duration);
    const rushHigh = filter(ctx, 'highpass', 85);
    const rushLow = filter(ctx, 'lowpass', 4600);
    const rushGain = ctx.createGain();
    rushGain.gain.setValueAtTime(.0001, start);
    rushGain.gain.linearRampToValueAtTime(.5 * strength, start + .07);
    rushGain.gain.exponentialRampToValueAtTime(.25 * strength, start + .58);
    rushGain.gain.exponentialRampToValueAtTime(.0001, start + duration - .04);
    rush.connect(rushHigh).connect(rushLow).connect(rushGain).connect(masterGain);
    rush.start(start);
    rush.stop(start + duration);

    // A bright splash accent emphasizes the impact of number 1.
    const foam = noiseSource(ctx, duration);
    const foamBand = filter(ctx, 'bandpass', 3050, .55);
    const foamGain = ctx.createGain();
    foamGain.gain.setValueAtTime(.0001, start);
    foamGain.gain.linearRampToValueAtTime(.29 * strength, start + .12);
    foamGain.gain.exponentialRampToValueAtTime(.11 * strength, start + .48);
    foamGain.gain.exponentialRampToValueAtTime(.0001, start + duration - .08);
    foam.connect(foamBand).connect(foamGain).connect(masterGain);
    foam.start(start);
    foam.stop(start + duration);

    // Deep ocean surge underneath the crash supplies its weight.
    const undertow = noiseSource(ctx, duration);
    const undertowLow = filter(ctx, 'lowpass', 390);
    const undertowGain = ctx.createGain();
    undertowGain.gain.setValueAtTime(.0001, start);
    undertowGain.gain.linearRampToValueAtTime(.36 * strength, start + .18);
    undertowGain.gain.exponentialRampToValueAtTime(.0001, start + duration - .07);
    undertow.connect(undertowLow).connect(undertowGain).connect(masterGain);
    undertow.start(start);
    undertow.stop(start + duration);
  }

  function stopWave() {
    if (!activeWave || !audioContext) return;
    const now = audioContext.currentTime;
    for (const node of activeWave) {
      node.gain.cancelScheduledValues(now);
      node.gain.setTargetAtTime(.00001, now, .07);
    }
    activeWave = null;
  }

  function playWaveSplash() {
    const ctx = audio();
    if (!ctx) return;
    stopWave();
    const start = ctx.currentTime + .025;
    const waveBus = ctx.createGain();
    waveBus.gain.value = 1;
    waveBus.connect(masterGain);

    // A broad crashing wave: a sharp surge followed by rolling, foamy water.
    const crash = noiseSource(ctx, 4.6);
    const crashGain = ctx.createGain();
    const crashHigh = filter(ctx, 'highpass', 95);
    const crashLow = filter(ctx, 'lowpass', 5200);
    crashGain.gain.setValueAtTime(.0001, start);
    crashGain.gain.linearRampToValueAtTime(.92, start + .11);
    crashGain.gain.exponentialRampToValueAtTime(.4, start + .83);
    crashGain.gain.exponentialRampToValueAtTime(.08, start + 2.6);
    crashGain.gain.exponentialRampToValueAtTime(.0001, start + 4.5);
    crash.connect(crashHigh).connect(crashLow).connect(crashGain).connect(waveBus);
    crash.start(start);
    crash.stop(start + 4.6);

    // Separate high-frequency foam bursts make the splash distinctive.
    const foam = noiseSource(ctx, 2.3);
    const foamGain = ctx.createGain();
    const foamBand = filter(ctx, 'bandpass', 3100, .65);
    const bursts = [
      [0, .0001], [.12, .4], [.24, .04], [.42, .3],
      [.58, .035], [.76, .2], [1.13, .03], [2.2, .0001]
    ];
    for (const [offset, gain] of bursts) foamGain.gain.linearRampToValueAtTime(gain, start + offset);
    foam.connect(foamBand).connect(foamGain).connect(waveBus);
    foam.start(start);
    foam.stop(start + 2.3);

    // The splash gives way to two soft, deep ocean swells and a long fade.
    const ocean = noiseSource(ctx, 9.6);
    const oceanGain = ctx.createGain();
    const oceanLow = filter(ctx, 'lowpass', 900);
    const oceanHigh = filter(ctx, 'highpass', 60);
    const swells = [
      [0, .0001], [.5, .06], [1.4, .23], [2.6, .35],
      [3.8, .22], [5.2, .32], [6.5, .18], [8, .055], [9.4, .0001]
    ];
    for (const [offset, gain] of swells) oceanGain.gain.linearRampToValueAtTime(gain, start + offset);
    ocean.connect(oceanHigh).connect(oceanLow).connect(oceanGain).connect(waveBus);
    ocean.start(start);
    ocean.stop(start + 9.6);

    // An echo/reverb path lets the crash repeat softly over the ocean wash.
    const delay = ctx.createDelay(2);
    delay.delayTime.value = .57;
    const echoLow = filter(ctx, 'lowpass', 1650);
    const feedback = ctx.createGain();
    feedback.gain.value = .27;
    const echoWet = ctx.createGain();
    echoWet.gain.value = .31;
    waveBus.connect(delay);
    delay.connect(echoLow);
    echoLow.connect(echoWet).connect(masterGain);
    echoLow.connect(feedback).connect(delay);
    activeWave = [waveBus, echoWet];
  }

  function setNumber(number) {
    countdownNumber.classList.remove('number-enter');
    void countdownNumber.offsetWidth;
    countdownNumber.textContent = String(number);
    countdownNumber.classList.add('number-enter');
    for (const pip of progressPips.children) {
      pip.classList.toggle('is-lit', Number(pip.dataset.number) >= number);
    }
    if (number === 1) countdownWave();
    else countdownBeep(number);
  }

  function tick(number) {
    if (phase !== 'countdown') return;
    setNumber(number);
    const pace = Number(paceSelect.value) || 2000;
    if (number > 1) nextTick = window.setTimeout(() => tick(number - 1), pace);
    else nextTick = window.setTimeout(reveal, pace);
  }

  function start() {
    if (phase !== 'ready') return;
    audio();
    stopWave();
    window.clearTimeout(nextTick);
    showScene('countdown');
    setSettings(false);
    tick(10);
  }

  function makeParticles() {
    particles.replaceChildren();
    const palette = ['#d7b577', '#6cddd1', '#f5f0e2', '#a7e5f0'];
    for (let index = 0; index < 44; index++) {
      const bit = document.createElement('i');
      bit.style.setProperty('--x', `${8 + Math.random() * 84}%`);
      bit.style.setProperty('--drift', `${-160 + Math.random() * 320}px`);
      bit.style.setProperty('--delay', `${Math.random() * .9}s`);
      bit.style.setProperty('--duration', `${3.2 + Math.random() * 2.4}s`);
      bit.style.setProperty('--color', palette[index % palette.length]);
      bit.style.setProperty('--rotate', `${Math.random() * 720}deg`);
      particles.appendChild(bit);
    }
  }

  function reveal() {
    if (phase !== 'countdown') return;
    window.clearTimeout(nextTick);
    makeParticles();
    showScene('revealed');
    playWaveSplash();
  }

  function reset() {
    window.clearTimeout(nextTick);
    nextTick = null;
    stopWave();
    particles.replaceChildren();
    countdownNumber.textContent = '10';
    for (const pip of progressPips.children) pip.classList.remove('is-lit');
    showScene('backdrop');
    setSettings(false);
    continueButton.focus({preventScroll: true});
  }

  function setSettings(open) {
    settingsPanel.hidden = !open;
    settingsToggle.setAttribute('aria-expanded', String(open));
  }

  async function fullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {
      // Browser or display policy can disable fullscreen; ceremony still works.
    }
  }

  launchButton.addEventListener('click', start);
  continueButton.addEventListener('click', continueToLaunch);
  backdropButton.addEventListener('click', returnToBackdrop);
  document.getElementById('reset-button').addEventListener('click', reset);
  settingsToggle.addEventListener('click', () => setSettings(settingsPanel.hidden));
  document.getElementById('settings-close').addEventListener('click', () => setSettings(false));
  soundLevel.addEventListener('input', updateSoundLevel);
  soundToggle.addEventListener('change', updateSoundLevel);
  document.getElementById('sound-preview').addEventListener('click', playWaveSplash);
  document.getElementById('beep-preview').addEventListener('click', () => countdownBeep(10));
  document.getElementById('countdown-preview').addEventListener('click', countdownWave);
  fullscreenButton.addEventListener('click', fullscreen);
  document.getElementById('settings-fullscreen').addEventListener('click', fullscreen);
  document.addEventListener('fullscreenchange', () => {
    fullscreenButton.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !settingsPanel.hidden) setSettings(false);
  });
  showScene('backdrop');
})();
