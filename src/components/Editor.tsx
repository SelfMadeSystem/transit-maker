import { EditorContext } from '../EditorContext';
import { HistoryUi } from './HistoryUi';
import { MapComponent } from './MapComponent';
import { SelectedUi } from './ui/SelectedUi';
import { useContext } from 'react';

export function Editor() {
  const ctx = useContext(EditorContext);

  return (
    <>
      <MapComponent props={ctx} />
      <div className="absolute top-0 left-0 w-fit rounded-br-2xl bg-white/10 p-2 backdrop-blur-md">
        <HistoryUi />
      </div>
      <div className="absolute top-0 right-0 max-h-[90vh] w-fit overflow-y-auto rounded-bl-2xl bg-white/10 p-2 backdrop-blur-md">
        <SelectedUi />
      </div>
    </>
  );
}
