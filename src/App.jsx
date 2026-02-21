import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { engine } from './audioEngine';
import { exporter } from './exporter';
import { Play, Pause, Upload, Settings2, Command, Download, X, ChevronDown, ChevronRight, Image as ImageIcon, Video, Type, Settings, Sparkles, Folder, File, Layers } from 'lucide-react';
import VisualizerCanvas from './Visualizer';
import './index.css';

function LeftSidebar() {
  const { layers, selectedLayerId, setSelectedLayerId, addLayer, effects } = useStore();
  const [layersOpen, setLayersOpen] = useState(true);
  const [effectsOpen, setEffectsOpen] = useState(true);

  const getIconForType = (type) => {
    switch (type) {
      case 'image': return <ImageIcon size={14} className="text-blue-400" />;
      case 'video': return <Video size={14} className="text-purple-400" />;
      case 'text': return <Type size={14} className="text-green-400" />;
      case 'spectrum-circle': return <Sparkles size={14} className="text-pink-400" />;
      case 'particles': return <Sparkles size={14} className="text-yellow-400" />;
      default: return <File size={14} className="text-gray-400" />;
    }
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
            <div className="flex-col pl-6 mt-1 gap-0.5 border-l border-white/5 ml-2.5">
              {/* Render layers in reverse so visually top = top layer */}
              {[...layers].reverse().map(layer => (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors text-xs ${selectedLayerId === layer.id ? 'bg-accent/20 text-white' : 'text-muted hover:bg-white/5 hover:text-white'}`}
                >
                  {getIconForType(layer.type)}
                  <span className="truncate flex-grow">{layer.name}</span>
                </div>
              ))}
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
            <div className="flex-col gap-1">
              <label className="text-xs text-muted mb-1">Intensity</label>
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

      {layer.content !== undefined && (
        <div className="flex-col gap-2 mt-1">
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
            placeholder="Or paste URL here..."
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

      {layer.audioReactive && layer.audioReactive.scale && (
        <div className="mt-4 p-3 bg-black/30 border border-white/5 rounded-lg flex-col gap-2 shadow-inner">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => updateLayer(layer.id, { audioReactive: { ...layer.audioReactive, scale: { ...layer.audioReactive.scale, enabled: !layer.audioReactive.scale.enabled } } })}>
            <label className="text-xs font-semibold cursor-pointer tracking-wider uppercase text-accent">Audio Reactivity</label>
            <input type="checkbox" checked={layer.audioReactive.scale.enabled} className="cursor-pointer" readOnly />
          </div>

          {layer.audioReactive.scale.enabled && (
            <>
              <div className="flex-col gap-1 mt-2">
                <label className="text-xs text-muted">Frequency Source</label>
                <select
                  className="glass-input text-xs p-1"
                  value={layer.audioReactive.scale.source}
                  onChange={(e) => updateLayer(layer.id, { audioReactive: { ...layer.audioReactive, scale: { ...layer.audioReactive.scale, source: e.target.value } } })}
                >
                  <option value="bass">Bass</option>
                  <option value="mid">Mid</option>
                  <option value="treble">Treble</option>
                  <option value="kick">Kick</option>
                </select>
              </div>
              <div className="flex-col gap-1 mt-2">
                <label className="text-xs text-muted">Strength Multiplier</label>
                <input
                  type="range" min="-1" max="2" step="0.05"
                  className="w-full"
                  value={layer.audioReactive.scale.amount}
                  onChange={(e) => updateLayer(layer.id, { audioReactive: { ...layer.audioReactive, scale: { ...layer.audioReactive.scale, amount: parseFloat(e.target.value) } } })}
                />
              </div>
            </>
          )}
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
          audioReactive: { scale: { enabled: true, source: 'bass', amount: 0.2 } },
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
  const { isPlaying, setIsPlaying, audioFile, setAudioFile } = useStore();
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

  return (
    <>
      <div className="glass-panel h-16 flex items-center p-4 justify-between z-10 border-b-0 border-x-0 rounded-none bg-black/40">
        <div className="flex items-center gap-4">
          <button className="glass-button primary w-10 h-10 p-0 rounded-full flex justify-center items-center shrink-0" onClick={togglePlay} disabled={isExporting}>
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
          </button>

          <input type="file" ref={fileInputRef} accept="audio/*" className="hidden" onChange={handleFileChange} />

          <div className="text-xs font-mono bg-black/40 px-3 py-1.5 rounded-md border border-white/5 whitespace-nowrap">
            {audioFile ? `Loaded (${engine.audio.duration ? Math.round(engine.audio.duration) + 's' : ''})` : "No Audio"}
          </div>
        </div>

        <Terminal />

        <div className="flex gap-2 shrink-0">
          <button className="glass-button text-xs" onClick={() => fileInputRef.current?.click()} disabled={isExporting}>
            <Upload size={14} /> Load MP3
          </button>
          <button className="glass-button primary text-xs" onClick={() => setShowExportModal(true)} disabled={isExporting || !audioFile}>
            <Download size={14} /> {isExporting ? `Exporting...` : "Export Video"}
          </button>
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="glass-panel w-[600px] p-6 flex-col gap-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Export Settings</h2>
              <button onClick={() => !isExporting && setShowExportModal(false)} className="text-muted hover:text-white disabled:opacity-50" disabled={isExporting}>
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-col gap-1 w-full">
                <label className="text-xs text-muted">FFmpeg Preset (Speed vs Size)</label>
                <select
                  className="glass-input p-2"
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
                <label className="text-xs text-muted">CRF (Quality: 0-51, lower is better)</label>
                <input
                  type="number"
                  className="glass-input p-2"
                  value={crf}
                  onChange={(e) => setCrf(e.target.value)}
                  min="0" max="51"
                  disabled={isExporting}
                />
              </div>
            </div>

            {isExporting ? (
              <div className="flex-col gap-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{progressInfo.phase} Phase...</span>
                  <span>{Math.round(progressInfo.progress * 100)}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all duration-300"
                    style={{ width: `${progressInfo.progress * 100}%` }}
                  />
                </div>
                {progressInfo.eta != null && (
                  <div className="text-xs text-muted mt-1">
                    Estimated time remaining: {Math.round(progressInfo.eta)}s
                  </div>
                )}

                <div className="mt-4 bg-black/50 border border-white/10 rounded-md p-2 h-32 overflow-y-auto font-mono text-[10px] text-muted flex-col gap-1 flex-col-reverse">
                  {logs.slice().reverse().map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </div>
            ) : (
              <button
                className="glass-button primary w-full mt-4"
                onClick={startExport}
              >
                Start Render
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
    <div className="flex-grow relative bg-black/20" style={{ zIndex: 0 }}>
      <VisualizerCanvas />
    </div>
  );
}

function App() {
  return (
    <div className="flex flex-col w-screen h-screen bg-bg-color text-white overflow-hidden">
      {/* Top Header/Menu Bar (Optional) */}
      <div className="h-10 bg-[#0a0a0e] border-b border-white/5 flex items-center px-4 justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent-color opacity-80" style={{ background: 'var(--accent-color)' }}></div>
          <span className="font-bold tracking-widest text-xs uppercase opacity-80">VIZZO</span>
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
