import createCanvasComponent from "./CanvasComponent";
import { drawTransitMap } from "../transit/draw";
import { transitMap } from "../transit";

export const MapComponent = createCanvasComponent({
  autoResize: true,
  props: {
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
    },
  },
  setup(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2d context");

    return {
      update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawTransitMap(ctx, transitMap);
      },
    };
  },
});
