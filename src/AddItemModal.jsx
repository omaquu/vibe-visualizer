import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { X, Search } from 'lucide-react';
import { useStore } from './store';

const gid = () => Math.random().toString(36).substring(2, 9);

const CATALOG = [
    { id: 'group', name: 'Group', cat: 'Group', tag: 'folder', desc: 'Folder for grouping layers together', color: '#fbbf24', icon: '📁', type: 'layer' },
    { id: 'waveform', name: '3D Bars', cat: '3D', tag: 'spectrum', desc: 'Audio-reactive frequency bars', color: '#f97316', icon: '▌▊▌▋▍', type: 'layer' },
    { id: 'spectrum-circle', name: 'Spectrum Circle', cat: '3D', tag: 'spectrum', desc: 'Neon ring pulsing to bass', color: '#7b61ff', icon: '⬤', type: 'layer' },
    { id: 'spectrum-mountain', name: 'Spectrum Mountain', cat: '2D', tag: 'spectrum', desc: 'Mountain ridges from FFT data', color: '#22d3ee', icon: '∿∿∿', type: 'layer' },
    { id: 'particles', name: 'Particles', cat: '3D', tag: 'particles', desc: 'Floating particles, audio-reactive', color: '#facc15', icon: '✦ ✦✦ ✦', type: 'layer' },
    { id: 'particle-rings', name: 'Particle Rings', cat: '3D', tag: 'particles', desc: 'Rings flying toward camera', color: '#2dd4bf', icon: '◎◎◎', type: 'layer' },
    { id: 'starfield', name: 'Star Field', cat: '3D', tag: 'particles', desc: 'Parallax stars, speed = bass', color: '#ffffff', icon: '✦ ·· ✦ ·', type: 'layer' },
    { id: 'tunnel', name: 'Tunnel', cat: '3D', tag: 'shader', desc: 'Zooming shader tunnel', color: '#a78bfa', icon: '◯ ◯ ◯', type: 'layer' },
    { id: 'kaleidoscope', name: 'Kaleidoscope', cat: '2D', tag: 'shader', desc: 'Mirrored fractal shader', color: '#ec4899', icon: '✿', type: 'layer' },
    { id: 'laser', name: 'Laser Beams', cat: '3D', tag: 'particles', desc: 'Rotating laser fan, kick-reactive', color: '#f43f5e', icon: '╱ ╲ ╱ ╲', type: 'layer' },
    { id: 'glitch', name: 'Glitch Plane', cat: '3D', tag: 'shader', desc: 'Glitch distortion on beat', color: '#4ade80', icon: '▓▒░▓▒', type: 'layer' },
    { id: 'text', name: 'Text', cat: '2D', tag: 'text', desc: 'Animated audio-reactive text', color: '#f8fafc', icon: 'Aa', type: 'layer' },
    { id: 'image', name: 'Image', cat: '2D', tag: 'media', desc: 'Static or animated image layer', color: '#60a5fa', icon: '🖼', type: 'layer' },
    { id: 'video', name: 'Video', cat: '2D', tag: 'media', desc: 'Video background layer', color: '#c084fc', icon: '▶', type: 'layer' },
    { id: 'audio', name: 'Audio Track', cat: '2D', tag: 'media', desc: 'Audio layer for synchronization', color: '#10b981', icon: '🎵', type: 'layer' },
    { id: 'fx-bloom', name: 'Bloom FX', cat: 'FX', tag: 'fx', desc: 'Glow on bright areas', color: '#fbbf24', icon: '✦', type: 'fx' },
    { id: 'fx-chromatic', name: 'Chromatic FX', cat: 'FX', tag: 'fx', desc: 'RGB split aberration', color: '#60a5fa', icon: '❋', type: 'fx' },
    { id: 'fx-vignette', name: 'Vignette FX', cat: 'FX', tag: 'fx', desc: 'Edge darkening', color: '#1e1b4b', icon: '◉', type: 'fx' },
    { id: 'fx-noise', name: 'Film Noise FX', cat: 'FX', tag: 'fx', desc: 'Film grain noise', color: '#6b7280', icon: '▒', type: 'fx' },
];

const CATEGORIES = ['All', 'Group', '3D', '2D', 'FX'];
const CAT_FILTER = {
    'All': () => true,
    'Group': i => i.id === 'group',
    '3D': i => i.cat === '3D',
    '2D': i => i.cat === '2D',
    'FX': i => i.type === 'fx',
};

