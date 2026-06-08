import Phaser from "phaser";
import "./styles.css";
import { H, W } from "./game/constants.js";
import { BootScene, LevelScene, MapScene, SummaryScene, WelcomeScene } from "./game/scenes.js";

function showStartupError(error) {
  const pre = document.createElement("pre");
  pre.textContent = `启动失败\n\n${error?.stack || error}`;
  pre.style.position = "fixed";
  pre.style.inset = "12px";
  pre.style.margin = "0";
  pre.style.whiteSpace = "pre-wrap";
  pre.style.padding = "16px";
  pre.style.borderRadius = "16px";
  pre.style.background = "rgba(255,255,255,0.96)";
  pre.style.fontSize = "13px";
  pre.style.lineHeight = "1.45";
  pre.style.color = "#24304a";
  pre.style.zIndex = "9999";
  document.body.appendChild(pre);
  console.error(error);
}

window.addEventListener("error", (event) => {
  showStartupError(event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  showStartupError(event.reason);
});

try {
  window.Phaser = Phaser;
  const rexModule = await import("phaser3-rex-plugins/dist/rexuiplugin.min.js");
  const rexUIPlugin = rexModule.default || window.rexuiplugin;
  if (typeof rexUIPlugin !== "function") {
    throw new Error("RexUI plugin did not load correctly.");
  }
  window.rexuiplugin = rexUIPlugin;

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "app",
    width: W,
    height: H,
    backgroundColor: "#ccefff",
    roundPixels: true,
    pixelArt: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.NO_CENTER
    },
    plugins: {
      scene: [
        {
          key: "rexUI",
          plugin: rexUIPlugin,
          mapping: "rexUI"
        }
      ]
    },
    scene: [BootScene, WelcomeScene, MapScene, LevelScene, SummaryScene]
  });
} catch (error) {
  showStartupError(error);
}
