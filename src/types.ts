import { createRoot } from "react-dom/client";
import { GetSchemes, ClassicPreset } from "rete";
import { ReactArea2D } from "rete-react-plugin";
import {
    ContextMenuExtra,
} from "rete-context-menu-plugin";
import { LabeledTextControl } from "./LabeledTextControl";

class Connection<
  A extends Node,
  B extends Node
> extends ClassicPreset.Connection<A, B> {}

export type Node = NodeA | NodeB;
export type Schemes = GetSchemes<Node, Connection<Node, Node>>;
export type AreaExtra = ReactArea2D<Schemes> | ContextMenuExtra;

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

export class NodeA extends ClassicPreset.Node {
    height = 140;
    width = 200;

    constructor(socket: NodeBSocket) {
        super("NodeA");

        this.addControl("a", new ClassicPreset.InputControl("text", {}));
        this.addOutput("a", new ClassicPreset.Output(socket));
    }
}

export class NodeB extends ClassicPreset.Node<
{ [key in string]: ClassicPreset.Socket },
{ [key in string]: ClassicPreset.Socket },
{
  [key in string]:
    | LabeledTextControl
    | ClassicPreset.Control
    | ClassicPreset.InputControl<"number">
    | ClassicPreset.InputControl<"text">;
}
> {
    height = 180;
    width = 200;

    constructor(inSocket: NodeBSocket, outSocket: NodeCSocket) {
        super("NodeB");

        this.addControl("b", new LabeledTextControl("my value", false));
        this.addControl("b2", new ClassicPreset.InputControl("text", {}));
        this.addInput("b", new ClassicPreset.Input(inSocket));
        this.addOutput("c", new ClassicPreset.Output(outSocket));
    }
}

export class NodeC extends ClassicPreset.Node {
    height = 140;
    width = 200;

    constructor(inSocket: NodeCSocket) {
        super("NodeC");

        this.addControl("c", new ClassicPreset.InputControl("text", {}));
        this.addInput("c", new ClassicPreset.Input(inSocket));
    }
}
