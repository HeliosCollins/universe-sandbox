// Collision system placeholder — detect and handle collisions between entities
export function collisionSystem(world) {
  const transforms = world.ecs.get("Transform");
  const colliders = world.ecs.get("Collider");
  if (!colliders.size) return;

  // ---- 1. gather collidable ids ----
  const ids = [...colliders.keys()];

  // ---- 2. naive N² check (good up to a few k entities) ----
  for (let i = 0; i < ids.length - 1; i++) {
    const idA = ids[i];
    const tA = transforms.get(idA);

    for (let j = i + 1; j < ids.length; j++) {
      const idB = ids[j];
      const tB = transforms.get(idB);

      const distSq = p5.Vector.sub(tA.pos, tB.pos).magSq();
      const minR = tA.radius + tB.radius;
      if (distSq >= minR * minR) continue; // no hit

      // ---- 3. resolve overlap ----
      const normal = p5.Vector.sub(tB.pos, tA.pos).normalize();
      const overlap = minR - Math.sqrt(distSq);

      // push each entity half way (skip if one is obstacle)
      const isObstacleA = world.ecs.get("ObstacleTag").has(idA);
      const isObstacleB = world.ecs.get("ObstacleTag").has(idB);

      if (!isObstacleA) tA.pos.add(p5.Vector.mult(normal, -overlap / 2));
      if (!isObstacleB) tB.pos.add(p5.Vector.mult(normal, overlap / 2));

      // ---- 4. reflect velocity (simple elastic) ----
      reflect(tA, normal, isObstacleA);
      reflect(tB, normal.mult(-1), isObstacleB);

      // ---- 5. store hit pair for ruleSystem ----
      world.collisionsThisFrame.push([idA, idB]);
    }
  }
}

function reflect(transform, normal, fixed) {
  if (fixed) return; // obstacles don't bounce
  const v = transform.vel;
  const dot = v.dot(normal);
  transform.vel = p5.Vector.sub(v, p5.Vector.mult(normal, 2 * dot));
}
