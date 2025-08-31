import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node as RFNode,
  Edge as RFEdge,
  ReactFlowProvider,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import './styles.css';

export type Node = { id: string; label: string; type?: string };
export type Edge = { from: string; to: string; label?: string };

const nodeWidth = 260;
const nodeHeight = 96;

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'LR') {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction });

  nodes.forEach((n) => g.setNode(n.id, { width: nodeWidth, height: nodeHeight }));
  edges.forEach((e) => g.setEdge(e.from, e.to));

  dagre.layout(g);

    const layoutedNodes: RFNode[] = nodes.map((n) => {
    const nodeWithPosition = g.node(n.id);
    return {
      id: n.id,
      type: (n as any).kpis ? 'kpi' : 'rect',
      className: (n as any).kpis ? 'kpi-node' : 'rect-node',
      data: { label: n.label, kpis: (n as any).kpis, _threshold: (n as any)._threshold },
      position: { x: nodeWithPosition.x - nodeWidth / 2, y: nodeWithPosition.y - nodeHeight / 2 },
      style: { width: nodeWidth, height: nodeHeight },
    } as RFNode;
  });

  const layoutedEdges: RFEdge[] = edges.map((e) => ({
    id: `e-${e.from}-${e.to}`,
    source: e.from,
    target: e.to,
    label: e.label,
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

// KPI node renderer
const KpiNode: React.FC<any> = ({ data }) => {
  const k = data.kpis || {};
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div className="kpi-title">{data.label}</div>
        <div className="kpi-badges">
          <div className={`badge ${k.errors > (data._threshold ?? 10) ? 'badge-danger' : 'badge-ok'}`}>
            {k.errors ?? 0}
          </div>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi-item">
          <div className="kpi-value">{k.active ?? '-'}</div>
          <div className="kpi-label">active</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-value">{k.errors ?? '-'}</div>
          <div className="kpi-label">errors</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-value">{k.avg_ms ?? '-'} ms</div>
          <div className="kpi-label">avg</div>
        </div>
        <div className="kpi-spark">
          <Sparkline values={k.history} value={k.active} />
        </div>
      </div>
    </div>
  );
};

const RectNode: React.FC<any> = ({ data }) => {
  return (
    <div className="nice-card">
      <div className="nice-title">{data.label}</div>
    </div>
  );
};

const Sparkline: React.FC<{ values?: number[]; value?: number }> = ({ values, value }) => {
  // simple sparkline: if values not provided, synthesize from value
  let pts = values && values.length ? values.slice(-16) : [];
  if (!pts.length) {
    const base = (value || 0);
    for (let i = 0; i < 12; i++) pts.push(Math.max(0, Math.round(base + (Math.random() - 0.5) * base * 0.2)));
  }
  const w = 96;
  const h = 28;
  const max = Math.max(...pts, 1);
  const step = w / Math.max(pts.length - 1, 1);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step},${h - (p / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="sparkline">
      <path d={path} fill="none" stroke="var(--edge)" strokeWidth={2} strokeOpacity={0.9} />
    </svg>
  );
};

export const SimpleFlowPanel: React.FC<any> = ({ options, data, width, height }) => {
  const [nodes, setNodes] = useState<RFNode[]>([]);
  const [edges, setEdges] = useState<RFEdge[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (options && options.theme) {
      return options.theme === 'dark' ? 'dark' : 'light';
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const loadAndLayout = useCallback(async () => {
    const candidates = [
      '/public/plugins/solmon-pflow-panel/data/order-flow.json', // Grafana plugin public path
      '/data/order-flow.json', // root-relative
      '/dev/data/order-flow.json', // dev server copy
      './data/order-flow.json', // relative
    ];

    for (const url of candidates) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          continue;
        }
  const j = await res.json();
  // inject threshold from options into nodes
  const threshold = (options && options.errorThreshold) || 10;
  const rawNodes = (j.nodes || []).map((nd: any) => ({ ...nd, _threshold: threshold }));
  const { nodes: n, edges: e } = getLayoutedElements(rawNodes, j.edges || []);
        setNodes(n);
        setEdges(e);
        return;
      } catch (err) {
        // try next
        continue;
      }
    }

    // nothing found
    setNodes([]);
    setEdges([]);
  }, []);

  useEffect(() => {
    loadAndLayout();
  }, [loadAndLayout]);

  useEffect(() => {
    // keep in sync with OS preference unless user set options.theme
    if (options && options.theme) {
      return;
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (ev: MediaQueryListEvent) => setTheme(ev.matches ? 'dark' : 'light');
      // older browsers use addListener
      if ((mq as any).addEventListener) {
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
      }
      (mq as any).addListener && (mq as any).addListener(handler);
      return () => (mq as any).removeListener && (mq as any).removeListener(handler);
    }
  }, [options]);

  const nodeTypes = { kpi: KpiNode, rect: RectNode };

  return (
    <div className={`pflow-root theme-${theme}`} style={{ width, height }}>
      <ReactFlowProvider>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView attributionPosition="bottom-left">
          <Background />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default SimpleFlowPanel;
