import React, { useRef, useState, useCallback, useEffect } from 'react'
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

function BlockModel({ url, ...props }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene.clone()} {...props} />
}

function DraggableAsset({ asset }) {
  const onDragStart = e => {
    e.dataTransfer.setData('model-url', asset.url)
  }
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="m-2 p-2 border border-gray-300 rounded cursor-grab bg-white hover:bg-gray-50"
    >
      {asset.name}
    </div>
  )
}

// Restrict camera within cube
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

// Handle WASD movement
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

    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()

    const moveVec = new THREE.Vector3()
    // Horizontal movement
    if (keys.current.KeyW) moveVec.add(forward)
    if (keys.current.KeyS) moveVec.sub(forward)
    if (keys.current.KeyA) moveVec.sub(right)
    if (keys.current.KeyD) moveVec.add(right)
    // Vertical movement: Shift up, Ctrl down
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
  const raycaster = useRef(new THREE.Raycaster())

  const handleDrop = useCallback(
    e => {
      e.preventDefault()
      const url = e.dataTransfer.getData('model-url')
      const { camera, gl } = context
      if (!camera || !gl) return

      const { clientX, clientY } = e
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((clientX - rect.left) / rect.width) * 2 - 1
      const y = -((clientY - rect.top) / rect.height) * 2 + 1

      raycaster.current.setFromCamera({ x, y }, camera)
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const intersect = new THREE.Vector3()
      raycaster.current.ray.intersectPlane(plane, intersect)

      setBlocks(curr => [...curr, { url, position: [intersect.x, intersect.y, intersect.z] }])
    },
    [context]
  )

  const handleDragOver = e => e.preventDefault()

  const CUBE_SIZE = 20
  const HALF = CUBE_SIZE / 2
  const GRID_PRIMARY = '#888'
  const GRID_SECONDARY = '#444'

  return (
    <div className="flex flex-col h-screen">
      {/* Asset menu */}
      <div className="flex p-2 bg-gray-100 overflow-x-auto">
        {assets.map(asset => (
          <DraggableAsset key={asset.url} asset={asset} />
        ))}
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative" 
        onDrop={handleDrop} 
        onDragOver={handleDragOver}   
        onContextMenu={e => {
        e.preventDefault();
        if (document.exitPointerLock) document.exitPointerLock();
      }}>
        <Canvas
          className="w-full h-full"
          camera={{ position: [0, 5, 10], fov: 50 }}
          onCreated={({ camera, gl }) => setContext({ camera, gl })}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} />

          {/* Floor and walls grids */}
          <gridHelper args={[CUBE_SIZE, CUBE_SIZE, GRID_PRIMARY, GRID_SECONDARY]} />
          <gridHelper args={[CUBE_SIZE, CUBE_SIZE, GRID_PRIMARY, GRID_SECONDARY]} rotation={[Math.PI / 2, 0, 0]} position={[0, HALF, -HALF]} />
          <gridHelper args={[CUBE_SIZE, CUBE_SIZE, GRID_PRIMARY, GRID_SECONDARY]} rotation={[0, 0, Math.PI / 2]} position={[-HALF, HALF, 0]} />
          <gridHelper args={[CUBE_SIZE, CUBE_SIZE, GRID_PRIMARY, GRID_SECONDARY]} rotation={[0, 0, -Math.PI / 2]} position={[HALF, HALF, 0]} />
          <gridHelper args={[CUBE_SIZE, CUBE_SIZE, GRID_PRIMARY, GRID_SECONDARY]} rotation={[-Math.PI / 2, 0, 0]} position={[0, HALF, HALF]} />

          {/* Cube wireframe boundary */}
          <mesh position={[0, HALF, 0]}> 
            <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
            <meshBasicMaterial wireframe transparent opacity={0.2} />
          </mesh>

          {/* Controls and movement */}
          <PointerLockControls />
          <CameraMovement />
          <BoundCamera bounds={CUBE_SIZE} />

          {/* Render blocks */}
          {blocks.map((block, idx) => (
            <BlockModel key={idx} url={block.url} position={block.position} />
          ))}
        </Canvas>
      </div>
    </div>
  )
}
