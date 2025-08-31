Grafana Process Flow Panel Plugin

This is a minimal Grafana panel plugin (React + TypeScript) that renders a static process flow (nodes and edges).

Files added:
- `plugin.json` - Grafana plugin manifest
- `src/module.tsx` - plugin entry and React component
- `src/styles.css` - minimal styles
- `data/order-flow.json` - static e-commerce order flow sample
- `tsconfig.json` - TypeScript config
- `.gitignore`

Build

This project uses esbuild to bundle. Install dev deps and run:

```bash
npm install
npm run build
```

After building, copy the `dist` folder into your Grafana plugins directory and restart Grafana.
