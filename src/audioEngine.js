// Note: we access useStore lazily to avoid circular imports

export class AudioEngine {
    constructor() {
        this.audio = new Audio();
        this.audio.crossOrigin = "anonymous";
        this.audioContext = null;
        this.analyzer = null;
        this.source = null;
        this.gainNode = null;
        this.isInitialized = false;
        this.isMuted = false; // Mute preview (effects still follow audio)

        // Larger FFT for richer spectrum data
        this.FFT_SIZE = 2048;
        const binCount = this.FFT_SIZE / 2;

        this.dataArray = new Uint8Array(binCount);
        this.floatArray = new Float32Array(binCount);

        this.audioData = {
            bass: 0,
            mid: 0,
            treble: 0,
            kick: 0,
            energy: 0,
            raw: this.dataArray,
            fullSpectrum: this.floatArray,
        };

        // Playlist / callback hooks
        this.onEndedCallback = null;
        this._getStore = null; // Set lazily by Timeline component
        this.audio.addEventListener('ended', () => {
            // Auto-chain to next track if store is available
            if (this._getStore) {
                const state = this._getStore();
                const { playlist, currentTrackIndex } = state;
                if (playlist.length > 0 && currentTrackIndex < playlist.length - 1) {
                    const nextIdx = currentTrackIndex + 1;
                    state.setTrack(nextIdx);
                    this.loadAudio(playlist[nextIdx].url);
                    this.play();
                    return;
                }
            }
            if (this.onEndedCallback) this.onEndedCallback();
        });
    }

    init() {
        if (this.isInitialized) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyzer = this.audioContext.createAnalyser();
        this.analyzer.fftSize = this.FFT_SIZE;
        this.analyzer.smoothingTimeConstant = 0.75;

        // Create gain node for mute-preview (analyzer still gets signal)
        this.gainNode = this.audioContext.createGain();

        try {
            this.source = this.audioContext.createMediaElementSource(this.audio);
            // Route: source -> analyzer -> gainNode -> destination
            this.source.connect(this.analyzer);
            this.analyzer.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
        } catch (e) {
            console.warn("Audio Context already connected", e);
        }

        const binCount = this.analyzer.frequencyBinCount;
        this.dataArray = new Uint8Array(binCount);
        this.floatArray = new Float32Array(binCount);
        this.audioData.raw = this.dataArray;
        this.audioData.fullSpectrum = this.floatArray;
        this.isInitialized = true;
    }

    loadAudio(url) {
        this.init();
        this.audio.src = url;
        this.audio.load();
    }

    play() {
        this.init();
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        this.audio.play();
    }

    pause() {
        this.audio.pause();
    }

    seek(time) {
        this.audio.currentTime = time;
    }

    setMutePreview(muted) {
        this.isMuted = muted;
        if (this.gainNode) {
            this.gainNode.gain.value = muted ? 0 : 1;
        }
    }

    setVolume(vol) {
        if (!this.isMuted && this.gainNode) {
            this.gainNode.gain.value = vol;
        }
        // Store the target volume for when unmuted
        this._targetVolume = vol;
    }

    update() {
        if (!this.isInitialized || !this.audio || this.audio.paused) {
            this.audioData.bass = 0;
            this.audioData.mid = 0;
            this.audioData.treble = 0;
            this.audioData.kick = 0;
            this.audioData.energy = 0;
            if (this.floatArray) this.floatArray.fill(0);
            return;
        }

        this.analyzer.getByteFrequencyData(this.dataArray);

        for (let i = 0; i < this.dataArray.length; i++) {
            this.floatArray[i] = this.dataArray[i] / 255.0;
        }

        let bassSum = 0, midSum = 0, trebleSum = 0, totalSum = 0;
        const len = this.dataArray.length;

        for (let i = 0; i < len; i++) {
            const val = this.dataArray[i] / 255.0;
            totalSum += val;
            if (i < 14) bassSum += val;
            else if (i < 186) midSum += val;
            else if (i < 744) trebleSum += val;
        }

        this.audioData.bass = bassSum / 14;
        this.audioData.mid = midSum / 172;
        this.audioData.treble = trebleSum / 558;
        this.audioData.energy = totalSum / len;
        this.audioData.kick = Math.pow(this.audioData.bass, 1.8);
    }
}

export const engine = new AudioEngine();
