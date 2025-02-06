interface ProgressProps {
  text: string;
  percentage: number;
  total: number;
  className?: string;
}

function Progress({ text, percentage, total, className = "" }: ProgressProps) {
  // Calculate percentage with safety checks
  const safePercentage = Math.min(
    100,
    Math.max(0, (percentage / total) * 100 || 0)
  );

  return (
    <div className={`w-full mb-2 ${className}`}>
      <div className="flex justify-between mb-1 text-xs text-white">
        <span>{text}</span>
        <span>{`${Math.round(safePercentage)}%`}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${safePercentage}%` }}
        />
      </div>
    </div>
  );
}

export default Progress;
