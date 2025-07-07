# OpenAI Realtime WebRTC Demo

A comprehensive demo application showcasing real-time voice conversations with OpenAI's AI models using WebRTC technology. This demo provides a clean, extensible interface for developers to understand and test the `useRealtimeClient` hook.

## 🚀 Features

### Core Functionality

- **Real-time Voice Conversations**: Natural voice interaction with AI models
- **WebRTC Integration**: Seamless audio streaming and data channel communication
- **Session Management**: Create, configure, and manage AI sessions using Next.js Server Actions
- **Voice Controls**: Start/stop microphone input with visual feedback
- **Real-time Events**: Live event logging and debugging
- **NEW: Speaker-Specific Transcripts**: Separate handling for user vs assistant speech
- **NEW: Chat-like Interface**: Live streaming and final transcript display
- **NEW: Enhanced Error Handling**: Inline transcription error display with recovery

### UI Components

- **Session Management**: One-click session creation with current settings
- **Settings Panel**: Configure AI voice, temperature, speed, and instructions
- **Voice Controls**: Microphone activation with status indicators
- **Conversation Panel**: Real-time display of user input and AI responses with chat-like interface
- **Transcription Panel**: Dedicated transcription-only mode with live streaming
- **Event Log**: Comprehensive event tracking for debugging
- **Status Bar**: Connection and microphone status monitoring

### Developer Features

- **TypeScript Support**: Full type safety throughout the application
- **Server Actions**: Next.js 15 server actions for session creation
- **Event System**: Comprehensive event logging and debugging
- **Extensible Architecture**: Easy to add new features and components
- **NEW: Transcript Callbacks**: Speaker-specific transcript event handling
- **NEW: Session Type Support**: Both regular chat and transcription-only modes

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key with Realtime API access
- Modern browser with WebRTC support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd openai-realtime-webrtc

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
```

### Environment Setup

Add your OpenAI API key to `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Running the Demo

```bash
# Start the development server
npm run dev

# Open http://localhost:3000
```

## 📖 Usage Guide

### 1. Session Creation

- **Choose Session Type**: Select between "Regular Chat Session" or "Transcription Session"
- **Configure AI Settings**: Set voice, temperature, speed, and instructions
- **Start Session**: Click "Start Session & Recording" to create a session using Next.js Server Actions
- **Automatic Connection**: The demo automatically connects and establishes the WebRTC session

### 2. Voice Interaction

#### Regular Chat Sessions

- **Real-time Conversation**: Speak naturally and receive AI responses
- **Live Transcripts**: See your speech transcribed in real-time as you speak
- **AI Response Streaming**: Watch AI responses stream in real-time
- **Text Input**: Optionally type messages for text-based interaction

#### Transcription Sessions

- **Speech-to-Text Only**: Focus on transcription without AI responses
- **Live User Transcripts**: Real-time display of your speech
- **Final Transcripts**: Completed messages saved to conversation history
- **Error Handling**: Inline display of transcription errors with recovery

### 3. Monitoring

- **Chat-like Interface**: Watch conversations in a modern messaging format
- **Live vs Final Transcripts**: Distinguish between streaming and completed messages
- **Speaker Indicators**: Clear visual separation between user and assistant
- **Auto-scroll**: Automatic scrolling to keep latest messages visible
- **Connection Status**: Monitor connection and microphone status
- **Event Logging**: Review comprehensive event timeline for debugging

## 🏗️ Architecture

### Component Structure

```
src/
├── app/
│   └── page.tsx                 # Main demo page
├── components/
│   ├── RealtimeDemo.tsx         # Main demo component with transcript state management
│   ├── SettingsPanel.tsx        # Session configuration
│   ├── ConversationPanel.tsx    # Chat-like conversation display with live transcripts
│   ├── TranscriptionPanel.tsx   # Dedicated transcription-only interface
│   ├── StatusBar.tsx           # Status indicators
│   └── EventLog.tsx            # Event debugging
├── lib/
│   ├── actions.ts              # Server actions for session creation
│   └── openai-realtime/
│       ├── client/RealtimeClient.ts # WebRTC client with speaker-specific callbacks
│       ├── server/index.ts     # Server-side session creation
│       └── types/              # TypeScript definitions
```

