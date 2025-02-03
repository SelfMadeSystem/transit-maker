import './App.css';
import { EditorProvider } from './EditorProvider';
import { Editor } from './components/Editor';

function App() {
  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center">
      <EditorProvider>
        <Editor />
      </EditorProvider>
    </div>
  );
}

export default App;
