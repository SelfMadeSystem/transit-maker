import { EditorContext } from '../../EditorContext';
import { Label } from '../../transit/Label';
import { TransitConnection } from '../../transit/TransitConnection';
import { TransitStop } from '../../transit/TransitStop';
import { LabelUi } from './LabelUi';
import { TransitConnectionUi } from './TransitConnectionUi';
import { TransitRoutesUi } from './TransitRoutesUi';
import { TransitStopUi } from './TransitStopUi';
import { useContext } from 'react';

// FIXME: if input is empty, it produces NaN

export function SelectedUi() {
  const { selected, map } = useContext(EditorContext);

  if (selected instanceof TransitStop) {
    return <TransitStopUi key={selected.id} stop={selected} />;
  }
  if (selected instanceof TransitConnection) {
    return <TransitConnectionUi key={selected.id} connection={selected} />;
  }
  if (selected instanceof Label) {
    return <LabelUi key={selected.id} label={selected} />;
  }
  return <TransitRoutesUi routes={map.routes} map={map} />;
}
