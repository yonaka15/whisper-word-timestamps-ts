/// <reference lib="webworker" />

declare let self: WorkerGlobalScope & typeof globalThis;

import {
  pipeline,
  type AutomaticSpeechRecognitionPipeline,
  type PretrainedOptions,
} from "@huggingface/transformers";

import type {
  DType,
  DeviceType,
  DeviceConfigs,
  ProgressCallback,
  LoadMessageData,
  RunMessageData,
  WorkerMessage,
  LoadingStatus,
  TranscriptionStatus,
} from "./types";

type errorArg = string | unknown;

// Enhanced debug logging
const debugLog = (message: string, ...args: errorArg[]): void => {
  const timestamp = new Date().toISOString();
  console.log(`[Whisper Worker ${timestamp}] ${message}`, ...args);
};

const PER_DEVICE_CONFIG: DeviceConfigs = {
  webgpu: {
    dtype: {
      encoder_model: "fp32",
      decoder_model_merged: "q4",
    } as Record<string, DType>,
    device: "webgpu",
  },
  wasm: {
    dtype: "q8" as DType,
    device: "wasm",
  },
};

/**
 * This class uses the Singleton pattern to ensure that only one instance of the model is loaded.
 */
class PipelineSingleton {
  private static model_id = "onnx-community/whisper-base_timestamped";
  private static instance: Promise<AutomaticSpeechRecognitionPipeline> | null =
    null;

  static async getInstance(
    progress_callback?: ProgressCallback,
    device: DeviceType = "webgpu"
  ): Promise<AutomaticSpeechRecognitionPipeline> {
    try {
      if (!this.instance) {
        debugLog("Creating new pipeline instance");
        const config = {
          ...PER_DEVICE_CONFIG[device],
          progress_callback,
        } as PretrainedOptions;

        this.instance = pipeline(
          "automatic-speech-recognition",
          this.model_id,
          config
        ) as Promise<AutomaticSpeechRecognitionPipeline>;
      }
      return await this.instance;
    } catch (error) {
      debugLog("Error in getInstance:", error);
      throw error;
    }
  }
}

async function check(): Promise<void> {
  try {
    debugLog("Starting WebGPU check");

    if (!navigator.gpu) {
      debugLog("navigator.gpu not found");
      throw new Error("WebGPU is not supported (navigator.gpu not found)");
    }

    debugLog("navigator.gpu exists, requesting adapter");
    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      debugLog("No WebGPU adapter found");
      throw new Error("WebGPU is not supported (no adapter found)");
    }

    debugLog("WebGPU adapter found:", adapter);
    self.postMessage({
      status: "ready",
      data: "WebGPU is supported",
    } as LoadingStatus);
  } catch (error) {
    debugLog("Error in WebGPU check:", error);
    self.postMessage({
      status: "error",
      data: error instanceof Error ? error.message : String(error),
    } as LoadingStatus);
  }
}

async function load({ device }: LoadMessageData): Promise<void> {
  try {
    debugLog(`Loading model for device: ${device}`);
    self.postMessage({
      status: "loading",
      data: `Loading model (${device})...`,
    } as LoadingStatus);

    const transcriber = await PipelineSingleton.getInstance((progress) => {
      debugLog("Loading progress:", progress);
      self.postMessage(progress);
    }, device);

    if (device === "webgpu") {
      self.postMessage({
        status: "loading",
        data: "Compiling shaders and warming up model...",
      } as LoadingStatus);

      debugLog("Running warmup inference");
      await transcriber(new Float32Array(16_000), {
        language: "ja",
      });
    }

    self.postMessage({ status: "ready" } as LoadingStatus);
    debugLog("Model load complete");
  } catch (error) {
    debugLog("Error in load:", error);
    self.postMessage({
      status: "error",
      data: error instanceof Error ? error.message : String(error),
    } as LoadingStatus);
  }
}

async function run({ audio, language }: RunMessageData): Promise<void> {
  try {
    debugLog(`Starting transcription in language: ${language}`);
    const transcriber = await PipelineSingleton.getInstance();

    const start = performance.now();
    debugLog("Starting transcription process");

    const result = await transcriber(audio, {
      language,
      return_timestamps: "word",
      chunk_length_s: 30,
    });

    const end = performance.now();
    const time = end - start;

    debugLog("Transcription complete", { result, time });
    self.postMessage({
      status: "complete",
      result,
      time,
    } as TranscriptionStatus);
  } catch (error) {
    debugLog("Error in run:", error);
    self.postMessage({
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    } as TranscriptionStatus);
  }
}

// Message handler
self.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;
  debugLog("Received message:", { type, data });

  try {
    switch (type) {
      case "check":
        await check();
        break;

      case "load":
        await load(data as LoadMessageData);
        break;

      case "run":
        await run(data as RunMessageData);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    debugLog("Error in message handler:", error);
    self.postMessage({
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    } as TranscriptionStatus);
  }
});

export {};
