import { useEffect, useState, useRef, useCallback } from "react";

import type {
  DeviceType,
  LoadingStatus,
  ProgressData,
  TranscriptionResult,
  TranscriptionStatus,
  MediaInputRef,
} from "./types";

// Import components
import Progress from "./components/Progress";
import MediaInput from "./components/MediaInput";
import Transcript from "./components/Transcript";
import LanguageSelector from "./components/LanguageSelector";

async function hasWebGPU(): Promise<boolean> {
  if (!navigator.gpu) {
    return false;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch (e) {
    console.error("WebGPU not supported:", e);
    return false;
  }
}

function App() {
  // Create a reference to the worker object
  const worker = useRef<Worker | null>(null);
  const mediaInputRef = useRef<MediaInputRef | null>(null);

  // State management
  const [status, setStatus] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [progressItems, setProgressItems] = useState<ProgressData[]>([]);

  const [audio, setAudio] = useState<Float32Array | null>(null);
  const [language, setLanguage] = useState<string>("ja");
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const [device, setDevice] = useState<DeviceType>("webgpu");
  const [modelSize, setModelSize] = useState<number>(
    "gpu" in navigator ? 196 : 77
  );

  // Check WebGPU support
  useEffect(() => {
    hasWebGPU().then((result) => {
      setModelSize(result ? 196 : 77);
      setDevice(result ? "webgpu" : "wasm");
    });
  }, []);

  // Initialize worker
  useEffect(() => {
    worker.current ??= new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });

    const onMessageReceived = (
      e: MessageEvent<LoadingStatus | ProgressData | TranscriptionStatus>
    ) => {
      const data = e.data;

      switch (data.status) {
        case "loading":
          setStatus("loading");
          if ("data" in data && typeof data.data === "string") {
            setLoadingMessage(data.data);
          }
          break;

        case "progress":
          // Handle both model loading progress and transcription progress
          setProgressItems((prev) => {
            const progressItem = {
              status: "progress",
              file: data.file,
              progress: data.progress,
              total: 100, // Progress comes as percentage
            };

            const existingIndex = prev.findIndex(
              (item) => item.file === data.file
            );
            if (existingIndex >= 0) {
              const newItems = [...prev];
              newItems[existingIndex] = progressItem;
              return newItems;
            }
            return [...prev, progressItem];
          });
          break;

        case "initiate":
          setProgressItems((prev) => [...prev, data as ProgressData]);
          break;

        case "done":
          setProgressItems((prev) =>
            prev.filter((item) => item.file !== (data as ProgressData).file)
          );
          break;

        case "ready":
          setStatus("ready");
          break;

        case "complete":
          const transcriptionStatus = data as TranscriptionStatus;
          if (transcriptionStatus.result) {
            setResult(transcriptionStatus.result);
            setTime(transcriptionStatus.time ?? null);
          }
          setStatus("ready");
          break;

        case "error":
          // Check if the data has an error property
          if ("error" in data) {
            console.error("Worker error:", data.error);
          } else {
            console.error("Worker error: Unknown error");
          }
          setStatus("error");
          break;
      }
    };

    worker.current.addEventListener("message", onMessageReceived);

    return () => {
      worker.current?.removeEventListener("message", onMessageReceived);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (!worker.current) return;

    setResult(null);
    setTime(null);

    if (status === null) {
      setStatus("loading");
      worker.current.postMessage({ type: "load", data: { device } });
    } else if (audio) {
      setStatus("running");
      worker.current.postMessage({
        type: "run",
        data: { audio, language },
      });
    }
  }, [status, audio, language, device]);

  return (
    <div className="w-screen h-screen text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900">
      <div className="flex flex-col mx-auto items justify-end max-w-xl h-full">
        {status === "loading" && (
          <div className="flex justify-center items-center fixed w-screen h-screen bg-black z-10 bg-opacity-90 top-0 left-0">
            <div className="w-full max-w-lg">
              <p className="text-center mb-1 text-white text-md">
                {loadingMessage}
              </p>
              {progressItems.map(({ file, progress, total }, i) => (
                <Progress
                  key={i}
                  text={file ?? ""}
                  percentage={progress ?? 0}
                  total={total ?? 0}
                />
              ))}
            </div>
          </div>
        )}

        <div className="h-full flex justify-center items-center flex-col relative">
          <div className="flex flex-col items-center mb-1 text-center">
            <h1 className="text-5xl font-bold mb-2">Whisper タイムスタンプ</h1>
            <h2 className="text-xl font-semibold">
              ブラウザで動作する音声認識（単語レベルのタイムスタンプ付き）
            </h2>
          </div>

          <div className="w-full min-h-[220px] flex flex-col justify-center items-center p-2">
            {!audio && (
              <p className="mb-2">
                <a
                  href="https://huggingface.co/onnx-community/whisper-base_timestamped"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline"
                >
                  whisper-base (timestamped)
                </a>{" "}
                をダウンロードします。このモデルは7,300万のパラメータを持つ音声認識モデルで、
                100以上の言語で単語レベルのタイムスタンプを生成できます。
                一度読み込まれたモデル（{modelSize}&nbsp;MB）は、
                次回のアクセス時にはキャッシュから再利用されます。
                <br />
                <br />
                すべての処理は{" "}
                <a
                  href="https://huggingface.co/docs/transformers.js"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  🤗&nbsp;Transformers.js
                </a>{" "}
                とONNX Runtime Webを使用してブラウザ上でローカルに実行されます。
                サーバーへのAPIコールは一切行われないため、
                モデルの読み込み後はインターネット接続なしでも使用できます！
              </p>
            )}

            <div className="flex flex-col w-full m-3">
              <span className="text-sm mb-0.5">音声/動画ファイルを入力</span>
              <MediaInput
                ref={mediaInputRef}
                className="flex items-center border rounded-md cursor-pointer min-h-[100px] max-h-[500px] overflow-hidden"
                onInputChange={setAudio}
                onTimeUpdate={setCurrentTime}
              />
            </div>

            <div className="relative w-full flex justify-center items-center">
              <button
                className="border px-4 py-2 rounded-lg bg-blue-400 text-white hover:bg-blue-500 disabled:bg-blue-100 disabled:cursor-not-allowed select-none cursor-pointer"
                onClick={handleClick}
                disabled={
                  status === "running" || (status !== null && audio === null)
                }
              >
                {status === null
                  ? "モデルを読み込む"
                  : status === "running"
                  ? "実行中..."
                  : "モデルを実行"}
              </button>

              {status !== null && (
                <div className="absolute right-0 bottom-0">
                  <span className="text-xs">言語:</span>
                  <br />
                  <LanguageSelector
                    className="border rounded-lg p-1 max-w-[100px] dark:bg-gray-800"
                    language={language}
                    setLanguage={setLanguage}
                  />
                </div>
              )}
            </div>

            {result && time && (
              <>
                <div className="w-full mt-4 border rounded-md">
                  <Transcript
                    className="p-2 max-h-[200px] overflow-y-auto scrollbar-thin select-none"
                    transcript={result}
                    currentTime={currentTime}
                    setCurrentTime={(time) => {
                      setCurrentTime(time);
                      mediaInputRef.current?.setMediaTime(time);
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 text-end p-1">
                  生成時間:{" "}
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">
                    {time.toFixed(2)}ms
                  </span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
