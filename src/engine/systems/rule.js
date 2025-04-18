import { createFollower } from "../../game/prefabs.js";

export function ruleSystem(world) {
  if (!world.rules || !world.rules.length) return;

  for (const rule of world.rules) {
    if (rule.if.type === "collision") {
      for (const [idA, idB] of world.collisionsThisFrame) {
        const tagA = world.ecs.get("Tag")?.get(idA)?.value;
        const tagB = world.ecs.get("Tag")?.get(idB)?.value;
        if (tagA === rule.if.tagA && tagB === rule.if.tagB) {
          applyThen(world, rule.then, idA, idB);
        }
      }
    }
    // extend with distance<, timer, keypress etc.
  }
}

function applyThen(world, then, idA, idB) {
  switch (then.type) {
    case "destroy":
      world.ecs.remove(then.target === "a" ? idA : idB);
      break;
    case "spawn":
      const position = world.ecs.get("Transform").get(idA).pos;
      createFollower(world, {
        x: position.x,
        y: position.y,
      });
      break;
    // additional rule actions can be added here
  }
}

// Helper function for spawn action (placeholder)
function createEntityAtPosition(world, x, y) {
  // Call your entity creation function with position
  // Example: createFollower(world, { x, y });

  // This is a placeholder that would need to be replaced with your actual entity creation code
  console.log(`Entity would be created at position ${x}, ${y}`);
}
