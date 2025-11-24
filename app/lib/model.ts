
import * as ort from 'onnxruntime-web';


export let session: ort.InferenceSession | null = null
export type ModelState = "NULL" | "LOADING" | "READY" | "ERROR"
export let modelState: ModelState = "NULL"


let _modelState: ModelState = 'NULL'
const listeners = new Set<(state: ModelState) => void>();

export const getModelState = () => _modelState;

export const setModelState = (newState: ModelState) => {
  _modelState = newState;
  listeners.forEach((fn) => fn(newState))
}

export const subscribeModelState = (fn: (state: ModelState) => void) => {
  listeners.add(fn);
  fn(_modelState);
  return () => listeners.delete(fn)
}



export async function initModel(): Promise<void> {
  if (session) {
    console.warn("called init model but session already exist")
    return;
  }
  try {
    setModelState("LOADING")

    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@dev/dist/';
    session = await ort.InferenceSession
      .create('/garbage_weighted.onnx',
        { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    console.log('Inference session created');
    setModelState("READY")
  } catch (error) {
    console.error(error);
    setModelState("ERROR")
  }
  return;
}

/**
  * @returns [Float32Array, number]: probs score and inference time
  */
export async function runInference(preprocessedData: any): Promise<[Float32Array, number]> {
  if (!session)
    throw new Error("No model session is initialized")

  const start = new Date();

  const feeds: Record<string, ort.Tensor> = {};
  feeds[session.inputNames[0]] = preprocessedData;

  const outputData = await session.run(feeds);
  const end = new Date();
  const inferenceTime = (end.getTime() - start.getTime()) / 1000;
  const output = outputData[session.outputNames[0]].data as Float32Array;
  return [output, inferenceTime]
}
