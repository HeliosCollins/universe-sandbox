// Toolbar implementation for entity creation and game controls
import {
  createNode,
  addForceField,
  addPathFollower,
  addZoneForce,
  createObstacle,
} from "../prefabs.js";
import { COLORS } from "../constants.js";

// Version logging for debugging
console.log("Loading Node-based toolbar implementation");

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

  // -- State tracking --
  let currentTool = null;
  let selectedEntityId = null;
  let waitingForPathTarget = false;
  let tempPathIndicator = null;

  // -- Tool buttons --
  const tools = [
    {
      name: "",
      icon: "🧲",
      action: (e) => {
        // Create a base node and add attractor force field
        currentTool = "node";
        resetMultiStepCreation();
        updateToolStatus(tools[0].name);
      },
    },
    {
      name: "",
      icon: "↔️",
      action: (e) => {
        // Create a base node and add repeller force field
        currentTool = "repeller";
        resetMultiStepCreation();
        updateToolStatus(tools[1].name);
      },
    },
    {
      name: "Follower",
      icon: "🔴",
      action: (e) => {
        // Follower now just creates a node first, then waits for path
        currentTool = "follower";
        resetMultiStepCreation();
        updateToolStatus(tools[2].name);
      },
    },
    {
      name: "Obstacle",
      icon: "⬛",
      action: (e) => {
        // Still creates an obstacle directly
        currentTool = "obstacle";
        resetMultiStepCreation();
        updateToolStatus(tools[3].name);
      },
    },
    {
      name: "Clear All",
      icon: "🗑️",
      action: (e) => {
        clearAllEntities(world);
        resetMultiStepCreation();
      },
    },
  ];

  // Create tool buttons (keeping original UI)
  tools.forEach((tool) => {
    const button = document.createElement("button");
    button.innerHTML = `${tool.icon} ${tool.name}`;
    button.style.cssText = `
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
    `;
    button.onmouseover = () => {
      button.style.background = "rgba(80, 80, 80, 0.9)";
    };
    button.onmouseout = () => {
      button.style.background = "rgba(60, 60, 60, 0.7)";
    };
    button.onclick = tool.action;
    toolbarContainer.appendChild(button);
  });

  // Status indicator
  const statusIndicator = document.createElement("div");
  statusIndicator.className = "status-indicator";
  statusIndicator.style.cssText = `
    font-family: sans-serif;
    font-size: 12px;
    color: #aaa;
    text-align: center;
    margin-top: 5px;
  `;
  statusIndicator.textContent = "Click a tool to start";
  toolbarContainer.appendChild(statusIndicator);

  function updateToolStatus(toolName, customMessage = null) {
    statusIndicator.textContent = customMessage || `Selected: ${toolName}`;
  }

  function resetMultiStepCreation() {
    waitingForPathTarget = false;
    selectedEntityId = null;
    tempPathIndicator = null;
  }

  // Create temporary visual indicator for the target point
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

  // Add temporary indicator drawing to the draw loop
  const originalDraw = window.draw;
  window.draw = () => {
    originalDraw();

    // Draw target path indicator if active
    if (waitingForPathTarget && tempPathIndicator) {
      tempPathIndicator.endX = mouseX;
      tempPathIndicator.endY = mouseY;
      tempPathIndicator.draw();
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

  // Handle canvas clicks for entity creation (node-based approach)
  window.mousePressed = () => {
    if (!currentTool) return;

    // Only create entities within canvas boundaries
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

    // Handle the second step of follower creation (setting the target)
    if (waitingForPathTarget) {
      // Add a path target to the existing node
      if (selectedEntityId) {
        addPathFollower(world, selectedEntityId, {
          targetPos: { x: mouseX, y: mouseY },
        });

        updateToolStatus("Follower", "Path target set!");
        waitingForPathTarget = false;
        tempPathIndicator = null;
      }
      return;
    }

    switch (currentTool) {
      case "attractor":
        // Create a base node and add attractor component
        selectedEntityId = createNode(world, { x: mouseX, y: mouseY });
        addForceField(world, selectedEntityId, {
          type: "attractor",
          strength: 50,
        });
        break;

      case "repeller":
        // Create a base node and add repeller component
        selectedEntityId = createNode(world, { x: mouseX, y: mouseY });
        addForceField(world, selectedEntityId, {
          type: "repeller",
          strength: -50,
        });
        break;

      case "follower":
        // First create a base node
        selectedEntityId = createNode(world, {
          x: mouseX,
          y: mouseY,
          maxSpeed: 5, // Use appropriate speed constant
        });

        // Then set up path selection
        waitingForPathTarget = true;
        tempPathIndicator = createTargetIndicator(
          mouseX,
          mouseY,
          mouseX,
          mouseY
        );
        updateToolStatus("Follower", "Click again to set target");
        break;

      case "obstacle":
        // Create an obstacle directly (already node-based internally)
        createObstacle(world, {
          x: mouseX,
          y: mouseY,
          radius: 30,
        });
        break;
    }
  };

  function clearAllEntities(world) {
    // Get all entity IDs
    const entityIds = Array.from(world.ecs.entities);

    // Remove each entity
    entityIds.forEach((id) => {
      world.ecs.remove(id);
    });

    statusIndicator.textContent = "All entities cleared";
  }

  console.log("Node-based toolbar initialized");
  return toolbarContainer;
}
