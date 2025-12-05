import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Activity } from 'lucide-react';
import { InferenceSession } from 'onnxruntime-web'

const WasteClassifier = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<InferenceSession | null>(null);
  const [isInferencing, setIsInferencing] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [benchmark, setBenchmark] = useState({
    preprocessTime: 0,
    inferenceTime: 0,
    postprocessTime: 0,
    totalTime: 0,
    fps: 0
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() });

  const classes = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash'];
  const INPUT_SIZE = 224; // Common input size, adjust based on your model

  // Load ONNX model
  const loadModel = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Dynamically import onnxruntime-web
      const ort = await import('onnxruntime-web');


      // Configure ONNX Runtime to use local WASM files
      ort.env.wasm.wasmPaths = '/onnx/';
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.simd = true;
      // Create session
      const session = await ort.InferenceSession.create("garbage_weighted.onnx", {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });

      setSession(session);
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to load model: ${(err as any).message}`);
      setIsLoading(false);
    }
  };
  useEffect(() => {
    loadModel()
  }, [])

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setError(`Camera access denied: ${(err as any).message}`);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsInferencing(false);
  };

  // Preprocess image
  const preprocessImage = (ctx, width, height) => {
    const startTime = performance.now();

    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;

    // Prepare tensor data (CHW format: [1, 3, 224, 224])
    const float32Data = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    for (let i = 0; i < INPUT_SIZE; i++) {
      for (let j = 0; j < INPUT_SIZE; j++) {
        const idx = (i * INPUT_SIZE + j) * 4;

        // Convert to [0, 1] range (ToTensor step)
        const r = data[idx] / 255.0;
        const g = data[idx + 1] / 255.0;
        const b = data[idx + 2] / 255.0;

        // Apply normalization and store in CHW format
        float32Data[i * INPUT_SIZE + j] = (r - mean[0]) / std[0];
        float32Data[INPUT_SIZE * INPUT_SIZE + i * INPUT_SIZE + j] = (g - mean[1]) / std[1];
        float32Data[2 * INPUT_SIZE * INPUT_SIZE + i * INPUT_SIZE + j] = (b - mean[2]) / std[2];
      }
    }

    const preprocessTime = performance.now() - startTime;
    return { float32Data, preprocessTime };
  };

  // Run inference
  const runInference = async () => {
    if (!session || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    // Draw video frame to canvas
    canvas.width = INPUT_SIZE;
    canvas.height = INPUT_SIZE;
    ctx.drawImage(video, 0, 0, INPUT_SIZE, INPUT_SIZE);

    const totalStartTime = performance.now();

    // Preprocess
    const { float32Data, preprocessTime } = preprocessImage(ctx, INPUT_SIZE, INPUT_SIZE);

    // Run inference
    const inferenceStartTime = performance.now();
    const ort = await import('onnxruntime-web');
    const tensor = new ort.Tensor('float32', float32Data, [1, 3, INPUT_SIZE, INPUT_SIZE]);

    const feeds = {};
    feeds[session.inputNames[0]] = tensor;
    const results = await session.run(feeds);
    const inferenceTime = performance.now() - inferenceStartTime;

    // Postprocess
    const postprocessStartTime = performance.now();
    const output = results[session.outputNames[0]];
    const probs = Array.from(output.data);

    // Apply softmax
    const maxProb = Math.max(...probs);
    const expProbs = probs.map(p => Math.exp(p - maxProb));
    const sumExp = expProbs.reduce((a, b) => a + b, 0);
    const softmax = expProbs.map(p => p / sumExp);

    // Get top prediction
    const maxIdx = softmax.indexOf(Math.max(...softmax));
    const postprocessTime = performance.now() - postprocessStartTime;

    const totalTime = performance.now() - totalStartTime;

    // Update FPS
    fpsCounterRef.current.frames++;
    const now = Date.now();
    const elapsed = now - fpsCounterRef.current.lastTime;
    let fps = benchmark.fps;

    if (elapsed >= 1000) {
      fps = Math.round((fpsCounterRef.current.frames * 1000) / elapsed);
      fpsCounterRef.current.frames = 0;
      fpsCounterRef.current.lastTime = now;
    }

    setPrediction({
      class: classes[maxIdx],
      confidence: softmax[maxIdx],
      allProbs: softmax.map((prob, idx) => ({
        class: classes[idx],
        confidence: prob
      })).sort((a, b) => b.confidence - a.confidence)
    });

    setBenchmark({
      preprocessTime: preprocessTime.toFixed(2),
      inferenceTime: inferenceTime.toFixed(2),
      postprocessTime: postprocessTime.toFixed(2),
      totalTime: totalTime.toFixed(2),
      fps
    });

    if (isInferencing) {
      animationRef.current = requestAnimationFrame(runInference);
    }
  };

  // Toggle inference
  const toggleInference = () => {
    if (!session) {
      setError('Please load a model first');
      return;
    }

    if (isInferencing) {
      cancelAnimationFrame(animationRef.current);
      setIsInferencing(false);
    } else {
      setIsInferencing(true);
      fpsCounterRef.current = { frames: 0, lastTime: Date.now() };
      runInference();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);



  const getConfidenceColor = (confidence) => {
    if (confidence > 0.7) return 'text-green-500';
    if (confidence > 0.4) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Waste Classifier</h1>
          <p className="text-gray-400">Real-time waste classification with ONNX Runtime</p>
        </div>

        {/* Model Upload */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            Load ONNX Model
          </h2>
          {isLoading && (
            <p className="mt-2 text-blue-400">Loading model...</p>
          )}
          {session && !isLoading && (
            <p className="mt-2 text-green-400">✓ Model loaded successfully</p>
          )}
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 flex items-start gap-3">
            <X className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Camera Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Camera Controls
          </h2>
          <div className="flex gap-4">
            <button
              onClick={startCamera}
              disabled={!session}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition"
            >
              Start Camera
            </button>
            <button
              onClick={stopCamera}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded transition"
            >
              Stop Camera
            </button>
            <button
              onClick={toggleInference}
              disabled={!session}
              className={`px-6 py-2 rounded transition ${isInferencing
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-blue-600 hover:bg-blue-700'
                } disabled:bg-gray-600 disabled:cursor-not-allowed`}
            >
              {isInferencing ? 'Stop Inference' : 'Start Inference'}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Video Feed */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Video Feed</h2>
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isInferencing && (
                <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  LIVE
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Prediction */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Prediction</h2>
              {prediction ? (
                <div>
                  <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                    <div className="text-3xl font-bold mb-2 capitalize">
                      {prediction.class}
                    </div>
                    <div className={`text-2xl font-semibold ${getConfidenceColor(prediction.confidence)}`}>
                      {(prediction.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    {prediction.allProbs.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-24 text-sm capitalize">{item.class}</div>
                        <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${item.confidence * 100}%` }}
                          />
                        </div>
                        <div className="w-16 text-right text-sm">
                          {(item.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  Start inference to see predictions
                </p>
              )}
            </div>

            {/* Benchmark */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Performance
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">FPS</span>
                  <span className="font-mono font-bold text-lg text-green-400">
                    {benchmark.fps}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Preprocess</span>
                  <span className="font-mono">{benchmark.preprocessTime} ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Inference</span>
                  <span className="font-mono">{benchmark.inferenceTime} ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Postprocess</span>
                  <span className="font-mono">{benchmark.postprocessTime} ms</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                  <span className="text-gray-400 font-semibold">Total</span>
                  <span className="font-mono font-bold">{benchmark.totalTime} ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
            <li>Wait for the ONNX model to load</li>
            <li>Click "Start Camera" to access your device camera</li>
            <li>Click "Start Inference" to begin real-time classification</li>
            <li>Point your camera at waste items to classify them</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default WasteClassifier;
