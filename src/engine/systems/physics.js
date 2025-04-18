export function physicsSystem(world) {
  const transforms = world.ecs.get("Transform");
  for (const [id, t] of transforms) {
    t.vel.add(t.acc).limit(t.maxSpeed);
    t.pos.add(p5.Vector.mult(t.vel, world.dt * 60));
    t.acc.mult(0);
    // wall bounce (simple)
    if (t.pos.x < t.radius || t.pos.x > width - t.radius) t.vel.x *= -1;
    if (t.pos.y < t.radius || t.pos.y > height - t.radius) t.vel.y *= -1;
  }
}
