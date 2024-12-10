import { useRete } from "rete-react-plugin";
import { createEditor } from "./editor";

declare global {
  interface Window {
    showSaveFilePicker: () => Promise<any>
    showOpenFilePicker: () => Promise<any>
  }
}

export default function App() {
  const [ref] = useRete(createEditor);

  return (
    <div className="App">
      <div ref={ref} style={{ height: "100vh", width: "100vw" }}></div>
    </div>
  );
}
