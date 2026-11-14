import { useEffect, useRef } from "react";
import "./App.css";
import { ExpoApp } from "./ExpoApp";
import { ExpoAppClass } from "./ExpoAppClass";

const isClassScene =
  new URLSearchParams(window.location.search).get("scene") === "class";

function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const expoAppRef = useRef<ExpoAppClass>(null);

  useEffect(() => {
    // 描画先の要素が取得できない場合は初期化しない
    if (!canvasContainerRef.current) {
      return;
    }

    // この Effect が管理する Canvas を作成して描画領域に追加する
    const canvas = document.createElement("canvas");
    canvas.className = "canvas";
    canvasContainerRef.current.appendChild(canvas);

    const expoApp = new ExpoAppClass(canvas);
    expoAppRef.current = expoApp;

    return () => {
      expoApp.dispose();
      canvas.remove();
    };
  }, []);

  if (!isClassScene) {
    return (
      <div className="app">
        <ExpoApp />
      </div>
    );
  }

  return (
    <div className="app">
      <main className="render-canvas-cont" ref={canvasContainerRef}></main>
    </div>
  );
}

export default App;
