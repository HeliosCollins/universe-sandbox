// Path system — handle pathfinding and movement towards target positions
export function pathSystem(world) {
  const pathTargets = world.ecs.get("PathTarget");
  const transforms = world.ecs.get("Transform");
  const tags = world.ecs.get("Tag");

  // Skip if no path targets exist
  if (pathTargets.size === 0) return;

  // Process each entity with a path target
  pathTargets.forEach((target, entityId) => {
    // Get the entity's transform
    const transform = transforms.get(entityId);
    if (!transform) return;

    // Skip if no target position is set
    if (!target.targetPos) return;

    // Calculate direction to target
    const direction = p5.Vector.sub(target.targetPos, transform.pos);
    const distance = direction.mag();

    // Check if entity has reached the target
    const arrivalThreshold = transform.radius * 2;
    if (distance < arrivalThreshold) {
      // If this is a waypoint and there are more targets, move to the next one
      if (target.waypoints && target.waypoints.length > 0) {
        target.targetPos = target.waypoints.shift();
        return;
      }

      // If we've reached the final target and we're set to stop at target, stop moving
      if (target.stopAtTarget) {
        // Clear the target
        target.targetPos = null;
        return;
      }
    }

    // Normalize and scale the direction vector
    direction.normalize();

    // Calculate speed based on distance to target (slow down as we get closer)
    let speed = transform.maxSpeed;

    // If we're close to the target, gradually slow down
    const slowdownDistance = transform.radius * 6;
    if (distance < slowdownDistance) {
      speed = map(distance, 0, slowdownDistance, 0, transform.maxSpeed);
    }

    // Scale the direction by the desired speed
    direction.mult(speed * target.strength);

    // Apply the steering force to the entity's acceleration
    transform.acc.add(direction);
  });
}
