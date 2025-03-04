'use client';

import React from 'react';
import { useSession } from '../context/OpenAIRealtimeWebRTC';
import { JsonViewer } from '@textea/json-viewer';
import { ConnectionStatus } from '../types';

const SessionsDebugger: React.FC = () => {
  const { session } = useSession();

  if (!session) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No active sessions</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Sessions Debugger</h2>
      <div className="space-y-4">
        <div key={session.id} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Session ID: {session.id}</h3>
            <span
              className={`px-2 py-1 rounded-full text-sm ${
                session.connectionStatus === ConnectionStatus.CONNECTED
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {session.connectionStatus === ConnectionStatus.CONNECTED
                ? 'Connected'
                : 'Disconnected'}
            </span>
          </div>
          <div className="mt-2 overflow-auto max-h-96">
            <JsonViewer
              value={session}
              defaultInspectDepth={2}
              theme="light"
              displayDataTypes={false}
              enableClipboard={true}
              style={{
                backgroundColor: 'transparent',
                padding: '8px',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionsDebugger;
