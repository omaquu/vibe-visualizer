import React, { useState, useRef, useEffect } from 'react';
import { useStore } from './store';
import { engine } from './audioEngine';
import { exporter } from './exporter';
import { Play, Pause, Upload, Download, X, Command, Plus, Volume2, VolumeX, ZoomIn, ChevronRight, ChevronDown } from 'lucide-react';

const gid = () => Math.random().toString(36).substring(2, 9);

// ─── Terminal ─────────────────────────────────────────────────────────────────
export function TerminalPanel() {
    const { addLayer, updateEffect, toggleAnalyzer, addToPlaylist, toggleRadioMode, addDjLine } = useStore();
    const [lines, setLines] = useState(['VibeVisualizer Terminal v2.0 — type `help` for commands.']);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState([]);
    const [histIdx, setHistIdx] = useState(-1);
    const scrollRef = useRef(null);

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [lines]);

    const print = (...msgs) => setLines(prev => [...prev, ...msgs]);

    const HELP = [
        '  ring [count] [speed]         → Particle Rings layer',
        '  tunnel [speed]               → Tunnel layer',
        '  stars [count]                → Star Field layer',
        '  kaleid [segments]            → Kaleidoscope layer',
        '  laser [count]                → Laser layer',
        '  mountain [shape]             → Spectrum Mountain',
        '  text <words...>              → Text layer',
        '  glitch [amount]              → Glitch layer',
        '  bloom [intensity]            → Toggle bloom',
        '  chromatic [x] [y]            → Chromatic aberration',
        '  noise [opacity]              → Film noise',
        '  analyzer                     → Toggle FFT analyzer',
        '  preset vaporwave | techno    → Apply preset scene',
        '  export                       → Copy current layers as script',
        '  clear                        → Clear terminal',
    ];

    const exec = (raw) => {
        const cmd = raw.trim();
        if (!cmd) return;
        print(`> ${cmd}`);
        setHistory(h => [cmd, ...h].slice(0, 50));
        setHistIdx(-1);

        const parts = cmd.split(/\s+/);
        const p0 = parts[0].toLowerCase();
        const num = (n, d) => { const v = parseFloat(parts[n]); return isNaN(v) ? d : v; };
        const int = (n, d) => { const v = parseInt(parts[n]); return isNaN(v) ? d : v; };

        if (p0 === 'help') { print(...HELP); return; }
        if (p0 === 'clear') { setLines(['Terminal cleared.']); return; }
        if (p0 === 'analyzer') { toggleAnalyzer(); print('Analyzer toggled.'); return; }
        if (p0 === 'export') {
            const { layers, globalEffects } = useStore.getState();
            const lines = layers.map(l => {
                let s = `addLayer({ id: '${l.id}', type: '${l.type}', name: '${l.name}', visible: ${l.visible !== false}, startTime: ${l.startTime || 0}, duration: ${l.duration || 9999}`;
                if (l.color) s += `, color: '${l.color}'`;
                if (l.position) s += `, position: [${l.position.join(',')}]`;
                if (l.scale) s += `, scale: ${l.scale}`;
                return s + ` });`;
            });
            navigator.clipboard.writeText(lines.join('\n'))
                .then(() => print(`Copied ${layers.length} layers to clipboard as script!`))
                .catch(() => print('Failed to copy to clipboard.'));
            return;
        }
        if (p0 === 'bloom') { updateEffect('bloom', { enabled: true, intensity: num(1, 2) }); print(`Bloom ON`); return; }
        if (p0 === 'chromatic') { updateEffect('chromaticAberration', { enabled: true, offsetX: num(1, 0.005), offsetY: num(2, 0.005) }); print(`Chromatic ON`); return; }
        if (p0 === 'noise') { updateEffect('noise', { enabled: true, opacity: num(1, 0.08) }); print(`Noise ON`); return; }
        if (p0 === 'ring') { addLayer({ id: gid(), type: 'particle-rings', name: 'Rings', visible: true, position: [0, 0, 0], scale: 1, color: '#00ffcc', ringCount: int(1, 4), speed: num(2, 1), startTime: 0, duration: 9999, freeMode: { enabled: false, speed: 1 } }); print('Added Rings'); return; }
        if (p0 === 'tunnel') { addLayer({ id: gid(), type: 'tunnel', name: 'Tunnel', visible: true, position: [0, 0, -5], scale: 1, color: '#7b61ff', speed: num(1, 1), startTime: 0, duration: 9999 }); print('Added Tunnel'); return; }
        if (p0 === 'stars') { addLayer({ id: gid(), type: 'starfield', name: 'Stars', visible: true, position: [0, 0, 0], scale: 1, color: '#ffffff', count: int(1, 800), speed: 1, startTime: 0, duration: 9999 }); print('Added Stars'); return; }
        if (p0 === 'kaleid') { addLayer({ id: gid(), type: 'kaleidoscope', name: 'Kaleidoscope', visible: true, position: [0, 0, -2], scale: 1, color: '#ff00ff', segments: int(1, 6), speed: 1, startTime: 0, duration: 9999 }); print('Added Kaleidoscope'); return; }
        if (p0 === 'laser') { addLayer({ id: gid(), type: 'laser', name: 'Laser', visible: true, position: [0, 0, 1], scale: 1, color: '#ff0066', laserCount: int(1, 8), startTime: 0, duration: 9999 }); print('Added Laser'); return; }
        if (p0 === 'mountain') { addLayer({ id: gid(), type: 'spectrum-mountain', name: 'Mountain', visible: true, position: [0, 0, 2], scale: 1, color: '#7b61ff', shape: parts[1] || 'line', amplitude: 4, startTime: 0, duration: 9999 }); print('Added Mountain'); return; }
        if (p0 === 'text') { const text = parts.slice(1).join(' ') || 'VIBE'; addLayer({ id: gid(), type: 'text', name: 'Text', visible: true, content: text, position: [0, 0, 2], scale: 1, color: '#ffffff', startTime: 0, duration: 9999, audioReactive: { scale: { enabled: true, source: 'bass', amount: 0.2 } } }); print(`Added text: "${text}"`); return; }
        if (p0 === 'glitch') { addLayer({ id: gid(), type: 'glitch', name: 'Glitch', visible: true, position: [0, 0, 5], scale: 1, color: '#ffffff', startTime: 0, duration: 9999, audioReactive: { glitch: { enabled: true, amount: num(1, 1) } } }); print('Added Glitch'); return; }
        if (p0 === 'preset') {
            if (parts[1] === 'vaporwave') {
                addLayer({ id: gid(), type: 'spectrum-circle', name: 'Vapor Ring', visible: true, position: [0, 0, 1], scale: 1.5, color: '#ff71ce', startTime: 0, duration: 9999, audioReactive: { scale: { enabled: true, source: 'bass', amount: 0.5 } } });
                updateEffect('bloom', { enabled: true, intensity: 2.5 });
                updateEffect('chromaticAberration', { enabled: true, offsetX: 0.005, offsetY: 0.005 });
                print('Preset: Vaporwave');
            } else if (parts[1] === 'techno') {
                addLayer({ id: gid(), type: 'glitch', name: 'Techno Glitch', visible: true, position: [0, 0, 0], scale: 1, color: '#00ff00', startTime: 0, duration: 9999, audioReactive: { glitch: { enabled: true, amount: 2 } } });
                updateEffect('noise', { enabled: true, opacity: 0.2 });
                print('Preset: Techno');
            } else { print('Unknown preset. Try: vaporwave, techno'); }
            return;
        }
        print(`Unknown: ${p0}. Type 'help'.`);
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter') { exec(input); setInput(''); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setHistIdx(i => { const n = Math.min(i + 1, history.length - 1); setInput(history[n] || ''); return n; }); }
        if (e.key === 'ArrowDown') { e.preventDefault(); setHistIdx(i => { const n = Math.max(i - 1, -1); setInput(n === -1 ? '' : history[n]); return n; }); }
    };

    return (
        <div style={{ height: '100px', flexShrink: 0, background: '#000', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
            <div ref={scrollRef} style={{ flexGrow: 1, overflowY: 'auto', padding: '4px 10px', fontFamily: 'monospace', fontSize: '10px', color: '#4ade80', lineHeight: 1.6 }}>
                {lines.map((l, i) => <div key={i}>{l}</div>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid rgba(34,197,94,0.15)', padding: '4px 10px', gap: '6px', flexShrink: 0 }}>
                <Command size={10} style={{ color: '#166534', flexShrink: 0 }} />
                <span style={{ color: '#166534', fontSize: '10px', fontFamily: 'monospace', flexShrink: 0 }}>$</span>
                <input
                    style={{ flexGrow: 1, background: 'transparent', outline: 'none', border: 'none', color: '#86efac', fontSize: '11px', fontFamily: 'monospace', caretColor: '#4ade80' }}
                    placeholder="type a command…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    spellCheck={false}
                    autoComplete="off"
                />
            </div>
        </div>
    );
}

// ─── Audio Waveform Track ─────────────────────────────────────────────────────
function AudioTrackWaveform({ audioUrl, color }) {
    const canvasRef = useRef(null);
    const [waveData, setWaveData] = useState(null);

    useEffect(() => {
        if (!audioUrl) { setWaveData(null); return; }
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        fetch(audioUrl)
            .then(r => r.arrayBuffer())
            .then(buf => ctx.decodeAudioData(buf))
            .then(decoded => {
                const raw = decoded.getChannelData(0);
                const BARS = 800;
                const step = Math.floor(raw.length / BARS);
                const peaks = [];
                for (let i = 0; i < BARS; i++) {
                    let max = 0;
                    for (let j = 0; j < step; j++) {
                        const abs = Math.abs(raw[i * step + j] || 0);
                        if (abs > max) max = abs;
                    }
                    peaks.push(max);
                }
                setWaveData(peaks);
                ctx.close();
            })
            .catch(() => setWaveData(null));
    }, [audioUrl]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !waveData) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        const barW = W / waveData.length;
        ctx.fillStyle = color;
        waveData.forEach((peak, i) => {
            const h = peak * H * 0.9;
            ctx.fillRect(i * barW, (H - h) / 2, Math.max(barW - 0.5, 0.5), h);
        });
    }, [waveData, color]);

    return (
        <canvas ref={canvasRef} width={800} height={14} style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', top: 0, left: 0, opacity: 0.8, pointerEvents: 'none' }} />
    );
}

// ─── Timeline Draggable Clip ──────────────────────────────────────────────────
function TimelineClip({ layer, duration, color, depth = 0, isComp = false, isOpen, onToggle, forceAbsolute = false }) {
    const { updateLayer, setSelectedLayerId, selectedLayerId, audioFile } = useStore();
    const [localStart, setLocalStart] = useState(null);
    const [localDur, setLocalDur] = useState(null);

    const start = localStart !== null ? localStart : (layer.startTime || 0);
    const dur = localDur !== null ? localDur : (layer.duration || 9999);

    const leftPct = duration > 0 ? (start / duration) * 100 : 0;
    const widthPct = duration > 0 ? (dur / duration) * 100 : 100;

    const trackRef = useRef(null);
    const isSelected = selectedLayerId === layer.id;
    const rowHeight = isComp ? 28 : 24;
    const clipHeight = isComp ? 24 : 20;

    const startDrag = (e, type) => {
        e.stopPropagation();
        setSelectedLayerId(layer.id);
        e.target.setPointerCapture(e.pointerId);
        const startX = e.clientX;
        const initialStart = layer.startTime || 0;
        const initialDur = layer.duration || 9999;

        let finalStart = initialStart;
        let finalDur = initialDur;

        // Note: forceAbsolute clips are rendered relative to track's flexGrow area
        const container = forceAbsolute && trackRef.current ? trackRef.current.parentElement : trackRef.current?.parentElement;
        const trackW = container ? container.getBoundingClientRect().width : 800;

        const target = e.target;
        const onMove = (ev) => {
            const deltaSec = ((ev.clientX - startX) / trackW) * duration;
            if (type === 'move') {
                finalStart = Math.max(0, initialStart + deltaSec);
                setLocalStart(finalStart);
            } else if (type === 'left') {
                finalStart = Math.max(0, Math.min(initialStart + deltaSec, initialStart + initialDur - 0.1));
                finalDur = initialDur - (finalStart - initialStart);
                setLocalStart(finalStart);
                setLocalDur(finalDur);
            } else if (type === 'right') {
                finalDur = Math.max(0.1, initialDur + deltaSec);
                setLocalDur(finalDur);
            }
        };
        const onUp = (ev) => {
            target.releasePointerCapture(e.pointerId);
            target.removeEventListener('pointermove', onMove);
            target.removeEventListener('pointerup', onUp);
            // Commit to store
            setLocalStart(null);
            setLocalDur(null);
            if (finalStart !== initialStart || finalDur !== initialDur) {
                updateLayer(layer.id, { startTime: finalStart, duration: finalDur });
            }
        };
        target.addEventListener('pointermove', onMove);
        target.addEventListener('pointerup', onUp);
    };

    const clipContent = (
        <div ref={trackRef}
            onPointerDown={(e) => startDrag(e, 'move')}
            style={{
                position: 'absolute', left: forceAbsolute ? 0 : `${leftPct}%`, width: forceAbsolute ? '100%' : `${Math.max(widthPct, 0.5)}%`, top: 0, bottom: 0,
                background: isComp ? `${color}18` : `${color}25`,
                border: `1px solid ${color}${isSelected ? 'cc' : '60'}`,
                borderRadius: '3px', cursor: 'grab', overflow: 'hidden',
                boxShadow: isSelected ? `0 0 6px ${color}40` : 'none'
            }}>

            {/* Waveform for Compositions */}
            {isComp && (layer.audioUrl || audioFile) && (
                <div style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }}>
                    <AudioTrackWaveform audioUrl={layer.audioUrl || audioFile} color={color} />
                </div>
            )}

            {/* Left Trim Handle */}
            <div onPointerDown={(e) => startDrag(e, 'left')}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px', cursor: 'ew-resize', zIndex: 2, background: `${color}60`, borderRadius: '3px 0 0 3px', opacity: 0.7 }} />

            <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.9)', padding: '0 6px', lineHeight: `${clipHeight}px`, whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '4px', position: 'relative', zIndex: 3, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {isComp && (
                    <button onPointerDown={(e) => { e.stopPropagation(); onToggle && onToggle(); }} style={{ pointerEvents: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    </button>
                )}
                {isComp ? `🎵 ${layer.name}` : layer.name}
            </span>

            {/* Right Trim Handle */}
            <div onPointerDown={(e) => startDrag(e, 'right')}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '8px', cursor: 'ew-resize', zIndex: 2, background: `${color}60`, borderRadius: '0 3px 3px 0', opacity: 0.7 }} />
        </div>
    );

    if (forceAbsolute) {
        return (
            <div style={{ position: 'absolute', left: `${leftPct}%`, width: `${Math.max(widthPct, 0.5)}%`, height: `${clipHeight}px`, top: '2px' }}>
                {clipContent}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', height: `${rowHeight}px`, gap: 0, background: isComp ? 'rgba(251,191,36,0.03)' : 'transparent', borderBottom: isComp ? '1px solid rgba(251,191,36,0.08)' : 'none' }}>
            <div style={{ width: '80px', flexShrink: 0, fontSize: '9px', color: isComp ? '#fbbf24' : 'rgba(255,255,255,0.4)', padding: `0 4px 0 ${4 + depth * 12}px`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#0b0b14', zIndex: 10, display: 'flex', alignItems: 'center', gap: '2px', fontWeight: isComp ? 600 : 400 }}>
                {isComp && (
                    <button onClick={onToggle} style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    </button>
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{layer.name}</span>
            </div>
            <div style={{ flexGrow: 1, height: `${clipHeight}px`, background: 'rgba(255,255,255,0.03)', borderRadius: '3px', position: 'relative' }}>
                {clipContent}
            </div>
        </div>
    );
}

// ─── Multi-Track Timeline ─────────────────────────────────────────────────────
export function Timeline() {
    const {
        isPlaying, setIsPlaying, audioFile, setAudioFile, currentTime, setCurrentTime,
        layers, playlist, currentTrackIndex, setTrack, nextTrack, radioMode, djLines,
    } = useStore();
    const fileInputRef = useRef(null);
    const file2InputRef = useRef(null);
    const [showExport, setShowExport] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [progressInfo, setProgressInfo] = useState({ phase: '', progress: 0 });
    const [logs, setLogs] = useState([]);
    const [preset, setPreset] = useState('ultrafast');
    const [crf, setCrf] = useState('23');
    const [audioTrack2, setAudioTrack2] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [audioTracksOpen, setAudioTracksOpen] = useState(true);
    const [openComps, setOpenComps] = useState({}); // Track which compositions are open in the timeline

    const toggleComp = (id) => {
        setOpenComps(prev => ({ ...prev, [id]: !prev[id] }));
    };

    useEffect(() => {
        // Give the engine a way to access the store for auto-chaining tracks
        engine._getStore = () => useStore.getState();
        // Note: play/pause/ended listeners removed — custom playback loop manages state
    }, []);

    const handleFile = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const url = URL.createObjectURL(file);
        setAudioFile(url);
        engine.loadAudio(url);

        // Add Audio as a layer instead of a composition
        const tempAudio = new window.Audio(url);
        tempAudio.onloadedmetadata = () => {
            const store = useStore.getState();
            store.addLayer({
                id: `layer_${Date.now()}`,
                name: file.name.replace(/\.[^.]+$/, ''),
                type: 'audio',
                visible: true,
                parentId: null, // Audio layers are root layers (or they can be dropped into comps)
                audioUrl: url,
                startTime: store.currentTime || 0,
                duration: tempAudio.duration || 30
            });
        };
    };

    const handleFile2 = (e) => {
        const file = e.target.files[0]; if (!file) return;
        setAudioTrack2({ name: file.name, url: URL.createObjectURL(file) });
    };

    const togglePlay = () => {
        const hasAudio = layers.some(l => l.type === 'audio');
        if (!hasAudio && !audioFile && playlist.length === 0) {
            fileInputRef.current?.click();
            return;
        }
        if (isPlaying) {
            engine.pause();
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
        }
    };

    // Calculate timeline duration from all layers (guarantee 120s minimum)
    const timelineDuration = (() => {
        let maxEnd = 120; // 2 minutes minimum
        layers.forEach(l => {
            const end = (l.startTime || 0) + (l.duration || 0);
            if (end > maxEnd) maxEnd = end;
        });
        return maxEnd;
    })();
    const duration = timelineDuration;

    // Active audio layer tracker ref
    const activeAudioRef = useRef(null);

    // Composition-aware playback loop
    useEffect(() => {
        if (!isPlaying) return;
        let lastTime = performance.now();
        let raf;

        const tick = (now) => {
            const dt = (now - lastTime) / 1000;
            lastTime = now;

            const { currentTime: ct, layers: currentLayers } = useStore.getState();
            const newTime = ct + dt;

            // Check if we've reached the end
            if (newTime >= duration) {
                setCurrentTime(duration);
                setIsPlaying(false);
                engine.pause();
                activeCompRef.current = null;
                return;
            }

            setCurrentTime(newTime);

            // Find which audio layer the playhead is in
            const audioLayers = currentLayers.filter(l => l.type === 'audio');
            let activeAudioLayer = null;
            for (const layer of audioLayers) {
                const cs = layer.startTime || 0;
                const ce = cs + (layer.duration || 0);
                if (newTime >= cs && newTime < ce) {
                    activeAudioLayer = layer;
                    break;
                }
            }

            if (activeAudioLayer && activeAudioLayer.audioUrl) {
                const offset = newTime - (activeAudioLayer.startTime || 0);
                // If we switched to a new audio layer, load its audio
                if (activeAudioRef.current !== activeAudioLayer.id) {
                    activeAudioRef.current = activeAudioLayer.id;
                    engine.loadAudio(activeAudioLayer.audioUrl);
                    engine.audio.currentTime = offset;
                    engine.play();
                } else {
                    // Keep audio roughly in sync (only correct if drifted > 0.3s)
                    const audioDrift = Math.abs(engine.audio.currentTime - offset);
                    if (audioDrift > 0.3) {
                        engine.audio.currentTime = offset;
                    }
                }
            } else {
                // Not inside any audio layer — silence
                if (activeAudioRef.current !== null) {
                    activeAudioRef.current = null;
                    engine.pause();
                }
            }

            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [isPlaying, duration]);

    const startExport = async () => {
        if (!audioFile) return alert('Load audio first!');
        setIsExporting(true); setLogs([]);
        try {
            await exporter.exportVideo(audioFile, duration || 30,
                (info) => setProgressInfo(info),
                (msg) => setLogs(p => [...p, msg]),
                { preset, crf }
            );
        } catch (e) { setLogs(p => [...p, `ERROR: ${e.message}`]); }
        finally { setIsExporting(false); }
    };

    // Color map for layer types on timeline
    const trackColor = (type) => {
        const map = {
            image: '#3b82f6', video: '#a855f7', text: '#22c55e', waveform: '#f97316',
            'spectrum-circle': '#ec4899', 'spectrum-mountain': '#8b5cf6', particles: '#eab308',
            'particle-rings': '#06b6d4', starfield: '#fff', tunnel: '#a78bfa', kaleidoscope: '#ec4899',
            laser: '#ef4444', glitch: '#4ade80', 'fx-bloom': '#34d399', 'fx-chromatic': '#34d399',
            'fx-vignette': '#34d399', 'fx-noise': '#34d399', composition: '#fbbf24', group: '#fbbf24'
        };
        return map[type] || '#7b61ff';
    };

    const fmtTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;

    return (
        <>
            <div style={{ height: '200px', flexShrink: 0, background: '#0b0b14', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                {/* Transport bar */}
                <div style={{ height: '36px', display: 'flex', alignItems: 'center', padding: '0 10px', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                    <button onClick={togglePlay} disabled={isExporting}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-color)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(123,97,255,0.3)', flexShrink: 0 }}>
                        {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" style={{ marginLeft: '1px' }} />}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                        <button onClick={() => { const m = !isMuted; setIsMuted(m); engine.setMutePreview(m); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: isMuted ? '#f87171' : 'rgba(255,255,255,0.4)' }}
                            title={isMuted ? 'Unmute Preview (effects still follow audio)' : 'Mute Preview'}>
                            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                        </button>
                        <input type="range" min="0" max="1" step="0.05" value={volume}
                            onChange={e => { const v = parseFloat(e.target.value); setVolume(v); engine.setVolume(v); }}
                            style={{ width: '40px', height: '4px', accentColor: '#fff', cursor: 'pointer' }} title="Preview Volume" />
                    </div>

                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', minWidth: '60px', marginLeft: '8px' }}>
                        {fmtTime(currentTime)} / {fmtTime(duration)}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px', marginRight: '8px' }}>
                        <ZoomIn size={10} color="rgba(255,255,255,0.4)" />
                        <input type="range" min="0.2" max="15" step="0.1" value={zoom}
                            onChange={e => setZoom(parseFloat(e.target.value))}
                            style={{ width: '50px', height: '4px', accentColor: '#a78bfa', cursor: 'pointer' }} title="Timeline Zoom" />
                    </div>

                    <input type="file" ref={fileInputRef} accept="audio/*" style={{ display: 'none' }} onChange={handleFile} />
                    <button onClick={() => fileInputRef.current?.click()}
                        style={{ fontSize: '9px', padding: '3px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Upload size={10} /> {audioFile ? 'Change' : 'Load'} MP3
                    </button>

                    {/* Add second audio track */}
                    <input type="file" ref={file2InputRef} accept="audio/*" style={{ display: 'none' }} onChange={handleFile2} />
                    <button onClick={() => file2InputRef.current?.click()}
                        style={{ fontSize: '9px', padding: '3px 8px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '4px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Plus size={9} /> Audio Track 2
                    </button>

                    <div style={{ marginLeft: 'auto' }}>
                        <button onClick={() => setShowExport(true)} disabled={isExporting || !audioFile}
                            style={{ fontSize: '9px', padding: '4px 12px', background: 'var(--accent-color)', border: 'none', borderRadius: '4px', color: '#fff', cursor: audioFile ? 'pointer' : 'not-allowed', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', opacity: audioFile ? 1 : 0.4 }}>
                            <Download size={10} /> Render
                        </button>
                    </div>
                </div>

                {/* Track area */}
                <div style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'auto', padding: '0', position: 'relative' }}>
                    <div style={{ minWidth: `calc(100% * ${zoom})`, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

                        {/* Playhead */}
                        {duration > 0 && (
                            <div style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `calc(80px + ((100% - 80px) * ${currentTime / (duration || 1)}))`,
                                width: '1px', background: '#fff', zIndex: 6, pointerEvents: 'none'
                            }} />
                        )}

                        {/* Timeline Ruler / Seek Row */}
                        <div style={{ position: 'relative', height: '20px', background: '#09090f', borderBottom: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', flexShrink: 0 }}
                            onPointerDown={e => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pct = (e.clientX - rect.left - 80) / (rect.width - 80);
                                const t = Math.max(0, Math.min(1, pct)) * (duration || 100);
                                engine.audio.currentTime = t; setCurrentTime(t);
                            }}>
                            <div style={{ position: 'absolute', left: 0, width: '80px', height: '100%', borderRight: '1px solid rgba(255,255,255,0.05)', background: '#0b0b14', display: 'flex', alignItems: 'center', paddingLeft: '8px', fontSize: '8px', color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '0.05em' }}>TIMELINE</div>
                            {/* Tick marks */}
                            {(() => {
                                const tickInterval = zoom < 0.3 ? 60 : zoom < 0.6 ? 30 : zoom > 3 ? 2 : zoom > 1.5 ? 5 : 10;
                                const tickCount = Math.max(2, Math.ceil((duration || 100) / tickInterval));
                                return Array.from({ length: tickCount }).map((_, i) => (
                                    <div key={`tick-${i}`} style={{ position: 'absolute', left: `calc(80px + ((100% - 80px) * ${(i * tickInterval) / (duration || 100)}))`, bottom: 0, height: '100%', width: '1px', background: 'rgba(255,255,255,0.06)' }}>
                                        <span style={{ position: 'absolute', top: '2px', left: '3px', fontSize: '7px', color: 'rgba(255,255,255,0.2)' }}>{i * tickInterval}s</span>
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* Layer tracks (Stacked Rows per Composition) */}
                        {(() => {
                            const comps = layers.filter(l => l.type === 'composition');
                            const unboundLayers = layers.filter(l => !l.parentId && l.type !== 'composition');

                            let elements = [];

                            // 1. Master Compositions Track
                            const compositionsOpen = openComps['__master__'] !== false;

                            elements.push(
                                <div key="master-comps-row" style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '32px', background: 'rgba(251,191,36,0.05)', borderBottom: '1px solid rgba(251,191,36,0.1)' }}>
                                    <div style={{ width: '80px', flexShrink: 0, fontSize: '9px', color: '#fbbf24', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#0b0b14', zIndex: 10, display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                        <button onClick={() => toggleComp('__master__')} style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                            {compositionsOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                        </button>
                                        <span>MASTER</span>
                                    </div>
                                    <div style={{ flexGrow: 1, height: '32px', position: 'relative' }}>
                                        {comps.map(comp => (
                                            <TimelineClip
                                                key={comp.id}
                                                layer={comp}
                                                duration={duration || 100}
                                                color={trackColor(comp.type)}
                                                isComp={true}
                                                forceAbsolute={true}
                                                isOpen={openComps[comp.id] !== false}
                                                onToggle={() => toggleComp(comp.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );

                            // 2. Render children for OPEN compositions
                            if (compositionsOpen) {
                                comps.forEach(comp => {
                                    if (openComps[comp.id] !== false) {
                                        // Render a subtle subheader
                                        elements.push(
                                            <div key={`subheader-${comp.id}`} style={{ height: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center' }}>
                                                <div style={{ width: '80px', fontSize: '8px', paddingLeft: '8px', color: '#fbbf24', borderRight: '1px solid rgba(255,255,255,0.05)' }}>↳ {comp.name}</div>
                                                <div style={{ flexGrow: 1 }} />
                                            </div>
                                        );

                                        const getDescendants = (parentId) => {
                                            let res = [];
                                            const kids = layers.filter(l => l.parentId === parentId);
                                            kids.forEach(k => {
                                                res.push(k);
                                                res.push(...getDescendants(k.id));
                                            });
                                            return res;
                                        };

                                        const allCompDescendants = getDescendants(comp.id);

                                        // Group them by layer name so they get their own row
                                        const childGroups = {};
                                        allCompDescendants.forEach(child => {
                                            if (!childGroups[child.name]) childGroups[child.name] = [];
                                            childGroups[child.name].push(child);
                                        });

                                        Object.entries(childGroups).forEach(([name, groupLayers]) => {
                                            elements.push(
                                                <div key={`row-${comp.id}-${name}`} style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '24px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                    <div style={{ width: '80px', flexShrink: 0, fontSize: '9px', color: 'rgba(255,255,255,0.4)', padding: '0 4px 0 16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#0b0b14', zIndex: 10, display: 'flex', alignItems: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                                        {name}
                                                    </div>
                                                    <div style={{ flexGrow: 1, height: '24px', position: 'relative' }}>
                                                        {groupLayers.map(layer => (
                                                            <div key={`layer-wrap-${layer.id}`} style={{ position: 'absolute', top: '2px', bottom: '2px', left: 0, right: 0, pointerEvents: 'none' }}>
                                                                <div style={{ pointerEvents: 'auto', height: '100%' }}>
                                                                    <TimelineClip layer={layer} duration={duration || 100} color={trackColor(layer.type)} forceAbsolute={true} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    }
                                });
                            }

                            // 3. Render Root Non-Comp Rows (Unbound Layers)
                            if (unboundLayers.length > 0) {
                                elements.push(
                                    <div key="unbound-header" style={{ height: '20px', background: 'rgba(123,97,255,0.05)', display: 'flex', alignItems: 'center', borderTop: '1px solid rgba(123,97,255,0.1)' }}>
                                        <div style={{ width: '80px', fontSize: '8px', paddingLeft: '4px', color: '#7b61ff', fontWeight: 600, borderRight: '1px solid rgba(255,255,255,0.05)' }}>UNBOUND</div>
                                        <div style={{ flexGrow: 1 }} />
                                    </div>
                                );

                                const rootGroups = {};
                                unboundLayers.forEach(child => {
                                    if (!rootGroups[child.name]) rootGroups[child.name] = [];
                                    rootGroups[child.name].push(child);
                                });

                                Object.entries(rootGroups).forEach(([name, groupLayers]) => {
                                    elements.push(
                                        <div key={`root-row-${name}`} style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '24px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                            <div style={{ width: '80px', flexShrink: 0, fontSize: '9px', color: 'rgba(255,255,255,0.6)', padding: '0 4px 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#0b0b14', zIndex: 10, display: 'flex', alignItems: 'center', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                                {name}
                                            </div>
                                            <div style={{ flexGrow: 1, height: '24px', position: 'relative' }}>
                                                {groupLayers.map(layer => (
                                                    <div key={`layer-wrap-${layer.id}`} style={{ position: 'absolute', top: '2px', bottom: '2px', left: 0, right: 0, pointerEvents: 'none' }}>
                                                        <div style={{ pointerEvents: 'auto', height: '100%' }}>
                                                            <TimelineClip layer={layer} duration={duration || 100} color={trackColor(layer.type)} forceAbsolute={true} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                });
                            }

                            return elements;
                        })()}
                    </div>
                </div>
            </div>

            {/* Export modal */}
            {showExport && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(8px)' }}>
                    <div style={{ width: '480px', padding: '24px', background: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Export</h2>
                            <button onClick={() => !isExporting && setShowExport(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={16} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
                                <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Preset</label>
                                <select className="glass-input" style={{ fontSize: '10px', padding: '4px' }} value={preset} onChange={e => setPreset(e.target.value)} disabled={isExporting}>
                                    {['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow'].map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '80px' }}>
                                <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>CRF</label>
                                <input type="number" className="glass-input" style={{ fontSize: '10px', padding: '4px' }} value={crf} onChange={e => setCrf(e.target.value)} min="0" max="51" disabled={isExporting} />
                            </div>
                        </div>
                        {isExporting ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'monospace' }}>
                                    <span style={{ textTransform: 'uppercase' }}>{progressInfo.phase}…</span>
                                    <span>{Math.round(progressInfo.progress * 100)}%</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${progressInfo.progress * 100}%`, height: '100%', background: 'var(--accent-color)', transition: 'width 0.3s' }} />
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '6px', height: '80px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>
                                    {logs.slice().reverse().map((l, i) => <div key={i}>{l}</div>)}
                                </div>
                            </div>
                        ) : (
                            <button onClick={startExport}
                                style={{ width: '100%', padding: '10px', background: 'var(--accent-color)', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', cursor: 'pointer' }}>
                                Start Render
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
