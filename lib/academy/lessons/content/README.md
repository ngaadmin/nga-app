# Lesson content

**Authors:** spreadsheet only → **[templates/lesson-authoring/INSTRUCTIONS.md](../../../templates/lesson-authoring/INSTRUCTIONS.md)**

A scored screen needs Error text for Explorer, Pathfinder, and Maverick. A miss empties the header coin meter. See **[docs/lesson-authoring.md](../../../docs/lesson-authoring.md)**.

**Developers:** screen type inventory → **[docs/academy-screen-types.md](../../../docs/academy-screen-types.md)**

Two files to fill: `Lesson-Details.csv` + `Screens.csv`

```bash
npm run lesson:import -- path/to/your-folder          # preview
npm run lesson:import -- path/to/your-folder --install  # dev only
```

Reference: `Characters.csv` · `Game-Types.csv` · `example-m1-l1/`
