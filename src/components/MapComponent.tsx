import { EditorContextType } from '../EditorContext';
import {
  MoveAction,
  createImageAction,
  createLabelAction,
  createStopAction,
  moveMovableAction,
  removeAction,
} from '../transit/Action';
import { Label } from '../transit/Label';
import {
  TransformableState,
  createTransformAction,
  drawTransformableRegion,
  getHandle,
  getCursor as getHandleCursor,
  getTransformableState,
  isTransformable,
  transform,
} from '../transit/Transformable';
import { ActionableItem, PosWithKeys, Transformable } from '../transit/types';
import { Vector2 } from '../utils/vec';
import createCanvasComponent from './CanvasComponent';
import { waitForInput } from './context-menu';

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
    let zoom = 3;
    let offsetX = 200;
    let offsetY = 0;
    let panning = false;
    let transformableState: TransformableState | null = null;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let ogMouseX = 0;
    let ogMouseY = 0;
    let ogPos: Vector2 | null = null;
    let moveAction: MoveAction | null = null;

    function setSelection(item: ActionableItem | null) {
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
      return new Vector2((mouseX - offsetX) / zoom, (mouseY - offsetY) / zoom);
    }

    return {
      update() {
        canvas.style.cursor = '';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(zoom, zoom);
        map.draw(ctx, selected);
        if (selected && 'getSize' in selected) {
          drawTransformableRegion(ctx, zoom, selected);
          const mousePos = mouseToPos({
            mouseX: prevMouseX,
            mouseY: prevMouseY,
          });
          const handle = getHandle(mousePos, zoom, selected);
          if (handle) {
            const cursor = getHandleCursor(handle, selected);
            canvas.style.cursor = cursor;
          }
        }
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
        const mousePos = mouseToPos({ mouseX, mouseY });
        const { x, y } = mousePos;

        transformableState = null;
        if (e.button === 0) {
          if (isTransformable(selected)) {
            transformableState = getTransformableState(
              selected as ActionableItem & Transformable,
              zoom,
              mousePos,
            );
          }

          if (transformableState === null) {
            setSelection(map.getSelectable(x, y, ctx));
          }
          panning = true;
        } else if (e.button === 2) {
          // Right click
          const selectable = map.getSelectable(x, y, ctx);
          if (selectable && 'rightClick' in selectable) {
            if (
              selectable.rightClick({
                selected,
                setSelected: setSelection,
                altKey: e.altKey,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                pos: mousePos,
              })
            ) {
              panning = true;
            }
          } else {
            waitForInput(['Create Stop', 'Create Label'], mouseX, mouseY).then(
              result => {
                if (result === 'Create Stop') {
                  setSelected(
                    createStopAction(map, 'Unnamed Stop', mousePos).data,
                  );
                } else if (result === 'Create Label') {
                  setSelected(
                    createLabelAction(map, 'Unnamed Label', mousePos).data,
                  );
                }
              },
            );
          }
        }
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        ogMouseX = mouseX;
        ogMouseY = mouseY;
      },
      mouseDbClick(e, { mouseX, mouseY }) {
        const { x, y } = mouseToPos({ mouseX, mouseY });
        const selectable = map.getSelectable(x, y, ctx);

        if (selectable && 'doubleClick' in selectable) {
          selectable.doubleClick({
            selected,
            setSelected: setSelection,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            pos: new Vector2(x, y),
          });
        } else if (selectable instanceof Label) {
          renameLabel(selectable);
        } else {
          setSelected(
            createStopAction(map, 'Unnamed Stop', new Vector2(x, y)).data,
          );
        }
      },
      mouseMove(e, { mouseX, mouseY }) {
        if (panning) {
          e.preventDefault();
          const deltaX = mouseX - prevMouseX;
          const deltaY = mouseY - prevMouseY;
          if (transformableState) {
            e.preventDefault();
            const mousePos = mouseToPos({ mouseX, mouseY });
            transform(transformableState, {
              pos: mousePos,
              shiftKey: e.shiftKey,
              ctrlKey: e.ctrlKey,
              altKey: e.altKey,
            });
          } else if (selected) {
            const deltaPos = new Vector2(
              (mouseX - ogMouseX) / zoom,
              (mouseY - ogMouseY) / zoom,
            );

            if ('moveTo' in selected) {
              if (!moveAction) {
                moveAction = moveMovableAction(selected);
              }
              const l: PosWithKeys = {
                pos: new Vector2(ogPos!.x + deltaPos.x, ogPos!.y + deltaPos.y),
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
              };
              selected.moveTo(l);
              moveAction.pos = selected.getPos();
            }
          } else {
            offsetX += deltaX;
            offsetY += deltaY;
          }
        }
        prevMouseX = mouseX;
        prevMouseY = mouseY;
      },
      mouseUp() {
        panning = false;
        if (transformableState) {
          createTransformAction(map, transformableState);
          transformableState = null;
        }
        if (moveAction) {
          if (!moveAction.pos.equals(moveAction.data)) {
            map.history.add(moveAction);
          }
          moveAction = null;
        }
      },
      keyDown(e) {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        switch (e.key) {
          case 'z':
            if (e.ctrlKey) {
              map.history.undo(map);
            }
            return;
          case 'y':
            if (e.ctrlKey) {
              map.history.redo(map);
            }
            return;
        }

        if (selected) {
          switch (e.key) {
            case 'Delete':
            case 'Backspace':
              removeAction(map, selected);
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
      wheel(e, { deltaY, mouseX, mouseY }) {
        if (e.ctrlKey) {
          e.preventDefault();
        }
        const delta = deltaY / 1000;
        zoom = Math.max(0.1, zoom * (1 + delta));
        offsetX = mouseX - (mouseX - offsetX) * (1 + delta);
        offsetY = mouseY - (mouseY - offsetY) * (1 + delta);
      },
      paste(e) {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          (e.target &&
            'isContentEditable' in e.target &&
            e.target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();

        const items = e.clipboardData?.items;

        if (!items) {
          return;
        }

        for (const item of items) {
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) {
              const url = URL.createObjectURL(blob);
              const img = new Image();
              img.src = url;
              img.onload = () => {
                const { x, y } = mouseToPos({
                  mouseX: prevMouseX,
                  mouseY: prevMouseY,
                });
                setSelected(
                  createImageAction(map, img, new Vector2(x, y)).data,
                );
              };
            }
          }
        }
      },
    };
  },
});
