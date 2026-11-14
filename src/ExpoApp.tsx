import {
  AppendSceneAsync,
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
import { useEffect, useRef, useState } from "react";

const models = [
  "513573_dem_6697",
  "51357370_bldg_6697_op",
  "51357371_bldg_6697_op",
  "51357380_bldg_6697_op",
  "51357381_bldg_6697_op",
  "51357370_frn_6697_op",
  "51357380_frn_6697_op",
];

export function ExpoApp() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [initializationFailed, setInitializationFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    return initialize(canvas, sceneRef, () => setInitializationFailed(true));
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="canvas"
        hidden={initializationFailed}
      />
      {initializationFailed && (
        <div className="webgl-error" role="alert">
          <h2>3D 表示を開始できませんでした</h2>
          <p>
            WebGL の初期化に失敗しました。ブラウザーの設定でハードウェア
            アクセラレーションを有効にして、ブラウザーを再起動してください。
            解決しない場合は、別のブラウザーでお試しください。
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            再読み込み
          </button>
        </div>
      )}
    </>
  );
}

const initialize = (
  canvas: HTMLCanvasElement,
  sceneRef: React.RefObject<Scene | null>,
  onEngineError: () => void,
): (() => void) | undefined => {
  const engine = createEngine(canvas);
  if (!engine) {
    onEngineError();
    return;
  }
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

  // plateau読み込み
  void loadModels(scene);

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

const createEngine = (canvas: HTMLCanvasElement): Engine | null => {
  const contextErrors: string[] = [];
  const onCreationError = (event: Event) => {
    contextErrors.push((event as WebGLContextEvent).statusMessage);
  };

  canvas.addEventListener("webglcontextcreationerror", onCreationError);
  try {
    // Babylon.js already falls back from WebGL 2 to WebGL 1.
    return new Engine(canvas, true);
  } catch (error) {
    console.error("WebGL engine initialization failed", {
      error,
      contextErrors,
    });
    return null;
  } finally {
    canvas.removeEventListener("webglcontextcreationerror", onCreationError);
  }
};

const loadModels = async (scene: Scene) => {
  const root = `${import.meta.env.BASE_URL}plateau/Expo/`;

  for (const name of models) {
    if (scene.isDisposed) return;
    try {
      await AppendSceneAsync(`${root}${name}/${name}.glb`, scene);
    } catch (error) {
      if (scene.isDisposed) return;
      console.error(`PLATEAU読み込み失敗: ${name}`, error);
    }
  }
};
