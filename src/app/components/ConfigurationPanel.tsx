'use client';

import React from 'react';

interface ConfigurationPanelProps {
  modelId: string;
  apiUrl: string;
  onModelChange: (model: string) => void;
  onApiUrlChange: (url: string) => void;
}

const AVAILABLE_MODELS = ['gpt-4o-realtime-preview-2024-12-17'] as const;

const DEFAULT_API_URL = 'https://api.openai.com/v1/realtime';

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  modelId,
  apiUrl,
  onModelChange,
  onApiUrlChange,
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">
        API Configuration
      </h2>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Model
          <input
            list="models"
            value={modelId}
            onChange={(e) => onModelChange(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Select or type model ID"
          />
          <datalist id="models">
            {AVAILABLE_MODELS.map((model) => (
              <option key={model} value={model} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          API URL
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => onApiUrlChange(e.target.value)}
            placeholder={DEFAULT_API_URL}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </label>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
