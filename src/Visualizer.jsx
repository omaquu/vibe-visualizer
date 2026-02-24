import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { Text, TransformControls } from '@react-three/drei';
import { BlendFunction } from 'postprocessing';
import { useStore } from './store';
import { engine } from './audioEngine';
import * as THREE from 'three';

// ─── Utilities ───────────────────────────────────────────────────────────────
const getAV = (layer, audioData, prop = 'scale') => {
    if (layer.audioReactive?.[prop]?.enabled) {
        const s = layer.audioReactive[prop].source;
        const a = layer.audioReactive[prop].amount;
        return (audioData[s] || 0) * a;
    }
    return 0;
};

const applyTransform = (ref, layer, audioData) => {
    if (!ref.current) return;
    const obj = ref.current;

    // Scale (with audio reactivity + flip)
    let s = (layer.scale || 1) + getAV(layer, audioData, 'scale');
    const sx = s * (layer.flipH ? -1 : 1);
    const sy = s * (layer.flipV ? -1 : 1);
    const sz = (layer.type === 'image' || layer.type === 'video') ? 1 : s;
    obj.scale.lerp(new THREE.Vector3(sx, sy, sz), 0.15);

    // Rotation (static + audio reactive spin + shake)
    const staticRot = layer.rotation || 0;
    const audioRot = getAV(layer, audioData, 'rotation');
    const audioShake = getAV(layer, audioData, 'shake');
    let targetRot = staticRot;
    if (audioRot) {
        obj.rotation.z += audioRot * 0.08;
    } else {
        if (audioShake) {
            targetRot += (Math.random() - 0.5) * audioShake * 0.3;
        }
        obj.rotation.z = THREE.MathUtils.lerp(obj.rotation.z, targetRot, 0.15);
    }

    // Position shake from audio
    // Position shake from audio
    if (audioShake) {
        const shakeAmt = audioShake * 0.15;
        obj.position.x = THREE.MathUtils.lerp(obj.position.x, (Math.random() - 0.5) * shakeAmt, 0.3);
        obj.position.y = THREE.MathUtils.lerp(obj.position.y, (Math.random() - 0.5) * shakeAmt, 0.3);
    } else {
        obj.position.x = THREE.MathUtils.lerp(obj.position.x, 0, 0.3);
        obj.position.y = THREE.MathUtils.lerp(obj.position.y, 0, 0.3);
    }

    // Skew via custom matrix
    if (layer.skewX || layer.skewY) {
        obj.updateMatrix();
        const skewMat = new THREE.Matrix4().set(
            1, layer.skewX || 0, 0, 0,
            layer.skewY || 0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );
        obj.matrix.multiply(skewMat);
        obj.matrixAutoUpdate = false;
    } else {
        obj.matrixAutoUpdate = true;
    }

    // Opacity — apply to material and all children materials
    const o = THREE.MathUtils.clamp((layer.opacity ?? 1) + getAV(layer, audioData, 'opacity'), 0, 1);
    const applyOpacity = (target) => {
        if (target.material) {
            target.material.opacity = o;
            target.material.transparent = o < 1;
        }
        if (target.children) target.children.forEach(applyOpacity);
    };
    applyOpacity(obj);
};

// ─── Image ───────────────────────────────────────────────────────────────────
function ImageLayer({ layer, audioData }) {
    const ref = useRef();
    const tex = useMemo(() => layer.content ? new THREE.TextureLoader().load(layer.content) : null, [layer.content]);
    useFrame(() => applyTransform(ref, layer, audioData));
    const o = layer.opacity ?? 1;
    return (
        <mesh ref={ref} position={layer.position}>
            {layer.shape === 'circle' ? <circleGeometry args={[8, 64]} /> :
                layer.shape === 'triangle' ? <circleGeometry args={[8, 3, Math.PI / 2]} /> :
                    <planeGeometry args={[16, 9]} />}
            <meshBasicMaterial color={layer.color || '#fff'} wireframe={!layer.content} map={tex}
                transparent opacity={o} depthWrite={o >= 1} side={THREE.DoubleSide} />
        </mesh>
    );
}