### Key Components

#### RealtimeDemo

The main demo component that orchestrates all functionality:

- Manages session configuration and state
- Uses server actions for session creation
- Handles WebRTC connection lifecycle
- Coordinates between UI components
- **NEW: Manages transcript state** - Live and final transcripts for both speakers
- **NEW: Speaker-specific callbacks** - Separate handling for user vs assistant
- **NEW: Session type switching** - Regular chat vs transcription-only modes
- Logs events for debugging

#### Server Actions (`src/lib/actions.ts`)

Next.js 15 server actions for session creation:

- `createRealtimeSession()` - Creates OpenAI Realtime sessions
- `createRealtimeTranscriptionSession()` - Creates transcription-only sessions
- Uses the server module for API communication
- Returns client secret for WebRTC connection

#### SettingsPanel

Configurable session parameters:

- Voice selection (Alloy, Ash, Ballad, Coral, Echo, Sage, Shimmer, Verse)
- Audio format (PCM16, G711)
- Temperature and speed controls
- System instructions
- **NEW: Session type selection** - Regular vs transcription modes

#### ConversationPanel

Chat-like conversation display:

- **Live User Transcripts**: Real-time display as user speaks
- **Live Assistant Transcripts**: Real-time display as AI responds
- **Final Transcripts**: Completed messages in conversation history
- **Speaker Distinction**: Clear visual separation between user and assistant
- **Auto-scroll**: Automatic scrolling to latest messages
- **Text Input**: Optional text message input for regular sessions
- **Error Handling**: Inline transcription error display
- Connection status and empty states

#### TranscriptionPanel

Dedicated transcription-only interface:

- **Live User Transcripts**: Real-time speech-to-text display
- **Final Transcripts**: Completed user messages in history
- **Error Handling**: Inline transcription error display with recovery
- **Chat-like Interface**: Modern messaging format
- Connection status and empty states

## 🔧 Extending the Demo

### Adding New Features

#### 1. Enhanced Transcript Handling

```typescript
// Add speaker-specific transcript state management
const [liveUserTranscript, setLiveUserTranscript] = useState('');
const [liveAssistantTranscript, setLiveAssistantTranscript] = useState('');
const [conversationHistory, setConversationHistory] = useState<
  Array<{
    id: string;
    speaker: 'user' | 'assistant';
    text: string;
    timestamp: Date;
    type: 'transcript' | 'text' | 'error';
  }>
>([]);

const client = new RealtimeClient({
  // User transcript callbacks
  onUserTranscriptDelta: (text) => {
    setLiveUserTranscript(text);
    console.log('User speaking:', text);
  },
  onUserTranscriptDone: (text) => {
    setLiveUserTranscript('');
    setConversationHistory((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        speaker: 'user',
        text,
        timestamp: new Date(),
        type: 'transcript',
      },
    ]);
  },

  // Assistant transcript callbacks
  onAssistantTranscriptDelta: (text) => {
    setLiveAssistantTranscript(text);
    console.log('Assistant speaking:', text);
  },
  onAssistantTranscriptDone: (text) => {
    setLiveAssistantTranscript('');
    setConversationHistory((prev) => [
      ...prev,
      {
        id: `assistant-${Date.now()}`,
        speaker: 'assistant',
        text,
        timestamp: new Date(),
        type: 'transcript',
      },
    ]);
  },

  // Error handling
  onTranscriptionError: (error) => {
    console.error('Transcription failed:', error.message);
    setConversationHistory((prev) => [
      ...prev,
      {
        id: `error-${Date.now()}`,
        speaker: 'user',
        text: `Transcription error: ${error.message}`,
        timestamp: new Date(),
        type: 'error',
      },
    ]);
  },
});
```

#### 2. Chat-like UI Components

