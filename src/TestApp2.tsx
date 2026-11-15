import {
  ArcRotateCamera,
  Color3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Tools,
  Vector2,
  Vector3,
} from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { WaterMaterial } from "@babylonjs/materials/water/waterMaterial";
import "@babylonjs/loaders/glTF/index.js";
import { useEffect, useRef } from "react";

export function TestApp2() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    return initialize(canvas, sceneRef);
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="canvas" />
    </>
  );
}

const initialize = (
  canvas: HTMLCanvasElement,
  sceneRef: React.RefObject<Scene | null>,
): (() => void) | undefined => {
  const engine = new Engine(canvas);
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera(
    "Camera",
    Tools.ToRadians(90),
    Tools.ToRadians(65),
    2000,
    Vector3.Zero(),
    scene,
  );
  camera.attachControl(true);
  new HemisphericLight("light", new Vector3(1, 1, 0), scene);

  sceneRef.current = scene;

  // Ground
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 1800, height: 1800, subdivisions: 32 },
    scene,
  );

  const groundMaterial = new StandardMaterial("groundMaterial", scene);
  const groundTexture = new Texture(
    `${import.meta.env.BASE_URL}textures/ground.jpg`,
    scene,
  );
  groundTexture.uScale = groundTexture.vScale = 4;
  groundMaterial.diffuseTexture = groundTexture;
  ground.material = groundMaterial;

  // water
  const waterMesh = MeshBuilder.CreateGround(
    "WaterMesh",
    { width: 1800, height: 1800, subdivisions: 32 },
    scene,
  );

  const water = new WaterMaterial("water", scene);
  water.bumpTexture = new Texture(
    `${import.meta.env.BASE_URL}textures/waterbump.png`,
    scene,
  );

  ground.position.y = -1;
  waterMesh.position.y = -0.1;

  // water properties
  water.windForce = -15;
  water.waveHeight = 0;
  water.windDirection = new Vector2(1, 1);
  water.waterColor = new Color3(0.1, 0.1, 0.6);
  water.colorBlendFactor = 0.3;
  water.bumpHeight = 0.1;
  water.waveLength = 0.1;

  // Add ground to the reflection and reflection
  water.addToRenderList(ground);

  // Assign the water material
  waterMesh.material = water;

  // render
  engine.runRenderLoop(() => scene.render());

  const observer = new ResizeObserver(() => engine.resize());
  observer.observe(canvas);

  return () => {
    observer.disconnect();
    engine.stopRenderLoop();
    scene.dispose();
    engine.dispose();
    if (sceneRef.current === scene) {
      sceneRef.current = null;
    }
  };
};