// ─── Video ───────────────────────────────────────────────────────────────────
function VideoLayer({ layer, audioData }) {
    const ref = useRef();
    const [vid] = useState(() => {
        const v = document.createElement('video');
        v.crossOrigin = 'Anonymous'; v.loop = true; v.muted = true;
        if (layer.content) { v.src = layer.content; v.play(); }
        return v;
    });
    useEffect(() => { if (layer.content) { vid.src = layer.content; vid.play(); } }, [layer.content]);
    useFrame(() => applyTransform(ref, layer, audioData));
    return (
        <mesh ref={ref} position={layer.position}>
            {layer.shape === 'circle' ? <circleGeometry args={[16, 64]} /> :
                layer.shape === 'triangle' ? <circleGeometry args={[16, 3, Math.PI / 2]} /> :
                    <planeGeometry args={[32, 18]} />}
            <meshBasicMaterial toneMapped={false} transparent side={THREE.DoubleSide}>
                <videoTexture attach="map" args={[vid]} />
            </meshBasicMaterial>
        </mesh>
    );
}

// ─── Spectrum Circle ──────────────────────────────────────────────────────────
function SpectrumCircleLayer({ layer, audioData }) {
    const ref = useRef(); const matRef = useRef();
    const thickness = layer.thickness || 0.06;
    useFrame(() => {
        applyTransform(ref, layer, audioData);
        if (matRef.current) {
            matRef.current.color.set(layer.color || '#7b61ff').multiplyScalar(1 + (audioData.kick || 0) * 3);
        }
    });
    return (
        <mesh ref={ref} position={layer.position}>
            <torusGeometry args={[2, thickness, 16, 120]} />
            <meshBasicMaterial ref={matRef} color={layer.color || '#7b61ff'} toneMapped={false} transparent />
        </mesh>
    );
}

// ─── Text ────────────────────────────────────────────────────────────────────
function TextLayer({ layer, audioData }) {
    const ref = useRef();
    useFrame(() => applyTransform(ref, layer, audioData));
    return (
        <Text ref={ref} position={layer.position} fontSize={layer.fontSize || 2} color={layer.color || '#fff'} anchorX="center" anchorY="middle">
            {layer.content || 'VIBE'}
            <meshBasicMaterial color={layer.color || '#fff'} toneMapped={false} transparent />
        </Text>
    );
}

