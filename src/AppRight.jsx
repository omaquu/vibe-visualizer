import React, { useState } from 'react';
import { Upload, Layers, Zap, ChevronDown, ChevronRight, Settings, Paintbrush } from 'lucide-react';
import { useStore } from './store';

// ─── Reusable UI Components ──────────────────────────────────────────────────
function Slider({ label, min, max, step, value, onChange }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{label}</label>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', width: '36px', textAlign: 'right' }}>
                    {typeof value === 'number' ? value.toFixed(step < 0.01 ? 3 : step < 0.1 ? 2 : 1) : value}
                </span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={onChange}
                style={{ width: '100%', height: '4px', appearance: 'none', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', outline: 'none', cursor: 'pointer' }} />
        </div>
    );
}

function Toggle({ label, checked, onChange }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={onChange}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{label}</span>
            <div style={{ width: '28px', height: '14px', borderRadius: '7px', background: checked ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', padding: '0 2px', transition: 'background 0.2s' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', transition: 'transform 0.2s', transform: checked ? 'translateX(14px)' : 'translateX(0)' }} />
            </div>
        </div>
    );
}

function Section({ title, defaultOpen = true, children }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div onClick={() => setOpen(!open)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 0', cursor: 'pointer', userSelect: 'none' }}>
                {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)' }}>{title}</span>
            </div>
            {open && <div style={{ paddingBottom: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>{children}</div>}
        </div>
    );
}

// ─── Global Effects Panel (shown in right sidebar) ───────────────────────────
function GlobalEffectsPanel() {
    const { effects, updateEffect } = useStore();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Settings size={14} className="text-emerald-400" />
                <span style={{ fontWeight: 600, fontSize: '12px' }}>Global Effects</span>
            </div>
            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', margin: '6px 0 4px' }}>Applied to the entire composition</p>

            <Section title="Bloom" defaultOpen={true}>
                <Toggle label="Enabled" checked={!!effects.bloom?.enabled}
                    onChange={() => updateEffect('bloom', { enabled: !effects.bloom?.enabled })} />
                {effects.bloom?.enabled && (<>
                    <Toggle label="Audio Reactive" checked={!!effects.bloom?.audioReactive}
                        onChange={() => updateEffect('bloom', { audioReactive: !effects.bloom?.audioReactive })} />
                    <Slider label="Intensity" min={0} max={8} step={0.1}
                        value={effects.bloom?.intensity ?? 1.5}
                        onChange={e => updateEffect('bloom', { intensity: parseFloat(e.target.value) })} />
                    <Slider label="Threshold" min={0} max={1} step={0.05}
                        value={effects.bloom?.luminanceThreshold ?? 0.2}
                        onChange={e => updateEffect('bloom', { luminanceThreshold: parseFloat(e.target.value) })} />
                </>)}
            </Section>

            <Section title="Chromatic Aberration" defaultOpen={false}>
                <Toggle label="Enabled" checked={!!effects.chromaticAberration?.enabled}
                    onChange={() => updateEffect('chromaticAberration', { enabled: !effects.chromaticAberration?.enabled })} />
                {effects.chromaticAberration?.enabled && (<>
                    <Toggle label="Audio Reactive (Treble)" checked={!!effects.chromaticAberration?.audioReactive}
                        onChange={() => updateEffect('chromaticAberration', { audioReactive: !effects.chromaticAberration?.audioReactive })} />
                    <Slider label="Offset X" min={0} max={0.05} step={0.001}
                        value={effects.chromaticAberration?.offsetX ?? 0.002}
                        onChange={e => updateEffect('chromaticAberration', { offsetX: parseFloat(e.target.value) })} />
                    <Slider label="Offset Y" min={0} max={0.05} step={0.001}
                        value={effects.chromaticAberration?.offsetY ?? 0.002}
                        onChange={e => updateEffect('chromaticAberration', { offsetY: parseFloat(e.target.value) })} />
                </>)}
            </Section>

            <Section title="Film Noise" defaultOpen={false}>
                <Toggle label="Enabled" checked={!!effects.noise?.enabled}
                    onChange={() => updateEffect('noise', { enabled: !effects.noise?.enabled })} />
                {effects.noise?.enabled && (
                    <Slider label="Opacity" min={0} max={0.5} step={0.01}
                        value={effects.noise?.opacity ?? 0.05}
                        onChange={e => updateEffect('noise', { opacity: parseFloat(e.target.value) })} />
                )}
            </Section>

            <Section title="Vignette" defaultOpen={false}>
                <Toggle label="Enabled" checked={!!effects.vignette?.enabled}
                    onChange={() => updateEffect('vignette', { enabled: !effects.vignette?.enabled })} />
                {effects.vignette?.enabled && (<>
                    <Slider label="Darkness" min={0} max={1} step={0.05}
                        value={effects.vignette?.darkness ?? 0.5}
                        onChange={e => updateEffect('vignette', { darkness: parseFloat(e.target.value) })} />
                    <Slider label="Offset" min={0} max={1} step={0.05}
                        value={effects.vignette?.offset ?? 0.3}
                        onChange={e => updateEffect('vignette', { offset: parseFloat(e.target.value) })} />
                </>)}
            </Section>
        </div>
    );
}

// ─── FX Layer Inspector ──────────────────────────────────────────────────────
function FXLayerInspector({ layer }) {
    const { updateLayer, removeLayer } = useStore();
    const p = layer.fxParams || {};
    const upd = (u) => updateLayer(layer.id, { fxParams: { ...p, ...u } });
    const label = layer.type.replace('fx-', '').charAt(0).toUpperCase() + layer.type.replace('fx-', '').slice(1);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={13} className="text-emerald-400" />
                    <span style={{ fontWeight: 600, fontSize: '12px' }}>{label} Effect</span>
                </div>
                <button style={{ fontSize: '10px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => removeLayer(layer.id)}>Delete</button>
            </div>
            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', margin: '6px 0 8px' }}>Affects layers below in stack</p>
            <Toggle label="Enabled" checked={!!p.enabled} onChange={() => upd({ enabled: !p.enabled })} />
            {p.enabled && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {layer.type === 'fx-bloom' && (<>
                        <Slider label="Intensity" min={0} max={8} step={0.1} value={p.intensity ?? 1.5} onChange={e => upd({ intensity: parseFloat(e.target.value) })} />
                        <Slider label="Threshold" min={0} max={1} step={0.05} value={p.luminanceThreshold ?? 0.2} onChange={e => upd({ luminanceThreshold: parseFloat(e.target.value) })} />
                    </>)}
                    {layer.type === 'fx-chromatic' && (<>
                        <Slider label="Offset X" min={0} max={0.05} step={0.001} value={p.offsetX ?? 0.003} onChange={e => upd({ offsetX: parseFloat(e.target.value) })} />
                        <Slider label="Offset Y" min={0} max={0.05} step={0.001} value={p.offsetY ?? 0.003} onChange={e => upd({ offsetY: parseFloat(e.target.value) })} />
                    </>)}
                    {layer.type === 'fx-noise' && (
                        <Slider label="Opacity" min={0} max={0.5} step={0.01} value={p.opacity ?? 0.1} onChange={e => upd({ opacity: parseFloat(e.target.value) })} />
                    )}
                    {layer.type === 'fx-vignette' && (<>
                        <Slider label="Darkness" min={0} max={1} step={0.05} value={p.darkness ?? 0.5} onChange={e => upd({ darkness: parseFloat(e.target.value) })} />
                        <Slider label="Offset" min={0} max={1} step={0.05} value={p.offset ?? 0.3} onChange={e => upd({ offset: parseFloat(e.target.value) })} />
                    </>)}
                </div>
            )}
        </div>
    );
}

// ─── Audio Reactive Section ─────────────────────────────────────────────────
function AudioReactiveSection({ layer, updateL }) {
    const ar = layer.audioReactive;
    if (!ar) return null;
    const srcOpts = ['bass', 'mid', 'treble', 'kick', 'energy'];

    const renderProp = (propKey, label) => {
        const prop = ar[propKey];
        if (prop === undefined) return null;
        return (
            <div key={propKey} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px', marginBottom: '4px' }}>
                <Toggle label={label} checked={!!prop.enabled}
                    onChange={() => updateL({ audioReactive: { ...ar, [propKey]: { ...prop, enabled: !prop.enabled } } })} />
                {prop.enabled && (
                    <div style={{ paddingLeft: '8px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <select className="glass-input" style={{ fontSize: '10px', padding: '4px' }}
                            value={prop.source || 'bass'}
                            onChange={e => updateL({ audioReactive: { ...ar, [propKey]: { ...prop, source: e.target.value } } })}>
                            {srcOpts.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                        <Slider label="Amount" min={-2} max={3} step={0.05} value={prop.amount || 0}
                            onChange={e => updateL({ audioReactive: { ...ar, [propKey]: { ...prop, amount: parseFloat(e.target.value) } } })} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <Section title="Audio Reactivity">
            {renderProp('scale', 'Scale Pulse')}
            {renderProp('rotation', 'Rotation Spin')}
            {renderProp('opacity', 'Opacity Pulse')}
            {renderProp('speed', 'Speed Boost')}
            {renderProp('spread', 'Spread Boost')}
        </Section>
    );
}

// ─── Free Mode section ──────────────────────────────────────────────────────
function FreeModeSection({ layer, updateL }) {
    const fm = layer.freeMode || { enabled: false, speed: 1.0 };
    if (!['particles', 'particle-rings'].includes(layer.type)) return null;
    return (
        <Section title="Free Mode">
            <Toggle label="No audio sync" checked={!!fm.enabled}
                onChange={() => updateL({ freeMode: { ...fm, enabled: !fm.enabled } })} />
            {fm.enabled && (
                <Slider label="Base Speed" min={0.1} max={5} step={0.1} value={fm.speed || 1}
                    onChange={e => updateL({ freeMode: { ...fm, speed: parseFloat(e.target.value) } })} />
            )}
        </Section>
    );
}

// ─── Right Sidebar ──────────────────────────────────────────────────────────
export default function RightSidebar() {
    const { layers, selectedLayerId, updateLayer, removeLayer } = useStore();

    const panelStyle = { width: '240px', height: '100%', padding: '10px', display: 'flex', flexDirection: 'column', gap: '0', zIndex: 10, overflowY: 'auto', background: '#0e0e16', borderLeft: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 };

    // Global Effects mode
    if (selectedLayerId === '__global_effects__') {
        return <div style={panelStyle}><GlobalEffectsPanel /></div>;
    }

    const layer = layers.find(l => l.id === selectedLayerId);

    // FX layer types
    const FX_TYPES = ['fx-bloom', 'fx-chromatic', 'fx-vignette', 'fx-noise'];
    if (layer && FX_TYPES.includes(layer.type)) {
        return <div style={panelStyle}><FXLayerInspector layer={layer} /></div>;
    }

    // Empty state
    if (!layer) {
        return (
            <div style={{ ...panelStyle, alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={24} style={{ opacity: 0.1, marginBottom: '6px' }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>Select a layer or effect</span>
            </div>
        );
    }

    const updateL = (u) => updateLayer(layer.id, u);
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            if (layer.type === 'audio') updateL({ audioUrl: url });
            else updateL({ content: url });

            // Auto-detect audio duration if it's an audio layer
            if (layer.type === 'audio') {
                const tempAudio = new window.Audio(url);
                tempAudio.onloadedmetadata = () => {
                    updateL({ duration: tempAudio.duration });
                };
            }
        }
    };

    return (
        <div style={panelStyle}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontWeight: 600, fontSize: '12px' }}>Layer Properties</span>
                <button style={{ fontSize: '10px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => removeLayer(layer.id)}>Delete</button>
            </div>

            {/* Settings Section */}
            <Section title="Settings" defaultOpen={true}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Name</label>
                    <input className="glass-input" style={{ fontSize: '11px', padding: '4px 8px' }} value={layer.name} onChange={e => updateL({ name: e.target.value })} />
                </div>
                {/* Parent Container Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
                    <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Parent Sequence / Group</label>
                    <select className="glass-input" style={{ fontSize: '11px', padding: '4px 8px' }}
                        value={layer.parentId || ''}
                        onChange={e => updateL({ parentId: e.target.value || null })}>
                        <option value="">-- Root (No Parent) --</option>
                        {layers.filter(l => (l.type === 'composition' || l.type === 'group') && l.id !== layer.id).map(g => (
                            <option key={g.id} value={g.id}>{g.name} ({g.type})</option>
                        ))}
                    </select>
                </div>
                {/* Audio Follow Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={layer.audioFollow !== false}
                            onChange={e => updateL({ audioFollow: e.target.checked })}
                            style={{ accentColor: '#7b61ff', width: '14px', height: '14px', cursor: 'pointer' }} />
                        Follow Audio
                    </label>
                </div>
            </Section>

            {/* Transform */}
            <Section title="Transform">
                {/* Position */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>X</label>
                        <input type="number" step="0.5" className="glass-input" style={{ fontSize: '10px', padding: '3px 4px' }}
                            value={layer.position?.[0] || 0} onChange={e => {
                                const p = [...(layer.position || [0, 0, 0])]; p[0] = parseFloat(e.target.value) || 0; updateL({ position: p });
                            }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>Y</label>
                        <input type="number" step="0.5" className="glass-input" style={{ fontSize: '10px', padding: '3px 4px' }}
                            value={layer.position?.[1] || 0} onChange={e => {
                                const p = [...(layer.position || [0, 0, 0])]; p[1] = parseFloat(e.target.value) || 0; updateL({ position: p });
                            }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>Z</label>
                        <input type="number" step="0.5" className="glass-input" style={{ fontSize: '10px', padding: '3px 4px' }}
                            value={layer.position?.[2] || 0} onChange={e => {
                                const p = [...(layer.position || [0, 0, 0])]; p[2] = parseFloat(e.target.value) || 0; updateL({ position: p });
                            }} />
                    </div>
                </div>
                {/* Scale + Rotation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <Slider label="Scale" min={0.1} max={10} step={0.1} value={layer.scale || 1}
                        onChange={e => updateL({ scale: parseFloat(e.target.value) })} />
                    <Slider label="Rotation" min={-3.14} max={3.14} step={0.05} value={layer.rotation || 0}
                        onChange={e => updateL({ rotation: parseFloat(e.target.value) })} />
                </div>
                {/* Skew */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <Slider label="Skew X" min={-2} max={2} step={0.05} value={layer.skewX || 0}
                        onChange={e => updateL({ skewX: parseFloat(e.target.value) })} />
                    <Slider label="Skew Y" min={-2} max={2} step={0.05} value={layer.skewY || 0}
                        onChange={e => updateL({ skewY: parseFloat(e.target.value) })} />
                </div>
                {/* Opacity */}
                <Slider label="Opacity" min={0} max={1} step={0.05} value={layer.opacity ?? 1}
                    onChange={e => updateL({ opacity: parseFloat(e.target.value) })} />
                {/* Shape + Color */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {layer.type !== 'composition' && layer.type !== 'group' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Shape</label>
                            <select className="glass-input" style={{ fontSize: '10px', padding: '4px' }}
                                value={layer.shape || 'rect'} onChange={e => updateL({ shape: e.target.value })}>
                                <option value="rect">Rectangle</option>
                                <option value="circle">Circle</option>
                                <option value="triangle">Triangle</option>
                            </select>
                        </div>
                    )}
                    {layer.color !== undefined && layer.type !== 'composition' && layer.type !== 'group' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Color</label>
                            <input type="color" value={layer.color} onChange={e => updateL({ color: e.target.value })}
                                style={{ width: '100%', height: '24px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }} />
                        </div>
                    )}
                </div>
                {/* Flip Buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button onClick={() => updateL({ flipH: !layer.flipH })}
                        style={{ flex: 1, padding: '4px', fontSize: '9px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', background: layer.flipH ? 'rgba(123,97,255,0.2)' : 'transparent', color: '#fff', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ↔ Flip H
                    </button>
                    <button onClick={() => updateL({ flipV: !layer.flipV })}
                        style={{ flex: 1, padding: '4px', fontSize: '9px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', background: layer.flipV ? 'rgba(123,97,255,0.2)' : 'transparent', color: '#fff', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ↕ Flip V
                    </button>
                </div>
            </Section>

            {/* Timing */}
            <Section title="Timing" defaultOpen={false}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>Start (s)</label>
                        <input type="number" step="0.1" className="glass-input" style={{ fontSize: '10px', padding: '3px 6px' }}
                            value={layer.startTime || 0} onChange={e => updateL({ startTime: parseFloat(e.target.value) })} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>Duration (s)</label>
                        <input type="number" step="0.1" className="glass-input" style={{ fontSize: '10px', padding: '3px 6px' }}
                            value={layer.duration || 9999} onChange={e => updateL({ duration: parseFloat(e.target.value) })} />
                    </div>
                </div>
            </Section>

            {/* Media */}
            {(layer.type === 'image' || layer.type === 'video' || layer.type === 'audio') && (
                <Section title="Media">
                    <button className="glass-button" style={{ fontSize: '10px', padding: '4px 8px' }}
                        onClick={() => document.getElementById(`layer-up-${layer.id}`)?.click()}>
                        <Upload size={10} /> Upload {layer.type === 'audio' ? 'Audio' : 'File'}
                    </button>
                    <input id={`layer-up-${layer.id}`} type="file"
                        accept={layer.type === 'video' ? 'video/*' : layer.type === 'audio' ? 'audio/*' : 'image/*'}
                        style={{ display: 'none' }} onChange={handleFileUpload} />
                    <input className="glass-input" style={{ fontSize: '9px', padding: '3px 6px', fontFamily: 'monospace' }}
                        placeholder="Or paste URL…" value={(layer.type === 'audio' ? layer.audioUrl : layer.content) || ''}
                        onChange={e => {
                            if (layer.type === 'audio') updateL({ audioUrl: e.target.value });
                            else updateL({ content: e.target.value });
                        }} />
                </Section>
            )}

            {/* Text */}
            {layer.type === 'text' && (
                <Section title="Content">
                    <input className="glass-input" style={{ fontSize: '11px', padding: '4px 8px' }}
                        value={layer.content || ''} onChange={e => updateL({ content: e.target.value })} />
                </Section>
            )}

            {/* Spectrum Mountain */}
            {layer.type === 'spectrum-mountain' && (
                <Section title="Shape">
                    <select className="glass-input" style={{ fontSize: '10px', padding: '4px' }}
                        value={layer.shape || 'line'} onChange={e => updateL({ shape: e.target.value })}>
                        {['line', 'mirror', 'circle', 'arc', 's-curve'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    <Slider label="Amplitude" min={0.5} max={10} step={0.1} value={layer.amplitude || 4}
                        onChange={e => updateL({ amplitude: parseFloat(e.target.value) })} />
                </Section>
            )}

            {/* Spectrum Circle */}
            {layer.type === 'spectrum-circle' && (
                <Section title="Ring Settings">
                    <Slider label="Thickness" min={0.01} max={0.5} step={0.01} value={layer.thickness || 0.06}
                        onChange={e => updateL({ thickness: parseFloat(e.target.value) })} />
                </Section>
            )}

            {/* Particle controls */}
            {(layer.type === 'particles' || layer.type === 'particle-rings') && (
                <Section title="Particle Config">
                    <Slider label="Speed" min={0.1} max={5} step={0.1} value={layer.speed || 1}
                        onChange={e => updateL({ speed: parseFloat(e.target.value) })} />
                    {layer.type === 'particles' && (
                        <Slider label="Count" min={50} max={2000} step={50} value={layer.count || 600}
                            onChange={e => updateL({ count: parseInt(e.target.value) })} />
                    )}
                    {layer.type === 'particle-rings' && (<>
                        <Slider label="Rings" min={1} max={10} step={1} value={layer.ringCount || 4}
                            onChange={e => updateL({ ringCount: parseInt(e.target.value) })} />
                        <Slider label="Per Ring" min={20} max={200} step={10} value={layer.perRing || 80}
                            onChange={e => updateL({ perRing: parseInt(e.target.value) })} />
                    </>)}
                </Section>
            )}

            {/* Laser / Kaleidoscope / Tunnel */}
            {layer.type === 'laser' && (
                <Section title="Laser Config">
                    <Slider label="Count" min={2} max={24} step={1} value={layer.laserCount || 8}
                        onChange={e => updateL({ laserCount: parseInt(e.target.value) })} />
                </Section>
            )}
            {layer.type === 'kaleidoscope' && (
                <Section title="Kaleidoscope">
                    <Slider label="Segments" min={2} max={16} step={1} value={layer.segments || 6}
                        onChange={e => updateL({ segments: parseInt(e.target.value) })} />
                    <Slider label="Speed" min={0.1} max={5} step={0.1} value={layer.speed || 1}
                        onChange={e => updateL({ speed: parseFloat(e.target.value) })} />
                </Section>
            )}
            {layer.type === 'tunnel' && (
                <Section title="Tunnel">
                    <Slider label="Speed" min={0.1} max={5} step={0.1} value={layer.speed || 1}
                        onChange={e => updateL({ speed: parseFloat(e.target.value) })} />
                </Section>
            )}

            <FreeModeSection layer={layer} updateL={updateL} />
            <AudioReactiveSection layer={layer} updateL={updateL} />
        </div>
    );
}
