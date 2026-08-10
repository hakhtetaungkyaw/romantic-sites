# Project Context

## 4. Component Registry

`components/shared/` is organized into category subfolders — hero/, gallery/,
message/, countdown/, timeline/, ambient/, interactive/, closing/ — and every
component in there (plus both templates in `components/templates/`) is documented
in `components/REGISTRY.md`: its folder/category, which template(s) use it, a
one-line style description, and its props.

**Convention:** update `components/REGISTRY.md` every time a shared component is
added, removed, moved, or repurposed. When adding a genuinely new kind of
component, put it in the subfolder matching what it *does* (not which template it
belongs to); only add a new subfolder if none of the existing eight fit. This keeps
the registry a reliable map of what exists without having to read every component
file to find the right one.

## 7. Patterns & Conventions

Hydration-safety pattern (established): any component whose values differ between
server render and client render (Math.random layouts, Date.now countdowns, etc.) uses
useSyncExternalStore with a static server snapshot (empty list / zeros) and a
client-side subscribe that updates post-hydration. See ambient/FloatingHearts.tsx and
countdown/Simple.tsx for reference implementations. Use this same pattern for any future
client-dynamic component (clocks, live counters, randomized layouts).
