import { EditorContext } from '../EditorContext';
import { HistoryAction } from '../transit/History';
import { useContext } from 'react';

export function HistoryUi() {
  const {
    map: { history },
    historyUpdate,
  } = useContext(EditorContext);

  return (
    <div className="max-h-[50vh] overflow-auto text-white" key={historyUpdate}>
      {history.historyActions().map((action, i) => (
        <HistoryItem key={i} action={action} />
      ))}
    </div>
  );
}

function HistoryItem({
  action: {
    action: { label },
    undid,
    index,
  },
}: {
  action: HistoryAction;
}) {
  const { map } = useContext(EditorContext);
  const { history } = map;

  const onClick = () => {
    if (history.index === index - 1) {
      history.redo(map);
      return;
    }
    history.setIndex(index - 1, map);
  };

  return (
    <div
      className={`cursor-pointer ${undid ? 'line-through' : ''}`}
      onClick={onClick}
    >
      {label}
    </div>
  );
}
