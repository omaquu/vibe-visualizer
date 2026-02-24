import React from 'react';
import { useStore } from './store';
import { LeftSidebar, AudioAnalyzer } from './AppLeft';
import RightSidebar from './AppRight';
import { Timeline, TerminalPanel } from './AppBottom';
import VisualizerCanvas from './Visualizer';
import './index.css';

function MainCanvas() {
  return (
    <div style={{ flexGrow: 1, display: 'flex', overflow: 'hidden', position: 'relative', background: '#000', minWidth: 0, minHeight: 0 }}>
      <VisualizerCanvas />
    </div>
  );
}

export default function App() {
  const showAnalyzer = useStore(s => s.showAnalyzer);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0d0d12', color: '#fff' }}>
      {/* Top Menu Bar */}
      <div style={{ height: '32px', flexShrink: 0, background: '#09090e', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', userSelect: 'none', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-color)', boxShadow: '0 0 8px var(--accent-color)' }} />
          <span style={{ fontWeight: 700, letterSpacing: '0.1em', fontSize: '10px', textTransform: 'uppercase', opacity: 0.9 }}>Vibe Visualizer</span>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
        <LeftSidebar />

        {/* Center column: canvas + waveform + analyzer */}
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
          <MainCanvas />



          {showAnalyzer && (
            <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.6)' }}>
              <AudioAnalyzer />
            </div>
          )}
        </div>

        <RightSidebar />
      </div>

      {/* Timeline */}
      <Timeline />

      {/* Terminal */}
      <TerminalPanel />
    </div>
  );
}
