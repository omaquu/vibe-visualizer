import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { Text } from '@react-three/drei';
import { useStore } from './store';
import { engine } from './audioEngine';
import * as THREE from 'three';

// --- Utility ---
const getAudioValue = (layer, audioData, prop = 'scale') => {
    if (layer.audioReactive?.[prop]?.enabled) {
        const source = layer.audioReactive[prop].source;
        const amount = layer.audioReactive[prop].amount;
        return (audioData[source] || 0) * amount;
    }
    return 0;
};

// --- Layer Components ---

function ImageLayer({ layer, audioData }) {
    const meshRef = useRef();

    useFrame(() => {
        if (!meshRef.current) return;
        let s = layer.scale;
        s += getAudioValue(layer, audioData, 'scale');
        meshRef.current.scale.lerp(new THREE.Vector3(s, s, 1), 0.2);
    });

    return (
        <mesh ref={meshRef} position={layer.position}>
            <planeGeometry args={[16, 9]} />
            <meshBasicMaterial color="#333" wireframe={!layer.content} />
        </mesh>
    );
}

function VideoLayer({ layer, audioData }) {
    const meshRef = useRef();
    const [video] = useState(() => {
        const vid = document.createElement("video");
        vid.src = layer.content || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4";
        vid.crossOrigin = "Anonymous";
        vid.loop = true;
        vid.muted = true;
        vid.play();
        return vid;
    });

    useFrame(() => {
        if (!meshRef.current) return;
        let s = layer.scale;
        s += getAudioValue(layer, audioData, 'scale');
        meshRef.current.scale.lerp(new THREE.Vector3(s, s, 1), 0.2);
    });

    return (
        <mesh ref={meshRef} position={layer.position}>
            <planeGeometry args={[16 * 2, 9 * 2]} />
            <meshBasicMaterial toneMapped={false}>
                <videoTexture attach="map" args={[video]} />
            </meshBasicMaterial>
        </mesh>
    );
}

function SpectrumCircleLayer({ layer, audioData }) {
    const meshRef = useRef();
    const materialRef = useRef();

    useFrame(() => {
        if (!meshRef.current) return;

        let s = layer.scale;
        s += getAudioValue(layer, audioData, 'scale') * 2;
        meshRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.3);

        if (materialRef.current) {
            const glow = 1 + (engine.audioData.kick || 0) * 2;
            const baseColor = new THREE.Color(layer.color || '#7b61ff');
            materialRef.current.color.copy(baseColor).multiplyScalar(glow);
        }
    });

    return (
        <mesh ref={meshRef} position={layer.position}>
            <torusGeometry args={[2, 0.05, 16, 100]} />
            <meshBasicMaterial ref={materialRef} color={layer.color || '#7b61ff'} toneMapped={false} />
        </mesh>
    );
}

function TextLayer({ layer, audioData }) {
    const meshRef = useRef();

    useFrame(() => {
        if (!meshRef.current) return;
        let s = layer.scale;
        s += getAudioValue(layer, audioData, 'scale');
        meshRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.2);
    });

    return (
        <Text
            ref={meshRef}
            position={layer.position}
            fontSize={2}
            color={layer.color || '#ffffff'}
            anchorX="center"
            anchorY="middle"
        >
            {layer.content || 'Neon'}
            <meshBasicMaterial color={layer.color || '#ffffff'} toneMapped={false} />
        </Text>
    );
}

function ParticleLayer({ layer, audioData }) {
    const count = 500;
    const meshRef = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 10 + Math.random() * 100;
            const speed = 0.005 + Math.random() / 200;
            const xFactor = -50 + Math.random() * 100;
            const yFactor = -50 + Math.random() * 100;
            const zFactor = -50 + Math.random() * 100;
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
        }
        return temp;
    }, [count]);

    useFrame(() => {
        if (!meshRef.current) return;
        const bass = audioData.bass || 0;

        particles.forEach((particle, i) => {
            let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
            t = particle.t += speed / 2 + (bass * 0.05);
            const a = Math.cos(t) + Math.sin(t * 1) / 10;
            const b = Math.sin(t) + Math.cos(t * 2) / 10;
            const s = Math.cos(t);

            const spread = 1 + bass * 0.5;

            dummy.position.set(
                (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10 * spread,
                (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10 * spread,
                (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10 * spread
            );

            const pScale = (s * 0.1) * (1 + bass * 2) * layer.scale;
            dummy.scale.set(pScale, pScale, pScale);
            dummy.rotation.set(s * 5, s * 5, s * 5);
            dummy.updateMatrix();

            meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]} position={layer.position || [0, 0, -15]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color={layer.color || '#fff'} toneMapped={false} />
        </instancedMesh>
    );
}

// --- Main Audio/Render Loop ---

function SceneManager() {
    const layers = useStore((state) => state.layers);

    useFrame(() => {
        engine.update();
    });

    return (
        <>
            <ambientLight intensity={0.5} />

            {layers.map(layer => {
                if (layer.type === 'image' || layer.type === 'Background') {
                    return <ImageLayer key={layer.id} layer={layer} audioData={engine.audioData} />;
                }
                if (layer.type === 'video') {
                    return <VideoLayer key={layer.id} layer={layer} audioData={engine.audioData} />;
                }
                if (layer.type === 'spectrum-circle') {
                    return <SpectrumCircleLayer key={layer.id} layer={layer} audioData={engine.audioData} />;
                }
                if (layer.type === 'text') {
                    return <TextLayer key={layer.id} layer={layer} audioData={engine.audioData} />;
                }
                if (layer.type === 'particles') {
                    return <ParticleLayer key={layer.id} layer={layer} audioData={engine.audioData} />;
                }
                return null;
            })}
        </>
    );
}

function PostProcessing() {
    const effects = useStore((state) => state.effects);

    return (
        <EffectComposer disableNormalPass>
            {effects.bloom?.enabled && (
                <Bloom
                    luminanceThreshold={effects.bloom.luminanceThreshold}
                    intensity={effects.bloom.intensity}
                    levels={9}
                    mipmapBlur
                />
            )}
            {effects.chromaticAberration?.enabled && (
                <ChromaticAberration offset={effects.chromaticAberration.offset} />
            )}
            {effects.noise?.enabled && (
                <Noise opacity={effects.noise.opacity} />
            )}
            {effects.vignette?.enabled && (
                <Vignette eskil={false} offset={effects.vignette.offset} darkness={effects.vignette.darkness} />
            )}
        </EffectComposer>
    );
}

export default function VisualizerCanvas() {
    return (
        <div className="w-full h-full absolute inset-0 -z-10" style={{ pointerEvents: 'none' }}>
            <Canvas
                camera={{ position: [0, 0, 10], fov: 50 }}
                gl={{ preserveDrawingBuffer: true, antialias: false, alpha: true }}
                style={{ pointerEvents: 'auto' }}
            >
                <SceneManager />
                <PostProcessing />
            </Canvas>
        </div>
    );
}
