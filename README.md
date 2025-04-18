# BlobVerse ECS Scaffold

Opinionated plain ES‑modules-based scaffold for building p5.js games with an ECS pattern.

## Project Structure

```
blobverse/
├─ index.html
├─ README.md
├─ src/
│  ├─ main.js
│  ├─ styles/
│  │   └─ main.css
│  ├─ engine/
│  │   ├─ ecs.js
│  │   ├─ world.js
│  │   └─ systems/
│  │       ├─ physics.js
│  │       ├─ force.js
│  │       ├─ path.js
│  │       ├─ collision.js
│  │       └─ render.js
│  └─ game/
│     ├─ constants.js
│     ├─ prefabs.js
│     ├─ ruleSystem.js
│     └─ ui/
│         ├─ toolbar.js
│         └─ paramPanel.js
└─ assets/
   └─ icons/
```

## Getting Started

Serve via any HTTP server (VSCode Live Server, `python -m http.server`, etc.) and open in browser.

## Next Steps

1. Implement engine systems (force, path, collision, render).
2. Populate UI modules (`toolbar.js`, `paramPanel.js`).
3. Add ruleSystem logic and wire into `world.addSystem`.
4. Extend game logic (prefabs, saving/loading).