// ─── Particles (audio-synced OR free-mode) ───────────────────────────────────
function ParticleLayer({ layer, audioData }) {
    const count = layer.count || 600;
    const ref = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const pts = useMemo(() => {
        return Array.from({ length: count }, () => ({
            angle: Math.random() * Math.PI * 2,
            radius: 5 + Math.random() * 30,
            z: (Math.random() - 0.5) * 60,
            speed: 0.002 + Math.random() * 0.006,
            phase: Math.random() * Math.PI * 2,
            t: Math.random() * 100,
        }));
    }, [count]);

    useFrame((_, dt) => {
        if (!ref.current) return;
        const free = layer.freeMode?.enabled;
        const freeSpd = free ? (layer.freeMode?.speed || 1) : 1;
        const bass = free ? 0 : (audioData.bass || 0);
        const treble = free ? 0 : (audioData.treble || 0);
        const energy = free ? 0 : (audioData.energy || 0);
        const spdMul = freeSpd * (1 + bass * (layer.audioReactive?.speed?.amount || 3));
        const spdMul2 = 1 + energy * (layer.audioReactive?.spread?.amount || 1.5);
        const scl = 0.08 + treble * 0.3 + (free ? 0.12 : 0);

        pts.forEach((p, i) => {
            p.t += p.speed * spdMul * 60 * dt;
            const r = p.radius * (free ? 1 : spdMul2);
            dummy.position.set(
                Math.cos(p.angle + p.t * 0.1) * r + Math.sin(p.t + p.phase) * 0.8,
                Math.sin(p.angle + p.t * 0.1) * r + Math.sin(p.t + p.phase) * 0.8,
                p.z + Math.sin(p.t * 0.5) * 2
            );
            dummy.scale.setScalar(Math.max(0.01, scl * (0.5 + Math.sin(p.t) * 0.3)) * layer.scale);
            dummy.rotation.set(p.t, p.t * 0.7, p.t * 0.3);
            dummy.updateMatrix();
            ref.current.setMatrixAt(i, dummy.matrix);
        });
        ref.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={ref} args={[null, null, count]} position={layer.position || [0, 0, 0]}>
            <sphereGeometry args={[0.15, 6, 6]} />
            <meshBasicMaterial color={layer.color || '#fff'} toneMapped={false} transparent opacity={layer.opacity ?? 1} />
        </instancedMesh>
    );
}

// ─── Particle Rings (tunnel toward camera, freeMode support) ─────────────────
function ParticleRingsLayer({ layer, audioData }) {
    const ringN = layer.ringCount || 4;
    const perR = layer.perRing || 80;
    const count = ringN * perR;
    const ref = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const pts = useMemo(() => {
        const temp = [];
        for (let r = 0; r < ringN; r++) {
            const zOff = r * (60 / ringN) - 60;
            const rad = 1.5 + r * 0.8;
            for (let p = 0; p < perR; p++) {
                const angle = (p / perR) * Math.PI * 2;
                temp.push({ angle, radius: rad, z: zOff, baseZ: zOff });
            }
        }
        return temp;
    }, [ringN, perR]);

    useFrame((_, dt) => {
        if (!ref.current) return;
        const free = layer.freeMode?.enabled;
        const freeSpd = free ? (layer.freeMode?.speed || 1) : 1;
        const bass = free ? 0 : (audioData.bass || 0);
        const treble = free ? 0 : (audioData.treble || 0);
        const kick = free ? 0 : (audioData.kick || 0);
        const speed = freeSpd * (layer.speed || 1) * (1 + bass * 2);
        const radMod = 1 + kick * 0.4;

        pts.forEach((p, i) => {
            p.z += speed * dt * 20;
            if (p.z > 15) p.z = p.baseZ;
            const r = p.radius * (free ? 1 : radMod) * layer.scale;
            dummy.position.set(Math.cos(p.angle) * r, Math.sin(p.angle) * r, p.z);
            dummy.scale.setScalar(Math.max(0.02, 0.1 + treble * 0.15 + (free ? 0.08 : 0)));
            dummy.updateMatrix();
            ref.current.setMatrixAt(i, dummy.matrix);
        });
        ref.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={ref} args={[null, null, count]} position={layer.position || [0, 0, 0]}>
            <sphereGeometry args={[0.12, 6, 6]} />
            <meshBasicMaterial color={layer.color || '#00ffcc'} toneMapped={false} />
        </instancedMesh>
    );
}

// ─── Star Field ───────────────────────────────────────────────────────────────
function StarFieldLayer({ layer, audioData }) {
    const count = layer.count || 800;
    const ref = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const stars = useMemo(() => Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 40, z: Math.random() * -80
    })), [count]);

    useFrame((_, dt) => {
        if (!ref.current) return;
        const bass = audioData.bass || 0;
        const energy = audioData.energy || 0;
        const speed = (layer.speed || 1) * (1 + bass * 3) * dt * 15;
        stars.forEach((s, i) => {
            s.z += speed;
            if (s.z > 10) { s.x = (Math.random() - 0.5) * 80; s.y = (Math.random() - 0.5) * 40; s.z = -80; }
            dummy.position.set(s.x, s.y, s.z);
            dummy.scale.setScalar(Math.max(0.03, (0.05 + energy * 0.2) * layer.scale));
            dummy.updateMatrix();
            ref.current.setMatrixAt(i, dummy.matrix);
        });
        ref.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={ref} args={[null, null, count]} position={layer.position || [0, 0, 0]}>
            <sphereGeometry args={[0.1, 4, 4]} />
            <meshBasicMaterial color={layer.color || '#fff'} toneMapped={false} />
        </instancedMesh>
    );
}

