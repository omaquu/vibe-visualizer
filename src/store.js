import { create } from 'zustand';

export const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_DJ_LINES = [
    "You're listening to VibeRadio, keep it locked in!",
    "That was an absolute banger. Stay tuned for more.",
    "VibeRadio — where the bass never stops.",
    "Coming up next, another fire track just for you.",
    "This is your host, bringing you the hottest beats.",
    "Don't touch that dial. More heat is on the way.",
    "VibeRadio, twenty-four seven, non-stop vibes.",
    "That one never gets old. Here comes the next one.",
];

export const useStore = create((set, get) => ({
    // ── Audio / Playback ──────────────────────────────────────────────────────
    audioFile: null,
    audioDuration: 0,
    isPlaying: false,
    currentTime: 0,
    isRendering: false,
    renderProgress: 0,

    // ── Playlist ──────────────────────────────────────────────────────────────
    playlist: [],           // [{ id, url, name, coverUrl }]
    currentTrackIndex: -1,
    radioMode: false,
    djLines: DEFAULT_DJ_LINES,
    showAnalyzer: true,

    // ── Layers ────────────────────────────────────────────────────────────────
    layers: (() => {
        const compId = generateId();
        return [
            {
                id: compId,
                type: 'composition',
                name: 'Composition 1',
                visible: true,
                parentId: null,
                startTime: 0,
                duration: 30,
            },
            {
                id: generateId(),
                type: 'spectrum-circle',
                name: 'Neon Circle',
                visible: true,
                opacity: 1,
                scale: 1,
                position: [0, 0, 1],
                rotation: 0,
                skewX: 0,
                skewY: 0,
                flipH: false,
                flipV: false,
                startTime: 0,
                duration: 9999,
                color: '#7b61ff',
                parentId: compId,
                audioReactive: {
                    scale: { enabled: true, source: 'bass', amount: 0.5 },
                },
            },
        ];
    })(),
    selectedLayerId: null,

    // ── Global Effects ────────────────────────────────────────────────────────
    effects: {
        bloom: {
            enabled: true,
            intensity: 1.5,
            luminanceThreshold: 0.2,
            audioReactive: true,
        },
        noise: {
            enabled: true,
            opacity: 0.05,
        },
        vignette: {
            enabled: true,
            darkness: 0.5,
            offset: 0.3,
        },
        chromaticAberration: {
            enabled: false,
            offsetX: 0.002,
            offsetY: 0.002,
            audioReactive: false,
        },
    },

    // ── Actions ───────────────────────────────────────────────────────────────
    setAudioFile: (url) => set({ audioFile: url }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setAudioDuration: (duration) => set({ audioDuration: duration }),
    toggleAnalyzer: () => set((s) => ({ showAnalyzer: !s.showAnalyzer })),

    addLayer: (layer) => set((s) => ({ layers: [...s.layers, layer], selectedLayerId: layer.id })),
    updateLayer: (id, updates) => set((s) => ({
        layers: s.layers.map(l => l.id === id ? { ...l, ...updates } : l),
    })),
    removeLayer: (id) => set((s) => ({
        layers: s.layers
            .filter(l => l.id !== id)
            .map(l => l.parentId === id ? { ...l, parentId: null } : l),
        selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId,
    })),
    setSelectedLayerId: (id) => set({ selectedLayerId: id }),
    reorderLayers: (newLayers) => set({ layers: newLayers }),
    toggleLayerVisibility: (id) => set((s) => ({
        layers: s.layers.map(l => l.id === id ? { ...l, visible: !(l.visible ?? true) } : l),
    })),

    updateEffect: (name, updates) => set((s) => ({
        effects: { ...s.effects, [name]: { ...s.effects[name], ...updates } },
    })),

    setRendering: (isRendering, progress = 0) => set({ isRendering, renderProgress: progress }),

    // Playlist actions
    addToPlaylist: (track) => set((s) => {
        const newPlaylist = [...s.playlist, track];
        const isFirst = s.playlist.length === 0;
        return {
            playlist: newPlaylist,
            currentTrackIndex: isFirst ? 0 : s.currentTrackIndex,
        };
    }),
    removeFromPlaylist: (id) => set((s) => ({
        playlist: s.playlist.filter(t => t.id !== id),
    })),
    reorderPlaylist: (newList) => set({ playlist: newList }),
    setTrack: (index) => set({ currentTrackIndex: index }),
    nextTrack: () => set((s) => {
        if (s.playlist.length === 0) return {};
        const next = (s.currentTrackIndex + 1) % s.playlist.length;
        return { currentTrackIndex: next };
    }),
    toggleRadioMode: () => set((s) => ({ radioMode: !s.radioMode })),
    addDjLine: (line) => set((s) => ({ djLines: [...s.djLines, line] })),
    setInvertZ: (val) => set({ invertZ: val }),
}));
