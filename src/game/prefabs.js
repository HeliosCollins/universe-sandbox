import {
  COLORS,
  FOLLOWER_SIZE,
  MAX_FOLLOWER_V,
  MAX_BLOB_V,
} from "./constants.js";

/**
 * Create a base node entity with just a Transform component
 * All other entities in the system are built on top of this
 */
export function createNode(
  world,
  { x, y, radius = 20, maxSpeed = MAX_BLOB_V, hasCollider = true } = {}
) {
  const id = world.ecs.createEntity();
  world.ecs.add(id, "Transform", {
    pos: createVector(x, y),
    vel: createVector(0, 0),
    acc: createVector(0, 0),
    radius: radius || 20,
    maxSpeed,
  });

  // Optional collider component (enabled by default)
  if (hasCollider) {
    world.ecs.add(id, "Collider", { type: "circle" });
  }

  // Add Tag component for default identification
  world.ecs.add(id, "Tag", { value: "node" });

  return id;
}

/**
 * Add a force field component to an entity
 */
export function addForceField(
  world,
  id,
  { strength = 50, type = "attractor", rangeMul = 2, falloff = "invSq" } = {}
) {
  world.ecs.add(id, "ForceField", {
    strength,
    type,
    rangeMul,
    falloff,
  });

  // Update Tag to reflect the entity's primary behavior
  world.ecs.add(id, "Tag", { value: type });

  return id;
}

/**
 * Add a path follower component to an entity
 */
export function addPathFollower(
  world,
  id,
  { targetPos, strength = 1.0, stopAtTarget = true } = {}
) {
  world.ecs.add(id, "PathTarget", {
    targetPos: targetPos ? createVector(targetPos.x, targetPos.y) : null,
    waypoints: [],
    stopAtTarget,
    strength,
  });

  return id;
}

/**
 * Add a zone force component to an entity (directional force)
 */
export function addZoneForce(
  world,
  id,
  { direction = { x: 1, y: 0 }, strength = 20, radius = 100 } = {}
) {
  world.ecs.add(id, "ZoneForce", {
    dir: createVector(direction.x, direction.y).normalize(),
    strength,
    radius,
  });

  // If entity doesn't have a more specific tag, update it
  const tag = world.ecs.get("Tag").get(id);
  if (tag.value === "node") {
    world.ecs.add(id, "Tag", { value: "zone" });
  }

  return id;
}

// === LEGACY PREFABS (for backward compatibility) ===

export function createBlob(
  world,
  { x, y, radius = 20, strength = 50, type = "attractor", rangeMul = 2 }
) {
  // Create a base node and add force field
  const id = createNode(world, { x, y, radius });
  addForceField(world, id, { strength, type, rangeMul });
  return id;
}

export function createFollower(world, { x, y, targetX, targetY } = {}) {
  // Create a node with follower properties
  const id = createNode(world, {
    x,
    y,
    radius: FOLLOWER_SIZE / 2,
    maxSpeed: MAX_FOLLOWER_V,
  });

  // Add Tag for follower type
  world.ecs.add(id, "Tag", { value: "follower" });

  // Add a PathTarget component if target coordinates are provided
  if (targetX !== undefined && targetY !== undefined) {
    addPathFollower(world, id, {
      targetPos: { x: targetX, y: targetY },
    });
  }

  return id;
}

export function createObstacle(world, { x, y, radius }) {
  // Create a base node with obstacle properties
  const id = createNode(world, { x, y, radius, maxSpeed: 0 });

  // Add obstacle tag
  world.ecs.add(id, "ObstacleTag", {});

  // Update entity tag
  world.ecs.add(id, "Tag", { value: "obstacle" });

  return id;
}
