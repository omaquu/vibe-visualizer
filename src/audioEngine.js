export class AudioEngine {
    constructor() {
        this.audio = new Audio();
        this.audio.crossOrigin = "anonymous";
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyzer = this.audioContext.createAnalyser();
        this.analyzer.fftSize = 256;
        this.analyzer.smoothingTimeConstant = 0.8;

        try {
            this.source = this.audioContext.createMediaElementSource(this.audio);
            this.source.connect(this.analyzer);
            this.analyzer.connect(this.audioContext.destination);
        } catch (e) {
            console.warn("Audio Context already connected", e);
        }

        this.dataArray = new Uint8Array(this.analyzer.frequencyBinCount);

        this.audioData = {
            bass: 0,
            mid: 0,
            treble: 0,
            kick: 0,
            raw: this.dataArray
        };
    }

    loadAudio(url) {
        this.audio.src = url;
        this.audio.load();
    }

    play() {
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

    update() {
        if (!this.audio || this.audio.paused) return;

        this.analyzer.getByteFrequencyData(this.dataArray);

        let bassSum = 0;
        let midSum = 0;
        let trebleSum = 0;

        // Assuming samplerate 44100Hz, Nyquist is 22050Hz
        // 128 bins = ~172Hz per bin
        // Bass: 0-250Hz -> bins 0-1
        // Mid: 250-4000Hz -> bins 2-23
        // Treble: 4000-22000Hz -> bins 24-127

        for (let i = 0; i < 128; i++) {
            const val = this.dataArray[i] / 255.0;
            if (i < 3) bassSum += val;
            else if (i < 24) midSum += val;
            else trebleSum += val;
        }

        this.audioData.bass = bassSum / 3;
        this.audioData.mid = midSum / 21;
        this.audioData.treble = trebleSum / 104;

        // Kick uses bin 1 (around 172Hz) or sum of lowest bins squared for extra peak
        this.audioData.kick = Math.pow(this.audioData.bass, 2);
    }
}

export const engine = new AudioEngine();
