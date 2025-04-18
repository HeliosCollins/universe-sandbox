// Tiny entity‑component store — no classes, just Maps
export const createECS = () => ({
  nextId: 1,
  entities: new Set(),
  comps: new Map(), // compType -> Map<id,comp>
  createEntity() {
    const id = this.nextId++;
    this.entities.add(id);
    return id;
  },
  add(id, type, data) {
    if (!this.comps.has(type)) this.comps.set(type, new Map());
    this.comps.get(type).set(id, data);
  },
  get(type) {
    return this.comps.get(type) ?? new Map();
  },
  remove(id) {
    this.entities.delete(id);
    for (const m of this.comps.values()) m.delete(id);
  },
});
