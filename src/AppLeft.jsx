
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { engine } from './audioEngine';
import AddItemModal from './AddItemModal';
import {
    ChevronDown, ChevronRight, Image, Plus, Trash2, Edit2, Play, Pause, ZoomIn, Search, FileDown, Upload, Crosshair, Layers, Folder, Type, Video, Music, Settings, Box, Eye, EyeOff, Film, FolderPlus, Sparkles, GripVertical, Radio, BarChart2, Zap, File, ArrowDownUp
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const gid = () => Math.random().toString(36).substring(2, 9);

// ─── FFT Analyzer ─────────────────────────────────────────────────────────────
export function AudioAnalyzer() {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const draw = () => {
            rafRef.current = requestAnimationFrame(draw);
            const ad = engine.audioData;
            ctx.clearRect(0, 0, W, H);
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 1;
            const labels = [
                ['bass', ad.bass, '#f97316'],
                ['mid', ad.mid, '#22d3ee'],
                ['treb', ad.treble, '#ec4899'],
            ];
            labels.forEach(([lbl, val, col], li) => {
                const bw = W * 0.22, bh = val * H * 0.9;
                ctx.fillStyle = col;
                ctx.fillRect(W * [0.02, 0.33, 0.66][li], H - bh, bw, bh);
                ctx.fillStyle = '#fff';
                ctx.font = '7px Inter';
                ctx.fillText(lbl, [2, W * 0.22, W * 0.65][li], H - 3);
            });
        };
        draw();
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <canvas ref={canvasRef} width={800} height={72}
            style={{ width: '100%', height: '72px', display: 'block' }} />
    );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FX_TYPES = ['fx-bloom', 'fx-chromatic', 'fx-vignette', 'fx-noise'];

const ICON_COLORS = {
    image: '#60a5fa', video: '#a855f7', text: '#22c55e', waveform: '#f97316',
    'spectrum-circle': '#ec4899', 'spectrum-mountain': '#8b5cf6',
    particles: '#eab308', 'particle-rings': '#06b6d4',
    starfield: '#fff', tunnel: '#a78bfa', kaleidoscope: '#ec4899',
    laser: '#ef4444', glitch: '#4ade80', composition: '#fbbf24',
};

function getIcon(type) {
    if (FX_TYPES.includes(type)) return <Zap size={11} style={{ color: '#34d399', flexShrink: 0 }} />;
    const getMap = () => ({
        image: Image, video: Video, text: Type, waveform: BarChart2,
        'spectrum-circle': Sparkles, 'spectrum-mountain': Sparkles,
        particles: Sparkles, 'particle-rings': Sparkles,
        starfield: Sparkles, tunnel: Sparkles, kaleidoscope: Sparkles,
        laser: Sparkles, glitch: Sparkles, composition: Folder,
    });
    const map = getMap();
    const Ic = map[type] || File;
    return <Ic size={11} style={{ color: ICON_COLORS[type] || 'rgba(255,255,255,0.3)', flexShrink: 0 }} />;
}

// ─── Sortable Layer Item ──────────────────────────────────────────────────────
function SortableItem({ layer, isSelected, onSelect, onToggleVis, onDelete, onAddChild }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: layer.id });
    const isFX = FX_TYPES.includes(layer.type);
    const isVisible = layer.visible !== false;
    const [hovered, setHovered] = useState(false);
    const hasChildren = !!layer._hasChildren;
    const isChild = !!layer.parentId;
    const depth = isChild ? 1 : 0;
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(layer.name);

    const handleRenameSubmit = () => {
        setIsEditing(false);
        if (editName.trim() !== layer.name) {
            useStore.getState().updateLayer(layer.id, { name: editName.trim() || 'Layer' });
        }
    };

    const rowStyle = {
        display: 'flex', alignItems: 'center', gap: '3px',
        padding: '4px 4px 4px ' + (4 + depth * 16) + 'px',
        borderRadius: '4px', fontSize: '10px', cursor: 'default', userSelect: 'none',
        transform: CSS.Transform.toString(transform), transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
        background: isSelected ? (isFX ? 'rgba(16,185,129,0.15)' : 'rgba(123,97,255,0.15)') : (hovered ? 'rgba(255,255,255,0.05)' : 'transparent'),
        borderLeft: isFX ? '2px solid rgba(16,185,129,0.4)' : isChild ? '2px solid rgba(255,255,255,0.06)' : 'none',
    };

    const btn = {
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '3px', borderRadius: '4px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 0,
    };

    return (
        <div ref={setNodeRef} style={rowStyle}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            {/* Drag handle */}
            <div style={{ cursor: 'grab', padding: '0 2px', flexShrink: 0, color: 'rgba(255,255,255,0.15)' }} {...attributes} {...listeners}>
                <GripVertical size={10} />
            </div>
            {/* Eye icon */}
            <button style={{ ...btn, color: isVisible ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)' }}
                title={isVisible ? 'Hide' : 'Show'}
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); e.preventDefault(); onToggleVis(layer.id); }}>
                {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            {/* Icon + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', flexGrow: 1, minWidth: 0, opacity: isVisible ? 1 : 0.35 }}
                onClick={e => { e.stopPropagation(); onSelect(layer.id); }}
                onDoubleClick={e => { e.stopPropagation(); setIsEditing(true); setEditName(layer.name); }}
            >
                {getIcon(layer.type)}
                {isEditing ? (
                    <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setIsEditing(false); }}
                        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(123,97,255,0.5)', color: '#fff', fontSize: '10px', padding: '2px 4px', borderRadius: '2px', outline: 'none', width: '100%' }}
                    />
                ) : (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.85)', fontWeight: isSelected ? 600 : 400 }}>
                        {layer.name}
                    </span>
                )}
            </div>
            {/* Add child effect */}
            {hovered && (
                <button style={{ ...btn, color: 'rgba(255,255,255,0.4)' }}
                    title="Add child effect"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); e.preventDefault(); onAddChild(layer.id); }}>
                    <Plus size={11} />
                </button>
            )}
            {/* Delete — far right */}
            {hovered && (
                <button style={{ ...btn, color: '#f87171', marginLeft: '6px' }}
                    title="Delete"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); e.preventDefault(); onDelete(layer.id); }}>
                    <Trash2 size={11} />
                </button>
            )}
        </div>
    );
}

