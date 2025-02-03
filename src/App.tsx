import { EditorProvider } from "./EditorProvider";
import { Editor } from "./components/Editor";

function App() {
  return (
    <div className="w-full h-full min-h-screen flex justify-center items-center">
      <EditorProvider>
        <Editor />
      </EditorProvider>
    </div>
  );
}

export default App;
