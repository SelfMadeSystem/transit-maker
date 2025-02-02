import { SelectableItem, TransitMap } from "../transit/types";
import createCanvasComponent from "./CanvasComponent";

export const MapComponent = createCanvasComponent<TransitMap>({
  autoResize: true,
  props: {
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
    },
  },
  setup(canvas, transitMap) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2d context");
    let zoom = 1;
    let offsetX = 0;
    let offsetY = 0;
    let panning = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let selected: SelectableItem | null = null;

    function setSelection(stop: SelectableItem | null) {
      selected = stop;
    }

    function mouseToLocation({
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
        transitMap.draw(ctx, selected);
        ctx.restore();
      },
      mouseDown(e, { mouseX, mouseY }) {
        const { x, y } = mouseToLocation({ mouseX, mouseY });

        if (e.button === 0) {
          setSelection(transitMap.getSelectable(x, y));
        }
        panning = true;
        prevMouseX = mouseX;
        prevMouseY = mouseY;
      },
      mouseDbClick(_, { mouseX, mouseY }) {
        const { x, y } = mouseToLocation({ mouseX, mouseY });
        const selectable = transitMap.getSelectable(x, y);

        if (selectable && "doubleClick" in selectable) {
          selectable.doubleClick(transitMap);
        }
      },
      mouseMove(_, { mouseX, mouseY }) {
        if (panning) {
          const deltaX = mouseX - prevMouseX;
          const deltaY = mouseY - prevMouseY;
          if (selected) {
            const deltaLocation = {
              x: deltaX / zoom,
              y: deltaY / zoom,
            };

            if ("move" in selected) selected.move(deltaLocation);
          } else {
            offsetX += mouseX - prevMouseX;
            offsetY += mouseY - prevMouseY;
          }
          prevMouseX = mouseX;
          prevMouseY = mouseY;
        }
      },
      mouseUp() {
        panning = false;
      },
      wheel(_, { deltaY, mouseX, mouseY }) {
        const delta = deltaY / 1000;
        console.log("delta", delta);
        zoom = Math.max(0.1, zoom * (1 + delta));
        offsetX = mouseX - (mouseX - offsetX) * (1 + delta);
        offsetY = mouseY - (mouseY - offsetY) * (1 + delta);
      },
    };
  },
});
