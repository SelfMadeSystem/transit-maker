import { EditorContext } from '../../EditorContext';
import {
  ConnectionStroke,
  ConnectionStyle,
} from '../../transit/TransitConnection';
import { SavedStyle } from '../../transit/TransitMap';
import { clone } from '../../utils/clone';
import { NumberInput } from '../NumberInput';
import { RouteColorEditor } from '../RouteColorEditor';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { mdiChevronRight, mdiDragVertical } from '@mdi/js';
import Icon from '@mdi/react';
import { useContext, useState } from 'react';

function ConnectionStrokeDotted({
  stroke,
}: {
  stroke: ConnectionStroke & { strokeType: 'dotted' };
}) {
  const [dottedSpacing, setDottedSpacing] = useState(stroke.dottedSpacing);
  const [dottedOffset, setDottedOffset] = useState(stroke.dottedOffset);

  return (
    <>
      <label className="flex items-center gap-2">
        <div className="text-white">Dotted spacing:</div>
        <NumberInput
          value={dottedSpacing}
          min={0}
          onChange={e => setDottedSpacing((stroke.dottedSpacing = e))}
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Dotted offset:</div>
        <NumberInput
          value={dottedOffset}
          min={0}
          max={1}
          step={0.01}
          onChange={e => setDottedOffset((stroke.dottedOffset = e))}
          className="bg-gray-900 text-white"
        />
      </label>
    </>
  );
}

function ConnectionStrokeDashed({
  stroke,
}: {
  stroke: ConnectionStroke & { strokeType: 'dashed' };
}) {
  const [dashedLength, setDashedLength] = useState(stroke.dashedLength);
  const [dashedSpacing, setDashedSpacing] = useState(stroke.dashedSpacing);
  const [dashedOffset, setDashedOffset] = useState(stroke.dashedOffset);

  return (
    <>
      <label className="flex items-center gap-2">
        <div className="text-white">Dashed length:</div>
        <NumberInput
          value={dashedLength}
          min={0}
          onChange={e => setDashedLength((stroke.dashedLength = e))}
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Dashed spacing:</div>
        <NumberInput
          value={dashedSpacing}
          min={0}
          onChange={e => setDashedSpacing((stroke.dashedSpacing = e))}
          className="bg-gray-900 text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <div className="text-white">Dashed offset:</div>
        <NumberInput
          value={dashedOffset}
          min={0}
          max={1}
          step={0.01}
          onChange={e => setDashedOffset((stroke.dashedOffset = e))}
          className="bg-gray-900 text-white"
        />
      </label>
    </>
  );
}

export function ConnectionStrokeUi({
  stroke,
  removeStroke,
}: {
  stroke: ConnectionStroke;
  removeStroke: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(stroke.width);
  const [color, setColor] = useState(stroke.color);
  const [clear, setClear] = useState(stroke.clear);
  const [lineCap, setLineCap] = useState(stroke.lineCap);
  const [strokeType, setStrokeType] = useState(stroke.strokeType);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: stroke.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        onClick={e => {
          if (e.target instanceof HTMLInputElement) return;
          setOpen(o => !o);
        }}
        className="flex flex-row items-center gap-2 bg-gray-900 text-white"
      >
        <div className={`${open ? 'rotate-90' : ''} transition-all`}>
          <Icon path={mdiChevronRight} size={1} />
        </div>
        <div>Stroke</div>
        <RouteColorEditor
          color={color}
          onChange={c => setColor((stroke.color = c))}
        />
        <NumberInput
          value={width}
          min={0}
          onChange={e => setWidth((stroke.width = e))}
          className="w-8 bg-gray-900 text-white"
        />
        <div
          {...attributes}
          {...listeners}
          className="ml-auto cursor-move px-4"
        >
          <Icon path={mdiDragVertical} size={1} />
        </div>
      </div>
      {open && (
        <>
          <div className="flex flex-col gap-2 pl-2">
            <label className="flex items-center gap-2">
              <div className="text-white">Clear:</div>
              <input
                type="checkbox"
                checked={clear}
                onChange={() => setClear((stroke.clear = !clear))}
              />
            </label>
            <label className="flex items-center gap-2">
              <div className="text-white">Line cap:</div>
              <select
                value={lineCap}
                onChange={e =>
                  setLineCap((stroke.lineCap = e.target.value as CanvasLineCap))
                }
                className="bg-gray-900 text-white"
              >
                <option value="butt">Butt</option>
                <option value="round">Round</option>
                <option value="square">Square</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <div className="text-white">Stroke type:</div>
              <select
                value={strokeType}
                onChange={e => {
                  const newStrokeType = e.target
                    .value as ConnectionStroke['strokeType'];
                  switch (newStrokeType) {
                    case 'dotted':
                      stroke.strokeType = 'dotted';
                      (
                        stroke as ConnectionStroke & { strokeType: 'dotted' }
                      ).dottedSpacing = 2;
                      (
                        stroke as ConnectionStroke & { strokeType: 'dotted' }
                      ).dottedOffset = 0;
                      break;
                    case 'dashed':
                      stroke.strokeType = 'dashed';
                      (
                        stroke as ConnectionStroke & { strokeType: 'dashed' }
                      ).dashedLength = 2;
                      (
                        stroke as ConnectionStroke & { strokeType: 'dashed' }
                      ).dashedSpacing = 2;
                      (
                        stroke as ConnectionStroke & { strokeType: 'dashed' }
                      ).dashedOffset = 0;
                      break;
                    default:
                      stroke.strokeType = 'solid';
                      break;
                  }
                  setStrokeType(newStrokeType);
                }}
                className="bg-gray-900 text-white"
              >
                <option value="solid">Solid</option>
                <option value="dotted">Dotted</option>
                <option value="dashed">Dashed</option>
              </select>
            </label>
            {strokeType === 'dotted' ? (
              <ConnectionStrokeDotted
                stroke={stroke as ConnectionStroke & { strokeType: 'dotted' }}
              />
            ) : strokeType === 'dashed' ? (
              <ConnectionStrokeDashed
                stroke={stroke as ConnectionStroke & { strokeType: 'dashed' }}
              />
            ) : null}
          </div>
          <button
            className="cursor-pointer bg-red-800 p-1 text-white"
            onClick={removeStroke}
          >
            Remove stroke
          </button>
        </>
      )}
    </div>
  );
}

