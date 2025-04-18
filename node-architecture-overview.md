# Node-Based Architecture for BlobVerse ECS

## Overview

The BlobVerse ECS system has been refactored to use a node-based architecture, where every entity is created as a base "Node" with a Transform component, and additional behaviors are added via components. This approach follows pure Entity-Component-System principles, allowing for greater flexibility and extensibility.

## Key Components

### Core Components

1. **Transform** - Required for all nodes

   - Position, velocity, acceleration, radius
   - The foundation component every entity needs

2. **Collider** - Optional but typically added to all nodes

   - Simple circle collider (can be extended to other shapes)
   - Used by the collision system

3. **Tag** - Type identification
   - Identifies the primary role of an entity
   - Updates when specific components are added

### Force Components

1. **ForceField** - Radial force generators

   - Type: attractor or repeller
   - Strength: force magnitude
   - Range multiplier: how far the force extends
   - Falloff: how force diminishes with distance (invSq, linear, exp)

2. **ZoneForce** - Directional force generators
   - Direction: vector indicating push direction
   - Strength: force magnitude
   - Radius: area of effect

### Behavior Components

1. **PathTarget** - Path following behavior
   - Target position: destination to move towards
   - Waypoints: array of positions for multi-point paths
   - Stop at target: whether to slow down near destination
   - Strength: how strongly to follow the path

## Entity Creation Flow

```javascript
// Create a basic node
const id = createNode(world, { x, y, radius });

// Add behaviors as needed
addForceField(world, id, { type: "attractor", strength: 50 });
addPathFollower(world, id, { targetPos: { x: 100, y: 100 } });
addZoneForce(world, id, { direction: { x: 1, y: 0 }, strength: 20 });
```

## UI Workflow

1. User clicks "Node" button and places a base entity
2. User selects the entity by clicking on it
3. User adds behaviors from the component palette:
   - Forces: Attractor, Repeller, Zone Force
   - Behaviors: Path Follow
4. For path following, a second click sets the destination

## System Updates

### Force System

Now processes both ForceField and ZoneForce components, with component-specific force calculation logic.

### Render System

Visualizes entities based on their component composition, with visual indicators for each behavior type.

### Collision System

Handles collision detection and resolution between entities with Transform and Collider components.

### Rule System

Processes collision events and applies rule-based effects.

## Benefits

1. **Composability**: Any entity can have any combination of behaviors
2. **Extensibility**: New components can be added without changing existing systems
3. **UI Simplicity**: One entity creation flow with component toggles
4. **Code Clarity**: Systems only process relevant components
5. **User Creativity**: Users can create hybrid entities with multiple behaviors

## Legacy Support

The old prefab functions (`createBlob`, `createFollower`, etc.) are maintained for backward compatibility but now use the node-based architecture internally.

## Future Extensions

This architecture makes it easy to add new components:

- **Wander** component for random movement
- **Flocking** behavior for group movement
- **Health/Damage** for game mechanics
- **Visual Effects** for purely aesthetic rendering

The node-based approach also simplifies serialization and deserialization of the world state, as entities are defined purely by their component data.
