import React from 'react';
import { createRoot } from 'react-dom/client';
import SimpleFlowPanel from '../src/panel';
import '../src/styles.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <div style={{height: '100%'}}>
    <SimpleFlowPanel width={window.innerWidth} height={window.innerHeight} />
  </div>
);
