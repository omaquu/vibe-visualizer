import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { useStore } from './store';
import { engine } from './audioEngine';

export class VideoExporter {
    constructor() {
        this.ffmpeg = new FFmpeg();
        this.fps = 30; // standard 30fps to avoid memory/perf issues in browser
        this.audioFilename = 'audio.mp3';
    }

    async load() {
        if (this.ffmpeg.loaded) return;

        // We use standard ffmpeg-core, loading from unpkg or local. 
        // In Vite, it's easier to use the default load which uses unpkg if not specified.
        // However, for GitHub pages with COEP, we must use multithreading and SharedArrayBuffer.
        // The coi-serviceworker handles the headers.
        await this.ffmpeg.load({
            coreURL: `https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js`,
            wasmURL: `https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm`
        });
    }

    async exportVideo(audioBlobUrl, duration, onProgress, onLog, options = { preset: 'ultrafast', crf: '23' }) {
        await this.load();
        const store = useStore.getState();
        const canvas = document.querySelector('canvas');
        if (!canvas) throw new Error("Canvas not found");

        if (!audioBlobUrl) throw new Error("No audio loaded");

        // Attach listeners
        this.ffmpeg.on('log', ({ message }) => {
            if (onLog) onLog(message);
        });

        this.ffmpeg.on('progress', ({ progress, time }) => {
            if (onProgress) onProgress({ phase: 'encoding', progress: progress });
        });

        onLog?.("Loading audio file into FFmpeg memory...");
        const audioData = await fetchFile(audioBlobUrl);
        await this.ffmpeg.writeFile(this.audioFilename, audioData);

        // Setup render loop
        const totalFrames = Math.ceil(duration * this.fps);
        store.setIsPlaying(true);

        engine.pause();

        onLog?.(`Starting extraction: ${totalFrames} frames...`);
        const extractStartTime = Date.now();

        for (let i = 0; i < totalFrames; i++) {
            const time = i / this.fps;
            engine.seek(time);

            await new Promise(r => requestAnimationFrame(r));
            engine.update();
            await new Promise(r => requestAnimationFrame(r));

            const frameData = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            if (frameData) {
                const frameBuffer = await fetchFile(frameData);
                const num = i.toString().padStart(4, '0');
                await this.ffmpeg.writeFile(`frame_${num}.jpg`, frameBuffer);
            }

            if (i % 10 === 0 || i === totalFrames - 1) {
                const elapsed = (Date.now() - extractStartTime) / 1000;
                const fpsExtraction = (i + 1) / elapsed;
                const etaSeconds = (totalFrames - i) / fpsExtraction;
                if (onProgress) onProgress({ phase: 'extracting', progress: i / totalFrames, eta: etaSeconds });
            }
        }

        if (onProgress) onProgress({ phase: 'encoding', progress: 0 });
        onLog?.("Extraction complete. Running FFmpeg encoding...");

        await this.ffmpeg.exec([
            '-framerate', `${this.fps}`,
            '-i', 'frame_%04d.jpg',
            '-i', this.audioFilename,
            '-c:v', 'libx264',
            '-preset', options.preset || 'ultrafast',
            '-crf', options.crf || '23',
            '-c:a', 'aac',
            '-pix_fmt', 'yuv420p',
            '-shortest',
            'out.mp4'
        ]);

        onLog?.("Encoding complete. Preparing download...");
        const fileData = await this.ffmpeg.readFile('out.mp4');
        const data = new Uint8Array(fileData);

        // Cleanup FS
        for (let i = 0; i < totalFrames; i++) {
            const num = i.toString().padStart(4, '0');
            await this.ffmpeg.deleteFile(`frame_${num}.jpg`);
        }
        await this.ffmpeg.deleteFile(this.audioFilename);

        this.ffmpeg.off('log');
        this.ffmpeg.off('progress');

        // Download
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vizzy-export.mp4';
        a.click();
        onLog?.("Download triggered successfully.");
    }
}

export const exporter = new VideoExporter();
