import './App.css';
import { ContextMenuContainer } from './components/context-menu/ContextMenu';
import { MapCanvas } from './transit/MapCanvas';

function App() {
  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center">
      <ContextMenuContainer />
      <MapCanvas />
    </div>
  );
}

export default App;
