import { EditorContextType } from '../EditorContext';
import { Label } from '../transit/Label';
import { PosWithKeys, SelectableItem } from '../transit/types';
import { Vector2 } from '../utils/vec';
import createCanvasComponent from './CanvasComponent';

export const MapComponent = createCanvasComponent<EditorContextType>({
  autoResize: true,
  props: {
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
    },
  },
  setup(canvas, { map, selected, setSelected }) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2d context');
    let zoom = 1;
    let offsetX = 0;
    let offsetY = 0;
    let panning = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let ogMouseX = 0;
    let ogMouseY = 0;
    let ogPos: Vector2 | null = null;

    function setSelection(item: SelectableItem | null) {
      setSelected(item);
      if (item && 'getPos' in item) {
        ogPos = item.getPos();
      }
    }

    function renameLabel(label: Label) {
      const newName = prompt('Enter new name', label.text);
      if (newName) {
        label.text = newName;
      }
    }

    function mouseToPos({
      mouseX,
      mouseY,
    }: {
      mouseX: number;
      mouseY: number;
    }) {
      return {
        x: (mouseX - offsetX) / zoom,
        y: (mouseY - offsetY) / zoom,
      };
    }

    return {
      update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(zoom, zoom);
        map.draw(ctx, selected);
        ctx.restore();
      },
      propsUpdate: {
        map() {
          console.error('Map should never change');
        },
        selected(newSelected) {
          selected = newSelected;
        },
        setSelected(newSetSelected) {
          setSelected = newSetSelected;
        },
      },
      mouseDown(e, { mouseX, mouseY }) {
        e.preventDefault();
        e.stopPropagation();
        const { x, y } = mouseToPos({ mouseX, mouseY });

        if (e.button === 0) {
          setSelection(map.getSelectable(x, y));
          panning = true;
        } else if (e.button === 2) {
          const selectable = map.getSelectable(x, y);
          if (selectable && 'rightClick' in selectable) {
            selectable.rightClick({
              selected,
            });
          }
        }
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        ogMouseX = mouseX;
        ogMouseY = mouseY;
      },
      mouseDbClick(_, { mouseX, mouseY }) {
        const { x, y } = mouseToPos({ mouseX, mouseY });
        const selectable = map.getSelectable(x, y);

        if (selectable && 'doubleClick' in selectable) {
          selectable.doubleClick({
            selected,
          });
        } else if (selectable instanceof Label) {
          renameLabel(selectable);
        } else if (!selectable) {
          map.createStop('Unnamed Stop', new Vector2(x, y));
        }
      },
      mouseMove(e, { mouseX, mouseY }) {
        if (panning) {
          e.preventDefault();
          const deltaX = mouseX - prevMouseX;
          const deltaY = mouseY - prevMouseY;
          if (selected) {
            const deltaPos = new Vector2(
              (mouseX - ogMouseX) / zoom,
              (mouseY - ogMouseY) / zoom,
            );

            if ('moveTo' in selected) {
              const l: PosWithKeys = {
                pos: new Vector2(ogPos!.x + deltaPos.x, ogPos!.y + deltaPos.y),
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
              };
              selected.moveTo(l);
            }
          } else {
            offsetX += deltaX;
            offsetY += deltaY;
          }
          prevMouseX = mouseX;
          prevMouseY = mouseY;
        }
      },
      mouseUp() {
        panning = false;
      },
      keyDown(e) {
        if (selected) {
          switch (e.key) {
            case 'Delete':
            case 'Backspace':
              map.remove(selected);
              setSelection(null);
              break;
            case 'Enter':
              if (selected instanceof Label) {
                renameLabel(selected);
              }
              break;
          }
        }
      },
      wheel(_, { deltaY, mouseX, mouseY }) {
        const delta = deltaY / 1000;
        zoom = Math.max(0.1, zoom * (1 + delta));
        offsetX = mouseX - (mouseX - offsetX) * (1 + delta);
        offsetY = mouseY - (mouseY - offsetY) * (1 + delta);
      },
    };
  },
});
