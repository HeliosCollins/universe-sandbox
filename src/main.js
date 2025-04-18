// import "./styles/main.css";
import { World } from "./engine/world.js";
import { physicsSystem } from "./engine/systems/physics.js";
import { forceSystem } from "./engine/systems/force.js";
import { pathSystem } from "./engine/systems/path.js";
import { collisionSystem } from "./engine/systems/collision.js";
import { ruleSystem } from "./engine/systems/rule.js";
import { renderSystem } from "./engine/systems/render.js";
import { createBlob } from "./game/prefabs.js";
import { initToolbar } from "./game/ui/toolbar.js";
import { initParamPanel } from "./game/ui/paramPanel.js";

let world;

window.setup = () => {
  createCanvas(windowWidth, windowHeight);
  world = new World();
  world.addSystem(forceSystem);
  world.addSystem(pathSystem);
  world.addSystem(physicsSystem);
  world.addSystem(collisionSystem);
  world.addSystem(ruleSystem);
  world.addSystem(renderSystem);

  // dev seed
  createBlob(world, { x: width / 2, y: height / 2 });

  // Initialize UI components
  initToolbar(world);
  initParamPanel(world);
};

window.draw = () => {
  background(30);
  world.update();
};

// Handle window resize to make canvas responsive
window.windowResized = () => {
  resizeCanvas(windowWidth, windowHeight);
};
