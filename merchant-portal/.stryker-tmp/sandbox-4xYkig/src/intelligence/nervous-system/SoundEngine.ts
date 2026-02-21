// 🔊 SOUND ENGINE (The Voice of the System)
// "The kitchen does not look. It listens."

// Simple beep synth for now (No assets required)
const playBeep = (freq = 440, type: OscillatorType = 'sine', duration = 0.5) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        console.warn('🔇 Audio Engine Failure:', e);
    }
};

export const SoundEngine = {
    playNewOrder: () => {
        // Double Ding (High Pitch)
        playBeep(880, 'sine', 0.2);
        setTimeout(() => playBeep(1100, 'sine', 0.4), 150);
    },

    playPressureRising: () => {
        // Low Drone Warning
        playBeep(150, 'sawtooth', 0.8);
    },

    playTicketDone: () => {
        // Success Chime
        playBeep(600, 'sine', 0.1);
        setTimeout(() => playBeep(800, 'sine', 0.3), 100);
    }
};
