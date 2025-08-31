import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// We import the panel dynamically after mocking fetch

const sampleFlow = {
  nodes: [
    { id: 'n1', label: 'Start' },
    { id: 'n2', label: 'End' }
  ],
  edges: [{ from: 'n1', to: 'n2', label: 'toEnd' }]
};

vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ json: () => Promise.resolve(sampleFlow) })));

// React Flow uses layout in DOM; to avoid heavy rendering, mock ReactFlow components used by our panel
vi.mock('reactflow', async () => {
  const actual = await vi.importActual<any>('reactflow');
  return {
    ...actual,
    ReactFlow: ({ children, nodes }: any) => (
      <div data-testid="reactflow">
        {nodes && nodes.map((n: any) => <div key={n.id}>{n.data?.label || n.id}</div>)}
        {children}
      </div>
    ),
    ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
    Background: () => <div />,
    Controls: () => <div />,
  };
});

import { SimpleFlowPanel } from '../panel';

describe('SimpleFlowPanel', () => {
  it('loads flow and renders nodes', async () => {
    render(<SimpleFlowPanel width={800} height={600} />);

    await screen.findByTestId('reactflow');

    await screen.findByText('Start');
    await screen.findByText('End');
  });
});
