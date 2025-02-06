import type { TranscriptionResult } from "../types";

interface TranscriptProps {
  transcript: TranscriptionResult;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  className?: string;
}

function Transcript({
  transcript,
  currentTime,
  setCurrentTime,
  className = "",
}: TranscriptProps) {
  return (
    <div className={className}>
      {transcript.chunks.map((chunk, i) => {
        const [start, end] = chunk.timestamp;
        const isActive = currentTime >= start && currentTime <= end;

        return (
          <span
            key={i}
            className={`cursor-pointer ${
              isActive
                ? "bg-blue-200 dark:bg-blue-800"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            onClick={() => setCurrentTime(start)}
          >
            {chunk.text}{" "}
          </span>
        );
      })}
    </div>
  );
}

export default Transcript;
