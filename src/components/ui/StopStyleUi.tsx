import { EditorContext } from '../../EditorContext';
import { SavedStyle } from '../../transit/TransitMap';
import { StopStyle, StopStyleLayer } from '../../transit/TransitStop';
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

function StopStyleLayerUi({
  layer,
  removeLayer,
}: {
  layer: StopStyleLayer;
  removeLayer: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [fillColor, setFillColor] = useState(layer.fillColor);
  const [strokeColor, setStrokeColor] = useState(layer.strokeColor);
  const [edges, setEdges] = useState(layer.edges);
  const [edgeOrientation, setEdgeOrientation] = useState(layer.edgeOrientation);
  const [edgeFollowsRoute, setEdgeFollowsRoute] = useState(
    layer.edgeFollowsRoute,
  );
  const [radius, setRadius] = useState(layer.radius);
  const [rounding, setRounding] = useState(layer.rounding);
  const [stretch, setStretch] = useState(layer.stretch);
  const [strokeWidth, setStrokeWidth] = useState(layer.strokeWidth);
  const [lateralOffset, setLateralOffset] = useState(layer.lateralOffset);
  const [clearFill, setClearFill] = useState(layer.clearFill);
  const [clearStroke, setClearStroke] = useState(layer.clearStroke);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: layer.id });

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
        <div>Layer</div>
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
          <label className="flex items-center gap-2">
            <div className="text-white">Fill color:</div>
            <RouteColorEditor
              color={fillColor}
              onChange={fill => setFillColor((layer.fillColor = fill))}
            />
          </label>
          <label className="flex items-center gap-2">
            <div className="text-white">Stroke color:</div>
            <RouteColorEditor
              color={strokeColor}
              onChange={stroke => setStrokeColor((layer.strokeColor = stroke))}
            />
          </label>
          <label className="flex items-center gap-2">
            <div className="text-white">Edges:</div>
            <select
              value={edges}
              onChange={e => setEdges((layer.edges = parseInt(e.target.value)))}
              className="bg-gray-900 text-white"
            >
              <option value="0">Circle</option>
              <option value="1">Rectangle</option>
              <option value="3">Triangle</option>
              <option value="4">Square</option>
              <option value="5">Pentagon</option>
              <option value="6">Hexagon</option>
            </select>
          </label>
          {edges > 0 ? (
            <>
              <label className="flex items-center gap-2">
                <div className="text-white">Edge orientation:</div>
                <select
                  value={edgeOrientation}
                  onChange={e =>
                    setEdgeOrientation(
                      (layer.edgeOrientation = parseInt(e.target.value)),
                    )
                  }
                  className="bg-gray-900 text-white"
                >
                  <option value="0">A</option>
                  <option value="1">B</option>
                  <option value="2">C</option>
                  <option value="3">D</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                <div className="text-white">Edge follows route:</div>
                <input
                  type="checkbox"
                  checked={edgeFollowsRoute}
                  onChange={() =>
                    setEdgeFollowsRoute(
                      (layer.edgeFollowsRoute = !edgeFollowsRoute),
                    )
                  }
                />
              </label>
            </>
          ) : null}
          <label className="flex items-center gap-2">
            <div className="text-white">Radius:</div>
            <NumberInput
              value={radius}
              min={0}
              onChange={e => setRadius((layer.radius = e))}
              className="bg-gray-900 text-white"
            />
          </label>
          <label className="flex items-center gap-2">
            <div className="text-white">Stroke width:</div>
            <NumberInput
              value={strokeWidth}
              min={0}
              onChange={e => setStrokeWidth((layer.strokeWidth = e))}
              className="bg-gray-900 text-white"
            />
          </label>
          {edges > 0 ? (
            <label className="flex items-center gap-2">
              <div className="text-white">Rounding:</div>
              <NumberInput
                value={rounding}
                min={0}
                onChange={e => setRounding((layer.rounding = e))}
                className="bg-gray-900 text-white"
              />
            </label>
          ) : null}
          <label className="flex items-center gap-2">
            <div className="text-white">Stretch:</div>
            <NumberInput
              value={stretch}
              min={0}
              step={0.1}
              onChange={e => setStretch((layer.stretch = e))}
              className="bg-gray-900 text-white"
            />
          </label>
          <label className="flex items-center gap-2">
            <div className="text-white">Lateral offset:</div>
            <NumberInput
              value={lateralOffset}
              onChange={e => setLateralOffset((layer.lateralOffset = e))}
              className="bg-gray-900 text-white"
            />
          </label>
          <label className="flex items-center gap-2">
            <div className="text-white">Clear fill:</div>
            <input
              type="checkbox"
              checked={clearFill}
              onChange={() => setClearFill((layer.clearFill = !clearFill))}
            />
          </label>
          <label className="flex items-center gap-2">
            <div className="text-white">Clear stroke:</div>
            <input
              type="checkbox"
              checked={clearStroke}
              onChange={() =>
                setClearStroke((layer.clearStroke = !clearStroke))
              }
            />
          </label>
          <button className="bg-gray-800 p-1 text-white" onClick={removeLayer}>
            Remove layer
          </button>
        </>
      )}
    </div>
  );
}

