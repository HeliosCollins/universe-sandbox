import { createECS } from "./ecs.js";

export class World {
  constructor() {
    this.ecs = createECS();
    this.systems = [];
    this.dt = 1 / 60; // fixed timestep
    this.collisionsThisFrame = [];
    this.rules = []; // Array to store game rules
  }
  addSystem(fn) {
    this.systems.push(fn);
  }
  update() {
    this.collisionsThisFrame.length = 0; // reset before systems run
    this.systems.forEach((s) => s(this));
  }

  // Method to add a new rule
  addRule(rule) {
    this.rules.push(rule);
  }

  // Method to remove a rule
  removeRule(index) {
    if (index >= 0 && index < this.rules.length) {
      this.rules.splice(index, 1);
    }
  }
}
