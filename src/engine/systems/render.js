// Render system - draw entities based on their components
export function renderSystem(world) {
  const transforms = world.ecs.get("Transform");
  const tags = world.ecs.get("Tag");
  const forceFields = world.ecs.get("ForceField");
  const pathTargets = world.ecs.get("PathTarget");
  const zoneForces = world.ecs.get("ZoneForce");
  const obstaclesTags = world.ecs.get("ObstacleTag");

  // Iterate through all entities with Transform components
  transforms.forEach((transform, entityId) => {
    push(); // Save current drawing state

    // Default color for basic nodes
    let entityColor = [200, 200, 200, 200];
    let hasSpecialRender = false;

    // Set color based on tag if present
    if (tags.has(entityId)) {
      const tag = tags.get(entityId);

      switch (tag.value) {
        case "attractor":
          entityColor = [100, 150, 255, 200]; // Blue for attractors
          break;
        case "repeller":
          entityColor = [255, 100, 255, 200]; // Purple for repellers
          break;
        case "follower":
          entityColor = [255, 100, 100, 220]; // Red for followers
          break;
        case "zone":
          entityColor = [100, 255, 180, 200]; // Teal for zone forces
          break;
        case "obstacle":
        case "node":
          // Use default gray for basic nodes
          break;
      }
    } else if (obstaclesTags.has(entityId)) {
      // If it has ObstacleTag
      entityColor = [100, 100, 100, 200]; // Dark gray for obstacles
    }

    // Draw the entity base
    fill(entityColor);
    noStroke();
    ellipse(transform.pos.x, transform.pos.y, transform.radius * 2);

    // === Draw component-specific visualizations ===

    // 1. ForceField Component (radial forces)
    if (forceFields && forceFields.has(entityId)) {
      const field = forceFields.get(entityId);
      hasSpecialRender = true;

      // Draw range indicator
      strokeWeight(1);
      stroke(entityColor[0], entityColor[1], entityColor[2], 50);
      noFill();
      ellipse(
        transform.pos.x,
        transform.pos.y,
        transform.radius * 2 * field.rangeMul
      );

      // Draw force direction indicator (+ for attractor, - for repeller)
      textAlign(CENTER, CENTER);
      textSize(transform.radius);
      fill(255);
      text(
        field.type === "attractor" ? "+" : "−",
        transform.pos.x,
        transform.pos.y
      );
    }

    // 2. ZoneForce Component (directional forces)
    if (zoneForces && zoneForces.has(entityId)) {
      const zone = zoneForces.get(entityId);
      hasSpecialRender = true;

      // Draw zone radius
      noFill();
      strokeWeight(1);
      stroke(entityColor[0], entityColor[1], entityColor[2], 60);
      ellipse(transform.pos.x, transform.pos.y, zone.radius * 2);

      // Draw direction indicator
      const dirVector = zone.dir.copy().mult(transform.radius * 1.5);
      const startX = transform.pos.x - dirVector.x;
      const startY = transform.pos.y - dirVector.y;
      const endX = transform.pos.x + dirVector.x;
      const endY = transform.pos.y + dirVector.y;

      strokeWeight(3);
      stroke(entityColor[0], entityColor[1], entityColor[2], 180);
      line(startX, startY, endX, endY);

      // Draw arrow head
      const arrowSize = transform.radius * 0.6;
      const angle = zone.dir.heading();

      fill(entityColor[0], entityColor[1], entityColor[2], 180);
      noStroke();
      push();
      translate(endX, endY);
      rotate(angle);
      triangle(0, 0, -arrowSize, arrowSize / 2, -arrowSize, -arrowSize / 2);
      pop();
    }

    // 3. PathTarget Component (followers)
    if (pathTargets && pathTargets.has(entityId)) {
      const pathTarget = pathTargets.get(entityId);
      hasSpecialRender = true;

      if (pathTarget.targetPos) {
        // Draw line to target
        strokeWeight(1);
        stroke(255, 255, 255, 100);
        line(
          transform.pos.x,
          transform.pos.y,
          pathTarget.targetPos.x,
          pathTarget.targetPos.y
        );

        // Draw target indicator
        noFill();
        strokeWeight(1);
        stroke(255, 255, 255, 150);
        ellipse(pathTarget.targetPos.x, pathTarget.targetPos.y, 10, 10);

        // Draw small crosshair at target
        line(
          pathTarget.targetPos.x - 5,
          pathTarget.targetPos.y,
          pathTarget.targetPos.x + 5,
          pathTarget.targetPos.y
        );
        line(
          pathTarget.targetPos.x,
          pathTarget.targetPos.y - 5,
          pathTarget.targetPos.x,
          pathTarget.targetPos.y + 5
        );
      }

      // If entity has waypoints, draw them
      if (pathTarget.waypoints && pathTarget.waypoints.length > 0) {
        strokeWeight(1);
        stroke(255, 255, 255, 80);

        // Connect waypoints
        for (let i = 0; i < pathTarget.waypoints.length - 1; i++) {
          line(
            pathTarget.waypoints[i].x,
            pathTarget.waypoints[i].y,
            pathTarget.waypoints[i + 1].x,
            pathTarget.waypoints[i + 1].y
          );
        }

        // Connect entity to first waypoint
        if (pathTarget.waypoints.length > 0) {
          line(
            transform.pos.x,
            transform.pos.y,
            pathTarget.waypoints[0].x,
            pathTarget.waypoints[0].y
          );
        }
      }
    }

    // For nodes with no special components, draw a simple identifier
    if (!hasSpecialRender) {
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(transform.radius * 0.6);
      text("N", transform.pos.x, transform.pos.y);
    }

    pop(); // Restore drawing state
  });
}
