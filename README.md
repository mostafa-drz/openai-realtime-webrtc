## OpenAI Realtime WebRTC Integration (Next.js)

This project provides a reusable, minimal boilerplate to integrate the OpenAI Realtime API with WebRTC using TypeScript and Next.js. It handles session creation, audio + data channel transport, and exposes a clean abstraction for frontend developers.

### 🔧 Features

- Ephemeral token authentication (client-secret)
- WebRTC connection management (audio + data)
- Voice input and output stream support
- Custom `RealtimeClient` class with high-level abstraction
- `useRealtimeClient` React hook with state management
- **Comprehensive Event System** - Raw event access with high-level APIs
- **NEW: Speaker-Specific Transcript Callbacks** - Separate handling for user vs assistant transcripts
- **NEW: Chat-like Interface** - Live streaming and final transcript display
- **NEW: Enhanced Demo App** - Full-featured UI showcasing all capabilities with real-time transcript visualization
- **Environment Configuration** - Fully configurable via environment variables
- Future-ready structure for publishing as an npm package

### 🚀 Quick Start

> **💡 Don't have Node.js installed?** Use Docker instead:
>
> ```bash
> git clone https://github.com/mostafa-drz/openai-realtime-webrtc.git
> cd openai-realtime-webrtc
> cp env.example .env.local
> # Edit .env.local with your OpenAI API key
> docker-compose up --build
> ```
>
> **Or with Docker directly:**
>
> ```bash
> docker build -t app .
> docker run -p 3000:3000 --env-file .env.local app
> ```

#### **Prerequisites**

- Node.js 18+ and npm
- OpenAI API key with Realtime API access
- Modern browser with WebRTC support

#### **Installation**

```bash
# Clone the repository
git clone https://github.com/mostafa-drz/openai-realtime-webrtc.git
cd openai-realtime-webrtc

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
```

#### **Environment Configuration**

Add your OpenAI configuration to `.env.local`:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_BASE_URL=https://api.openai.com/v1

# Realtime API Endpoints
OPENAI_REALTIME_SESSION_URL=https://api.openai.com/v1/realtime/sessions
NEXT_PUBLIC_OPENAI_REALTIME_WEBRTC_URL=https://api.openai.com/v1/realtime

# Model Configuration
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o-realtime-preview-2024-12-17
```

**Environment Variables Explained:**

- **`OPENAI_API_KEY`** - Your OpenAI API key for session creation
- **`OPENAI_API_BASE_URL`** - Base URL for all OpenAI API calls (optional, defaults to production)
- **`OPENAI_REALTIME_SESSION_URL`** - Session creation endpoint (server-side)
- **`NEXT_PUBLIC_OPENAI_REALTIME_WEBRTC_URL`** - WebRTC connection endpoint (client-side)
- **`NEXT_PUBLIC_OPENAI_MODEL`** - Default model for the demo application

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the client-side code.

#### **Running the Demo**

```bash
# Start the development server
npm run dev

# Open http://localhost:3000
```

#### **Docker Development (Recommended for Quick Start)**

```bash
# Using Docker Compose (with hot reloading)
docker-compose up --build

# Or using Docker directly
docker build -t app .
docker run -p 3000:3000 --env-file .env.local app

