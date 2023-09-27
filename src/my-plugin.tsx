//Base Plugins could have:
// - Adding an object to the graph
// - Providing a component to a surface
// - Throwing an intent
// - Handling an intent
// - could have other functionality in it, just commented out with no additional comments to explain how it works

import { Node, GraphProvides } from "@braneframe/plugin-graph";
import { IntentProvides } from "@braneframe/plugin-intent";
import { GraphNodeAdapter, SpaceAction } from "@braneframe/plugin-space";
import { TranslationsProvides } from "@braneframe/plugin-theme";
import { TreeViewAction } from "@braneframe/plugin-treeview";
import { DndPluginProvides } from "@braneframe/plugin-dnd";

import { Button } from "@dxos/aurora";
import {
  Expando,
  Space,
  SpaceProxy,
  TypedObject,
  isTypedObject,
} from "@dxos/react-client/echo";
import { PluginDefinition, findPlugin } from "@dxos/react-surface";
import { CompassTool, Palette, Plus } from "@phosphor-icons/react";
import React, { FC } from "react";
import { StackProvides } from "@braneframe/plugin-stack";

type MyPluginProvides = GraphProvides &
  IntentProvides &
  TranslationsProvides &
  StackProvides;

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
  parent: Node<Space>,
  object: Expando,
  index: string
): Node<Expando> => {
  const [child] = parent.addNode(PLUGIN_ID, {
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
  return (
    isTypedObject(object) &&
    object.type === "color" &&
    typeof object.color === "string"
  );
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
    ready: async (plugins) => {
      const dndPlugin = findPlugin<DndPluginProvides>(
        plugins,
        "dxos.org/plugin/dnd"
      );
      if (dndPlugin && dndPlugin.provides.dnd?.onSetTileSubscriptions) {
        dndPlugin.provides.dnd.onSetTileSubscriptions.push((tile, node) => {
          if (node && isColor(node.data)) {
            tile.copyClass = (tile.copyClass ?? new Set()).add("stack-section");
          }
          return tile;
        });
      }
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
      stack: {
        creators: [
          {
            id: "create-stack-section-color",
            testId: "color-plugin.createSectionSpaceColor",
            label: ["create stack section label", { ns: PLUGIN_ID }],
            icon: (props: any) => <CompassTool {...props} />,
            intent: {
              plugin: PLUGIN_ID,
              action: PluginAction.CREATE,
            },
          },
        ],
        choosers: [
          {
            id: "choose-stack-section-color", // TODO(burdon): Standardize.
            testId: "color-plugin.createSectionSpaceColor",
            label: ["choose stack section label", { ns: PLUGIN_ID }],
            icon: (props: any) => <CompassTool {...props} />,
            filter: isColor,
          },
        ],
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
          case "section": {
            if (isTypedObject(data) && isColor(data)) {
              return () => (
                <div
                  style={{
                    backgroundColor: data.color,
                    minHeight: "100px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    {data.color}
                  </p>
                </div>
              );
            }
            break;
          }
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