// ─── Tunnel Shader ───────────────────────────────────────────────────────────
function TunnelLayer({ layer, audioData }) {
    const matRef = useRef();
    const shader = useMemo(() => ({
        uniforms: {
            uTime: { value: 0 }, uSpeed: { value: 1 },
            uColor: { value: new THREE.Color(layer.color || '#7b61ff') }, uEnergy: { value: 0 },
        },
        vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `
            varying vec2 vUv; uniform float uTime,uSpeed,uEnergy; uniform vec3 uColor;
            void main(){
                vec2 uv=vUv-0.5; float dist=length(uv); float angle=atan(uv.y,uv.x);
                float t=uTime*uSpeed;
                float rings=fract(dist*6.0-t);
                float a=step(0.4,rings)*step(rings,0.6);
                float lines=step(0.48,fract(angle/6.28318*12.0));
                float b=(a+lines*0.3)*(0.5+uEnergy*1.5);
                gl_FragColor=vec4(uColor*b,b*0.85);
            }`,
    }), [layer.color]);
    useFrame((_, dt) => {
        if (!matRef.current) return;
        matRef.current.uniforms.uTime.value += dt;
        matRef.current.uniforms.uSpeed.value = (layer.speed || 1) * (1 + (audioData.mid || 0) * 2);
        matRef.current.uniforms.uEnergy.value = audioData.energy || 0;
        matRef.current.uniforms.uColor.value.set(layer.color || '#7b61ff');
    });
    return (
        <mesh position={layer.position || [0, 0, -5]}>
            <planeGeometry args={[20, 12]} />
            <shaderMaterial ref={matRef} args={[shader]} transparent toneMapped={false} />
        </mesh>
    );
}

// ─── Kaleidoscope Shader ──────────────────────────────────────────────────────
function KaleidoscopeLayer({ layer, audioData }) {
    const matRef = useRef();
    const shader = useMemo(() => ({
        uniforms: {
            uTime: { value: 0 }, uSegments: { value: layer.segments || 6 },
            uColor: { value: new THREE.Color(layer.color || '#ff00ff') }, uTreble: { value: 0 },
        },
        vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `
            varying vec2 vUv; uniform float uTime,uSegments,uTreble; uniform vec3 uColor;
            #define PI 3.14159265359
            void main(){
                vec2 uv=vUv-0.5; float angle=atan(uv.y,uv.x); float dist=length(uv);
                float seg=PI*2.0/uSegments; angle=mod(angle,seg); if(angle>seg*0.5) angle=seg-angle;
                vec2 p=vec2(cos(angle),sin(angle))*dist;
                float pat=sin(p.x*8.0+uTime)*cos(p.y*8.0-uTime*0.7);
                float br=abs(pat)*(0.6+uTreble*0.6);
                vec3 col=uColor*br+vec3(uTreble*0.3,0.1,uTreble*0.5);
                gl_FragColor=vec4(col,br*0.9);
            }`,
    }), [layer.color, layer.segments]);
    useFrame((_, dt) => {
        if (!matRef.current) return;
        matRef.current.uniforms.uTime.value += dt * (layer.speed || 1);
        matRef.current.uniforms.uTreble.value = audioData.treble || 0;
        matRef.current.uniforms.uSegments.value = layer.segments || 6;
        matRef.current.uniforms.uColor.value.set(layer.color || '#ff00ff');
    });
    return (
        <mesh position={layer.position || [0, 0, -2]}>
            <planeGeometry args={[20, 12]} />
            <shaderMaterial ref={matRef} args={[shader]} transparent toneMapped={false} />
        </mesh>
    );
}

// ─── Laser ────────────────────────────────────────────────────────────────────
function LaserLayer({ layer, audioData }) {
    const grpRef = useRef();
    const n = layer.laserCount || 8;
    const indices = useMemo(() => Array.from({ length: n }, (_, i) => i), [n]);
    useFrame((state) => {
        if (!grpRef.current) return;
        const kick = audioData.kick || 0, bass = audioData.bass || 0;
        grpRef.current.children.forEach((line, i) => {
            const angle = (i / n) * Math.PI * 2 + state.clock.elapsedTime * 0.3 + kick * 0.5;
            const len = (3 + bass * 6) * layer.scale;
            line.geometry.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(angle) * len, Math.sin(angle) * len, 0)]);
        });
    });
    return (
        <group ref={grpRef} position={layer.position || [0, 0, 1]}>
            {indices.map(i => (
                <line key={i}><bufferGeometry /><lineBasicMaterial color={layer.color || '#ff0066'} toneMapped={false} /></line>
            ))}
        </group>
    );
}