# Open http://localhost:3000
```

**Docker Benefits:**

- ✅ No Node.js installation required
- ✅ Hot reloading with code changes
- ✅ Consistent environment across machines
- ✅ Quick setup for experimentation

### 🧠 Architecture

#### **OpenAI Realtime API Flow**

The OpenAI Realtime API operates in two distinct phases:

**Phase 1: Session Creation**

```
Client → Server Action → OpenAI API
POST /api/realtime/sessions
{
  "model": "gpt-4o-realtime-preview-2024-12-17",
  "voice": "echo",
  "temperature": 0.8,
  "instructions": "You are a helpful assistant"
}
```

**Response:**

```json
{
  "id": "session_abc123",
  "client_secret": {
    "value": "rt_xyz789...",
    "expires_at": 1234567890
  },
  "model": "gpt-4o-realtime-preview-2024-12-17",
  "voice": "echo"
}
```

**Phase 2: WebRTC Connection**

```
Client → OpenAI WebRTC Endpoint
POST /api/realtime?model=gpt-4o-realtime-preview-2024-12-17
Headers: {
  "Authorization": "Bearer rt_xyz789...",
  "Content-Type": "application/sdp"
}
Body: SDP Offer
```

**Response:**

```
SDP Answer (text/plain)
```

#### **Event-Based Communication Architecture**

Once connected, the system uses a comprehensive event system for real-time communication:

**Client Events** (Browser → OpenAI):

- `session.update` - Update session configuration
- `input_audio_buffer.append/commit/clear` - Audio buffer management
- `conversation.item.create` - Add conversation messages
- `response.create/cancel` - Request/cancel AI responses
- `output_audio_buffer.clear` - Clear output audio

**Server Events** (OpenAI → Browser):

- `session.created/updated` - Session state changes
- `input_audio_buffer.speech_started/stopped` - Voice activity detection
- `conversation.item.input_audio_transcription.delta/completed` - User speech-to-text results
- `response.audio_transcript.delta/done` - Assistant speech-to-text results
- `response.content_part.added` - AI response streaming
- `output_audio_buffer.started/stopped` - Audio playback control
- `error` - Error notifications

#### **Our Implementation Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Demo    │    │  Server Actions  │    │  OpenAI API     │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │Realtime     │ │    │ │createSession │ │    │ │Session      │ │
│ │Client       │ │    │ │Server Action │ │    │ │Creation     │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│         │       │    │         │        │    │         │       │
│         ▼       │    │         ▼        │    │         ▼       │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │WebRTC       │ │    │ │Server Module │ │    │ │WebRTC       │ │
│ │Connection   │ │    │ │(API Wrapper) │ │    │ │Connection   │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

#### **Abstraction Layer Design**

Our abstraction layer provides multiple levels of API access:

**High-Level APIs** (Recommended for most use cases):

```typescript
// Simple conversation flow
const client = new RealtimeClient(config);
await client.sendTextMessage('Hello, how are you?');
await client.requestResponse();
const items = client.getConversationItems();
const responding = client.isResponding();
```

**Event Callbacks** (For reactive UI updates):

```typescript
const client = new RealtimeClient({
  onConversationItemCreated: (item) => console.log('New message:', item),
  onResponseCreated: (response) => console.log('AI started responding'),
  onSpeechStarted: () => console.log('User started speaking'),
  onSpeechStopped: () => console.log('User stopped speaking'),

  // NEW: Speaker-specific transcript callbacks
  onUserTranscriptDelta: (text) => console.log('User speaking:', text),
  onUserTranscriptDone: (text) => console.log('User finished:', text),
  onAssistantTranscriptDelta: (text) =>
    console.log('Assistant speaking:', text),
  onAssistantTranscriptDone: (text) => console.log('Assistant finished:', text),
  onTranscriptionError: (error) =>
    console.error('Transcription failed:', error),
});
```

**Raw Event Access** (For advanced use cases):

```typescript
const client = new RealtimeClient({
  onRawEvent: (event) => {
    // Handle any server event with full type safety
    switch (event.type) {
      case 'response.content_part.added':
        // Custom handling
        break;
    }
  },
});
```

#### **Key Components**

**1. Server Actions (`src/lib/actions.ts`)**

- Next.js 15 server actions for session creation
- Calls OpenAI API with session configuration
- Returns client secret for WebRTC authentication
- Uses `OPENAI_REALTIME_SESSION_URL` environment variable

**2. RealtimeClient (`src/lib/openai-realtime/client/RealtimeClient.ts`)**

- Manages WebRTC peer connection
- Handles SDP offer/answer exchange
- Manages data channel for events
- Processes audio streams
- **High-level methods**: `sendTextMessage()`, `requestResponse()`, `cancelResponse()`
- **State management**: Conversation tracking, response status
- **Event abstraction**: Converts raw events to callbacks

**3. Type System (`src/lib/openai-realtime/types/`)**

- Complete TypeScript definitions
- Session configuration types
- Event type definitions (`client-events.ts`, `server-events.ts`)
- API response types

#### **Data Flow**

```
1. User clicks "Start New Session"
   ↓
2. Server Action creates session via OpenAI API
   ↓
3. Client secret returned to frontend
   ↓
4. RealtimeClient establishes WebRTC connection
   ↓
5. SDP handshake with OpenAI WebRTC endpoint
   ↓
6. Data channel opens for event communication
   ↓
7. Audio streams established (input/output)
   ↓
8. Real-time conversation begins
   ↓
9. Events flow through abstraction layer
   ↓
