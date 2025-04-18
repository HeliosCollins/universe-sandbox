// Force system - applies forces between entities based on component relationships
export function forceSystem(world) {
  // Get maps of relevant components
  const transforms = world.ecs.get("Transform");
  const forceFields = world.ecs.get("ForceField");
  const zoneForces = world.ecs.get("ZoneForce");

  if (!transforms.size) return;

  // Step 1: Apply radial forces (ForceField)
  if (forceFields && forceFields.size > 0) {
    // Get all entity IDs with transforms (potential force targets)
    const entityIds = [...transforms.keys()];

    // For each force field, apply force to all other entities
    forceFields.forEach((field, sourceId) => {
      const sourceTransform = transforms.get(sourceId);
      if (!sourceTransform) return;

      // Calculate maximum range based on radius and multiplier
      const maxRange = sourceTransform.radius * field.rangeMul;
      const maxRangeSquared = maxRange * maxRange;

      // Loop through all potential targets
      entityIds.forEach((targetId) => {
        // Skip applying force to self
        if (targetId === sourceId) return;

        const targetTransform = transforms.get(targetId);

        // Calculate distance vector between entities
        const forceVector = p5.Vector.sub(
          sourceTransform.pos,
          targetTransform.pos
        );
        const distSquared = forceVector.magSq();

        // Skip if outside maximum range
        if (distSquared > maxRangeSquared) return;

        // Calculate force magnitude based on falloff type
        let forceMagnitude = calculateForceMagnitude(
          field.strength,
          field.falloff,
          distSquared,
          maxRangeSquared
        );

        // Apply negative force for repellers
        if (field.type === "repeller") {
          forceMagnitude *= -1;
        }

        // Direction from source to target (normalized)
        forceVector.normalize();

        // Scale by force magnitude
        forceVector.mult(forceMagnitude);

        // Apply to target's acceleration
        targetTransform.acc.add(forceVector);
      });
    });
  }

  // Step 2: Apply zone forces (directional pushes)
  if (zoneForces && zoneForces.size > 0) {
    // For each zone force, apply to all entities in range
    zoneForces.forEach((zone, sourceId) => {
      const sourceTransform = transforms.get(sourceId);
      if (!sourceTransform) return;

      // Calculate squared zone radius for distance checks
      const zoneRadiusSquared = zone.radius * zone.radius;

      // Loop through all entities with transforms
      transforms.forEach((targetTransform, targetId) => {
        // Skip applying to self
        if (targetId === sourceId) return;

        // Calculate distance from zone center to target
        const distVector = p5.Vector.sub(
          targetTransform.pos,
          sourceTransform.pos
        );
        const distSquared = distVector.magSq();

        // Skip if outside zone radius
        if (distSquared > zoneRadiusSquared) return;

        // Calculate falloff based on distance (linear falloff from center to edge)
        const falloff = 1 - Math.sqrt(distSquared) / zone.radius;

        // Create force vector using zone direction and strength
        const forceVector = zone.dir.copy();
        forceVector.mult(zone.strength * falloff);

        // Apply to target's acceleration
        targetTransform.acc.add(forceVector);
      });
    });
  }
}

// Helper function to calculate force magnitude based on falloff type
function calculateForceMagnitude(
  strength,
  falloffType,
  distSquared,
  maxRangeSquared
) {
  // Prevent division by zero
  const safeDistSquared = Math.max(distSquared, 0.0001);

  switch (falloffType) {
    case "linear":
      // Linear falloff from 1 at center to 0 at max range
      return (
        strength * (1 - Math.sqrt(safeDistSquared) / Math.sqrt(maxRangeSquared))
      );

    case "invSq":
      // Inverse square falloff (realistic gravity/electromagnetic)
      return strength / safeDistSquared;

    case "exp":
      // Exponential falloff
      return strength * Math.exp((-3 * safeDistSquared) / maxRangeSquared);

    default:
      return strength / safeDistSquared; // Default to inverse square
  }
}
