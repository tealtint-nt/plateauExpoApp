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

// 地面の上に水面を重ね、反射・屈折を表現する Babylon.js のサンプル。
export function TestApp2() {
  // React が描画した canvas と、作成した 3D シーンを保持する。
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  useEffect(() => {
    // canvas が画面に追加されてから、3D 描画の準備を始める。
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 戻り値の関数は、コンポーネントが取り除かれるときに実行される。
    return initialize(canvas, sceneRef);
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="canvas" />
    </>
  );
}

// 描画環境を作成して、終了時にリソースを解放する関数を返す。
const initialize = (
  canvas: HTMLCanvasElement,
  sceneRef: React.RefObject<Scene | null>,
): (() => void) | undefined => {
  // Engine は canvas への描画を担当し、Scene はカメラや地面などを管理する。
  const engine = new Engine(canvas);
  const scene = new Scene(engine);

  // 原点を中心に回転するカメラ。水平角 90 度・縦方向の角度 65 度、距離 2000 に配置する。
  // カメラが受け取る角度はラジアンなので、度から変換する。
  const camera = new ArcRotateCamera(
    "Camera",
    Tools.ToRadians(90),
    Tools.ToRadians(65),
    2000,
    Vector3.Zero(),
    scene,
  );
  // マウスやタッチでカメラを操作できるようにする。
  camera.attachControl(true);
  // 指定した方向からシーン全体を照らす、半球状の光源を追加する。
  new HemisphericLight("light", new Vector3(1, 1, 0), scene);

  sceneRef.current = scene;

  // 幅・奥行きが 1800 の地面を作る。subdivisions は面を分割する細かさ。
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 1800, height: 1800, subdivisions: 32 },
    scene,
  );

  // マテリアルは表面の見た目、テクスチャは表面に貼る画像を表す。
  const groundMaterial = new StandardMaterial("groundMaterial", scene);
  // BASE_URL を使い、アプリの公開先のパスに合わせて画像を読み込む。
  const groundTexture = new Texture(
    `${import.meta.env.BASE_URL}textures/ground.jpg`,
    scene,
  );
  // 画像を縦横それぞれ 4 回繰り返して、地面に貼り付ける。
  groundTexture.uScale = groundTexture.vScale = 4;
  groundMaterial.diffuseTexture = groundTexture;
  ground.material = groundMaterial;

  // 地面と同じ大きさの平面を作り、水面として使う。
  const waterMesh = MeshBuilder.CreateGround(
    "WaterMesh",
    { width: 1800, height: 1800, subdivisions: 32 },
    scene,
  );

  // 水専用のマテリアル。凹凸画像で光の反射に変化を付け、水面らしく見せる。
  const water = new WaterMaterial("water", scene);
  water.bumpTexture = new Texture(
    `${import.meta.env.BASE_URL}textures/waterbump.png`,
    scene,
  );

  // Y 座標は高さを表す。地面を水面より低くして、水底として見せる。
  ground.position.y = -1;
  waterMesh.position.y = -0.1;

  // 水の見た目と動きを調整する。
  // 風の強さ。負の値は、指定した風向きと逆方向に動かす。
  water.windForce = -15;
  // 波による水面の上下動を無効にする（凹凸画像による見た目の変化は残る）。
  water.waveHeight = 0;
  // 水平方向（X・Z）の風向き。
  water.windDirection = new Vector2(1, 1);
  // 水の色を RGB で指定する。各成分は 0～1 で、ここでは青を強める。
  water.waterColor = new Color3(0.1, 0.1, 0.6);
  // 反射・屈折の映像に水の色を混ぜる割合。
  water.colorBlendFactor = 0.3;
  // 凹凸画像による水面のゆがみの強さ。
  water.bumpHeight = 0.1;
  // 波の長さ。waveHeight が 0 のため、現在は上下動としては現れない。
  water.waveLength = 0.1;

  // 地面を反射・屈折の描画対象に登録し、水面の映り込みや水底の表現に使う。
  water.addToRenderList(ground);

  // 作成した平面に水の見た目を適用する。
  waterMesh.material = water;

  // 毎フレーム、シーンを描画する。
  engine.runRenderLoop(() => scene.render());

  // canvas の表示サイズが変わったら、描画サイズも合わせる。
  const observer = new ResizeObserver(() => engine.resize());
  observer.observe(canvas);

  return () => {
    // サイズ監視と描画を止め、シーンと描画エンジンのリソースを解放する。
    observer.disconnect();
    engine.stopRenderLoop();
    scene.dispose();
    engine.dispose();
    // 別のシーンに置き換わっていない場合だけ、保持している参照を空にする。
    if (sceneRef.current === scene) {
      sceneRef.current = null;
    }
  };
};
