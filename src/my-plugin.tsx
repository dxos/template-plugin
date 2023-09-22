//Base Plugins could have:
// - Adding an object to the graph
// - Providing a component to a surface
// - Throwing an intent
// - Handling an intent
// - could have other functionality in it, just commented out with no additional comments to explain how it works

import { Graph, GraphProvides } from "@braneframe/plugin-graph";
import { IntentProvides } from "@braneframe/plugin-intent";
import { GraphNodeAdapter, SpaceAction } from "@braneframe/plugin-space";
import { TranslationsProvides } from "@braneframe/plugin-theme";
import { TreeViewAction } from "@braneframe/plugin-treeview";
import { Button } from "@dxos/aurora";
import { Expando, Space, SpaceProxy, TypedObject, isTypedObject } from "@dxos/react-client/echo";
import { PluginDefinition } from "@dxos/react-surface";
import { Palette, Plus } from "@phosphor-icons/react";
import React, { FC } from "react";

type MyPluginProvides = GraphProvides & IntentProvides & TranslationsProvides;

const PLUGIN_ID = "color-plugin";

// prettier-ignore
const niceColors = [ "royalblue", "skyblue", "lightblue", "deepskyblue", "cadetblue", "palevioletred", "orchid", "mediumorchid", "violet", "mediumpurple", "rebeccapurple", "mediumseagreen", "seagreen", "limegreen", "palegreen", "springgreen", "darkseagreen", "olive", "darkolivegreen", "goldenrod", "darkgoldenrod", "chocolate", "saddlebrown", "firebrick", "tomato", ];
const getRandomColor = () => {
  return niceColors[Math.floor(Math.random() * niceColors.length)];
};

// prettier-ignore
const positiveExclamations = [ "Fantastic!", "Well done!", "Great job!", "Outstanding!", "Impressive!", "Bravo!", "Excellent!", "Superb!", "Amazing!", "Incredible!", ];
const getPositiveExclamation = () => {
  return positiveExclamations[
    Math.floor(Math.random() * positiveExclamations.length)
  ];
};

const PLUGIN_ACTION = `${PLUGIN_ID}/action`;

export enum PluginAction {
  CREATE = `${PLUGIN_ACTION}/create`,
}

export const objectToGraphNode = (
  parent: Graph.Node<Space>,
  object: Expando,
  index: string
): Graph.Node<Expando> => {
  const [child] = parent.add({
    id: object.id,
    label: `${object.color}`,
    icon: (props) => <Palette color={object.color} {...props} />,
    data: object,
    properties: {
      index: object.meta && object.meta.index ? object.meta.index : index,
      persistenceClass: "spaceObject",
    },
  });

  return child;
};

const ColorMain: FC<{ data: Expando }> = ({ data }) => {
  const changeColor = (object: Expando) => {
    object.exclaim = getPositiveExclamation();
    object.color = getRandomColor();
  };

  return (
    <div
      style={{
        backgroundColor: data.color,
        height: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        {data.exclaim && <p style={{ fontSize: "10vw" }}>{data.exclaim}</p>}
        <Button onClick={() => changeColor(data)}>Roll this color!</Button>
      </div>
    </div>
  );
};

const isColor = (object: TypedObject): boolean => {
  return object.type === "color" && typeof object.color === "string";
};

export const MyPlugin = (): PluginDefinition<MyPluginProvides> => {
  const adapter = new GraphNodeAdapter({
    filter: (object: Expando) => isColor(object),
    adapter: objectToGraphNode,
  });

  return {
    meta: {
      id: PLUGIN_ID,
    },
    unload: async () => {
      adapter.clear();
    },
    provides: {
      translations: [
        {
          "en-US": {
            [PLUGIN_ID]: {
              "create object label": "Create a Color",
              "color title placeholder": "Color",
              "delete object label": "Delete Color",
              "rename object label": "Rename Color",
            },
          },
        },
      ],
      graph: {
        nodes: (parent) => {
          if (!(parent.data instanceof SpaceProxy)) {
            return;
          }

          const space = parent.data;

          parent.addAction({
            id: `${PLUGIN_ID}/create`,
            label: ["create object label", { ns: PLUGIN_ID }],
            icon: (props) => <Plus {...props} />,
            properties: {
              testId: "spacePlugin.createDocument",
              disposition: "toolbar",
            },
            intent: [
              {
                plugin: PLUGIN_ID,
                action: PluginAction.CREATE,
              },
              {
                action: SpaceAction.ADD_OBJECT,
                data: { spaceKey: space.key.toHex() },
              },
              {
                action: TreeViewAction.ACTIVATE,
              },
            ],
          });

          return adapter?.createNodes(space, parent);
        },
      },
      component: (data, role) => {
        if (!data || typeof data !== "object") {
          return null;
        }

        switch (role) {
          case "main": {
            if (isTypedObject(data) && isColor(data)) {
              return ColorMain;
            }
            break;
          }
          // Waiting on universal drag-n-drop support!
          // case "section": {
          //   if (isColor(data)) {
          //     return () => <div>Color Section</div>;
          //   }
          //   break;
          // }
        }

        return null;
      },
      intent: {
        resolver: (intent) => {
          switch (intent.action) {
            case PluginAction.CREATE:
              return {
                object: new Expando({
                  type: "color",
                  color: getRandomColor(),
                  exclaim: getPositiveExclamation(),
                }),
              };
          }
        },
      },
    },
  };
};
