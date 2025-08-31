import React from 'react';
import { PanelPlugin } from '@grafana/data';
import { SimpleFlowPanel } from './panel';

export const plugin = new PanelPlugin(SimpleFlowPanel as any)
  .setPanelOptions((builder) =>
    builder
      .addRadio({
        path: 'theme',
        name: 'Theme',
        description: 'Light or dark theme for the panel',
        settings: {
          options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ],
        },
        defaultValue: 'light',
      })
      .addNumberInput({
        path: 'errorThreshold',
        name: 'Error threshold',
        description: 'Errors above this number will show a red badge',
        defaultValue: 10,
      })
  );

if (module && (module as any).hot) {
  (module as any).hot.accept();
}
