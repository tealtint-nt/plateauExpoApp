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

// 地面に画像を貼り付けて表示する、Babylon.js の基本サンプル。
export function TestApp1() {
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
  /*
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
*/

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