10. UI updates reactively via callbacks
```

### 🗣️ Turn Detection: Server VAD vs Semantic VAD

The OpenAI Realtime API supports two advanced turn detection modes for voice interaction:

#### **Server VAD (Voice Activity Detection)**

- Detects speech start/end based on audio volume.
- Responds at the end of user speech.
- **Fast**, but may cut off if you pause.

#### **Semantic VAD**

- Uses a turn detection model (in conjunction with VAD) to semantically estimate whether the user has finished speaking.
- Dynamically sets a timeout based on this probability.
- For example, if user audio trails off with "uhhm", the model will score a low probability of turn end and wait longer for the user to continue speaking.
- **More natural conversations**, but may have higher latency.

> **From OpenAI docs:**
>
> "Server VAD means that the model will detect the start and end of speech based on audio volume and respond at the end of user speech. Semantic VAD is more advanced and uses a turn detection model (in conjunction with VAD) to semantically estimate whether the user has finished speaking, then dynamically sets a timeout based on this probability. For example, if user audio trails off with 'uhhm', the model will score a low probability of turn end and wait longer for the user to continue speaking. This can be useful for more natural conversations, but may have a higher latency."

#### **Manual Mode**

- You can also set turn detection to `null` to disable automatic detection. In this case, the client must manually trigger model response (e.g., push-to-talk or commit audio buffer).

#### **Demo Session Types**

- **Live Chat (VAD):** Uses Server VAD for fast, automatic turn detection.
- **Natural Chat (Semantic):** Uses Semantic VAD for more natural, conversational flow.
- **Manual Chat/Transcription:** Uses manual commit/clear for full control.

See the navigation bar in the demo for hands-on examples of each mode.

### 📦 Usage

#### **Basic Setup**

```typescript
import { RealtimeClient } from '@/lib/openai-realtime/client/RealtimeClient';

function MyComponent() {
  const client = new RealtimeClient({
    clientSecret: 'your-client-secret',
    realtimeUrl: process.env.NEXT_PUBLIC_OPENAI_REALTIME_WEBRTC_URL,
    onMessageToken: (token) => console.log('AI:', token),

    // NEW: Speaker-specific transcript handling
    onUserTranscriptDelta: (text) => console.log('You said:', text),
    onAssistantTranscriptDelta: (text) => console.log('AI said:', text),
    onTranscriptionError: (error) => console.error('Transcription error:', error),
  });

  const startConversation = async () => {
    await client.connect();
    await client.sendTextMessage("Hello!");
    await client.requestResponse();
  };

  return (
    <div>
      <button onClick={startConversation}>
        Start Conversation
      </button>
    </div>
  );
}
```

#### **Enhanced Transcript Features**

The latest version includes speaker-specific transcript callbacks for precise control over user and assistant speech:

```typescript
const client = new RealtimeClient({
  clientSecret: 'your-secret',
  realtimeUrl: process.env.NEXT_PUBLIC_OPENAI_REALTIME_WEBRTC_URL,

  // User transcript callbacks
  onUserTranscriptDelta: (text) => {
    // Live user speech as they speak
    console.log('User speaking:', text);
    updateUserSubtitle(text);
  },
  onUserTranscriptDone: (text) => {
    // Final user transcript when they finish speaking
    console.log('User finished:', text);
    saveUserTranscript(text);
  },

  // Assistant transcript callbacks
  onAssistantTranscriptDelta: (text) => {
    // Live assistant speech as AI responds
    console.log('Assistant speaking:', text);
    updateAssistantSubtitle(text);
  },
  onAssistantTranscriptDone: (text) => {
    // Final assistant transcript when AI finishes
    console.log('Assistant finished:', text);
    saveAssistantTranscript(text);
  },

  // Error handling
  onTranscriptionError: (error) => {
    console.error('Transcription failed:', error.message);
    showTranscriptionError(error.message);
  },
});
```

**Chat-like Interface Features:**

- **Live Streaming**: Real-time transcript display as users speak
- **Final Transcripts**: Completed messages moved to conversation history
- **Speaker Distinction**: Clear visual separation between user and assistant
- **Error Handling**: Inline error display with recovery options
- **Auto-scroll**: Automatic scrolling to keep latest messages visible
- **Session Types**: Works for both regular chat and transcription-only sessions

#### **Advanced Usage with Event Callbacks**

```typescript
const client = new RealtimeClient({
  clientSecret: 'your-secret',
  realtimeUrl: process.env.NEXT_PUBLIC_OPENAI_REALTIME_WEBRTC_URL,

  // High-level callbacks
  onConversationItemCreated: (item) => {
    console.log('New conversation item:', item);
  },
  onResponseCreated: (response) => {
    console.log('AI started responding:', response.id);
  },
  onResponseDone: (response) => {
    console.log('AI finished responding:', response.id);
  },

  // Speech detection
  onSpeechStarted: () => {
    console.log('User started speaking');
  },
  onSpeechStopped: () => {
    console.log('User stopped speaking');
  },

  // Raw event access (for advanced use cases)
  onRawEvent: (event) => {
    console.log('Raw event:', event.type, event);
  },
});