export function ConnectionStyleUi({ style }: { style: ConnectionStyle }) {
  const [strokes, setStrokes] = useState(style.strokes);

  function addStroke() {
    const newStrokes = [
      ...strokes,
      {
        ...clone(strokes[strokes.length - 1] ?? style.strokes[0]),
        id: Date.now(),
      },
    ];

    setStrokes(newStrokes);
    style.strokes = newStrokes;
  }

  function removeStroke(index: number) {
    if (strokes.length === 1) return;

    const newStrokes = [...strokes];
    newStrokes.splice(index, 1);

    setStrokes(newStrokes);
    style.strokes = newStrokes;
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStrokes(strokes => {
        const oldIndex = strokes.findIndex(stroke => stroke.id === active.id);
        const newIndex = strokes.findIndex(stroke => stroke.id === over.id);

        const newArray = arrayMove(strokes, oldIndex, newIndex);
        style.strokes = newArray;
        return newArray;
      });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        className="cursor-pointer bg-gray-800 p-1 text-white"
        onClick={addStroke}
      >
        Add stroke
      </button>
      <div className="ml-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={strokes}
            strategy={verticalListSortingStrategy}
          >
            {strokes.map((stroke, i) => (
              <ConnectionStrokeUi
                key={stroke.id}
                stroke={stroke}
                removeStroke={() => removeStroke(i)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

export function ConnectionStyleSelector({
  allowNone,
  style,
  setStyle,
  getStyle,
}:
  | {
      allowNone?: never;
      style: SavedStyle<ConnectionStyle>;
      setStyle: (style: SavedStyle<ConnectionStyle>) => void;
      getStyle?: never;
    }
  | {
      allowNone: true;
      style: SavedStyle<ConnectionStyle> | undefined;
      setStyle: (style: SavedStyle<ConnectionStyle> | undefined) => void;
      getStyle: () => ConnectionStyle;
    }) {
  const { map } = useContext(EditorContext);
  const [styles, setStyles] = useState(() => map.getAllConnectionStyles());

  const autoStyle = 'Auto';
  const newStyle = 'New style';
  const styleId = style ? '-' + style.id : autoStyle;

  return (
    <>
      <label className="flex items-center gap-2">
        <div className="text-white">Connection style:</div>
        <select
          value={styleId}
          onChange={e => {
            const newId = e.target.value;
            switch (newId) {
              case autoStyle:
                if (allowNone) {
                  setStyle(undefined);
                }
                break;
              case newStyle: {
                const style: SavedStyle<ConnectionStyle> = {
                  name: `New style`,
                  id: `_${Date.now()}`,
                  style: clone(
                    getStyle?.() ?? map.defaultConnectionStyle.style,
                  ),
                  removable: true,
                };
                map.addSavedConnectionStyle(style);
                setStyle(style);
                setStyles(map.getAllConnectionStyles());
                break;
              }
              default: {
                const id = newId.substring(1);
                setStyle(styles.find(style => style.id === id)!);
                break;
              }
            }
          }}
          className="bg-gray-900 text-white"
        >
          {allowNone && <option value={autoStyle}>Auto</option>}
          {styles.map(style => (
            <option key={style.id} value={`-${style.id}`}>
              {style.name}
            </option>
          ))}
          <option value={newStyle}>New style</option>
        </select>
      </label>

      {style ? (
        <details>
          <summary className="text-white">Style details</summary>
          {style.removable && (
            <label className="flex items-center gap-2">
              <div className="text-white">Name:</div>
              <input
                type="text"
                defaultValue={style.name}
                onChange={e => (style.name = e.target.value)}
                className="bg-gray-900 text-white"
              />
            </label>
          )}
          <ConnectionStyleUi style={style.style} />
          {style.removable && (
            <button
              onClick={() => {
                if (!confirm('u sure buddy?')) return;
                map.removeSavedConnectionStyle(style.id);
                if (allowNone) {
                  setStyle(undefined);
                } else {
                  setStyle(map.defaultConnectionStyle);
                }
                setStyles(map.getAllConnectionStyles());
              }}
              className="cursor-pointer rounded-md bg-red-900 text-white"
            >
              Remove
            </button>
          )}
        </details>
      ) : null}
    </>
  );
}