// ─── Recursive Layer Tree Node ────────────────────────────────────────────────
function LayerNode({ compId, childrenItems, handleAddChild }) {
    const { selectedLayerId, setSelectedLayerId, removeLayer, toggleLayerVisibility, layers } = useStore();

    if (!childrenItems || childrenItems.length === 0) return null;

    return (
        <SortableContext items={childrenItems.map(l => l.id)} strategy={verticalListSortingStrategy}>
            {childrenItems.map(layer => {
                const layerChildren = layers.filter(l => l.parentId === layer.id).reverse();
                return (
                    <div key={layer.id}>
                        <SortableItem
                            layer={{ ...layer, _hasChildren: layerChildren.length > 0 }}
                            isSelected={selectedLayerId === layer.id}
                            onSelect={setSelectedLayerId}
                            onToggleVis={toggleLayerVisibility}
                            onDelete={removeLayer}
                            onAddChild={handleAddChild} />

                        {layerChildren.length > 0 && (
                            <div style={{ marginLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '4px' }}>
                                <LayerNode compId={compId} childrenItems={layerChildren} handleAddChild={handleAddChild} />
                            </div>
                        )}
                    </div>
                );
            })}
        </SortableContext>
    );
}

// ─── Left Sidebar ─────────────────────────────────────────────────────────────
export function LeftSidebar() {
    const { layers, selectedLayerId, setSelectedLayerId, removeLayer,
        toggleLayerVisibility, playlist, currentTrackIndex, setTrack,
        removeFromPlaylist, radioMode, toggleRadioMode } = useStore();
    const [layersOpen, setLayersOpen] = useState(true);
    const [playlistOpen, setPlaylistOpen] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);
    const [addParentId, setAddParentId] = useState(null);
    const [openComps, setOpenComps] = useState({});
    const audioInputRef = useRef(null);
    const coverInputRef = useRef(null);
    const pendingTrack = useRef(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const store = useStore.getState();
        const draggedLayer = store.layers.find(l => l.id === active.id);
        const targetLayer = store.layers.find(l => l.id === over.id);
        if (!draggedLayer || !targetLayer) return;

        // Drop onto a composition or group → become child of that container
        if (targetLayer.type === 'composition' || targetLayer.type === 'group' || targetLayer._hasChildren) {
            if (draggedLayer.parentId !== targetLayer.id) {
                store.updateLayer(active.id, { parentId: targetLayer.id });
                return;
            }
        }

        // Drop onto an unbound root layer → become unbound too (pop out of parent)
        if (!targetLayer.parentId && targetLayer.type !== 'composition') {
            if (draggedLayer.parentId !== null) {
                store.updateLayer(active.id, { parentId: null });
            }
        } else if (draggedLayer.parentId !== targetLayer.parentId) {
            // Drop onto a sibling → share its parent
            store.updateLayer(active.id, { parentId: targetLayer.parentId });
        }

        // Reorder within the flat list
        const items = [...store.layers].reverse();
        const oi = items.findIndex(i => i.id === active.id);
        const ni = items.findIndex(i => i.id === over.id);
        if (oi >= 0 && ni >= 0) {
            store.reorderLayers([...arrayMove(items, oi, ni)].reverse());
        }
    };

    const getChildren = (parentId) => layers.filter(l => l.parentId === parentId).reverse();

    const handleAddChild = (parentId) => {
        setAddParentId(parentId);
        setShowAddItem(true);
    };

    const handleAddTrack = () => audioInputRef.current?.click();
    const handleAddComposition = () => {
        const existingComps = useStore.getState().layers.filter(l => l.type === 'composition');
        let maxEndTime = 0;
        existingComps.forEach(c => {
            const end = (c.startTime || 0) + (c.duration || 0);
            if (end > maxEndTime) maxEndTime = end;
        });

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            const compId = `comp_${Date.now()}`;

            const audio = new window.Audio(url);
            audio.onloadedmetadata = () => {
                useStore.getState().addLayer({
                    id: compId,
                    name: file.name.replace(/\.[^.]+$/, ''),
                    type: 'composition',
                    visible: true,
                    parentId: null,
                    audioUrl: url,
                    startTime: maxEndTime,
                    duration: audio.duration
                });
                useStore.getState().setAudioFile(url);
                engine.loadAudio(url);
            };
        };
        input.click();
    };

    const onAudioChosen = (e) => {
        const file = e.target.files[0]; if (!file) return;
        pendingTrack.current = { id: gid(), url: URL.createObjectURL(file), name: file.name.replace(/\.[^.]+$/, ''), coverUrl: null };
        coverInputRef.current?.click(); e.target.value = '';
    };
    const onCoverChosen = (e) => {
        const file = e.target.files[0];
        if (pendingTrack.current) {
            if (file) pendingTrack.current.coverUrl = URL.createObjectURL(file);
            useStore.getState().addToPlaylist(pendingTrack.current);
            pendingTrack.current = null;
        }
        e.target.value = '';
    };

    return (
        <div style={{ width: '210px', display: 'flex', flexDirection: 'column', height: '100%', background: '#0d0d14', borderRight: '1px solid rgba(255,255,255,0.05)', zIndex: 10, flexShrink: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <Layers size={13} style={{ color: '#7b61ff' }} />
                <span style={{ fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Project</span>
            </div>

            <div style={{ overflowY: 'auto', overflowX: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Global Effects */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 8px', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => setSelectedLayerId('__global_effects__')}>
                        <Folder size={12} style={{ color: '#34d399' }} />
                        <span style={{ fontSize: '10px', fontWeight: 500 }}>Global Effects</span>
                        <ChevronRight size={10} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                    </div>
                </div>

                {/* Layer Master DND Context */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    {/* Individual Compositions */}
                    {layers.filter(l => l.type === 'composition').reverse().map((comp) => {
                        const isOpen = openComps[comp.id] !== false;
                        const compChildren = getChildren(comp.id);

                        return (
                            <div key={comp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {/* Composition Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 8px', cursor: 'pointer', userSelect: 'none', background: selectedLayerId === comp.id ? 'rgba(251,191,36,0.1)' : 'transparent' }}
                                    onClick={() => setSelectedLayerId(comp.id)}>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexGrow: 1 }} onClick={(e) => { e.stopPropagation(); setOpenComps(p => ({ ...p, [comp.id]: !isOpen })); }}>
                                        {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                        <Folder size={12} style={{ color: '#fbbf24' }} />
                                        <span style={{ fontSize: '10px', fontWeight: 500, color: selectedLayerId === comp.id ? '#fbbf24' : '#fff' }}>{comp.name}</span>
                                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{compChildren.length}</span>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const store = useStore.getState();
                                            const newLayers = [...store.layers];
                                            const childrenIds = compChildren.map(c => c.id);
                                            const reversedChildren = [...compChildren].reverse();

                                            let rIdx = 0;
                                            for (let i = 0; i < newLayers.length; i++) {
                                                if (childrenIds.includes(newLayers[i].id)) {
                                                    newLayers[i] = reversedChildren[rIdx++];
                                                }
                                            }
                                            store.reorderLayers(newLayers);
                                        }}
                                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '3px 5px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        title="Reverse layer order inside this composition"
                                    >
                                        <ArrowDownUp size={10} />
                                    </button>
                                </div>

                                {/* Composition Children recursively */}
                                {isOpen && (
                                    <div style={{ paddingLeft: '6px', paddingRight: '4px', paddingBottom: '6px', borderLeft: '1px solid rgba(255,255,255,0.05)', marginLeft: '14px' }}>
                                        <LayerNode compId={comp.id} childrenItems={compChildren} handleAddChild={handleAddChild} />

                                        <button
                                            onClick={() => { setAddParentId(comp.id); setShowAddItem(true); }}
                                            style={{ marginTop: '4px', width: '100%', fontSize: '10px', padding: '5px 0', border: '1px dashed rgba(123,97,255,0.3)', borderRadius: '4px', background: 'transparent', color: '#7b61ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <Plus size={10} /> Add Layer
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Root Layers (Non-composition root layers) */}
                    {(() => {
                        const rootNonComps = layers.filter(l => !l.parentId && l.type !== 'composition').reverse();
                        if (rootNonComps.length === 0) return null;
                        return (
                            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ padding: '6px 8px', fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>
                                    UNBOUND LAYERS
                                </div>
                                <div style={{ paddingBottom: '6px', paddingLeft: '6px', paddingRight: '4px' }}>
                                    <LayerNode compId={null} childrenItems={rootNonComps} handleAddChild={handleAddChild} />
                                </div>
                            </div>
                        );
                    })()}
                </DndContext>

                {/* Bottom Add Buttons */}
                <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => {
                            useStore.getState().addLayer({
                                id: `comp_${Date.now()}`,
                                name: `Composition ${layers.filter(l => l.type === 'composition').length + 1}`,
                                type: 'composition',
                                visible: true,
                                parentId: null,
                                startTime: (() => { const comps = layers.filter(l => l.type === 'composition'); let m = 0; comps.forEach(c => { const e = (c.startTime || 0) + (c.duration || 0); if (e > m) m = e; }); return m; })(),
                                duration: 30
                            });
                        }}
                        title="Add a new Composition container"
                        style={{ flex: 1, fontSize: '9px', padding: '6px 0', border: '1px solid rgba(251,191,36,0.5)', borderRadius: '4px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: 600 }}>
                        <FolderPlus size={10} /> Composition
                    </button>
                    <button
                        onClick={() => { setAddParentId(null); setShowAddItem(true); }}
                        title="Add a new layer or effect"
                        style={{ flex: 1, fontSize: '9px', padding: '6px 0', border: '1px dashed rgba(123,97,255,0.3)', borderRadius: '4px', background: 'transparent', color: '#7b61ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Plus size={10} /> Layer
                    </button>
                </div>

                {/* Playlist */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 8px', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => setPlaylistOpen(!playlistOpen)}>
                        {playlistOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                        <Folder size={12} style={{ color: '#ec4899' }} />
                        <span style={{ fontSize: '10px', fontWeight: 500 }}>Playlist</span>
                        <span style={{ marginLeft: 'auto', fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{playlist.length}</span>
                    </div>
                    {playlistOpen && (
                        <div style={{ paddingLeft: '10px', paddingBottom: '6px', borderLeft: '1px solid rgba(255,255,255,0.05)', marginLeft: '14px' }}>
                            {playlist.map((track, i) => (
                                <div key={track.id}
                                    onClick={() => { setTrack(i); import('./audioEngine').then(({ engine }) => { engine.loadAudio(track.url); engine.play(); }); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 4px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', color: i === currentTrackIndex ? '#fff' : 'rgba(255,255,255,0.4)', background: i === currentTrackIndex ? 'rgba(236,72,153,0.15)' : 'transparent' }}>
                                    {track.coverUrl
                                        ? <img src={track.coverUrl} style={{ width: '18px', height: '18px', borderRadius: '2px', objectFit: 'cover' }} />
                                        : <Music size={10} />}
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>{track.name}</span>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, color: '#f87171', padding: '2px' }}
                                        onClick={e => { e.stopPropagation(); removeFromPlaylist(track.id); }}>
                                        <Trash2 size={9} />
                                    </button>
                                </div>
                            ))}
                            <button style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '3px', padding: '3px 6px', marginTop: '4px', background: 'transparent', cursor: 'pointer' }}
                                onClick={handleAddTrack}>+ Add Track</button>
                            <button style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 6px', borderRadius: '3px', marginTop: '2px', background: 'transparent', border: 'none', cursor: 'pointer', color: radioMode ? '#ec4899' : 'rgba(255,255,255,0.3)' }}
                                onClick={toggleRadioMode}>
                                <Radio size={9} /> Radio DJ {radioMode ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={onAudioChosen} />
            <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onCoverChosen} />
            {showAddItem && <AddItemModal onClose={() => setShowAddItem(false)} parentLayerId={addParentId} />}
        </div >
    );
}