// ─── Waveform Bars ────────────────────────────────────────────────────────────
function WaveformLayer({ layer, audioData }) {
    const ref = useRef();
    const count = 64;
    const dummy = useMemo(() => new THREE.Object3D(), []);
    useFrame(() => {
        if (!ref.current) return;
        const raw = audioData.raw, step = Math.floor(raw.length / count);
        for (let i = 0; i < count; i++) {
            const v = raw[i * step] / 255, h = v * 6 * layer.scale;
            dummy.position.set((i / count) * 16 - 8, h / 2, 0);
            dummy.scale.set(0.18, Math.max(0.05, h), 0.1);
            dummy.updateMatrix();
            ref.current.setMatrixAt(i, dummy.matrix);
        }
        ref.current.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[null, null, count]} position={layer.position}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={layer.color || '#fff'} toneMapped={false} />
        </instancedMesh>
    );
}

// ─── Glitch ───────────────────────────────────────────────────────────────────
function GlitchLayer({ layer, audioData }) {
    const ref = useRef(), matRef = useRef();
    const [tex] = useState(() => layer.content ? new THREE.TextureLoader().load(layer.content) : null);
    const shader = useMemo(() => ({
        uniforms: {
            uTexture: { value: tex }, uTime: { value: 0 }, uIntensity: { value: 0 },
            uColor: { value: new THREE.Color(layer.color || '#fff') },
        },
        vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader: `
            varying vec2 vUv; uniform sampler2D uTexture; uniform float uTime,uIntensity; uniform vec3 uColor;
            void main(){
                vec2 uv=vUv;
                if(uIntensity>0.1){ uv.x+=uIntensity*0.05*sin(uTime*20.0+uv.y*30.0); }
                vec4 c=vec4(uColor,0.5);
                if(uIntensity>0.3){
                    c.r=texture2D(uTexture,uv+vec2(0.01*uIntensity,0.0)).r;
                    c.b=texture2D(uTexture,uv-vec2(0.01*uIntensity,0.0)).b;
                }
                gl_FragColor=c;
            }`,
    }), [tex, layer.color]);
    useFrame((state) => {
        applyTransform(ref, layer, audioData);
        if (matRef.current) {
            matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
            matRef.current.uniforms.uIntensity.value = (audioData.kick || 0) * (layer.audioReactive?.glitch?.amount || 1);
            matRef.current.uniforms.uColor.value.set(layer.color || '#fff');
        }
    });
    return (
        <mesh ref={ref} position={layer.position}>
            <planeGeometry args={[16, 9]} />
            <shaderMaterial ref={matRef} args={[shader]} transparent toneMapped={false} />
        </mesh>
    );
}

