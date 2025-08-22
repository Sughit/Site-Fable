// src/components/FableCanvas.js
import React, { useRef, useState, useCallback, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Import models from src/assets
import blockA from '../assets/cube.glb'
import blockB from '../assets/cone.glb'

const assets = [
  { name: 'Cube', url: blockA },
  { name: 'Cone', url: blockB },
]

// === SCENE MODELS ===
function BlockModel({ url, ...props }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene.clone()} {...props} />
}

function GhostModel({ url, position }) {
  const { scene } = useGLTF(url)
  const ghost = useMemo(() => scene.clone(true), [scene])
  useEffect(() => {
    ghost.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone()
        o.material.transparent = true
        o.material.opacity = 0.5
        o.material.depthWrite = false
      }
    })
  }, [ghost])
  return <primitive object={ghost} position={position} />
}

// === PALETTE (text, draggable) ===
function DraggableAsset({ asset }) {
  const onDragStart = e => {
    e.dataTransfer.setData('model-url', asset.url)
  }
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="m-2 p-2 border border-gray-300 rounded cursor-grab bg-white hover:bg-gray-50"
      title={asset.name}
    >
      {asset.name}
    </div>
  )
}

// === CAMERA LIMITS ===
function BoundCamera({ bounds }) {
  const { camera } = useThree()
  useFrame(() => {
    const half = bounds / 2
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -half + 1, half - 1)
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, 1, bounds - 1)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -half + 1, half - 1)
  })
  return null
}

// WASD + Z (up) / X (down). A = add(right), D = sub(right)
function CameraMovement({ speed = 5 }) {
  const { camera } = useThree()
  const keys = useRef({})

  useEffect(() => {
    const onKeyDown = e => { keys.current[e.code] = true }
    const onKeyUp = e => { keys.current[e.code] = false }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useFrame((_, delta) => {
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    // right vector — folosesc forward x up (cum am discutat),
    // și aplic A=add(right), D=sub(right)
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()

    const moveVec = new THREE.Vector3()
    if (keys.current.KeyW) moveVec.add(forward)
    if (keys.current.KeyS) moveVec.sub(forward)
    if (keys.current.KeyA) moveVec.sub(right) 
    if (keys.current.KeyD) moveVec.add(right) 
    if (keys.current.KeyZ) moveVec.y += 1
    if (keys.current.KeyX) moveVec.y -= 1

    if (moveVec.lengthSq() > 0) {
      moveVec.normalize().multiplyScalar(speed * delta)
      camera.position.add(moveVec)
    }
  })
  return null
}

export default function FableCanvas() {
  const [blocks, setBlocks] = useState([])
  const [context, setContext] = useState({ camera: null, gl: null })
  const [preview, setPreview] = useState(null) // { url, position: [x,0,z] }
  const raycaster = useRef(new THREE.Raycaster())

  const CUBE_SIZE = 20
  const HALF = CUBE_SIZE / 2
  const GRID_PRIMARY = '#888'
  const GRID_SECONDARY = '#444'
  const WALL_MARGIN = 0.25

  const clampInside = (x, z) => {
    const min = -HALF + WALL_MARGIN
    const max = HALF - WALL_MARGIN
    return {
      x: THREE.MathUtils.clamp(x, min, max),
      z: THREE.MathUtils.clamp(z, min, max),
    }
  }

  const projectToFloor = useCallback((clientX, clientY) => {
    const { camera, gl } = context
    if (!camera || !gl) return null
    const rect = gl.domElement.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 2 - 1
    const y = -((clientY - rect.top) / rect.height) * 2 + 1
    raycaster.current.setFromCamera({ x, y }, camera)
    const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hit = new THREE.Vector3()
    if (!raycaster.current.ray.intersectPlane(floor, hit)) return null
    const { x: cx, z: cz } = clampInside(hit.x, hit.z)
    return [cx, 0, cz]
  }, [context])

  // === DnD handlers pentru ghost + drop ===
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const url = e.dataTransfer.getData('model-url')
    if (!url) return
    const pos = projectToFloor(e.clientX, e.clientY) || [0, 0, 0]
    setBlocks(curr => [...curr, { url, position: pos }])
    setPreview(null)
  }, [projectToFloor])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    const url = e.dataTransfer.getData('model-url')
    if (!url) return
    const pos = projectToFloor(e.clientX, e.clientY)
    if (pos) setPreview({ url, position: pos })
  }, [projectToFloor])

  const handleDragEnter = useCallback((e) => {
    const url = e.dataTransfer.getData('model-url')
    if (!url) return
    const pos = projectToFloor(e.clientX, e.clientY) || [0, 0, 0]
    setPreview({ url, position: pos })
  }, [projectToFloor])

  const handleDragLeave = useCallback(() => {
    setPreview(null)
  }, [])

  return (
    <div className="flex flex-col h-screen">
      {/* Asset menu (text) */}
      <div className="flex p-2 bg-gray-100 overflow-x-auto">
        {assets.map(asset => (
          <DraggableAsset key={asset.url} asset={asset} />
        ))}
      </div>

      {/* Canvas area */}
      <div
        className="flex-1 relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onContextMenu={e => {
          e.preventDefault()
          if (document.exitPointerLock) document.exitPointerLock()
        }}
      >
        <Canvas
          className="w-full h-full"
          camera={{ position: [0, 5, 10], fov: 50 }}
          onCreated={({ camera, gl }) => setContext({ camera, gl })}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} />

          {/* Grids */}
          <gridHelper args={[CUBE_SIZE, CUBE_SIZE, GRID_PRIMARY, GRID_SECONDARY]} />
          <gridHelper args={[CUBE_SIZE, CUBE_SIZE, GRID_PRIMARY, GRID_SECONDARY]} rotation={[Math.PI / 2, 0, 0]} position={[0, HALF, -HALF]} />
          <gridHelper args={[CUBE_SIZE, CUBE_SIZE, GRID_PRIMARY, GRID_SECONDARY]} rotation={[0, 0, Math.PI / 2]} position={[-HALF, HALF, 0]} />
          <gridHelper args={[CUBE_SIZE, CUBE_SIZE, GRID_PRIMARY, GRID_SECONDARY]} rotation={[0, 0, -Math.PI / 2]} position={[HALF, HALF, 0]} />
          <gridHelper args={[CUBE_SIZE, CUBE_SIZE, GRID_PRIMARY, GRID_SECONDARY]} rotation={[-Math.PI / 2, 0, 0]} position={[0, HALF, HALF]} />

          {/* Boundary vizual */}
          <mesh position={[0, HALF, 0]}>
            <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
            <meshBasicMaterial wireframe transparent opacity={0.2} />
          </mesh>

          {/* Controls + camera */}
          <PointerLockControls />
          <CameraMovement />
          <BoundCamera bounds={CUBE_SIZE} />

          {/* Ghost + blocuri */}
          <Suspense fallback={null}>
            {preview && <GhostModel url={preview.url} position={preview.position} />}
            {blocks.map((b, i) => (
              <BlockModel key={i} url={b.url} position={b.position} />
            ))}
          </Suspense>
        </Canvas>
      </div>
    </div>
  )
}
