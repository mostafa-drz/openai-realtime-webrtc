# OpenAI Realtime WebRTC Demo

A comprehensive demo application showcasing real-time voice conversations with OpenAI's AI models using WebRTC technology. This demo provides a clean, extensible interface for developers to understand and test the `useRealtimeClient` hook.

## 🚀 Features

### Core Functionality

- **Real-time Voice Conversations**: Natural voice interaction with AI models
- **WebRTC Integration**: Seamless audio streaming and data channel communication
- **Session Management**: Create, configure, and manage AI sessions using Next.js Server Actions
- **Voice Controls**: Start/stop microphone input with visual feedback
- **Real-time Events**: Live event logging and debugging

### UI Components

- **Session Management**: One-click session creation with current settings
- **Settings Panel**: Configure AI voice, temperature, speed, and instructions
- **Voice Controls**: Microphone activation with status indicators
- **Conversation Panel**: Real-time display of user input and AI responses
- **Event Log**: Comprehensive event tracking for debugging
- **Status Bar**: Connection and microphone status monitoring

### Developer Features

- **TypeScript Support**: Full type safety throughout the application
- **Server Actions**: Next.js 15 server actions for session creation
- **Event System**: Comprehensive event logging and debugging
- **Extensible Architecture**: Easy to add new features and components

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

- Configure your AI settings (voice, temperature, speed, instructions)
- Click "Start New Session" to create a session using Next.js Server Actions
- The demo automatically connects and establishes the WebRTC session

### 2. Voice Interaction

- Click "Start Recording" to enable microphone
- Speak naturally - the AI will respond in real-time
- Click "Stop Recording" when finished

### 3. Monitoring

- Watch the conversation panel for real-time updates
- Monitor connection status in the status bar
- Review events in the collapsible event log

## 🏗️ Architecture

### Component Structure

```
src/
├── app/
│   └── page.tsx                 # Main demo page
├── components/
│   ├── RealtimeDemo.tsx         # Main demo component
│   ├── SettingsPanel.tsx        # Session configuration
│   ├── VoiceControls.tsx        # Microphone controls
│   ├── ConversationPanel.tsx    # Conversation display
│   ├── StatusBar.tsx           # Status indicators
│   └── EventLog.tsx            # Event debugging
├── lib/
│   ├── actions.ts              # Server actions for session creation
│   └── openai-realtime/
│       ├── useRealtimeClient.ts # React hook
│       ├── client/RealtimeClient.ts # WebRTC client
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
- Logs events for debugging

#### Server Actions (`src/lib/actions.ts`)

Next.js 15 server actions for session creation:

- `createRealtimeSession()` - Creates OpenAI Realtime sessions
- Uses the server module for API communication
- Returns client secret for WebRTC connection

#### SettingsPanel

Configurable session parameters:

- Voice selection (Alloy, Ash, Ballad, Coral, Echo, Sage, Shimmer, Verse)
- Audio format (PCM16, G711)
- Temperature and speed controls
- System instructions

#### VoiceControls

Microphone management:

- Start/stop recording
- Visual status indicators
- Usage instructions

#### ConversationPanel

Real-time conversation display:

- User transcript display
- AI response streaming
- Connection status
- Empty states

## 🔧 Extending the Demo

### Adding New Features

#### 1. Text Input Support

```typescript
// Add text input to ConversationPanel
const [textInput, setTextInput] = useState('');

const handleTextSubmit = async () => {
  if (!client || !textInput.trim()) return;

  // Send text input via data channel
  client.sendTextInput(textInput);
  setTextInput('');
};
```

#### 2. Conversation History

```typescript
// Add conversation state management
const [conversationHistory, setConversationHistory] = useState<Message[]>([]);

const addMessage = (role: 'user' | 'assistant', content: string) => {
  setConversationHistory((prev) => [
    ...prev,
    { role, content, timestamp: new Date() },
  ]);
};
```

#### 3. Session Persistence

```typescript
// Add session storage
const saveSession = (sessionId: string, config: SessionConfig) => {
  localStorage.setItem(`session_${sessionId}`, JSON.stringify(config));
};

const loadSession = (sessionId: string) => {
  const saved = localStorage.getItem(`session_${sessionId}`);
  return saved ? JSON.parse(saved) : null;
};
```

#### 4. Advanced Event Handling

Based on the comprehensive event types available:

```typescript
// Handle more server events
const handleServerEvent = (event: ServerEvent) => {
  switch (event.type) {
    case ServerEventType.RESPONSE_CREATED:
      addEvent('response_created', { responseId: event.response.id });
      break;
    case ServerEventType.RESPONSE_DONE:
      addEvent('response_done', { responseId: event.response.id });
      break;
    case ServerEventType.CONVERSATION_ITEM_CREATED:
      addEvent('item_created', { item: event.item });
      break;
    // ... handle more events
  }
};
```

### Future Enhancements

#### 1. Multi-Session Support

- Session switching
- Session comparison
- Session templates

#### 2. Advanced Audio Features

- Audio recording and playback
- Audio visualization
- Noise reduction settings

#### 3. Conversation Management

- Save/load conversations
- Export conversations
- Conversation search

#### 4. Developer Tools

- WebRTC connection inspector
- Performance metrics
- Network diagnostics

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
    onMessageToken: (token) => console.log('Token:', token),
    onTranscript: (transcript) => console.log('Transcript:', transcript),
    onError: (error) => console.error('Error:', error),
  });

  // Use the hook methods...
}
```

## 🐛 Debugging

### Event Log

The demo includes a comprehensive event log that shows:

- Session creation and connection events
- Message tokens and transcripts
- Errors and warnings
- Session updates
- Voice control events

### Common Issues

1. **Session Creation Failed**: Check your OpenAI API key and permissions
2. **Connection Failed**: Verify the client secret is valid
3. **Microphone Not Working**: Ensure browser permissions
4. **No Audio Output**: Check browser audio settings
5. **Events Not Logging**: Verify event handlers are properly configured

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