// ─── Spectrum Mountain / Ridge (line, mirror, circle, arc, s-curve) ───────────
function SpectrumMountainLayer({ layer, audioData }) {
    const lineRef = useRef();
    const mirrorRef = useRef();
    const POINTS = 128;
    const shape = layer.shape || 'line';
    const colorObj = useMemo(() => new THREE.Color(layer.color || '#7b61ff'), [layer.color]);

    const buildPts = useCallback((raw, flip) => {
        const pts = [];
        const step = Math.floor(raw.length / POINTS);
        const sc = layer.scale || 1;
        const amp = (layer.amplitude || 4) * sc;
        for (let i = 0; i < POINTS; i++) {
            const t = i / (POINTS - 1);
            const v = (raw[i * step] || 0) / 255;
            let x = 0, y = 0;
            if (shape === 'circle') {
                const a = t * Math.PI * 2, r = 3 * sc, push = v * amp * 0.5;
                x = Math.cos(a) * (r + push); y = Math.sin(a) * (r + push);
            } else if (shape === 'arc') {
                const a = t * Math.PI - Math.PI / 2, r = 5 * sc, push = (flip ? -1 : 1) * v * amp * 0.5;
                x = Math.cos(a) * (r + push); y = Math.sin(a) * (r + push);
            } else if (shape === 's-curve') {
                x = (t - 0.5) * 14 * sc;
                y = (flip ? -1 : 1) * v * amp + Math.sin(t * Math.PI * 2) * 2 * sc;
            } else {
                x = (t - 0.5) * 16 * sc;
                y = (flip ? -1 : 1) * v * amp;
            }
            pts.push(new THREE.Vector3(x, y, 0));
        }
        return pts;
    }, [shape, layer.scale, layer.amplitude]);

    useFrame(() => {
        const raw = audioData.raw;
        if (!raw || !lineRef.current) return;
        const pts = buildPts(raw, false);
        const pos = lineRef.current.geometry.attributes.position;
        pts.forEach((p, i) => pos.setXYZ(i, p.x, p.y, p.z));
        pos.needsUpdate = true;
        if (mirrorRef.current && (shape === 'mirror' || shape === 's-curve' || shape === 'arc')) {
            const mpts = buildPts(raw, true);
            const mpos = mirrorRef.current.geometry.attributes.position;
            mpts.forEach((p, i) => mpos.setXYZ(i, p.x, p.y, p.z));
            mpos.needsUpdate = true;
        }
    });

    const blank = useMemo(() => new Float32Array(POINTS * 3), []);

    return (
        <group position={layer.position || [0, 0, 2]}>
            <line ref={lineRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={POINTS} array={blank.slice()} itemSize={3} />
                </bufferGeometry>
                <lineBasicMaterial color={colorObj} toneMapped={false} />
            </line>
            {(shape === 'mirror' || shape === 's-curve' || shape === 'arc') && (
                <line ref={mirrorRef}>
                    <bufferGeometry>
                        <bufferAttribute attach="attributes-position" count={POINTS} array={blank.slice()} itemSize={3} />
                    </bufferGeometry>
                    <lineBasicMaterial color={colorObj} toneMapped={false} />
                </line>
            )}
        </group>
    );
}

// ─── Scene Manager ────────────────────────────────────────────────────────────
function SceneManager() {
    const layers = useStore(s => s.layers);
    const curTime = useStore(s => s.currentTime);

    useFrame(() => {
        engine.update();
        useStore.getState().setCurrentTime(engine.audio.currentTime);
    });

    const emptyAudio = { bass: 0, mid: 0, treble: 0, kick: 0, energy: 0, raw: new Uint8Array(0), fullSpectrum: new Float32Array(0) };

    return (
        <>
            <ambientLight intensity={0.3} />
            {layers.map((layer, idx) => {
                if (layer.visible === false) return null;
                const start = layer.startTime || 0, end = start + (layer.duration || 9999);
                if (curTime < start || curTime > end) return null;
                // Use audio data only if audioFollow is not explicitly false
                const ad = (layer.audioFollow !== false) ? engine.audioData : emptyAudio;
                const layerNoPos = { ...layer, position: [0, 0, 0] };
                const el = (() => {
                    switch (layer.type) {
                        case 'image':
                        case 'Background': return <ImageLayer layer={layerNoPos} audioData={ad} />;
                        case 'video': return <VideoLayer layer={layerNoPos} audioData={ad} />;
                        case 'spectrum-circle': return <SpectrumCircleLayer layer={layerNoPos} audioData={ad} />;
                        case 'waveform': return <WaveformLayer layer={layerNoPos} audioData={ad} />;
                        case 'text': return <TextLayer layer={layerNoPos} audioData={ad} />;
                        case 'particles': return <ParticleLayer layer={layerNoPos} audioData={ad} />;
                        case 'particle-rings': return <ParticleRingsLayer layer={layerNoPos} audioData={ad} />;
                        case 'starfield': return <StarFieldLayer layer={layerNoPos} audioData={ad} />;
                        case 'tunnel': return <TunnelLayer layer={layerNoPos} audioData={ad} />;
                        case 'kaleidoscope': return <KaleidoscopeLayer layer={layerNoPos} audioData={ad} />;
                        case 'laser': return <LaserLayer layer={layerNoPos} audioData={ad} />;
                        case 'glitch': return <GlitchLayer layer={layerNoPos} audioData={ad} />;
                        case 'spectrum-mountain': return <SpectrumMountainLayer layer={layerNoPos} audioData={ad} />;
                        case 'composition':
                        case 'group': return <group />;
                        default: return null;
                    }
                })();
                if (!el) return null;

                const isSelected = useStore.getState().selectedLayerId === layer.id;
                let content = el;

                if (isSelected && layer.type !== 'Background' && layer.type !== 'composition' && layer.type !== 'group') {
                    content = (
                        <TransformControls
                            mode="translate"
                            onMouseUp={(e) => {
                                if (e.target.object) {
                                    // TransformControls moves the inner object. 
                                    // Since the OUTER group also has layer.position, we need to add the delta.
                                    // BUT e.target.object.position represents the delta from the parent group.
                                    const delta = e.target.object.position.clone();
                                    const currentPos = layer.position || [0, 0, 0];
                                    const newPos = [
                                        Math.max(-50, Math.min(50, currentPos[0] + delta.x)),
                                        Math.max(-50, Math.min(50, currentPos[1] + delta.y)),
                                        Math.max(-100, Math.min(9.5, currentPos[2] + delta.z))
                                    ];

                                    // Reset the inner object's local position to zero so it doesn't double-apply!
                                    e.target.object.position.set(0, 0, 0);

                                    useStore.getState().updateLayer(layer.id, { position: newPos });
                                }
                            }}
                        >
                            <group
                                onWheel={(e) => {
                                    e.stopPropagation();
                                    const delta = e.deltaY > 0 ? -0.5 : 0.5;
                                    const currentPos = layer.position || [0, 0, 0];
                                    const newZ = Math.max(-100, Math.min(9.5, currentPos[2] + delta));
                                    useStore.getState().updateLayer(layer.id, { position: [currentPos[0], currentPos[1], newZ] });
                                }}
                            >
                                {el}
                            </group>
                        </TransformControls>
                    );
                }

                // Force layout orders: Background is ALWAYS at the absolute back (0)
                // Rest of layers are inverted if invertZ is true.
                const isBg = layer.type === 'Background';
                const baseRenderOrder = isBg ? 0 : (useStore.getState().invertZ ? (layers.length - idx) : idx + 1);

                return <group key={layer.id} renderOrder={baseRenderOrder} position={layer.position || [0, 0, 0]}>{content}</group>;
            })}

        </>
    );
}

// ─── Post Processing ──────────────────────────────────────────────────────────
function PostProcessing() {
    const effects = useStore(s => s.effects);
    const bloomRef = useRef(0);

    useFrame(() => {
        const bloom = effects.bloom;
        const target = bloom?.enabled && bloom?.audioReactive
            ? (bloom.intensity || 1.5) + (engine.audioData.bass || 0) * 4
            : (bloom?.intensity || 0);
        bloomRef.current = THREE.MathUtils.lerp(bloomRef.current, target, 0.15);
    });

    const ca = effects.chromaticAberration;
    const caOffset = useMemo(() => new THREE.Vector2(ca?.offsetX ?? 0.002, ca?.offsetY ?? 0.002), [ca?.offsetX, ca?.offsetY]);

    return (
        <EffectComposer disableNormalPass>
            {effects.bloom?.enabled && (
                <Bloom luminanceThreshold={effects.bloom.luminanceThreshold ?? 0.2} intensity={bloomRef.current} levels={9} mipmapBlur />
            )}
            {ca?.enabled && <ChromaticAberration offset={caOffset} blendFunction={BlendFunction.NORMAL} />}
            {effects.noise?.enabled && <Noise opacity={effects.noise.opacity ?? 0.05} />}
            {effects.vignette?.enabled && (
                <Vignette eskil={false} offset={effects.vignette.offset ?? 0.3} darkness={effects.vignette.darkness ?? 0.5} />
            )}
        </EffectComposer>
    );
}

// ─── Exported Canvas ──────────────────────────────────────────────────────────
export default function VisualizerCanvas() {
    return (
        <div className="w-full h-full absolute inset-0" style={{ pointerEvents: 'none' }}>
            <Canvas camera={{ position: [0, 0, 10], fov: 50 }} gl={{ preserveDrawingBuffer: true, antialias: false, alpha: true }} style={{ pointerEvents: 'auto' }}>
                <SceneManager />
                <PostProcessing />
            </Canvas>
        </div>
    );
}
