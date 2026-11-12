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

const models = [
  "513573_dem_6697",
  "51357370_bldg_6697_op",
  "51357371_bldg_6697_op",
  "51357380_bldg_6697_op",
  "51357381_bldg_6697_op",
  "51357370_frn_6697_op",
  "51357380_frn_6697_op",
];

export class ExpoApp {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private canvasEl: HTMLCanvasElement;
  private disposed = false;

  constructor(canvasEl: HTMLCanvasElement) {
    this.canvasEl = canvasEl;

    this.engine = new Engine(this.canvasEl, true, {
      loseContextOnDispose: true,
      adaptToDeviceRatio: true,
    });
    this.scene = new Scene(this.engine);

    // リサイズ
    const resizeWatcher = new ResizeObserver(() => {
      this.engine.resize();
    });
    resizeWatcher.observe(this.canvasEl);

    this.initialize();
  }

  private async initialize(): Promise<void> {
    const scene = this.scene;
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

    // Ground
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 1800, height: 1800, subdivisions: 32 },
      this.scene,
    );
    ground.position.y = -21;

    const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
    const groundTexture = new Texture(
      `${import.meta.env.BASE_URL}textures/ground.jpg`,
      this.scene,
    );
    groundTexture.uScale = groundTexture.vScale = 4;
    groundMaterial.diffuseTexture = groundTexture;
    ground.material = groundMaterial;

    // water
    const waterMesh = MeshBuilder.CreateGround(
      "WaterMesh",
      { width: 1800, height: 1800, subdivisions: 32 },
      this.scene,
    );
    // 波による上昇分を見込み、水面を低く配置する。
    waterMesh.position.y = -20;

    const water = new WaterMaterial("water", this.scene);
    water.bumpTexture = new Texture(
      `${import.meta.env.BASE_URL}textures/waterbump.png`,
      this.scene,
    );

    // water properties
    water.windForce = -15;
    water.waveHeight = 1.3;
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
    this.engine.runRenderLoop(() => scene.render());

    // plateau読み込み
    await this.loadModels();
  }

  private async loadModels() {
    const root = `${import.meta.env.BASE_URL}plateau/Expo/`;

    for (const name of models) {
      if (this.disposed) return;
      try {
        await AppendSceneAsync(`${root}${name}/${name}.glb`, this.scene);
      } catch (error) {
        console.log(error);
        if (this.disposed) return;
        console.error(`PLATEAU読み込み失敗: ${name}`, error);
      }
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    // 描画を止め、コントローラー → Scene → Engine の順に解放する。
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }
}