```typescript
// Create message bubble components
const MessageBubble = ({ message, isLive = false }) => {
  const isUser = message.speaker === 'user';
  const isError = message.type === 'error';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isError
          ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          : isUser
          ? 'bg-blue-500 text-white'
          : 'bg-green-500 text-white'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs opacity-75">
            {isUser ? '👤 You' : '🤖 Assistant'}
            {isLive && ' (speaking...)'}
          </span>
          <span className="text-xs opacity-50">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm">
          {message.text}
          {isLive && (
            <span className="inline-block w-2 h-4 bg-white ml-1 animate-pulse" />
          )}
        </p>
      </div>
    </div>
  );
};
```

#### 3. Session Type Management

```typescript
// Add session type switching
const [sessionType, setSessionType] = useState<'regular' | 'transcription'>('regular');

const handleSessionTypeChange = (type: 'regular' | 'transcription') => {
  setSessionType(type);
  // Update client configuration based on session type
  if (client) {
    client.disconnect();
    // Reconnect with new session type
  }
};

// Conditional rendering based on session type
{sessionType === 'regular' ? (
  <ConversationPanel
    connected={connected}
    liveUserTranscript={liveUserTranscript}
    liveAssistantTranscript={liveAssistantTranscript}
    conversationHistory={conversationHistory}
    transcriptionError={transcriptionError}
  />
) : (
  <TranscriptionPanel
    connected={connected}
    liveUserTranscript={liveUserTranscript}
    conversationHistory={conversationHistory}
    transcriptionError={transcriptionError}
  />
)}
```

#### 4. Advanced Event Handling

```typescript
// Handle comprehensive transcript events
const handleServerEvent = (event: ServerEvent) => {
  switch (event.type) {
    case ServerEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_DELTA:
      // Live user transcript
      console.log('User transcript delta:', event.delta);
      break;
    case ServerEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED:
      // Final user transcript
      console.log('User transcript completed:', event.transcript);
      break;
    case ServerEventType.RESPONSE_AUDIO_TRANSCRIPT_DELTA:
      // Live assistant transcript
      console.log('Assistant transcript delta:', event.delta);
      break;
    case ServerEventType.RESPONSE_AUDIO_TRANSCRIPT_DONE:
      // Final assistant transcript
      console.log('Assistant transcript done:', event.transcript);
      break;
    case ServerEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_FAILED:
      // Transcription error
      console.error('Transcription failed:', event.error);
      break;
  }
};
```

### Future Enhancements

#### 1. Multi-Session Support

- Session switching with transcript preservation
- Session comparison with side-by-side transcript views
- Session templates with predefined transcript handling

#### 2. Advanced Audio Features

- Audio recording and playback with transcript synchronization
- Audio visualization with real-time transcript overlay
- Noise reduction settings with transcript quality indicators

#### 3. Enhanced Conversation Management

- Save/load conversations with full transcript history
- Export conversations in various formats (text, JSON, SRT)
- Conversation search with transcript content indexing
- Transcript editing and correction tools

#### 4. Developer Tools

- WebRTC connection inspector with transcript event timeline
- Performance metrics for transcript accuracy and latency
- Network diagnostics with transcript quality correlation
- Real-time transcript confidence scoring display

#### 5. Advanced Transcript Features

- Multi-language transcript support
- Speaker diarization for multiple speakers
- Transcript summarization and key point extraction
- Sentiment analysis integration with transcript display

## 🎯 Server Actions Integration

### Session Creation

The demo uses Next.js 15 Server Actions for session creation:

```typescript
// Server Action (src/lib/actions.ts)
'use server';

import { createSession } from '@/lib/openai-realtime/server';
import { SessionConfig } from '@/lib/openai-realtime/types';

export async function createRealtimeSession(config: SessionConfig) {
  const session = await createSession(config);
  return {
    success: true,
    clientSecret: session.client_secret.value,
    sessionId: session.id,
    // ... other session data
  };
}
```

### Using the Hook

