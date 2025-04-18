// Serialization utility for saving and loading world state

/**
 * Serializes the current world state to a JSON string
 * @param {World} world - The world instance to serialize
 * @returns {string} JSON string of the world state
 */
export function serializeWorld(world) {
  // Create a snapshot of the current world state
  const snapshot = {
    // Convert the component maps to arrays of [type, [[id, obj]...]]
    comps: [...world.ecs.comps].map(([type, map]) => [type, [...map]]),
    // Include all rules
    rules: world.rules,
    // Add any global parameters
    globals: {
      // Include any global parameters that should be saved
      // Example: gravity strength, speed multiplier, etc.
    },
  };

  return JSON.stringify(snapshot);
}

/**
 * Deserializes a world state from a JSON string
 * @param {string} json - The JSON string to deserialize
 * @param {World} world - The world instance to apply the state to
 */
export function deserializeWorld(json, world) {
  try {
    const snapshot = JSON.parse(json);

    // Clear existing ECS data
    world.ecs.clear();

    // Restore components
    for (const [type, entries] of snapshot.comps) {
      const compMap = world.ecs.get(type);
      for (const [id, comp] of entries) {
        compMap.set(id, comp);
      }
    }

    // Restore rules
    world.rules = snapshot.rules || [];

    // Restore global parameters if any
    if (snapshot.globals) {
      // Set any global parameters
      // Example: world.gravity = snapshot.globals.gravity;
    }

    return true;
  } catch (error) {
    console.error("Error deserializing world:", error);
    return false;
  }
}

/**
 * Compress and encode world state for URL hash sharing
 * @param {string} json - The JSON string to compress
 * @returns {string} Compressed string for URL hash
 */
export function compressForSharing(json) {
  // This would typically use lz-string or a similar library
  // For simplicity, we're using a placeholder
  return btoa(json); // Simple base64 encoding as placeholder
}

/**
 * Decompress world state from URL hash
 * @param {string} compressed - The compressed string from URL hash
 * @returns {string} Original JSON string
 */
export function decompressFromSharing(compressed) {
  // Corresponding decompression function
  return atob(compressed); // Simple base64 decoding as placeholder
}
