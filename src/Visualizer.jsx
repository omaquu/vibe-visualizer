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

const applyAudioTransform = (ref, layer, audioData) => {
    if (!ref.current) return;
    
    // Scale
    let s = layer.scale;
    s += getAudioValue(layer, audioData, 'scale');
    ref.current.scale.lerp(new THREE.Vector3(s, s, layer.type === 'image' || layer.type === 'video' ? 1 : s), 0.2);

    // Rotation
    let r = getAudioValue(layer, audioData, 'rotation');
    if (r !== 0) {
        ref.current.rotation.z += r * 0.1;
    }

    // Opacity (if material exists)
    if (ref.current.material) {
        let o = layer.opacity !== undefined ? layer.opacity : 1;
        o += getAudioValue(layer, audioData, 'opacity');
        ref.current.material.opacity = THREE.MathUtils.clamp(o, 0, 1);
        ref.current.material.transparent = ref.current.material.opacity < 1;
    }
};

// --- Layer Components ---

function ImageLayer({ layer, audioData }) {
    const meshRef = useRef();

    useFrame(() => {
        applyAudioTransform(meshRef, layer, audioData);
    });

    return (
        <mesh ref={meshRef} position={layer.position}>
            <planeGeometry args={[16, 9]} />
            <meshBasicMaterial color={layer.color || "#ffffff"} wireframe={!layer.content} map={layer.content ? new THREE.TextureLoader().load(layer.content) : null} transparent />
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
        applyAudioTransform(meshRef, layer, audioData);
    });

    return (
        <mesh ref={meshRef} position={layer.position}>
            <planeGeometry args={[16 * 2, 9 * 2]} />
            <meshBasicMaterial toneMapped={false} transparent>
                <videoTexture attach="map" args={[video]} />
            </meshBasicMaterial>
        </mesh>
    );
}

function SpectrumCircleLayer({ layer, audioData }) {
    const meshRef = useRef();
    const materialRef = useRef();

    useFrame(() => {
        applyAudioTransform(meshRef, layer, audioData);

        if (materialRef.current) {
            const glow = 1 + (engine.audioData.kick || 0) * 2;
            const baseColor = new THREE.Color(layer.color || '#7b61ff');
            materialRef.current.color.copy(baseColor).multiplyScalar(glow);
        }
    });

    return (
        <mesh ref={meshRef} position={layer.position}>
            <torusGeometry args={[2, 0.05, 16, 100]} />
            <meshBasicMaterial ref={materialRef} color={layer.color || '#7b61ff'} toneMapped={false} transparent />
        </mesh>
    );
}

