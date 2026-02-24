import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { engine } from './audioEngine';
import { exporter } from './exporter';
import { Play, Pause, Upload, Settings2, Command, Download, X, ChevronDown, ChevronRight, Image as ImageIcon, Video, Type, Settings, Sparkles, Folder, File, Layers, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import VisualizerCanvas from './Visualizer';
import './index.css';

function LeftSidebar() {
  const { layers, selectedLayerId, setSelectedLayerId, addLayer, effects } = useStore();
  const [layersOpen, setLayersOpen] = useState(true);
  const [effectsOpen, setEffectsOpen] = useState(true);

  const getIconForType = (type) => {
    switch (type) {
      case 'image': return <ImageIcon size={14} className="text-blue-400 shrink-0" />;
      case 'video': return <Video size={14} className="text-purple-400 shrink-0" />;
      case 'text': return <Type size={14} className="text-green-400 shrink-0" />;
      case 'spectrum-circle': return <Sparkles size={14} className="text-pink-400 shrink-0" />;
      case 'glitch': return <Sparkles size={14} className="text-red-400 shrink-0" />;
      case 'waveform': return <Sparkles size={14} className="text-orange-400 shrink-0" />;
      case 'particles': return <Sparkles size={14} className="text-yellow-400 shrink-0" />;
      default: return <File size={14} className="text-gray-400 shrink-0" />;
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // minimum drag distance before triggering
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      // Re-order mapping because visually the list is rendered reversed 
      // but in data we want the top-most visual element to be at the end of the array
      const items = [...layers].reverse();
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);

      const newVisualOrder = arrayMove(items, oldIndex, newIndex);
      // reverse it back before saving to state
      useStore.getState().reorderLayers([...newVisualOrder].reverse());
    }
  };

  const SortableLayerItem = ({ layer, isSelected, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: layer.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 2 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-2 p-1.5 rounded text-xs transition-colors ${isSelected ? 'bg-accent/20 text-white' : 'text-muted hover:bg-white/5 hover:text-white'} ${isDragging ? 'opacity-50 ring-1 ring-accent scale-[1.02]' : ''}`}
      >
        <div
          className="cursor-grab hover:text-white text-white/30 shrink-0 active:cursor-grabbing px-1 h-full flex items-center"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={12} />
        </div>
        <div
          className="flex items-center gap-2 cursor-pointer flex-grow overflow-hidden"
          onClick={onClick}
        >
          {getIconForType(layer.type)}
          <span className="truncate">{layer.name}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel w-64 h-full flex-col text-sm overflow-hidden z-10 bg-[#16161e]/90 border-r border-white/5 shadow-2xl shrink-0">
      <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-black/20 font-semibold tracking-wide text-xs uppercase">
        <Layers size={16} className="text-accent" />
        Project Explorer
      </div>

      <div className="flex-col flex-grow overflow-y-auto overflow-x-hidden p-2">
        {/* Layers Folder */}
        <div className="flex-col mb-2">
          <div
            className="flex items-center gap-1.5 p-1.5 hover:bg-white/5 rounded cursor-pointer select-none"
            onClick={() => setLayersOpen(!layersOpen)}
          >
            {layersOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Folder size={16} className="text-accent" fill="currentColor" fillOpacity={0.2} />
            <span className="font-medium text-xs">Composition Layers</span>
          </div>

          {layersOpen && (
            <div className="flex-col pl-2 pr-1 mt-1 gap-0.5 border-l border-white/5 ml-2.5 min-h-[50px]">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={[...layers].reverse().map(l => l.id)} strategy={verticalListSortingStrategy}>
                  {/* Render layers in reverse so visually top = top layer */}
                  {[...layers].reverse().map(layer => (
                    <SortableLayerItem
                      key={layer.id}
                      layer={layer}
                      isSelected={selectedLayerId === layer.id}
                      onClick={() => setSelectedLayerId(layer.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <div
                className="flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors text-xs text-muted hover:bg-white/5 hover:text-white mt-1 opacity-70 border border-dashed border-white/10"
                onClick={() => addLayer({
                  id: Math.random().toString(36).substring(2, 9),
                  type: 'waveform',
                  name: 'New Waveform',
                  position: [0, 0, 1],
                  scale: 1,
                  color: '#ff9900'
                })}
              >
                <div className="w-3.5 flex justify-center">+</div>
                <span>Add Waveform...</span>
              </div>
              <div
                className="flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors text-xs text-muted hover:bg-white/5 hover:text-white mt-1 opacity-70 border border-dashed border-white/10"
                onClick={() => addLayer({
                  id: Math.random().toString(36).substring(2, 9),
                  type: 'text',
                  name: 'New Text',
                  content: 'Vibe',
                  position: [0, 0, 2],
                  scale: 1,
                  audioReactive: { scale: { enabled: true, source: 'bass', amount: 0.1 } },
                  color: '#ffffff'
                })}
              >
                <div className="w-3.5 flex justify-center">+</div>
                <span>Add Layer...</span>
              </div>
            </div>
          )}
        </div>

        {/* Global Effects Folder */}
        <div className="flex-col mt-2">
          <div
            className="flex items-center gap-1.5 p-1.5 hover:bg-white/5 rounded cursor-pointer select-none"
            onClick={() => setEffectsOpen(!effectsOpen)}
          >
            {effectsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Folder size={16} className="text-emerald-400" fill="currentColor" fillOpacity={0.2} />
            <span className="font-medium text-xs">Global Effects</span>
          </div>

          {effectsOpen && (
            <div className="flex-col pl-6 mt-1 gap-0.5 border-l border-white/5 ml-2.5">
              {Object.keys(effects).map(effectKey => (
                <div
                  key={`effect_${effectKey}`}
                  onClick={() => setSelectedLayerId(`effect_${effectKey}`)}
                  className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors text-xs ${selectedLayerId === `effect_${effectKey}` ? 'bg-emerald-500/20 text-white' : 'text-muted hover:bg-white/5 hover:text-white'}`}
                >
                  <Settings size={14} className={effects[effectKey].enabled ? "text-emerald-400" : "text-gray-600"} />
                  <span className="truncate flex-grow capitalize">{effectKey.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className={`w-2 h-2 rounded-full ${effects[effectKey].enabled ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`}></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RightSidebar() {
  const { layers, selectedLayerId, updateLayer, removeLayer, effects, updateEffect } = useStore();

  // Handle Global Effects selection
  if (selectedLayerId && selectedLayerId.startsWith('effect_')) {
    const effectKey = selectedLayerId.replace('effect_', '');
    const effect = effects[effectKey];
    if (!effect) return null;

    return (
      <div className="glass-panel w-80 h-full p-4 flex-col gap-4 border-r-0 border-y-0 z-10 overflow-y-auto bg-[#16161e]/90 shrink-0">
        <div className="flex justify-between items-center bg-black/20 p-2 rounded-md -mx-2 -mt-2 mb-2">
          <h3 className="font-semibold text-sm capitalize">{effectKey.replace(/([A-Z])/g, ' $1').trim()} Settings</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Enable</span>
            <input
              type="checkbox"
              checked={effect.enabled}
              onChange={() => updateEffect(effectKey, { enabled: !effect.enabled })}
              className="cursor-pointer"
            />
          </div>
        </div>

        {effectKey === 'bloom' && effect.enabled && (
          <>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted">Audio Reactive Bloom</label>
              <input 
                type="checkbox" 
                checked={effect.audioReactive} 
                onChange={() => updateEffect(effectKey, { audioReactive: !effect.audioReactive })}
                className="cursor-pointer"
              />
            </div>
            <div className="flex-col gap-1">
              <label className="text-xs text-muted mb-1">Base Intensity</label>
              <div className="flex gap-2">
                <input type="range" min="0" max="5" step="0.1" className="w-full" value={effect.intensity || 1.5} onChange={(e) => updateEffect(effectKey, { intensity: parseFloat(e.target.value) })} />
                <span className="text-xs w-8 text-right">{effect.intensity?.toFixed(1) || 1.5}</span>
              </div>
            </div>
            <div className="flex-col gap-1">
              <label className="text-xs text-muted mb-1">Threshold</label>
              <div className="flex gap-2">
                <input type="range" min="0" max="1" step="0.05" className="w-full" value={effect.luminanceThreshold || 0.2} onChange={(e) => updateEffect(effectKey, { luminanceThreshold: parseFloat(e.target.value) })} />
                <span className="text-xs w-8 text-right">{effect.luminanceThreshold?.toFixed(2) || 0.2}</span>
              </div>
            </div>
          </>
        )}

        {effectKey === 'noise' && effect.enabled && (
          <div className="flex-col gap-1">
            <label className="text-xs text-muted mb-1">Opacity</label>
            <div className="flex gap-2">
              <input type="range" min="0" max="1" step="0.01" className="w-full" value={effect.opacity || 0.05} onChange={(e) => updateEffect(effectKey, { opacity: parseFloat(e.target.value) })} />
              <span className="text-xs w-8 text-right">{effect.opacity?.toFixed(2) || 0.05}</span>
            </div>
          </div>
        )}

        {effectKey === 'vignette' && effect.enabled && (
          <>
            <div className="flex-col gap-1">
              <label className="text-xs text-muted mb-1">Darkness</label>
              <div className="flex gap-2">
                <input type="range" min="0" max="1" step="0.05" className="w-full" value={effect.darkness || 0.5} onChange={(e) => updateEffect(effectKey, { darkness: parseFloat(e.target.value) })} />
                <span className="text-xs w-8 text-right">{effect.darkness?.toFixed(2) || 0.5}</span>
              </div>
            </div>
            <div className="flex-col gap-1">
              <label className="text-xs text-muted mb-1">Offset</label>
              <div className="flex gap-2">
                <input type="range" min="0" max="1" step="0.05" className="w-full" value={effect.offset || 0.3} onChange={(e) => updateEffect(effectKey, { offset: parseFloat(e.target.value) })} />
                <span className="text-xs w-8 text-right">{effect.offset?.toFixed(2) || 0.3}</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Regular Layer Selection
  const layer = layers.find(l => l.id === selectedLayerId);

  if (!layer) {
    return (
      <div className="glass-panel w-80 h-full p-4 flex-col gap-4 border-r-0 border-y-0 z-10 items-center justify-center text-muted bg-[#16161e]/90 shrink-0">
        <Layers size={32} className="opacity-20 mb-2" />
        <span className="text-sm">Select a layer or effect</span>
      </div>
    );
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateLayer(layer.id, { content: url });
    }
  };

  return (
    <div className="glass-panel w-80 h-full p-4 flex-col gap-4 border-r-0 border-y-0 z-10 overflow-y-auto bg-[#16161e]/90 shrink-0">
      <div className="flex justify-between items-center bg-black/20 p-2 rounded-md -mx-2 -mt-2 mb-2">
        <h3 className="font-semibold text-sm">Layer Properties</h3>
        <button className="text-danger-color text-xs hover:underline" onClick={() => removeLayer(layer.id)}>Delete</button>
      </div>

      <div className="flex-col gap-1">
        <label className="text-xs text-muted">Name</label>
        <input
          className="glass-input text-sm p-1.5"
          value={layer.name}
          onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
        />
      </div>

      <div className="flex-col gap-1 mt-2">
        <label className="text-xs text-muted">Layer Type</label>
        <select
          className="glass-input text-sm p-1.5 w-full capitalize"
          value={layer.type}
          onChange={(e) => updateLayer(layer.id, { type: e.target.value })}
        >
          <option value="text">Text</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="spectrum-circle">Spectrum Circle</option>
          <option value="waveform">Waveform Bars</option>
          <option value="particles">Particles</option>
          <option value="glitch">Glitch Plane</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="flex-col gap-1">
          <label className="text-xs text-muted">Start Time (s)</label>
          <input
            type="number" step="0.1"
            className="glass-input text-sm p-1.5 w-full"
            value={layer.startTime || 0}
            onChange={(e) => updateLayer(layer.id, { startTime: parseFloat(e.target.value) })}
          />
        </div>
        <div className="flex-col gap-1">
          <label className="text-xs text-muted">Duration (s)</label>
          <input
            type="number" step="0.1"
            className="glass-input text-sm p-1.5 w-full"
            value={layer.duration || 10}
            onChange={(e) => updateLayer(layer.id, { duration: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      {layer.content !== undefined && layer.type !== 'spectrum-circle' && layer.type !== 'particles' && (
        <div className="flex-col gap-2 mt-2">
          <label className="text-xs text-muted">{layer.type === 'video' || layer.type === 'image' ? 'Media Source' : 'Content Text'}</label>
          {(layer.type === 'video' || layer.type === 'image') && (
            <div className="flex items-center gap-2">
              <button
                className="glass-button text-xs py-1.5 px-3 whitespace-nowrap"
                onClick={() => document.getElementById(`layer-upload-${layer.id}`)?.click()}
              >
                <Upload size={12} className="mr-1" /> Upload File
              </button>
              <input
                id={`layer-upload-${layer.id}`}
                type="file"
                accept={layer.type === 'video' ? 'video/*' : 'image/*'}
                className="hidden"
                onChange={handleFileUpload}
              />
              <span className="text-[10px] text-muted truncate">
                {layer.content.startsWith('blob:') ? 'Local File' : 'External URL'}
              </span>
            </div>
          )}
          <input
            className="glass-input text-xs p-1.5 font-mono"
            placeholder={layer.type === 'text' ? "Write something..." : "Or paste URL here..."}
            value={layer.content}
            onChange={(e) => updateLayer(layer.id, { content: e.target.value })}
          />
        </div>
      )}

      <div className="flex-col gap-1 mt-2">
        <label className="text-xs text-muted mb-1">Scale / Size</label>
        <div className="flex gap-2">
          <input
            type="range" min="0.1" max="10" step="0.1"
            className="w-full"
            value={layer.scale}
            onChange={(e) => updateLayer(layer.id, { scale: parseFloat(e.target.value) })}
          />
          <span className="text-xs w-8 text-right">{layer.scale.toFixed(1)}</span>
        </div>
      </div>

      {layer.color !== undefined && (
        <div className="flex-col gap-1 mt-2">
          <label className="text-xs text-muted">Color Tint</label>
          <input
            type="color"
            className="w-full h-8 bg-transparent border border-white/10 rounded cursor-pointer"
            value={layer.color}
            onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
          />
        </div>
      )}

      {layer.audioReactive && (
        <div className="mt-4 p-3 bg-black/30 border border-white/5 rounded-lg flex-col gap-2 shadow-inner">
          <label className="text-xs font-semibold tracking-wider uppercase text-accent mb-2 block">Audio Reactivity</label>
          
          {/* Scale Reactivity */}
          <div className="flex-col gap-2 border-b border-white/5 pb-2 mb-2">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => updateLayer(layer.id, { audioReactive: { ...layer.audioReactive, scale: { ...layer.audioReactive.scale, enabled: !layer.audioReactive.scale?.enabled } } })}>
              <span className="text-xs text-muted">Scale Reactivity</span>
              <input type="checkbox" checked={layer.audioReactive.scale?.enabled} className="cursor-pointer" readOnly />
            </div>
            {layer.audioReactive.scale?.enabled && (
              <div className="flex-col gap-1 pl-2">
                <select className="glass-input text-[10px] p-1 mb-1" value={layer.audioReactive.scale.source} onChange={(e) => updateLayer(layer.id, { audioReactive: { ...layer.audioReactive, scale: { ...layer.audioReactive.scale, source: e.target.value } } })}>
                  <option value="bass">Bass</option><option value="mid">Mid</option><option value="treble">Treble</option><option value="kick">Kick</option>
                </select>
                <input type="range" min="-1" max="2" step="0.05" className="w-full" value={layer.audioReactive.scale.amount} onChange={(e) => updateLayer(layer.id, { audioReactive: { ...layer.audioReactive, scale: { ...layer.audioReactive.scale, amount: parseFloat(e.target.value) } } })} />
              </div>
            )}
          </div>

          {/* Rotation Reactivity */}
          <div className="flex-col gap-2 border-b border-white/5 pb-2 mb-2">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => updateLayer(layer.id, { audioReactive: { ...layer.audioReactive, rotation: { ...layer.audioReactive.rotation, enabled: !layer.audioReactive.rotation?.enabled } } })}>
              <span className="text-xs text-muted">Rotation (Spin)</span>
              <input type="checkbox" checked={layer.audioReactive.rotation?.enabled} className="cursor-pointer" readOnly />
            </div>
            {layer.audioReactive.rotation?.enabled && (
              <div className="flex-col gap-1 pl-2">
                <select className="glass-input text-[10px] p-1 mb-1" value={layer.audioReactive.rotation.source || 'kick'} onChange={(e) => updateLayer(layer.id, { audioReactive: { ...layer.audioReactive, rotation: { ...layer.audioReactive.rotation, source: e.target.value } } })}>
                  <option value="bass">Bass</option><option value="mid">Mid</option><option value="treble">Treble</option><option value="kick">Kick</option>
                </select>
                <input type="range" min="-2" max="2" step="0.1" className="w-full" value={layer.audioReactive.rotation.amount || 0.5} onChange={(e) => updateLayer(layer.id, { audioReactive: { ...layer.audioReactive, rotation: { ...layer.audioReactive.rotation, amount: parseFloat(e.target.value) } } })} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Terminal() {
  const { addLayer, updateEffect } = useStore();
  const [inputVal, setInputVal] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const parts = inputVal.split(' ');
      if (parts[0] === 'generate' && parts[1] === 'videomp3') {
        const title = parts[2] || 'New Track';

        // Add a text layer with the title
        addLayer({
          id: Math.random().toString(36).substring(2, 9),
          type: 'text',
          name: 'Track Title',
          content: title,
          position: [0, 0, 2],
          scale: 1,
          audioReactive: { 
            scale: { enabled: true, source: 'bass', amount: 0.2 },
            rotation: { enabled: true, source: 'kick', amount: 0.1 }
          },
          color: '#ffffff'
        });

        // Parse effects with optional strength
        const lowerInput = inputVal.toLowerCase();

        const getStrength = (keyword, defaultVal) => {
          const match = lowerInput.match(new RegExp(`${keyword}\\s+(\\d+(\\.\\d+)?)`));
          return match ? parseFloat(match[1]) : defaultVal;
        };

        if (lowerInput.includes('bloom')) updateEffect('bloom', { enabled: true, intensity: getStrength('bloom', 2) });
        if (lowerInput.includes('noise')) updateEffect('noise', { enabled: true, opacity: getStrength('noise', 0.1) });
        if (lowerInput.includes('glitch') || lowerInput.includes('chromatic')) {
          updateEffect('chromaticAberration', { enabled: true });
        }

        // Add video background if requested
        if (lowerInput.includes('video')) {
          addLayer({
            id: Math.random().toString(36).substring(2, 9),
            type: 'video',
            name: 'Video Background',
            position: [0, 0, -20],
            scale: 1,
            // Example cool public domain video, could be customizable later
            content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
          });
        } else if (lowerInput.includes('cyberpunk') || lowerInput.includes('space')) {
          // Fallback to particles if no video requested but vibe is set
          addLayer({
            id: Math.random().toString(36).substring(2, 9),
            type: 'particles',
            name: 'Vibe Particles',
            position: [0, 0, -15],
            scale: 1,
            color: lowerInput.includes('cyberpunk') ? '#00ffcc' : '#ffffff'
          });
        }

        setInputVal('');
      } else if (parts[0] === 'preset') {
        const p = parts[1];
        if (p === 'vaporwave') {
            addLayer({
                id: Math.random().toString(36).substring(2, 9),
                type: 'spectrum-circle',
                name: 'Vapor Ring',
                position: [0, 0, 1],
                scale: 1.5,
                color: '#ff71ce',
                audioReactive: { scale: { enabled: true, source: 'bass', amount: 0.5 } }
            });
            updateEffect('bloom', { enabled: true, intensity: 2.5 });
            updateEffect('chromaticAberration', { enabled: true, offset: [0.005, 0.005] });
        } else if (p === 'techno') {
            addLayer({
                id: Math.random().toString(36).substring(2, 9),
                type: 'glitch',
                name: 'Techno Glitch',
                position: [0, 0, 0],
                scale: 1,
                color: '#00ff00',
                audioReactive: { glitch: { enabled: true, amount: 2.0 } }
            });
            updateEffect('noise', { enabled: true, opacity: 0.2 });
        }
        setInputVal('');
      } else if (parts[0] === 'glitch') {
        const amount = parseFloat(parts[1]) || 1.0;
        addLayer({
            id: Math.random().toString(36).substring(2, 9),
            type: 'glitch',
            name: 'Glitch Effect',
            position: [0, 0, 5],
            scale: 1,
            startTime: engine.audio.currentTime,
            duration: 2,
            color: '#ffffff',
            audioReactive: { glitch: { enabled: true, amount: amount } }
        });
        setInputVal('');
      } else if (parts[0] === 'text') {
        const text = parts.slice(1).join(' ') || 'VIBE';
        addLayer({
            id: Math.random().toString(36).substring(2, 9),
            type: 'text',
            name: 'Terminal Text',
            content: text,
            position: [0, 0, 2],
            scale: 1,
            startTime: engine.audio.currentTime,
            duration: 5,
            color: '#ffffff',
            audioReactive: { scale: { enabled: true, source: 'bass', amount: 0.2 } }
        });
        setInputVal('');
      }
    }
  };

  return (
    <div className="flex-grow max-w-[600px] mx-4">
      <div className="glass-panel flex items-center p-0 shadow-lg border-white/5 bg-black/50 overflow-hidden">
        <div className="bg-white/5 py-2 px-3 border-r border-white/5 flex items-center justify-center">
          <Command size={14} className="text-muted" />
        </div>
        <input
          className="bg-transparent border-none outline-none text-xs w-full px-3 py-2 text-white placeholder-white/30 font-mono"
          placeholder="Terminal: generate videomp3 Cyberpunk bloom noise"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}

function Timeline() {
  const { isPlaying, setIsPlaying, audioFile, setAudioFile, currentTime, setCurrentTime, layers, updateLayer } = useStore();
  const fileInputRef = useRef(null);

  useEffect(() => {
    engine.audio.addEventListener('play', () => setIsPlaying(true));
    engine.audio.addEventListener('pause', () => setIsPlaying(false));
    engine.audio.addEventListener('ended', () => setIsPlaying(false));
  }, [setIsPlaying]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(url);
      engine.loadAudio(url);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    engine.audio.currentTime = time;
    setCurrentTime(time);
  };

  const togglePlay = () => {
    if (!audioFile) {
      fileInputRef.current?.click();
      return;
    }
    if (isPlaying) {
      engine.pause();
    } else {
      engine.play();
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ phase: '', progress: 0, eta: null });
  const [logs, setLogs] = useState([]);

  const [preset, setPreset] = useState('ultrafast');
  const [crf, setCrf] = useState('23');

  const startExport = async () => {
    if (!audioFile) return alert("Load an audio file first!");

    setIsExporting(true);
    setLogs([]);
    setProgressInfo({ phase: 'starting', progress: 0, eta: null });

    try {
      const duration = engine.audio.duration || 30;
      await exporter.exportVideo(
        audioFile,
        duration,
        (info) => {
          setProgressInfo(info);
        },
        (logMsg) => {
          setLogs(prev => [...prev, logMsg]);
        },
        { preset, crf }
      );
    } catch (e) {
      console.error(e);
      setLogs(prev => [...prev, `ERROR: ${e.message}`]);
    } finally {
      setIsExporting(false);
    }
  };

  const duration = engine.audio.duration || 0;

  return (
    <>
      <div className="glass-panel h-64 flex-col z-10 border-b-0 border-x-0 rounded-none bg-[#16161e]/90 shrink-0">
        {/* Timeline Visualization Area */}
        <div className="flex-grow flex-col p-4 border-b border-white/5 relative overflow-y-auto bg-black/40">
          {/* Seek Bar */}
          <div className="sticky top-0 z-20 bg-black/60 p-1 mb-2 rounded border border-white/5">
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              step="0.01" 
              value={currentTime} 
              onChange={handleSeek}
              className="w-full h-1 accent-accent"
            />
            <div className="flex justify-between text-[10px] font-mono mt-1 text-muted">
              <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(2).padStart(5, '0')}</span>
              <span>{Math.floor(duration / 60)}:{(duration % 60).toFixed(2).padStart(5, '0')}</span>
            </div>
          </div>

          {/* Layer Tracks */}
          <div className="flex-col gap-1">
            {layers.map(layer => (
              <div key={`track-${layer.id}`} className="h-6 flex items-center gap-2 group">
                <div className="w-24 text-[10px] truncate text-muted group-hover:text-white transition-colors">{layer.name}</div>
                <div className="flex-grow bg-white/5 rounded h-4 relative overflow-hidden">
                  <div 
                    className="absolute bg-accent/40 border border-accent/60 h-full rounded cursor-pointer hover:bg-accent/60 transition-colors"
                    style={{ 
                      left: `${(layer.startTime / (duration || 100)) * 100}%`,
                      width: `${(layer.duration / (duration || 100)) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Terminal overlaying the waveform view */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full flex justify-center z-10">
            <Terminal />
          </div>
        </div>

        <div className="h-16 flex items-center p-4 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button className="glass-button primary w-10 h-10 p-0 rounded-full flex justify-center items-center shrink-0 shadow-lg shadow-accent/20" onClick={togglePlay} disabled={isExporting}>
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
            </button>

            <input type="file" ref={fileInputRef} accept="audio/*" className="hidden" onChange={handleFileChange} />

            <div className="text-xs font-mono bg-black/40 px-3 py-1.5 rounded-md border border-white/5 whitespace-nowrap hidden md:block">
              {audioFile ? `Track Loaded` : "No Audio"}
            </div>

            <button className="glass-button text-xs font-medium" onClick={() => fileInputRef.current?.click()} disabled={isExporting}>
              <Upload size={14} className="mr-1" /> {audioFile ? 'Change MP3' : 'Load MP3'}
            </button>
          </div>

          <div className="flex gap-2 shrink-0">
            <button className="glass-button primary text-xs uppercase tracking-wider font-bold" onClick={() => setShowExportModal(true)} disabled={isExporting || !audioFile}>
              <Download size={14} className="mr-1" /> {isExporting ? `Exporting...` : "Render Video"}
            </button>
          </div>
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md">
          <div className="glass-panel w-[600px] p-6 flex-col gap-4 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold uppercase tracking-widest">Export Settings</h2>
              <button onClick={() => !isExporting && setShowExportModal(false)} className="text-muted hover:text-white disabled:opacity-50" disabled={isExporting}>
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-col gap-1 w-full">
                <label className="text-xs text-muted uppercase tracking-wider">FFmpeg Preset</label>
                <select
                  className="glass-input p-2 font-mono text-sm"
                  value={preset}
                  onChange={(e) => setPreset(e.target.value)}
                  disabled={isExporting}
                >
                  <option value="ultrafast">Ultrafast (Fastest, Larger file)</option>
                  <option value="superfast">Superfast</option>
                  <option value="veryfast">Veryfast</option>
                  <option value="faster">Faster</option>
                  <option value="fast">Fast</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="slow">Slow</option>
                  <option value="slower">Slower</option>
                  <option value="veryslow">Veryslow (Slowest, Small file)</option>
                </select>
              </div>
              <div className="flex-col gap-1 w-full">
                <label className="text-xs text-muted uppercase tracking-wider">CRF (Quality: 0-51)</label>
                <input
                  type="number"
                  className="glass-input p-2 font-mono text-sm"
                  value={crf}
                  onChange={(e) => setCrf(e.target.value)}
                  min="0" max="51"
                  disabled={isExporting}
                />
              </div>
            </div>

            {isExporting ? (
              <div className="flex-col gap-2 mt-4">
                <div className="flex justify-between text-sm font-mono tracking-wider">
                  <span className="uppercase">{progressInfo.phase} Phase...</span>
                  <span>{Math.round(progressInfo.progress * 100)}%</span>
                </div>
                <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="bg-accent h-full transition-all duration-300 shadow-[0_0_10px_rgba(123,97,255,0.8)]"
                    style={{ width: `${progressInfo.progress * 100}%` }}
                  />
                </div>
                {progressInfo.eta != null && (
                  <div className="text-xs text-muted mt-1 font-mono">
                    ETA: {Math.round(progressInfo.eta)}s
                  </div>
                )}

                <div className="mt-4 bg-black/80 border border-white/10 rounded-md p-3 h-32 overflow-y-auto font-mono text-[10px] text-muted flex-col gap-1 flex-col-reverse shadow-inner">
                  {logs.slice().reverse().map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </div>
            ) : (
              <button
                className="glass-button primary w-full mt-4 py-3 uppercase tracking-widest font-bold"
                onClick={startExport}
              >
                Start Render Process
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function MainCanvas() {
  return (
    <div className="flex-grow flex items-center justify-center p-4 min-w-[500px] z-0 overflow-hidden relative">
      {/* Container simulating a video editor monitor view */}
      <div className="w-full flex-grow max-w-[1280px] aspect-video relative rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden bg-black flex shrink-0">
        <VisualizerCanvas />
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="flex flex-col w-screen h-screen bg-bg-color text-white overflow-hidden">
      {/* Top Header/Menu Bar (Optional) */}
      <div className="h-10 bg-[#0a0a0e] border-b border-white/5 flex items-center px-4 justify-between select-none shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent-color opacity-80" style={{ background: 'var(--accent-color)' }}></div>
          <span className="font-bold tracking-widest text-xs uppercase opacity-80">VIBE VISUALIZER</span>
        </div>
        <div className="flex gap-4 text-[11px] font-medium text-muted uppercase tracking-wider">
          <span className="hover:text-white cursor-pointer relative after:absolute after:bottom-[-12px] after:left-0 after:w-full after:h-[2px] after:bg-accent-color">View</span>
          <span className="hover:text-white cursor-pointer transition-colors">Project</span>
          <span className="hover:text-white cursor-pointer transition-colors cursor-pointer text-accent">Help: npm run dev</span>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-grow relative overflow-hidden">
        <LeftSidebar />
        <MainCanvas />
        <RightSidebar />
      </div>

      {/* Bottom Timeline/Terminal Bar */}
      <Timeline />
    </div>
  );
}

export default App;
