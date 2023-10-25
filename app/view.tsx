"use client"
import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import { Vector3 } from "three";
import { createWSConnection, ping } from "./services/binace";
import {generateAggregatedDepth} from "@/app/services/depth";

(async () => {
    await createWSConnection();
    await generateAggregatedDepth('BTCUSDT', 0.1, 10);
})();


const PriceLine = () => {
    return (
        <Line
            position={[0, 0, 0]}
            points={[
                [0, 0, 0],
            ]}       // Array of points, Array<Vector3 | Vector2 | [number, number, number] | [number, number] | number>
            color={"#000000"}                   // Default
            lineWidth={1}                   // In pixels (default)
        >
        </Line>

    )
}

function Box(props: any) {
    // This reference gives us direct access to the THREE.Mesh object
    const ref = useRef()
    // Hold state for hovered and clicked events
    const [hovered, hover] = useState(false)
    const [clicked, click] = useState(false)
    // Subscribe this component to the render-loop, rotate the mesh every frame
    // useFrame((state, delta) => (ref.current.rotation.x += delta))
    // Return the view, these are regular Threejs elements expressed in JSX
    return (
        <mesh
            {...props}
            ref={ref}
            scale={clicked ? 1.5 : 1}
            onClick={(event) => click(!clicked)}
            onPointerOver={(event) => (event.stopPropagation(), hover(true))}
            onPointerOut={(event) => hover(false)}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
        </mesh>
    )
}

export const View = () => {
    return (
        <Canvas>
            {/*<ambientLight intensity={0.2} />*/}
            <pointLight position={[10, 10, 10]} intensity={1000} color="#fff" />
            <pointLight position={[-10, -10, -10]} intensity={1000} color="#fff" />
            <Box position={[-1.2, 0, 0]} />
            <Box position={[1.2, 0, 0]} />
            <Line
                position={[0, 0, 0]}
                points={[[0, 0, 0], [2, 0, 0]]}
                color={"#ff0000"}
                lineWidth={1}
            />
            <Line
                position={[0, 0, 0]}
                points={[[0, 0, 0], [0, 2, 0]]}
                color={"#00ff00"}
                lineWidth={1}
            />
            <Line
                position={[0, 0, 0]}
                points={[[0, 0, 0], [0, 0, 2]]}
                color={"#0000ff"}
                lineWidth={1}
            />
            <PriceLine />
            <OrbitControls />
        </Canvas>
    )
}