function TextLayer({ layer, audioData }) {
    const meshRef = useRef();

    useFrame(() => {
        applyAudioTransform(meshRef, layer, audioData);
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
            <meshBasicMaterial color={layer.color || '#ffffff'} toneMapped={false} transparent />
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

function WaveformLayer({ layer, audioData }) {
    const meshRef = useRef();
    const count = 64;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame(() => {
        if (!meshRef.current) return;
        const raw = audioData.raw;
        const step = Math.floor(raw.length / count);

        for (let i = 0; i < count; i++) {
            const val = raw[i * step] / 255;
            const h = val * 5 * layer.scale;
            
            // X position: spread from -8 to 8
            const x = (i / count) * 16 - 8;
            dummy.position.set(x, 0, 0);
            dummy.scale.set(0.1, h + 0.1, 0.1);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]} position={layer.position}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={layer.color || '#fff'} toneMapped={false} />
        </instancedMesh>
    );
}

function GlitchLayer({ layer, audioData }) {
    const meshRef = useRef();
    const materialRef = useRef();
    const [texture] = useState(() => layer.content ? new THREE.TextureLoader().load(layer.content) : null);

    useFrame((state) => {
        applyAudioTransform(meshRef, layer, audioData);
        if (materialRef.current) {
            const kick = audioData.kick || 0;
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
            materialRef.current.uniforms.uIntensity.value = kick * (layer.audioReactive?.glitch?.amount || 1.0);
        }
    });

    const GlitchMaterial = {
        uniforms: {
            uTexture: { value: texture },
            uTime: { value: 0 },
            uIntensity: { value: 0 },
            uColor: { value: new THREE.Color(layer.color || '#ffffff') }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            uniform sampler2D uTexture;
            uniform float uTime;
            uniform float uIntensity;
            uniform vec3 uColor;

            void main() {
                vec2 uv = vUv;
                if (uIntensity > 0.1) {
                    float shift = uIntensity * 0.05 * sin(uTime * 20.0);
                    uv.x += shift * Math.sin(uv.y * 10.0);
                }
                
                vec4 tex = texture2D(uTexture, uv);
                if (uIntensity > 0.5) {
                    tex.r = texture2D(uTexture, uv + vec2(0.01 * uIntensity, 0.0)).r;
                    tex.b = texture2D(uTexture, uv - vec2(0.01 * uIntensity, 0.0)).b;
                }
                
                gl_FragColor = tex * vec4(uColor, 1.0);
            }
        `
    };

    return (
        <mesh ref={meshRef} position={layer.position}>
            <planeGeometry args={[16, 9]} />
            <shaderMaterial
                ref={materialRef}
                args={[GlitchMaterial]}
                transparent
                toneMapped={false}
            />
        </mesh>
    );
}

// --- Main Audio/Render Loop ---

function SceneManager() {
    const layers = useStore((state) => state.layers);
    const currentTime = useStore((state) => state.currentTime);

    useFrame(() => {
        engine.update();
        // Update store currentTime from engine
        useStore.getState().setCurrentTime(engine.audio.currentTime);
    });

    return (
        <>
            <ambientLight intensity={0.5} />

            {layers.map(layer => {
                // Time-based visibility check
                if (currentTime < (layer.startTime || 0) || currentTime > (layer.startTime || 0) + (layer.duration || 9999)) {
                    return null;
                }

                if (layer.type === 'image' || layer.type === 'Background') {
                    return <ImageLayer key={layer.id} layer={layer} audioData={engine.audioData} />;
                }
                if (layer.type === 'video') {
                    return <VideoLayer key={layer.id} layer={layer} audioData={engine.audioData} />;
                }
                if (layer.type === 'spectrum-circle') {
                    return <SpectrumCircleLayer key={layer.id} layer={layer} audioData={engine.audioData} />;
                }
                if (layer.type === 'waveform') {
                    return <WaveformLayer key={layer.id} layer={layer} audioData={engine.audioData} />;
                }
                if (layer.type === 'text') {
                    return <TextLayer key={layer.id} layer={layer} audioData={engine.audioData} />;
                }
                if (layer.type === 'particles') {
                    return <ParticleLayer key={layer.id} layer={layer} audioData={engine.audioData} />;
                }
                if (layer.type === 'glitch') {
                    return <GlitchLayer key={layer.id} layer={layer} audioData={engine.audioData} />;
                }
                return null;
            })}
        </>
    );
}

function PostProcessing() {
    const effects = useStore((state) => state.effects);
    const [bloomIntensity, setBloomIntensity] = useState(0);

    useFrame(() => {
        if (effects.bloom?.enabled && effects.bloom.audioReactive) {
            const bass = engine.audioData.bass || 0;
            const target = effects.bloom.intensity + (bass * 3);
            setBloomIntensity(THREE.MathUtils.lerp(bloomIntensity, target, 0.2));
        } else {
            setBloomIntensity(effects.bloom?.intensity || 0);
        }
    });

    return (
        <EffectComposer disableNormalPass>
            {effects.bloom?.enabled && (
                <Bloom
                    luminanceThreshold={effects.bloom.luminanceThreshold}
                    intensity={bloomIntensity}
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
