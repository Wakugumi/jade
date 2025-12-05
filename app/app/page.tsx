"use client";
import { useEffect, useState } from "react"
import { initModel, runInference, subscribeModelState } from 'lib/model'
import Canvas from "./_components/Canvas";
import { canvasStore } from "./_module/canvas.ref";
import { preprocess } from "@/lib/preprocessing";
import { transformCanvas } from "@/lib/imageLoader";
import { decodeOutput, LABELS } from "@/lib/decoder";
import WasteClassifier from "./theapp";


export default function Home() {
  const [modelStatus, setModelStatus] = useState("")

  const [predicted, setPredicted] = useState("null")
  const [inferenceTime, setInferenceTime] = useState("")
  const [inferenceScore, setInferenceScore] = useState("")

  useEffect(() => {
    subscribeModelState(setModelStatus);
    initModel()


  }, [])

  useEffect(() => {
    if (!canvasStore.ref || modelStatus !== 'READY') return;

    const loop = async () => {
      console.log("looping")

      const jimp = await transformCanvas(canvasStore.ref!);
      const tensor = preprocess(jimp)
      console.log(tensor)


      const [probs, time] = await runInference(tensor);
      const { label, score } = decodeOutput(probs);
      setPredicted(label);
      setInferenceTime(time.toString())
      setInferenceScore(score.toString())


      requestAnimationFrame(loop)
    }
    loop()




  }, [canvasStore.ref, modelStatus])

  return (

    <>

      <WasteClassifier />
    </>


  )
}
