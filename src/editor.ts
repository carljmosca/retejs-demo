import { createRoot } from "react-dom/client";
import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import {
  ConnectionPlugin,
  Presets as ConnectionPresets,
} from "rete-connection-plugin";
import { ReactPlugin, Presets, ReactArea2D } from "rete-react-plugin";
import {
  AutoArrangePlugin,
  Presets as ArrangePresets,
} from "rete-auto-arrange-plugin";
import {
  ContextMenuExtra,
  ContextMenuPlugin,
  Presets as ContextMenuPresets,
} from "rete-context-menu-plugin";
import { Input, Output } from "rete/_types/presets/classic";

import { Schemes, AreaExtra, NodeA, NodeB, NodeC, NodeASocket, NodeBSocket, NodeCSocket } from "./types";
import { LabeledTextControl, LabeledText } from "./LabeledTextControl";


export function getConnectionSockets(
  editor: NodeEditor<Schemes>,
  connection: Schemes["Connection"]
) {
  const source = editor.getNode(connection.source);
  const target = editor.getNode(connection.target);

  const output =
    source &&
    (source.outputs as Record<string, Input<ClassicPreset.Socket>>)[connection.sourceOutput];
  const input =
    target && (target.inputs as unknown as Record<string, Output<ClassicPreset.Socket>>)[connection.targetInput];

  return {
    source: output?.socket,
    target: input?.socket
  };
}

export function canCreateConnection(editor: NodeEditor<Schemes>, connection: Schemes["Connection"]) {
  const { source, target } = getConnectionSockets(editor, connection);

  return true;

  //return source && target && (source as any).isCompatibleWith(target);

}

const handleSaveFile = async (fileContents: string) => {
  try {
    const fileHandle = await window.showSaveFilePicker();
    const writable = await fileHandle.createWritable();
    await writable.write(fileContents);
    await writable.close();
  } catch (error) {
    console.error("Error saving file: ", error);
  }
}

export async function createEditor(container: HTMLElement) {
  const socket = new ClassicPreset.Socket("socket");
  const aSocket = new NodeASocket();
  const bSocket = new NodeBSocket();
  const cSocket = new NodeCSocket();

  // const cNode = new NodeC(cSocket);
  // cNode.label = "test";

  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });
  const arrange = new AutoArrangePlugin<Schemes>();
  const contextMenu = new ContextMenuPlugin<Schemes>({
    items: ContextMenuPresets.classic.setup([
      ["NodeA", () => new NodeA(bSocket)],
      ["Extra", [
        ["NodeB", () => new NodeB(bSocket, cSocket)],
        ["NodeC", () => new NodeC(cSocket)]
      ]],
    ]),
  });


  class ButtonControl extends ClassicPreset.Control {
    constructor(public label: string, public onClick: () => void) {
      super();
    }
  }

  class ProgressControl extends ClassicPreset.Control {
    constructor(public percent: number) {
      super();
    }
  }

  area.use(contextMenu);

  const contextMenu2 = new ContextMenuPlugin<Schemes>({
    items(context, plugin) {
      if (context === 'root') {
        return {
          searchBar: false,
          list: [
            { label: 'Log Custom', key: '1', handler: () => console.log('Custom') },
            {
              label: 'Collection', key: '11', handler: () => null,
              subitems: [
                { label: 'Export Graph', key: '2', handler: () => handleSaveFile(exportGraph(editor)) },
                { label: 'Import Graph', key: '3', handler: () => importGraph(editor, arrange, area) },

                { label: 'Log Subitem', key: '12', handler: () => alert('Subitem') },
                { label: 'Log Connections', key: '13', handler: () => console.log(editor.getConnections()) }
              ]
            }
          ]
        }
      }
      return {
        searchBar: false,
        list: [
        ]
      }
    }
  });

  area.use(contextMenu2)

  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl(),
  });

  render.addPreset(Presets.contextMenu.setup());
  render.addPreset(Presets.classic.setup());
  render.addPreset(
    Presets.classic.setup({
      customize: {
        control(data) {
          if (data.payload instanceof LabeledTextControl) {
            return LabeledText;
          }
          if (data.payload instanceof ClassicPreset.InputControl) {
            return Presets.classic.Control;
          }
          return null;
        }
      }
    })
  );

  connection.addPreset(ConnectionPresets.classic.setup());

  arrange.addPreset(ArrangePresets.classic.setup());

  editor.use(area);

  editor.addPipe((context) => {
    if (context.type === "connectioncreate") {
      if (!canCreateConnection(editor, context.data)) {
        alert("Sockets are not compatible");
        return;
      }
    }
    return context;
  });

  area.use(connection);
  area.use(render);
  area.use(arrange);

  AreaExtensions.simpleNodesOrder(area);

  // const a = new NodeA(bSocket);
  const b = new NodeB(bSocket, cSocket);
  const inputControl = new ClassicPreset.InputControl("number", {
    initial: 0,

  });

  b.addControl("input", inputControl);
  // await editor.addNode(a);
  
  await editor.addNode(b);

  // await editor.addConnection(new ClassicPreset.Connection(a, "a", b, "b"));

  await arrange.layout();
  AreaExtensions.zoomAt(area, editor.getNodes());

  return {
    destroy: () => area.destroy(),
  };
}

async function importGraph(
  editor: NodeEditor<Schemes>, 
  arrange: AutoArrangePlugin<Schemes>, 
  area: AreaPlugin<Schemes, AreaExtra>
) {

  try {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const fileStream = file.stream();
    const reader = fileStream.getReader();
    let data = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      data += new TextDecoder().decode(value);  
    }


    var e = JSON.parse(data);
    for (const node of e.nodes) {
      var addNode;
      addNode = new NodeB(new NodeBSocket(), new NodeCSocket()); 
      await editor.addNode(addNode);
      await arrange.layout();
    }
    for (const connection of e.connections) {
      console.log("adding connection: ", connection);
      await editor.addConnection(connection);
      await arrange.layout();
    }
    await arrange.layout();
    await AreaExtensions.zoomAt(area, editor.getNodes());
  } catch (error) {
    console.error("Error loading file: ", error);
  }

}

function exportGraph(editor: NodeEditor<Schemes>): string {
  return JSON.stringify(editor);
}
