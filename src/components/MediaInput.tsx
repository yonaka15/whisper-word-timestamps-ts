import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useState,
  useCallback,
} from "react";
import type { ForwardedRef } from "react";
import type { MediaInputRef } from "../types";

interface MediaInputProps {
  className?: string;
  onInputChange: (audio: Float32Array) => void;
  onTimeUpdate: (time: number) => void;
}

const MediaInput = forwardRef(function MediaInput(
  { className = "", onInputChange, onTimeUpdate }: MediaInputProps,
  ref: ForwardedRef<MediaInputRef>
) {
  const [dragActive, setDragActive] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const mediaRef = useRef<HTMLVideoElement>(null);

  // Expose setMediaTime method via ref
  useImperativeHandle(ref, () => ({
    setMediaTime: (time: number) => {
      if (mediaRef.current) {
        mediaRef.current.currentTime = time;
      }
    },
  }));

  const processFile = useCallback(
    async (file: File) => {
      try {
        console.log("Processing file:", file.name, file.type);

        // Validate file type
        if (
          !file.type.startsWith("audio/") &&
          !file.type.startsWith("video/")
        ) {
          throw new Error(
            "Invalid file type. Please select an audio or video file."
          );
        }

        // Create object URL for video preview
        const url = URL.createObjectURL(file);
        console.log("Created URL:", url);
        setMediaUrl(url);

        // Convert audio file to Float32Array
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Get audio data
        const channelData = audioBuffer.getChannelData(0);
        const resampledLength = Math.floor(
          channelData.length * (16000 / audioBuffer.sampleRate)
        );
        const resampledData = new Float32Array(resampledLength);

        // Simple resampling (for demo purposes)
        for (let i = 0; i < resampledLength; i++) {
          const originalIndex = Math.floor(
            i * (audioBuffer.sampleRate / 16000)
          );
          resampledData[i] = channelData[originalIndex];
        }

        onInputChange(resampledData);
      } catch (error) {
        console.error("Error processing file:", error);
        // Here you might want to add error handling UI
      }
    },
    [onInputChange]
  );

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer.files;
      if (files?.[0]) {
        await processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const files = e.target.files;
      if (files?.[0]) {
        await processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleTimeUpdate = useCallback(() => {
    if (mediaRef.current) {
      onTimeUpdate(mediaRef.current.currentTime);
    }
  }, [onTimeUpdate]);

  return (
    <div
      className={`relative ${className} ${
        dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900" : ""
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {!mediaUrl && (
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          accept="audio/*,video/*"
          onChange={handleChange}
        />
      )}

      {mediaUrl ? (
        <video
          ref={mediaRef}
          className="w-full h-full object-contain"
          src={mediaUrl}
          controls
          controlsList="nodownload"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            console.log("Video loaded");
          }}
          onError={(e) => {
            console.error("Video error:", e);
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-center p-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            音声または動画ファイルをここにドロップするか、クリックして選択してください
          </p>
        </div>
      )}
    </div>
  );
});

export default MediaInput;
