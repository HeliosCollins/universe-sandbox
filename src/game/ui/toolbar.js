// Toolbar implementation for entity creation and game controls
import {
  createNode,
  addForceField,
  addPathFollower,
  addZoneForce,
  createObstacle,
} from "../prefabs.js";
import { COLORS } from "../constants.js";

export function initToolbar(world) {
  const toolbarContainer = document.createElement("div");
  toolbarContainer.className = "toolbar";
  toolbarContainer.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: rgba(40, 40, 40, 0.7);
    border-radius: 5px;
    padding: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  `;
  document.body.appendChild(toolbarContainer);

  // -- Creation Mode and Selected Entity State --
  let currentCreationMode = null;
  let selectedEntityId = null;
  let waitingForPathTarget = false;
  let tempPathIndicator = null;

  // -- Section: Entity Creation --
  const createSection = document.createElement("div");
  createSection.style.cssText = `
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 10px;
    margin-bottom: 5px;
  `;
  toolbarContainer.appendChild(createSection);

  // Create Node button
  const createNodeButton = createButton("➕ Node", () => {
    resetSelections();
    currentCreationMode = "node";
    updateStatus("Click to place a node");
  });
  createNodeButton.style.background = "rgba(80, 120, 180, 0.8)";
  createSection.appendChild(createNodeButton);

  // Create Obstacle button
  const createObstacleButton = createButton("⬛ Obstacle", () => {
    resetSelections();
    currentCreationMode = "obstacle";
    updateStatus("Click to place an obstacle");
  });
  createSection.appendChild(createObstacleButton);

  // -- Section: Behavior Components --
  const componentsSection = document.createElement("div");
  componentsSection.style.cssText = `
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 10px;
    margin-bottom: 5px;
  `;
  toolbarContainer.appendChild(componentsSection);

  // Section Header: Forces
  const forcesHeader = document.createElement("div");
  forcesHeader.textContent = "Forces:";
  forcesHeader.style.cssText = `
    font-family: sans-serif;
    font-size: 12px;
    color: #ccc;
    margin: 5px 0;
  `;
  componentsSection.appendChild(forcesHeader);

  // Force Component Toggles
  const forceComponents = [
    { name: "Attractor", action: "add-attractor", icon: "🧲" },
    { name: "Repeller", action: "add-repeller", icon: "↔️" },
    { name: "Zone Force", action: "add-zone", icon: "↗️" },
  ];

  const forceButtons = createToggleGroup(forceComponents, (action) => {
    if (!selectedEntityId) {
      updateStatus("Select a node first");
      return;
    }

    switch (action) {
      case "add-attractor":
        addForceField(world, selectedEntityId, {
          type: "attractor",
          strength: 50,
        });
        updateStatus("Added attractor force field");
        break;
      case "add-repeller":
        addForceField(world, selectedEntityId, {
          type: "repeller",
          strength: -50,
        });
        updateStatus("Added repeller force field");
        break;
      case "add-zone":
        addZoneForce(world, selectedEntityId);
        updateStatus("Added zone force field");
        break;
    }
  });

  forceButtons.forEach((btn) => componentsSection.appendChild(btn));

  // Section Header: Behaviors
  const behaviorsHeader = document.createElement("div");
  behaviorsHeader.textContent = "Behaviors:";
  behaviorsHeader.style.cssText = `
    font-family: sans-serif;
    font-size: 12px;
    color: #ccc;
    margin: 8px 0 5px 0;
  `;
  componentsSection.appendChild(behaviorsHeader);

  // Behavior Component Toggles
  const behaviorComponents = [
    { name: "Path Follow", action: "add-path", icon: "🔴" },
  ];

  const behaviorButtons = createToggleGroup(behaviorComponents, (action) => {
    if (!selectedEntityId) {
      updateStatus("Select a node first");
      return;
    }

    if (action === "add-path") {
      waitingForPathTarget = true;
      const transform = world.ecs.get("Transform").get(selectedEntityId);
      if (transform) {
        tempPathIndicator = createTargetIndicator(
          transform.pos.x,
          transform.pos.y,
          mouseX,
          mouseY
        );
        updateStatus("Click to set target destination");
      }
    }
  });

  behaviorButtons.forEach((btn) => componentsSection.appendChild(btn));

  // -- Section: Utilities --
  const utilsSection = document.createElement("div");
  toolbarContainer.appendChild(utilsSection);

  // Clear All button
  const clearButton = createButton("🗑️ Clear All", () => {
    clearAllEntities(world);
    resetSelections();
    updateStatus("All entities cleared");
  });
  utilsSection.appendChild(clearButton);

  // Status indicator
  const statusIndicator = document.createElement("div");
  statusIndicator.className = "status-indicator";
  statusIndicator.style.cssText = `
    font-family: sans-serif;
    font-size: 12px;
    color: #aaa;
    text-align: center;
    margin-top: 10px;
  `;
  statusIndicator.textContent = "Create a node or select one";
  toolbarContainer.appendChild(statusIndicator);

  // -- Helper Functions --

  // Create a standard button
  function createButton(label, onClick) {
    const btn = document.createElement("button");
    btn.innerHTML = label;
    btn.style.cssText = `
      background: rgba(60, 60, 60, 0.7);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      margin: 2px 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: sans-serif;
      transition: background 0.2s;
      width: 100%;
    `;
    btn.onmouseover = () => {
      btn.style.background = "rgba(80, 80, 80, 0.9)";
    };
    btn.onmouseout = () => {
      btn.style.background = "rgba(60, 60, 60, 0.7)";
    };
    btn.onclick = onClick;
    return btn;
  }

  // Create a group of toggle buttons
  function createToggleGroup(options, onToggle) {
    return options.map((option) => {
      const btn = createButton(`${option.icon} ${option.name}`, () => {
        onToggle(option.action);
      });
      btn.dataset.action = option.action;
      // Make these buttons appear slightly different
      btn.style.padding = "6px 10px";
      btn.style.fontSize = "12px";
      btn.style.justifyContent = "flex-start";
      return btn;
    });
  }

  // Update status message
  function updateStatus(message) {
    statusIndicator.textContent = message;
  }

  // Reset selections and indicators
  function resetSelections() {
    selectedEntityId = null;
    waitingForPathTarget = false;
    tempPathIndicator = null;
  }

  // Create temporary visual indicator for target points
  function createTargetIndicator(x, y, targetX, targetY) {
    return {
      startX: x,
      startY: y,
      endX: targetX,
      endY: targetY,
      draw: function () {
        push();
        stroke(255, 100, 100, 150);
        strokeWeight(2);
        line(this.startX, this.startY, this.endX, this.endY);

        fill(255, 100, 100, 150);
        noStroke();
        ellipse(this.endX, this.endY, 10, 10);

        // Draw arrow head
        let angle = atan2(this.endY - this.startY, this.endX - this.startX);
        translate(this.endX, this.endY);
        rotate(angle);
        triangle(-15, -6, 0, 0, -15, 6);
        pop();
      },
    };
  }

  // Handle canvas clicks for entity interaction
  window.mousePressed = () => {
    // Only handle clicks within canvas boundaries
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

    // Handle setting path target
    if (waitingForPathTarget && selectedEntityId) {
      addPathFollower(world, selectedEntityId, {
        targetPos: { x: mouseX, y: mouseY },
      });

      waitingForPathTarget = false;
      tempPathIndicator = null;
      updateStatus("Path target set");
      return;
    }

    // Handle entity creation
    if (currentCreationMode) {
      switch (currentCreationMode) {
        case "node":
          selectedEntityId = createNode(world, { x: mouseX, y: mouseY });
          updateStatus("Node created - add components or create another");
          break;
        case "obstacle":
          createObstacle(world, { x: mouseX, y: mouseY, radius: 30 });
          updateStatus("Obstacle created");
          break;
      }
      return;
    }

    // Try to select an entity if no creation mode is active
    selectEntityAt(mouseX, mouseY);
  };

  // Entity selection logic
  function selectEntityAt(x, y) {
    const transforms = world.ecs.get("Transform");
    if (!transforms) return;

    let bestMatch = null;
    let shortestDistance = Infinity;

    transforms.forEach((transform, id) => {
      const dist = p5.Vector.dist(createVector(x, y), transform.pos);

      if (dist <= transform.radius && dist < shortestDistance) {
        shortestDistance = dist;
        bestMatch = id;
      }
    });

    if (bestMatch) {
      selectedEntityId = bestMatch;

      // Get tag for better status display
      const tag = world.ecs.get("Tag")?.get(bestMatch)?.value || "entity";
      updateStatus(`Selected ${tag} - add components or modify`);

      // Highlight selected entity in the render system
      // (This could be implemented by adding a "Selected" component)
    } else {
      selectedEntityId = null;
      updateStatus("No entity selected");
    }
  }

  // Draw any temporary visual indicators
  const originalDraw = window.draw;
  window.draw = () => {
    originalDraw();

    // Draw path indicator if active
    if (waitingForPathTarget && tempPathIndicator && selectedEntityId) {
      const transform = world.ecs.get("Transform").get(selectedEntityId);
      if (transform) {
        tempPathIndicator.startX = transform.pos.x;
        tempPathIndicator.startY = transform.pos.y;
        tempPathIndicator.endX = mouseX;
        tempPathIndicator.endY = mouseY;
        tempPathIndicator.draw();
      }
    }

    // Draw selection indicator for selected entity
    if (selectedEntityId) {
      const transform = world.ecs.get("Transform").get(selectedEntityId);
      if (transform) {
        push();
        noFill();
        stroke(255, 255, 0, 150);
        strokeWeight(2);
        ellipse(transform.pos.x, transform.pos.y, transform.radius * 2 + 6);
        pop();
      } else {
        // Entity no longer exists, clear selection
        selectedEntityId = null;
      }
    }
  };

  // Clear all entities from the world
  function clearAllEntities(world) {
    const entityIds = Array.from(world.ecs.entities);
    entityIds.forEach((id) => world.ecs.remove(id));
  }

  console.log("Toolbar initialized for:", world);
  return toolbarContainer; // Return for potential reference
}