```typescript
import { useRealtimeClient } from '@/lib/openai-realtime/useRealtimeClient';

function MyComponent() {
  const {
    connect,
    disconnect,
    startVoiceInput,
    stopVoiceInput,
    connected,
    micEnabled,
    error,
  } = useRealtimeClient({
    clientSecret: 'your_client_secret',
    model: 'gpt-4o-realtime-preview-2024-12-17',
    realtimeUrl: 'https://api.openai.com/v1/realtime/sessions',

    // Speaker-specific transcript callbacks
    onUserTranscriptDelta: (text) => console.log('User speaking:', text),
    onUserTranscriptDone: (text) => console.log('User finished:', text),
    onAssistantTranscriptDelta: (text) =>
      console.log('Assistant speaking:', text),
    onAssistantTranscriptDone: (text) =>
      console.log('Assistant finished:', text),
    onTranscriptionError: (error) =>
      console.error('Transcription error:', error),

    // Legacy callbacks (still supported)
    onMessageToken: (token) => console.log('Token:', token),
    onError: (error) => console.error('Error:', error),
  });

  // Use the hook methods...
}
```

### Direct Client Usage

```typescript
import { RealtimeClient } from '@/lib/openai-realtime/client/RealtimeClient';

const client = new RealtimeClient({
  clientSecret: 'your_client_secret',
  model: 'gpt-4o-realtime-preview-2024-12-17',
  realtimeUrl: 'https://api.openai.com/v1/realtime/sessions',

  // Speaker-specific transcript callbacks
  onUserTranscriptDelta: (text) => {
    // Handle live user transcript updates
    setLiveUserTranscript(text);
  },
  onUserTranscriptDone: (text) => {
    // Handle completed user transcript
    addToConversationHistory({
      speaker: 'user',
      text,
      timestamp: new Date(),
      type: 'transcript',
    });
  },
  onAssistantTranscriptDelta: (text) => {
    // Handle live assistant transcript updates
    setLiveAssistantTranscript(text);
  },
  onAssistantTranscriptDone: (text) => {
    // Handle completed assistant transcript
    addToConversationHistory({
      speaker: 'assistant',
      text,
      timestamp: new Date(),
      type: 'transcript',
    });
  },
  onTranscriptionError: (error) => {
    // Handle transcription errors
    setTranscriptionError(error.message);
  },
});
```

## 🐛 Debugging

### Event Log

The demo includes a comprehensive event log that shows:

- Session creation and connection events
- **NEW: Speaker-specific transcript events** (user vs assistant)
- **NEW: Live transcript deltas** and completion events
- **NEW: Transcription error events** with detailed error messages
- Message tokens and legacy transcripts
- Errors and warnings
- Session updates
- Voice control events

### Common Issues

1. **Session Creation Failed**: Check your OpenAI API key and permissions
2. **Connection Failed**: Verify the client secret is valid
3. **Microphone Not Working**: Ensure browser permissions
4. **No Audio Output**: Check browser audio settings
5. **Events Not Logging**: Verify event handlers are properly configured
6. **NEW: Transcript Not Appearing**: Check speaker-specific callback configuration
7. **NEW: Transcription Errors**: Review error messages in the conversation panel
8. **NEW: Session Type Issues**: Ensure correct session type for your use case

### Transcript Debugging

```typescript
// Enable detailed transcript logging
const client = new RealtimeClient({
  // ... other config
  onUserTranscriptDelta: (text) => {
    console.log('🔵 User Delta:', text);
    setLiveUserTranscript(text);
  },
  onUserTranscriptDone: (text) => {
    console.log('🔵 User Done:', text);
    setLiveUserTranscript('');
    addToHistory({ speaker: 'user', text });
  },
  onAssistantTranscriptDelta: (text) => {
    console.log('🟢 Assistant Delta:', text);
    setLiveAssistantTranscript(text);
  },
  onAssistantTranscriptDone: (text) => {
    console.log('🟢 Assistant Done:', text);
    setLiveAssistantTranscript('');
    addToHistory({ speaker: 'assistant', text });
  },
  onTranscriptionError: (error) => {
    console.error('❌ Transcription Error:', error.message);
    setTranscriptionError(error.message);
  },
});
```

## 📚 Resources

- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/realtime)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [WebRTC MDN Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

This demo is designed to be extensible. Feel free to:

- Add new features and components
- Improve the UI/UX
- Add more comprehensive error handling
- Create additional examples

## 📄 License

This project is licensed under the MIT License.
