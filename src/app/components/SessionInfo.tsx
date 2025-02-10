import React from 'react';

interface SessionInfoProps {
  startTime?: string;
  endTime?: string;
  duration?: number;
}

const SessionInfo: React.FC<SessionInfoProps> = ({ startTime, endTime, duration }) => {
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Not set';
    return new Date(isoString).toLocaleString();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  return (
    <div className="bg-gray-100 border border-gray-200 rounded-md p-4 w-full max-w-sm shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Session Info</h3>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>Start:</span>
        <span className="font-medium">{formatDateTime(startTime)}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>End:</span>
        <span className="font-medium">{formatDateTime(endTime)}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-800 font-bold border-t border-gray-300 pt-2">
        <span>Duration:</span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  );
};

export default SessionInfo; 