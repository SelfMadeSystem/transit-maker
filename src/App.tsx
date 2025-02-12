import './App.css';
import { EditorProvider } from './EditorProvider';
import { Editor } from './components/Editor';
import { ContextMenuContainer } from './components/context-menu/ContextMenu';

function App() {
  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center">
      <ContextMenuContainer />
      <EditorProvider>
        <Editor />
      </EditorProvider>
    </div>
  );
}

export default App;
