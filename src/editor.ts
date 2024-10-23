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

type Node = NodeA | NodeB;
type Schemes = GetSchemes<Node, Connection<Node, Node>>;
type AreaExtra = ReactArea2D<Schemes> | ContextMenuExtra;

export class NodeASocket extends ClassicPreset.Socket {
  constructor() {
    super("NodeASocket");
  }

  isCompatibleWith(socket: ClassicPreset.Socket) {
    return socket instanceof NodeASocket;
  }
}

export class NodeBSocket extends ClassicPreset.Socket {
  constructor() {
    super("NodeBSocket");
  }

  isCompatibleWith(socket: any) {
    return socket instanceof NodeBSocket;
  }
}

export class NodeCSocket extends ClassicPreset.Socket {
  constructor() {
    super("NodeCSocket");
  }

  isCompatibleWith(socket: ClassicPreset.Socket) {
    return socket instanceof NodeCSocket;
  }
}

class NodeA extends ClassicPreset.Node {
  height = 140;
  width = 200;

  constructor(socket: NodeBSocket) {
    super("NodeA");

    this.addControl("a", new ClassicPreset.InputControl("text", {}));
    this.addOutput("a", new ClassicPreset.Output(socket));
  }
}

class NodeB extends ClassicPreset.Node {
  height = 140;
  width = 200;

  constructor(inSocket: NodeBSocket, outSocket: NodeCSocket) {
    super("NodeB");

    this.addControl("b", new ClassicPreset.InputControl("text", {}));
    this.addInput("b", new ClassicPreset.Input(inSocket));
    this.addOutput("c", new ClassicPreset.Output(outSocket));
  }
}

class NodeC extends ClassicPreset.Node {
  height = 140;
  width = 200;

  constructor(inSocket: NodeBSocket) {
    super("NodeC");

    this.addControl("b", new ClassicPreset.InputControl("text", {}));
    this.addInput("b", new ClassicPreset.Input(inSocket));
  }
}

class Connection<
  A extends Node,
  B extends Node
> extends ClassicPreset.Connection<A, B> {}

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

    return source && target && (source as any).isCompatibleWith(target);

}

export async function createEditor(container: HTMLElement) {
  const socket = new ClassicPreset.Socket("socket");
  const aSocket = new NodeASocket();
  const bSocket = new NodeBSocket();
  const cSocket = new NodeCSocket();

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

  area.use(contextMenu);

  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl(),
  });

  render.addPreset(Presets.contextMenu.setup());
  render.addPreset(Presets.classic.setup());

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
  // const b = new NodeB(bSocket, cSocket);

  // await editor.addNode(a);
  // await editor.addNode(b);

  // await editor.addConnection(new ClassicPreset.Connection(a, "a", b, "b"));

  await arrange.layout();
  AreaExtensions.zoomAt(area, editor.getNodes());

  return {
    destroy: () => area.destroy(),
  };
}
