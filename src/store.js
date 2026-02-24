import { create } from 'zustand';

// Generate a random ID for layers
export const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStore = create((set, get) => ({
    // App State
    audioFile: null,      // The loaded audio file URL (blob)
    audioDuration: 0,
    isPlaying: false,
    currentTime: 0,
    isRendering: false,
    renderProgress: 0,

    // Visualizer Layers
    layers: [
        {
            id: generateId(),
            type: 'image',
            name: 'Background',
            opacity: 1,
            scale: 1,
            position: [0, 0, 0], // x, y, z
            startTime: 0,
            duration: 999, // infinite for now
            audioReactive: {
                scale: { enabled: false, source: 'bass', amount: 0.1 },
                brightness: { enabled: false, source: 'bass', amount: 0.2 },
                rotation: { enabled: false, source: 'kick', amount: 0.5 },
                opacity: { enabled: false, source: 'mid', amount: 0.1 },
            },
            content: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop', // Default BG
        },
        {
            id: generateId(),
            type: 'spectrum-circle',
            name: 'Neon Circle',
            opacity: 1,
            scale: 1,
            position: [0, 0, 1],
            startTime: 0,
            duration: 999,
            color: '#7b61ff', // Default primary color
            audioReactive: {
                scale: { enabled: true, source: 'bass', amount: 0.2 },
            },
        }
    ],
    selectedLayerId: null,

    // Global Effects
    effects: {
        bloom: { enabled: true, intensity: 1.5, luminanceThreshold: 0.2, audioReactive: true },
        noise: { enabled: true, opacity: 0.05 },
        vignette: { enabled: true, darkness: 0.5, offset: 0.3 },
        chromaticAberration: { enabled: false, offset: [0.002, 0.002] },
    },

    // Actions
    setAudioFile: (url) => set({ audioFile: url }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setAudioDuration: (duration) => set({ audioDuration: duration }),

    addLayer: (layer) => set((state) => ({ layers: [...state.layers, layer], selectedLayerId: layer.id })),
    updateLayer: (id, updates) => set((state) => ({
        layers: state.layers.map(l => l.id === id ? { ...l, ...updates } : l)
    })),
    removeLayer: (id) => set((state) => ({
        layers: state.layers.filter(l => l.id !== id),
        selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId
    })),
    setSelectedLayerId: (id) => set({ selectedLayerId: id }),
    reorderLayers: (newLayers) => set({ layers: newLayers }),

    updateEffect: (effectName, updates) => set((state) => ({
        effects: { ...state.effects, [effectName]: { ...state.effects[effectName], ...updates } }
    })),

    setRendering: (isRendering, progress = 0) => set({ isRendering, renderProgress: progress }),
}));
