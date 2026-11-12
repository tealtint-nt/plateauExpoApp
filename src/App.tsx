import { useEffect, useRef } from "react";
import "./App.css";
import { ExpoApp } from "./ExpoApp";

function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const expoAppRef = useRef<ExpoApp>(null);

  useEffect(() => {
    // 描画先の要素が取得できない場合は初期化しない
    if (!canvasContainerRef.current) {
      return;
    }

    // この Effect が管理する Canvas を作成して描画領域に追加する
    const canvas = document.createElement("canvas");
    canvas.className = "canvas";
    canvasContainerRef.current.appendChild(canvas);

    const expoApp = new ExpoApp(canvas);
    expoAppRef.current = expoApp;

    return () => {
      expoApp.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <div className="app">
      <main className="render-canvas-cont" ref={canvasContainerRef}></main>
    </div>
  );
}

export default App;
