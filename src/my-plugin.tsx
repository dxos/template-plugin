import { CompassTool, IconProps, Palette } from "@phosphor-icons/react";
import { effect } from "@preact/signals-react";
import React, { FC } from "react";

import { SPACE_PLUGIN, SpaceAction } from "@braneframe/plugin-space";
import { StackProvides } from "@braneframe/plugin-stack";
import { Folder } from "@braneframe/types";
import {
  GraphBuilderProvides,
  IntentResolverProvides,
  LayoutAction,
  MetadataRecordsProvides,
  parseIntentPlugin,
  PluginDefinition,
  resolvePlugin,
  SurfaceProvides,
  TranslationsProvides,
} from "@dxos/app-framework";
import { Expando, TypedObject, isTypedObject } from "@dxos/react-client/echo";
import { Button } from "@dxos/react-ui";

// --- View -------------------------------------------------------------------

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

const ColorMain: FC<{ object: Expando }> = ({ object }) => {
  const changeColor = (object: Expando) => {
    object.exclaim = getPositiveExclamation();
    object.color = getRandomColor();
  };

  return (
    <div
      style={{
        backgroundColor: object.color,
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        {object.exclaim && <p style={{ fontSize: "10vw" }}>{object.exclaim}</p>}
        <Button onClick={() => changeColor(object)}>Roll this color!</Button>
      </div>
    </div>
  );
};

const ColorSection: FC<{ object: Expando }> = ({ object }) => {
  return (
    <div
      style={{
        backgroundColor: object.color,
        minHeight: "100px",
        width: "100%",
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
        {object.color}
      </p>
    </div>
  );
};

// --- Helpers ----------------------------------------------------------------
const TYPE = "color";

const isColor = (object: TypedObject): boolean => {
  return (
    isTypedObject(object) &&
    object.type === TYPE &&
    typeof object.color === "string"
  );
};

// --- Plugin Definition ------------------------------------------------------
type MyPluginProvides = SurfaceProvides &
  IntentResolverProvides &
  GraphBuilderProvides &
  MetadataRecordsProvides &
  TranslationsProvides &
  StackProvides;

const PLUGIN_ID = "/color-plugin";

export const MyPluginMeta = {
  id: PLUGIN_ID,
  name: "Color Plugin",
  iconComponent: (props: IconProps) => <Palette {...props} />,
};

const PLUGIN_ACTION_NAME = `${PLUGIN_ID}/action`;

export enum MyPluginAction {
  CREATE = `${PLUGIN_ACTION_NAME}/create`,
}

export default function MyPlugin(): PluginDefinition<MyPluginProvides> {
  return {
    meta: MyPluginMeta,
    provides: {
      metadata: {
        records: {
          [TYPE]: {
            placeholder: ["color title placeholder", { ns: PLUGIN_ID }],
            icon: (props) => <Palette {...props} />,
          },
        },
      },
      translations: [
        {
          "en-US": {
            [PLUGIN_ID]: {
              "create object label": "Create a Color",
              "color title placeholder": "Color",
              "delete object label": "Delete Color",
              "rename object label": "Rename Color",
              "create stack section label": "Create a Color",
            },
          },
        },
      ],
      graph: {
        builder: ({ parent, plugins }) => {
          if (parent.data instanceof Folder) {
            const intentPlugin = resolvePlugin(plugins, parseIntentPlugin);

            parent.actionsMap[`${SPACE_PLUGIN}/create`]?.addAction({
              id: `${PLUGIN_ID}/create`,
              label: ["create object label", { ns: PLUGIN_ID }],
              icon: (props) => <Palette {...props} />,
              properties: {
                testId: "spacePlugin.createDocument",
                disposition: "toolbar",
              },
              invoke: () =>
                intentPlugin.provides.intent.dispatch([
                  {
                    plugin: PLUGIN_ID,
                    action: MyPluginAction.CREATE,
                  },
                  {
                    action: SpaceAction.ADD_OBJECT,
                    data: { target: parent.data },
                  },
                  {
                    action: LayoutAction.ACTIVATE,
                  },
                ]),
            });
          } else if (isTypedObject(parent.data) && isColor(parent.data)) {
            return effect(() => {
              parent.label = parent.data.color || [
                "color title placeholder",
                { ns: PLUGIN_ID },
              ];
            });
          }
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
              action: MyPluginAction.CREATE,
            },
          },
        ],
      },
      surface: {
        component: ({ data, role }) => {
          switch (role) {
            case "main":
              return isTypedObject(data.active) && isColor(data.active) ? (
                <ColorMain object={data.active} />
              ) : null;

            case "section":
              return isTypedObject(data.object) && isColor(data.object) ? (
                <ColorSection object={data.object} />
              ) : null;
          }

          return null;
        },
      },
      intent: {
        resolver: (intent) => {
          switch (intent.action) {
            case MyPluginAction.CREATE:
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
}