// Connect and start conversation
await client.connect();
await client.sendTextMessage('Hello!');
await client.requestResponse();
```

#### **State Management (Consumer Responsibility)**

The RealtimeClient no longer manages conversation state internally. Consumers are responsible for managing their own state:

```typescript
// Example: Managing conversation state in your application
const [conversationItems, setConversationItems] = useState([]);
const [isResponding, setIsResponding] = useState(false);
const [isSpeaking, setIsSpeaking] = useState(false);
const [hasAudioBuffer, setHasAudioBuffer] = useState(false);

const client = new RealtimeClient({
  // ... config
  onResponseCreated: () => setIsResponding(true),
  onResponseDone: () => setIsResponding(false),
  onSpeechStarted: () => setIsSpeaking(true),
  onSpeechStopped: () => setIsSpeaking(false),
  onConversationItemCreated: (item) => {
    setConversationItems((prev) => [...prev, item]);
  },
});
```

#### **Migration Guide**

If you're upgrading from a previous version that had built-in state management:

**Before (Old API):**

```typescript
// These methods no longer exist
if (client.isResponding()) { ... }
if (client.isSpeaking()) { ... }
if (client.hasAudioBuffer()) { ... }
const items = client.getConversationItems(); // Never existed but implied
```

**After (New API):**

```typescript
// Manage state in your application
const [isResponding, setIsResponding] = useState(false);
const [isSpeaking, setIsSpeaking] = useState(false);
const [hasAudioBuffer, setHasAudioBuffer] = useState(false);
const [conversationItems, setConversationItems] = useState([]);

// Use callbacks to update state
const client = new RealtimeClient({
  // ... config
  onResponseCreated: () => setIsResponding(true),
  onResponseDone: () => setIsResponding(false),
  onSpeechStarted: () => setIsSpeaking(true),
  onSpeechStopped: () => setIsSpeaking(false),
  onConversationItemCreated: (item) => {
    setConversationItems((prev) => [...prev, item]);
  },
});
```

#### **Enhanced Audio and Conversation Management**

```typescript
const client = new RealtimeClient({
  clientSecret: 'your-secret',
  realtimeUrl: process.env.NEXT_PUBLIC_OPENAI_REALTIME_WEBRTC_URL,
});

// Audio buffer management
await client.appendAudioData(base64AudioData);
await client.commitAudioBuffer();
await client.clearAudioBuffer();

// Conversation management
await client.retrieveConversationItem('item_123');
await client.truncateConversationItem(5000); // Truncate at 5 seconds
await client.deleteConversationItem();

// Enhanced response management
await client.cancelSpecificResponse('response_456', 'User interrupted');

