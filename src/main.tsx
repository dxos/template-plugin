//
// Copyright 2023 DXOS.org
//

import React from 'react';
import { createRoot } from 'react-dom/client';

import { ClientPlugin } from '@braneframe/plugin-client';
import { DndPlugin } from '@braneframe/plugin-dnd';
import { ErrorPlugin } from '@braneframe/plugin-error';
import { GraphPlugin } from '@braneframe/plugin-graph';
import { IntentPlugin } from '@braneframe/plugin-intent';
import { SpacePlugin } from '@braneframe/plugin-space';
import { SplitViewPlugin } from '@braneframe/plugin-splitview';
import { StackPlugin } from '@braneframe/plugin-stack';
import { ThemePlugin } from '@braneframe/plugin-theme';
import { TreeViewPlugin } from '@braneframe/plugin-treeview';
import { UrlSyncPlugin } from '@braneframe/plugin-url-sync';
import { TypedObject } from '@dxos/echo-schema';
import { PluginProvider } from '@dxos/react-surface';

import { SamplePlugin } from './sample-plugin';

// TODO(wittjosiah): This ensures that typed objects are not proxied by deepsignal. Remove.
// https://github.com/luisherranz/deepsignal/issues/36
(globalThis as any)[TypedObject.name] = TypedObject;

createRoot(document.getElementById('root')!).render(
  <PluginProvider
    plugins={[
      IntentPlugin(),
      ThemePlugin({ appName: 'Test App' }),
      DndPlugin(),
      // Inside theme provider so that errors are styled.
      ErrorPlugin(),
      ClientPlugin(),
      GraphPlugin(),
      TreeViewPlugin(),
      UrlSyncPlugin(),
      SplitViewPlugin({ showComplementarySidebar: false }),
      SpacePlugin(),
      StackPlugin(),
      SamplePlugin(),
    ]}
  />
);