export function StopStyleUi({ style }: { style: StopStyle }) {
  const [layers, setLayers] = useState(style.layers);

  function addLayer() {
    setLayers((style.layers = [...layers, clone(layers[layers.length - 1])]));
  }

  function removeLayer(index: number) {
    if (layers.length === 1) return;
    setLayers((style.layers = layers.filter((_, i) => i !== index)));
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
      setLayers(layers => {
        const oldIndex = layers.findIndex(stroke => stroke.id === active.id);
        const newIndex = layers.findIndex(stroke => stroke.id === over.id);

        const newArray = arrayMove(layers, oldIndex, newIndex);
        style.layers = newArray;
        return newArray;
      });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button className="bg-gray-800 p-1 text-white" onClick={addLayer}>
        Add layer
      </button>
      <div className="ml-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={layers}
            strategy={verticalListSortingStrategy}
          >
            {layers.map((layer, i) => (
              <StopStyleLayerUi
                key={layer.id}
                layer={layer}
                removeLayer={() => removeLayer(i)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

export function StopStyleSelector({
  allowNone,
  style,
  setStyle,
  getStyle,
}:
  | {
      allowNone?: never;
      style: SavedStyle<StopStyle>;
      setStyle: (style: SavedStyle<StopStyle>) => void;
      getStyle?: never;
    }
  | {
      allowNone: true;
      style: SavedStyle<StopStyle> | undefined;
      setStyle: (style: SavedStyle<StopStyle> | undefined) => void;
      getStyle: () => StopStyle;
    }) {
  const { map } = useContext(EditorContext);
  const [styles, setStyles] = useState(() => map.getAllStopStyles());

  const autoStyle = 'Auto';
  const newStyle = 'New style';
  const styleId = style ? '-' + style.id : autoStyle;

  return (
    <>
      <label className="flex items-center gap-2">
        <div className="text-white">Stop style:</div>
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
                const style: SavedStyle<StopStyle> = {
                  name: `New style`,
                  id: `_${Date.now()}`,
                  style: clone(getStyle?.() ?? map.defaultStopStyle.style),
                  removable: true,
                };
                map.addSavedStopStyle(style);
                setStyle(style);
                setStyles(map.getAllStopStyles());
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
          <StopStyleUi style={style.style} />
          {style.removable && (
            <button
              onClick={() => {
                if (!confirm('u sure buddy?')) return;
                map.removeSavedStopStyle(style.id);
                if (allowNone) {
                  setStyle(undefined);
                } else {
                  setStyle(map.defaultStopStyle);
                }
                setStyles(map.getAllStopStyles());
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