// Check states
if (client.isSpeaking()) {
  console.log('User is currently speaking');
}
if (client.hasAudioBuffer()) {
  console.log('Audio buffer has data');
}
```

#### **API Reference**

| Method                                 | Description                                          | Parameters                                    | Use Case                                                                      |
| -------------------------------------- | ---------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| `constructor(config)`                  | Creates a new RealtimeClient instance                | `config: RealtimeClientConfig`                | Initialize the client with authentication and event handlers                  |
| `connect()`                            | Establishes WebRTC connection to OpenAI Realtime API | None                                          | Start a new session and connect to the API                                    |
| `updateSession(config)`                | Sends session update event to server                 | `config: Partial<SessionConfig>`              | Update session parameters during active session                               |
| `updateTranscriptionSession(config)`   | Sends transcription session update event             | `config: Partial<TranscriptionSessionConfig>` | Update transcription parameters during active session                         |
| `disconnect()`                         | Closes WebRTC connection and cleans up resources     | None                                          | Properly end session and free system resources                                |
| `isConnected()`                        | Returns connection status                            | None                                          | Check if client is connected before making API calls                          |
| `getSessionId()`                       | Returns current session ID                           | None                                          | Get session identifier for logging or debugging                               |
| `getSessionType()`                     | Returns session type (regular/transcription)         | None                                          | Determine session capabilities and behavior                                   |
| `getConnectionState()`                 | Returns current connection state                     | None                                          | Get detailed connection status for UI feedback                                |
| `sendTextMessage(text, role?)`         | Sends text message to conversation                   | `text: string`, `role?: MessageRole`          | Add text messages in regular sessions                                         |
| `requestResponse(options?)`            | Requests AI response from conversation               | `options?: Partial<ResponseConfig>`           | Trigger AI response after adding messages                                     |
| `cancelResponse(reason?)`              | Cancels current AI response                          | `reason?: string`                             | Stop ongoing AI response generation                                           |
| `commitAudioBuffer()`                  | Commits current audio buffer to conversation         | None                                          | **Manual audio control**: Push-to-talk, walkie-talkie, manual transcription   |
| `clearAudioBuffer()`                   | Clears current audio buffer without committing       | None                                          | **Manual audio control**: Cancel recording, re-record, error recovery         |
| `clearOutputAudioBuffer()`             | Clears output audio buffer                           | None                                          | Stop currently playing AI audio output                                        |
| `appendAudioData(audioBase64)`         | Appends audio data to buffer                         | `audioBase64: string`                         | **Manual audio control**: Build up audio buffer before committing             |
| `retrieveConversationItem(itemId)`     | Retrieves specific conversation item                 | `itemId: string`                              | Load messages from history, implement search                                  |
| `truncateConversationItem(audioEndMs)` | Truncates assistant message audio at timestamp       | `audioEndMs: number`                          | **User interruption**: Truncate unplayed AI audio, sync playback with context |
| `deleteConversationItem()`             | Deletes any item from conversation history           | None                                          | Remove unwanted messages, clean up history, privacy control                   |

#### **Transcript Callback Interface**

The latest version provides speaker-specific transcript callbacks for precise control:

| Callback                     | Description                         | Parameters     | Use Case                                 |
| ---------------------------- | ----------------------------------- | -------------- | ---------------------------------------- |
| `onUserTranscriptDelta`      | Live user speech transcription      | `text: string` | Show real-time user speech as they speak |
| `onUserTranscriptDone`       | Final user transcript               | `text: string` | Save completed user message to history   |
| `onAssistantTranscriptDelta` | Live assistant speech transcription | `text: string` | Show real-time AI speech as it responds  |
| `onAssistantTranscriptDone`  | Final assistant transcript          | `text: string` | Save completed AI response to history    |
| `onTranscriptionError`       | Transcription error handling        | `error: Error` | Handle transcription failures gracefully |

**Note:** Methods marked with **Manual audio control** are essential for push-to-talk, walkie-talkie, or manual transcription interfaces where you want to control when audio is sent to the AI, as opposed to automatic streaming used in the current demo.

**State Management:** The client no longer provides state checking methods like `isResponding()`, `isSpeaking()`, or `hasAudioBuffer()`. Consumers must manage these states using the provided event callbacks.

### 🎯 Demo Application

**Try the live demo!** This project includes a comprehensive demo application that showcases:

- **Real-time Voice Conversations**: Natural voice interaction with AI
- **Chat-like Interface**: Live streaming and final transcript display
- **Speaker-Specific Transcripts**: Separate handling for user vs assistant speech
- **Session Configuration**: Voice selection, temperature, speed controls
- **Event Logging**: Comprehensive debugging and monitoring
- **Responsive UI**: Modern, accessible interface with auto-scroll
- **Error Handling**: Inline transcription error display
- **Developer Tools**: API examples and integration patterns

**Key Demo Features:**

- **Live Transcript Streaming**: See your speech transcribed in real-time as you speak
- **Final Transcript History**: Completed messages saved to conversation history
- **Assistant Response Visualization**: Watch AI responses stream in real-time
- **Error Recovery**: Graceful handling of transcription failures
- **Session Type Support**: Both regular chat and transcription-only modes
- **Event Timeline**: Complete event logging for debugging

**Quick Start:**

```bash
npm install
npm run dev
# Open http://localhost:3000
```

See [DEMO_README.md](./DEMO_README.md) for detailed demo documentation.
