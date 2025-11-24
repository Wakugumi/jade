
import { useEffect, useRef } from "react";
import { canvasStore } from "../_module/canvas.ref";

export interface CanvasProps {
  width: number;
  height: number;
}

export default function Canvas(props: CanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function init() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    }
    init();
  }, []);

  useEffect(() => {
    const draw = () => {
      const video = videoRef.current;
      const canvas = canvasStore.ref
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      requestAnimationFrame(draw);
    };
    draw();
  }, []);

  return (
    <div>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={(el) => { canvasStore.ref = el }} width={props.width} height={props.height} />
    </div>
  );
}