export default function AddItemModal({ onClose, parentLayerId }) {
    const { addLayer } = useStore();
    const [cat, setCat] = useState('All');
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const f = CAT_FILTER[cat] || (() => true);
        const q = search.toLowerCase();
        return CATALOG.filter(i => f(i) && (
            !q || i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.tag.includes(q)
        ));
    }, [cat, search]);

    const handleAdd = (item) => {
        const base = {
            id: gid(), name: item.name, visible: true,
            position: [0, 0, 0], scale: 1, rotation: 0,
            skewX: 0, skewY: 0, flipH: false, flipV: false,
            opacity: 1, startTime: 0, duration: 9999, color: item.color,
            parentId: parentLayerId || null,
            audioFollow: true,
        };
        if (item.type === 'fx') {
            addLayer({ ...base, type: item.id, fxParams: { enabled: true, intensity: 1.5, opacity: 0.1, offsetX: 0.003, offsetY: 0.003, darkness: 0.5, offset: 0.3 } });
        } else {
            const extras = {
                particles: { freeMode: { enabled: false, speed: 1 }, audioReactive: { scale: { enabled: true, source: 'bass', amount: 0.3 }, speed: { enabled: true, source: 'bass', amount: 2 } } },
                'particle-rings': { freeMode: { enabled: false, speed: 1 }, speed: 1, ringCount: 4, perRing: 80, audioReactive: { scale: { enabled: true, source: 'bass', amount: 0.2 } } },
                starfield: { speed: 1, count: 800 },
                waveform: {},
                'spectrum-circle': { audioReactive: { scale: { enabled: true, source: 'bass', amount: 0.5 } } },
                'spectrum-mountain': { shape: 'line', amplitude: 4 },
                tunnel: { speed: 1 },
                kaleidoscope: { segments: 6, speed: 1 },
                laser: { laserCount: 8 },
                glitch: { audioReactive: { glitch: { enabled: true, amount: 1 } } },
                text: { content: 'VIBE', audioReactive: { scale: { enabled: true, source: 'bass', amount: 0.2 } } },
                image: { content: '' },
                video: { content: '' },
                audio: { audioUrl: '' },
            };
            addLayer({ ...base, type: item.id, ...(extras[item.id] || {}) });
        }
        onClose();
    };

    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
    };

    const panelStyle = {
        width: '680px', maxHeight: '80vh', background: '#0e0e18',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    };

    const catBtnStyle = (isActive) => ({
        padding: '5px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
        border: 'none', cursor: 'pointer', transition: 'all 0.15s',
        background: isActive ? '#7b61ff' : 'rgba(255,255,255,0.05)',
        color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
    });

    const cardStyle = (isHovered, isFx) => ({
        background: '#131320', borderRadius: '10px', cursor: 'pointer',
        border: isHovered ? '1px solid rgba(255,255,255,0.3)' : `1px solid ${isFx ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.15s', transform: isHovered ? 'scale(1.03)' : 'scale(1)',
        overflow: 'hidden',
    });

    const [hoveredId, setHoveredId] = useState(null);

    return ReactDOM.createPortal(
        <div style={overlayStyle} onClick={onClose}>
            <div style={panelStyle} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.05em' }}>Add Item</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Search + Categories */}
                <div style={{ padding: '12px 20px', display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '6px 12px', flexGrow: 1 }}>
                        <Search size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search effects, layers..."
                            autoFocus
                            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', color: '#fff', width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {CATEGORIES.map(c => (
                            <button key={c} onClick={() => setCat(c)} style={catBtnStyle(cat === c)}>{c}</button>
                        ))}
                    </div>
                </div>

                {/* Grid — 5 columns */}
                <div style={{ flexGrow: 1, overflowY: 'auto', padding: '16px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                        {filtered.map(item => (
                            <div key={item.id}
                                style={cardStyle(hoveredId === item.id, item.type === 'fx')}
                                onMouseEnter={() => setHoveredId(item.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={() => handleAdd(item)}>
                                {/* Icon area */}
                                <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a12', position: 'relative', fontSize: '22px', color: item.color }}>
                                    {item.icon}
                                    <span style={{ position: 'absolute', top: '4px', right: '4px', fontSize: '7px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: item.type === 'fx' ? 'rgba(16,185,129,0.8)' : item.cat === '3D' ? 'rgba(139,92,246,0.7)' : 'rgba(6,182,212,0.7)', color: '#fff' }}>
                                        {item.type === 'fx' ? 'FX' : item.cat}
                                    </span>
                                </div>
                                {/* Label */}
                                <div style={{ padding: '6px 8px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                    <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', marginTop: '2px', lineHeight: '1.3', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div style={{ gridColumn: 'span 5', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px', padding: '40px 0' }}>
                                No items match "{search}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
