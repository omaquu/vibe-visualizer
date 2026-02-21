import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { engine } from './audioEngine';
import { exporter } from './exporter';
import { Play, Pause, Upload, Settings2, Command, Download, X } from 'lucide-react';
import VisualizerCanvas from './Visualizer';
import './index.css';

function Sidebar() {
  const { layers, selectedLayerId, setSelectedLayerId, addLayer } = useStore();

  return (
    <div className="glass-panel w-64 h-full p-4 flex-col gap-4" style={{ zIndex: 10 }}>
      <h2 className="font-semibold text-lg flex items-center gap-2">
        <Settings2 size={20} className="text-accent" />
        Visualizer
      </h2>

      <div className="flex-col gap-2 flex-grow overflow-y-auto">
        <div className="text-sm font-medium text-muted mb-2">LAYERS</div>
        {layers.map(layer => (
          <div
            key={layer.id}
            onClick={() => setSelectedLayerId(layer.id)}
            className={`glass-panel p-3 cursor-pointer transition-all ${selectedLayerId === layer.id ? 'border-accent-color' : ''}`}
            style={{
              borderColor: selectedLayerId === layer.id ? 'var(--accent-color)' : 'var(--glass-border)',
              backgroundColor: selectedLayerId === layer.id ? 'rgba(123, 97, 255, 0.1)' : 'var(--glass-bg)'
            }}
          >
            <div className="font-medium text-sm">{layer.name}</div>
            <div className="text-xs text-muted capitalize">{layer.type.replace('-', ' ')}</div>
          </div>
        ))}
      </div>

      <button className="glass-button w-full" onClick={() => addLayer({
        id: Math.random().toString(36).substring(2, 9),
        type: 'text',
        name: 'New Text',
        content: 'Vibe',
        position: [0, 0, 2],
        scale: 1,
        audioReactive: { scale: { enabled: true, source: 'bass', amount: 0.1 } },
        color: '#ffffff'
      })}>
        + Add Layer
      </button>
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
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-[600px]">
      <div className="glass-panel flex items-center p-2 gap-2 shadow-lg">
        <Command size={18} className="text-accent" />
        <input
          className="glass-input bg-transparent border-none outline-none text-sm w-full"
          placeholder="Terminal: generate videomp3 Cyberpunk bloom noise"
          style={{ background: 'transparent' }}
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
      <div className="glass-panel absolute bottom-4 left-4 right-4 h-16 flex items-center p-4 justify-between z-10">
        <div className="flex items-center gap-4">
          <button className="glass-button primary w-10 h-10 p-0 rounded-full flex justify-center items-center" onClick={togglePlay} disabled={isExporting}>
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
          </button>

          <input type="file" ref={fileInputRef} accept="audio/*" className="hidden" onChange={handleFileChange} />

          <div className="text-sm font-medium">
            {audioFile ? `Audio Loaded (${engine.audio.duration ? Math.round(engine.audio.duration) + 's' : ''})` : "No Audio"}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="glass-button" onClick={() => fileInputRef.current?.click()} disabled={isExporting}>
            <Upload size={16} /> Load MP3
          </button>
          <button className="glass-button primary" onClick={() => setShowExportModal(true)} disabled={isExporting || !audioFile}>
            <Download size={16} /> {isExporting ? `Exporting...` : "Export Video"}
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
    <div className="flex w-full h-full text-white relative">
      <Terminal />
      <Sidebar />
      <MainCanvas />
      <Timeline />
    </div>
  );
}

export default App;
