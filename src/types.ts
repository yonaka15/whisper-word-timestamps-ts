// Device configuration types
type DType =
  | "auto"
  | "fp32"
  | "fp16"
  | "q8"
  | "int8"
  | "uint8"
  | "q4"
  | "bnb4"
  | "q4f16";
type DeviceDType = DType | Record<string, DType>;

type DeviceType = "webgpu" | "wasm";

type DeviceConfigs = {
  [key in DeviceType]: {
    dtype: DeviceDType;
    device: DeviceType;
  };
};

// Progress callback type
type ProgressCallback = (info: {
  status: string;
  name?: string;
  progress?: number;
  total?: number;
}) => void;

// Progress data for UI
interface ProgressData {
  status: string;
  file?: string;
  progress?: number;
  total?: number;
}

// Message data types
type LoadMessageData = {
  device: DeviceType;
};

type RunMessageData = {
  audio: Float32Array;
  language: string;
};

type MessageTypes = "check" | "load" | "run";

// Worker messages
type WorkerMessage = {
  type: MessageTypes;
  data?: LoadMessageData | RunMessageData;
};

// Component refs
interface MediaInputRef {
  setMediaTime: (time: number) => void;
}

// Transcription types
interface TranscriptionResult {
  text: string;
  chunks: Array<{
    timestamp: [number, number];
    text: string;
  }>;
}

// Worker response types
interface BaseStatus {
  status: string;
  data?: string;
  error?: string;
}

type status = "loading" | "ready" | "error" | "progress";

export interface LoadingStatus extends BaseStatus {
  status: status;
  data?: string;
  file?: string;
  progress?: number;
  total?: number;
}

export interface TranscriptionStatus extends BaseStatus {
  status: "complete" | "error";
  result?: TranscriptionResult;
  time?: number;
}

interface ProgressInfo {
  status: "progress";
  name: string;
  file: string;
  progress: number;
  loaded: number;
  total?: number;
}

export interface LoadingStatus extends BaseStatus {
  status: status;
  data?: string;
  name?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

export type {
  DType,
  DeviceType,
  DeviceConfigs,
  ProgressCallback,
  ProgressData,
  LoadMessageData,
  RunMessageData,
  WorkerMessage,
  MediaInputRef,
  TranscriptionResult,
};
