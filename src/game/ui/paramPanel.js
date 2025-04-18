// Parameter panel for adjusting entity properties
import { COLORS, G } from "../constants.js";

export function initParamPanel(world) {
  const panelContainer = document.createElement("div");
  panelContainer.className = "param-panel";
  panelContainer.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    width: 250px;
    background: rgba(40, 40, 40, 0.7);
    border-radius: 5px;
    padding: 15px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    color: white;
    font-family: sans-serif;
    overflow-y: auto;
    max-height: 80vh;
  `;
  document.body.appendChild(panelContainer);

  // Panel title
  const title = document.createElement("h2");
  title.textContent = "Simulation Parameters";
  title.style.cssText = `
    margin-top: 0;
    font-size: 16px;
    margin-bottom: 15px;
    color: #fff;
    text-align: center;
    border-bottom: 1px solid rgba(255,255,255,0.2);
    padding-bottom: 8px;
  `;
  panelContainer.appendChild(title);

  // Global parameters
  const globalSection = createSection("Global Settings");
  panelContainer.appendChild(globalSection);

  // Gravity strength
  let gravityStrength = G;
  createSlider(
    globalSection,
    "Gravity Strength",
    0,
    200,
    gravityStrength,
    (value) => {
      gravityStrength = Number(value);
      // Update all force fields that use gravity
      const forceFields = world.ecs.get("ForceField");
      if (forceFields) {
        forceFields.forEach((field, id) => {
          // Only update attractors, not repellers
          if (field.type === "attractor") {
            field.strength = gravityStrength / 2;
          }
        });
      }
    }
  );

  // Speed multiplier
  let speedMultiplier = 1.0;
  createSlider(
    globalSection,
    "Speed Multiplier",
    0.1,
    3,
    speedMultiplier,
    (value) => {
      speedMultiplier = Number(value);
      // Update all entity transforms' maxSpeed
      const transforms = world.ecs.get("Transform");
      if (transforms) {
        transforms.forEach((transform) => {
          // Store original max speed if not already stored
          if (!transform.originalMaxSpeed) {
            transform.originalMaxSpeed = transform.maxSpeed;
          }
          transform.maxSpeed = transform.originalMaxSpeed * speedMultiplier;
        });
      }
    },
    0.1
  );

  // Entity counters
  const statsSection = createSection("Entity Stats");
  panelContainer.appendChild(statsSection);

  const statsContainer = document.createElement("div");
  statsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 10px;
  `;

  const attractorCounter = createCounter(statsContainer, "Attractors", "🧲");
  const repellerCounter = createCounter(statsContainer, "Repellers", "↔️");
  const followerCounter = createCounter(statsContainer, "Followers", "🔴");
  const obstacleCounter = createCounter(statsContainer, "Obstacles", "⬛");

  statsSection.appendChild(statsContainer);

  // Selected entity properties section
  const entitySection = createSection("Selected Entity");
  panelContainer.appendChild(entitySection);

  const noSelectionMsg = document.createElement("div");
  noSelectionMsg.textContent = "Click an entity to select it";
  noSelectionMsg.style.cssText = `
    font-size: 13px;
    color: #aaa;
    text-align: center;
    margin: 15px 0;
  `;
  entitySection.appendChild(noSelectionMsg);

  const entityControls = document.createElement("div");
  entityControls.style.display = "none";
  entitySection.appendChild(entityControls);

  // Entity selection
  let selectedEntityId = null;

  // Add selection handling
  window.mouseClicked = () => {
    // Check if we clicked on an entity
    const transforms = world.ecs.get("Transform");
    if (!transforms) return;

    let closestEntity = null;
    let closestDistance = Infinity;

    transforms.forEach((transform, id) => {
      const pos = transform.pos;
      const distance = dist(mouseX, mouseY, pos.x, pos.y);

      if (distance <= transform.radius && distance < closestDistance) {
        closestDistance = distance;
        closestEntity = id;
      }
    });

    if (closestEntity !== null) {
      selectedEntityId = closestEntity;
      updateEntityPanel(selectedEntityId);
    }
  };

  // Update entity panel with selected entity's properties
  function updateEntityPanel(entityId) {
    entityControls.innerHTML = ""; // Clear previous controls
    entityControls.style.display = "block";
    noSelectionMsg.style.display = "none";

    const transform = world.ecs.get("Transform").get(entityId);
    const forceField = world.ecs.get("ForceField")?.get(entityId);
    const tag = world.ecs.get("Tag")?.get(entityId);

    if (!transform) return;

    // Entity type header
    const typeHeader = document.createElement("h3");
    typeHeader.textContent = tag
      ? `${tag.value.charAt(0).toUpperCase() + tag.value.slice(1)}`
      : "Entity";
    typeHeader.style.cssText = `
      margin: 5px 0 15px 0;
      font-size: 14px;
      text-align: center;
    `;
    entityControls.appendChild(typeHeader);

    // Position display
    const posInfo = document.createElement("div");
    posInfo.textContent = `Position: (${Math.round(
      transform.pos.x
    )}, ${Math.round(transform.pos.y)})`;
    posInfo.style.cssText = `
      font-size: 12px;
      margin-bottom: 10px;
    `;
    entityControls.appendChild(posInfo);

    // Size control
    createSlider(entityControls, "Size", 5, 50, transform.radius, (value) => {
      transform.radius = Number(value);
    });

    // Force field properties if applicable
    if (forceField) {
      createSlider(
        entityControls,
        "Strength",
        -100,
        100,
        forceField.strength,
        (value) => {
          forceField.strength = Number(value);
        }
      );

      createSlider(
        entityControls,
        "Range Multiplier",
        1,
        5,
        forceField.rangeMul,
        (value) => {
          forceField.rangeMul = Number(value);
        },
        0.1
      );

      // Falloff type selector
      const falloffContainer = document.createElement("div");
      falloffContainer.style.cssText = `
        margin: 10px 0;
      `;

      const falloffLabel = document.createElement("label");
      falloffLabel.textContent = "Falloff Type: ";
      falloffLabel.style.fontSize = "13px";
      falloffContainer.appendChild(falloffLabel);

      const falloffSelect = document.createElement("select");
      falloffSelect.style.cssText = `
        background: rgba(60, 60, 60, 0.7);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 5px;
        width: 120px;
        margin-left: 5px;
      `;

      const falloffTypes = ["linear", "invSq", "exp"];
      falloffTypes.forEach((type) => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent =
          type === "invSq"
            ? "Inverse Square"
            : type === "exp"
            ? "Exponential"
            : "Linear";
        option.selected = forceField.falloff === type;
        falloffSelect.appendChild(option);
      });

      falloffSelect.onchange = () => {
        forceField.falloff = falloffSelect.value;
      };

      falloffContainer.appendChild(falloffSelect);
      entityControls.appendChild(falloffContainer);
    }

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete Entity";
    deleteButton.style.cssText = `
      background: rgba(200, 60, 60, 0.7);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px;
      margin-top: 15px;
      width: 100%;
      cursor: pointer;
    `;
    deleteButton.onclick = () => {
      world.ecs.remove(entityId);
      selectedEntityId = null;
      entityControls.style.display = "none";
      noSelectionMsg.style.display = "block";
    };
    entityControls.appendChild(deleteButton);
  }

  // Update entity counters every second
  setInterval(() => {
    const tags = world.ecs.get("Tag");
    if (!tags) return;

    let attractors = 0;
    let repellers = 0;
    let followers = 0;

    tags.forEach((tag) => {
      switch (tag.value) {
        case "attractor":
          attractors++;
          break;
        case "repeller":
          repellers++;
          break;
        case "follower":
          followers++;
          break;
      }
    });

    const obstacles = world.ecs.get("ObstacleTag")?.size || 0;

    attractorCounter.textContent = attractors;
    repellerCounter.textContent = repellers;
    followerCounter.textContent = followers;
    obstacleCounter.textContent = obstacles;

    // If selected entity was deleted, update the panel
    if (
      selectedEntityId !== null &&
      !world.ecs.entities.has(selectedEntityId)
    ) {
      selectedEntityId = null;
      entityControls.style.display = "none";
      noSelectionMsg.style.display = "block";
    }

    // Update position for selected entity if it exists
    if (selectedEntityId !== null) {
      const transform = world.ecs.get("Transform").get(selectedEntityId);
      if (transform) {
        const posInfo = entityControls.querySelector("div");
        if (posInfo) {
          posInfo.textContent = `Position: (${Math.round(
            transform.pos.x
          )}, ${Math.round(transform.pos.y)})`;
        }
      }
    }
  }, 1000);

  // Rules section
  const rulesSection = createSection("Rules");
  panelContainer.appendChild(rulesSection);

  const rulesInfo = document.createElement("div");
  rulesInfo.textContent = "Create rules to define entity interactions";
  rulesInfo.style.cssText = `
    font-size: 12px;
    color: #aaa;
    margin-bottom: 10px;
  `;
  rulesSection.appendChild(rulesInfo);

  // Add rule button
  const addRuleBtn = document.createElement("button");
  addRuleBtn.textContent = "Add Rule";
  addRuleBtn.style.cssText = `
    background: #4a80bd;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    cursor: pointer;
    width: 100%;
    margin-bottom: 10px;
    font-size: 13px;
  `;
  rulesSection.appendChild(addRuleBtn);

  // Rules list container
  const rulesListContainer = document.createElement("div");
  rulesListContainer.style.cssText = `
    max-height: 200px;
    overflow-y: auto;
  `;
  rulesSection.appendChild(rulesListContainer);

  // Handle adding a rule
  addRuleBtn.addEventListener("click", () => {
    showRuleDialog(world, (rule) => {
      world.addRule(rule);
      updateRulesList();
    });
  });

  // Update the rules list display
  function updateRulesList() {
    rulesListContainer.innerHTML = "";

    if (!world.rules || world.rules.length === 0) {
      const noRulesMsg = document.createElement("div");
      noRulesMsg.textContent = "No rules defined";
      noRulesMsg.style.cssText = `
        font-size: 12px;
        color: #aaa;
        text-align: center;
        margin: 10px 0;
      `;
      rulesListContainer.appendChild(noRulesMsg);
      return;
    }

    world.rules.forEach((rule, index) => {
      const ruleItem = document.createElement("div");
      ruleItem.style.cssText = `
        background: rgba(60, 60, 60, 0.5);
        border-radius: 4px;
        padding: 8px 10px;
        margin-bottom: 5px;
        font-size: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;

      // Rule description
      const ruleDesc = document.createElement("div");
      ruleDesc.textContent = formatRuleDescription(rule);
      ruleItem.appendChild(ruleDesc);

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "×";
      deleteBtn.style.cssText = `
        background: none;
        border: none;
        color: #ff6b6b;
        font-size: 16px;
        cursor: pointer;
        padding: 0 5px;
      `;
      deleteBtn.addEventListener("click", () => {
        world.removeRule(index);
        updateRulesList();
      });
      ruleItem.appendChild(deleteBtn);

      rulesListContainer.appendChild(ruleItem);
    });
  }

  // Format rule for display
  function formatRuleDescription(rule) {
    const condition = rule.if;
    const action = rule.then;

    let conditionText = "";
    if (condition.type === "collision") {
      conditionText = `When ${condition.tagA} hits ${condition.tagB}`;
    }

    let actionText = "";
    if (action.type === "destroy") {
      actionText = `destroy ${action.target}`;
    } else if (action.type === "spawn") {
      actionText = `spawn new entity`;
    }

    return `${conditionText} → ${actionText}`;
  }

  // Initial rules list update
  updateRulesList();

  // Helper function to create sliders
  function createSlider(parent, label, min, max, value, onChange, step = 1) {
    const container = document.createElement("div");
    container.style.cssText = `
      margin-bottom: 10px;
    `;

    const labelEl = document.createElement("label");
    labelEl.textContent = `${label}: ${value}`;
    labelEl.style.fontSize = "13px";
    container.appendChild(labelEl);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.style.cssText = `
      width: 100%;
      margin-top: 5px;
    `;

    slider.oninput = () => {
      labelEl.textContent = `${label}: ${slider.value}`;
      onChange(slider.value);
    };

    container.appendChild(slider);
    parent.appendChild(container);

    return container;
  }

  // Helper function to create a section with header
  function createSection(title) {
    const section = document.createElement("div");
    section.style.cssText = `
      margin-bottom: 20px;
    `;

    const header = document.createElement("h3");
    header.textContent = title;
    header.style.cssText = `
      font-size: 14px;
      margin: 5px 0;
      color: #ddd;
    `;

    section.appendChild(header);
    return section;
  }

  // Helper function to create entity counters
  function createCounter(parent, label, icon) {
    const counterContainer = document.createElement("div");
    counterContainer.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const counterLabel = document.createElement("span");
    counterLabel.textContent = `${icon} ${label}:`;
    counterLabel.style.fontSize = "13px";

    const counterValue = document.createElement("span");
    counterValue.textContent = "0";
    counterValue.style.fontSize = "13px";

    counterContainer.appendChild(counterLabel);
    counterContainer.appendChild(counterValue);
    parent.appendChild(counterContainer);

    return counterValue;
  }

  return panelContainer; // Return for potential reference
}

// Rule creation dialog
function showRuleDialog(world, onAddRule) {
  // Create dialog overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;
  document.body.appendChild(overlay);

  // Create dialog
  const dialog = document.createElement("div");
  dialog.style.cssText = `
    background: #2a2a2a;
    border-radius: 8px;
    padding: 20px;
    width: 320px;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
  `;
  overlay.appendChild(dialog);

  // Dialog title
  const dialogTitle = document.createElement("h3");
  dialogTitle.textContent = "Create New Rule";
  dialogTitle.style.cssText = `
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 16px;
    color: white;
    text-align: center;
  `;
  dialog.appendChild(dialogTitle);

  // Condition section
  const conditionSection = document.createElement("div");
  conditionSection.style.marginBottom = "15px";
  dialog.appendChild(conditionSection);

  const conditionLabel = document.createElement("div");
  conditionLabel.textContent = "When:";
  conditionLabel.style.marginBottom = "5px";
  conditionSection.appendChild(conditionLabel);

  // Currently only supporting collision conditions
  const typeSelect = document.createElement("select");
  typeSelect.innerHTML = `<option value="collision">Collision Between</option>`;
  typeSelect.style.cssText = `
    width: 100%;
    padding: 6px;
    background: #444;
    color: white;
    border: none;
    border-radius: 4px;
    margin-bottom: 10px;
  `;
  conditionSection.appendChild(typeSelect);

  // Entity type selectors
  const entityRow = document.createElement("div");
  entityRow.style.cssText = `
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  `;
  conditionSection.appendChild(entityRow);

  const entityTypes = ["attractor", "repeller", "follower", "obstacle"];

  const entityASelect = document.createElement("select");
  entityASelect.style.cssText = `
    flex: 1;
    padding: 6px;
    background: #444;
    color: white;
    border: none;
    border-radius: 4px;
  `;
  entityTypes.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    entityASelect.appendChild(option);
  });
  entityRow.appendChild(entityASelect);

  const andLabel = document.createElement("div");
  andLabel.textContent = "and";
  andLabel.style.padding = "6px 0";
  entityRow.appendChild(andLabel);

  const entityBSelect = document.createElement("select");
  entityBSelect.style.cssText = `
    flex: 1;
    padding: 6px;
    background: #444;
    color: white;
    border: none;
    border-radius: 4px;
  `;
  entityTypes.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    entityBSelect.appendChild(option);
  });
  entityRow.appendChild(entityBSelect);

  // Action section
  const actionSection = document.createElement("div");
  actionSection.style.marginBottom = "15px";
  dialog.appendChild(actionSection);

  const actionLabel = document.createElement("div");
  actionLabel.textContent = "Then:";
  actionLabel.style.marginBottom = "5px";
  actionSection.appendChild(actionLabel);

  const actionSelect = document.createElement("select");
  actionSelect.innerHTML = `
    <option value="destroy">Destroy Entity</option>
    <option value="spawn">Spawn New Entity</option>
  `;
  actionSelect.style.cssText = `
    width: 100%;
    padding: 6px;
    background: #444;
    color: white;
    border: none;
    border-radius: 4px;
    margin-bottom: 10px;
  `;
  actionSection.appendChild(actionSelect);

  // Target selector (for destroy action)
  const targetRow = document.createElement("div");
  targetRow.style.cssText = `
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  `;
  actionSection.appendChild(targetRow);

  const targetLabel = document.createElement("div");
  targetLabel.textContent = "Which one:";
  targetLabel.style.padding = "6px 0";
  targetRow.appendChild(targetLabel);

  const targetSelect = document.createElement("select");
  targetSelect.innerHTML = `
    <option value="a">First Entity</option>
    <option value="b">Second Entity</option>
  `;
  targetSelect.style.cssText = `
    flex: 1;
    padding: 6px;
    background: #444;
    color: white;
    border: none;
    border-radius: 4px;
  `;
  targetRow.appendChild(targetSelect);

  // Show/hide target selector based on action
  actionSelect.addEventListener("change", () => {
    targetRow.style.display =
      actionSelect.value === "destroy" ? "flex" : "none";
  });

  // Button row
  const buttonRow = document.createElement("div");
  buttonRow.style.cssText = `
    display: flex;
    gap: 10px;
    margin-top: 20px;
  `;
  dialog.appendChild(buttonRow);

  // Cancel button
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.cssText = `
    flex: 1;
    padding: 8px;
    background: #666;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  cancelBtn.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
  buttonRow.appendChild(cancelBtn);

  // Add rule button
  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Rule";
  addBtn.style.cssText = `
    flex: 1;
    padding: 8px;
    background: #4a80bd;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  addBtn.addEventListener("click", () => {
    // Create rule from selections
    const rule = {
      if: {
        type: typeSelect.value,
        tagA: entityASelect.value,
        tagB: entityBSelect.value,
      },
      then: {
        type: actionSelect.value,
        target:
          actionSelect.value === "destroy" ? targetSelect.value : undefined,
      },
    };

    onAddRule(rule);
    document.body.removeChild(overlay);
  });
  buttonRow.appendChild(addBtn);
}
