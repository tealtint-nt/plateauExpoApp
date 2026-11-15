import {
  ArcRotateCamera,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Tools,
  Vector3,
} from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Scene } from "@babylonjs/core/scene.js";
import "@babylonjs/loaders/glTF/index.js";
import { useEffect, useRef } from "react";

export function TestApp1() {
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
