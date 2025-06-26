## OpenAI Realtime WebRTC Integration (Next.js)

This project provides a reusable, minimal boilerplate to integrate the OpenAI Realtime API with WebRTC using TypeScript and Next.js. It handles session creation, audio + data channel transport, and exposes a clean abstraction for frontend developers.

### 🔧 Features

- Ephemeral token authentication (client-secret)
- WebRTC connection management (audio + data)
- Voice input and output stream support
- Custom `RealtimeClient` class with high-level abstraction
- `useRealtimeClient` React hook with state management
- **Comprehensive Event System** - Raw event access with high-level APIs
- **NEW: Comprehensive Demo App** - Full-featured UI showcasing all capabilities
- **Environment Configuration** - Fully configurable via environment variables
- Future-ready structure for publishing as an npm package

### 🚀 Quick Start

#### **Prerequisites**

- Node.js 18+ and npm
- OpenAI API key with Realtime API access
- Modern browser with WebRTC support

#### **Installation**

```bash
# Clone the repository
git clone <repository-url>
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
- `conversation.item.input_audio_transcription.completed` - Speech-to-text results
- `response.content_part.added` - AI response streaming
- `output_audio_buffer.started/stopped` - Audio playback control
- `error` - Error notifications

#### **Our Implementation Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Demo    │    │  Server Actions  │    │  OpenAI API     │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │useRealtime  │ │    │ │createSession │ │    │ │Session      │ │
│ │Client Hook  │ │    │ │Server Action │ │    │ │Creation     │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│         │       │    │         │        │    │         │       │
│         ▼       │    │         ▼        │    │         ▼       │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │Realtime     │ │    │ │Server Module │ │    │ │WebRTC       │ │
│ │Client Class │ │    │ │(API Wrapper) │ │    │ │Connection   │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

#### **Abstraction Layer Design**

Our abstraction layer provides multiple levels of API access:

**High-Level APIs** (Recommended for most use cases):

```typescript
// Simple conversation flow
await sendTextMessage('Hello, how are you?');
await requestResponse();
const items = conversationItems;
const responding = isResponding;
```

**Event Callbacks** (For reactive UI updates):

```typescript
const { onConversationItemCreated, onResponseCreated } = useRealtimeClient({
  onConversationItemCreated: (item) => console.log('New message:', item),
  onResponseCreated: (response) => console.log('AI started responding'),
});
```

**Raw Event Access** (For advanced use cases):

```typescript
const { onRawEvent } = useRealtimeClient({
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

**3. useRealtimeClient Hook (`src/lib/openai-realtime/useRealtimeClient.ts`)**

- React hook wrapper for RealtimeClient
- Manages connection state and conversation state
- Provides clean API for components
- **Reactive state**: `conversationItems`, `isResponding`, `currentResponseId`
- **High-level methods**: All client methods exposed as async functions

**4. Type System (`src/lib/openai-realtime/types/`)**

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
10. UI updates reactively via callbacks/state
```

### 📦 Usage

#### **Basic Setup**

```typescript
import { useRealtimeClient } from '@/lib/openai-realtime/useRealtimeClient';

function MyComponent() {
  const {
    connect,
    sendTextMessage,
    requestResponse,
    conversationItems,
    isResponding,
    connected,
  } = useRealtimeClient({
    clientSecret: 'your-client-secret',
    realtimeUrl: process.env.NEXT_PUBLIC_OPENAI_REALTIME_WEBRTC_URL,
    onMessageToken: (token) => console.log('AI:', token),
    onTranscript: (text) => console.log('You said:', text),
  });

  const startConversation = async () => {
    await connect();
    await sendTextMessage("Hello!");
    await requestResponse();
  };

  return (
    <div>
      <button onClick={startConversation} disabled={!connected}>
        Start Conversation
      </button>
      {isResponding && <p>AI is thinking...</p>}
    </div>
  );
}
```

#### **Advanced Usage with Event Callbacks**

```typescript
const { connect, sendTextMessage, requestResponse, conversationItems } =
  useRealtimeClient({
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
```

#### **Direct Client Usage (Without Hook)**

```typescript
import { RealtimeClient } from '@/lib/openai-realtime/client/RealtimeClient';

const client = new RealtimeClient({
  clientSecret: 'your-client-secret',
  model: process.env.NEXT_PUBLIC_OPENAI_MODEL,
  realtimeUrl: process.env.NEXT_PUBLIC_OPENAI_REALTIME_WEBRTC_URL,
  onMessageToken: (token) => console.log('AI:', token),
  onError: (error) => console.error('Error:', error),
});

// Connect and start conversation
await client.connect();
await client.sendTextMessage('Hello!');
await client.requestResponse();
```

#### **Error Handling**

The abstraction layer provides multiple error handling approaches:

```typescript
const { error, onError } = useRealtimeClient({
  // ... config
  onError: (error) => {
    console.error('Connection error:', error);
    // Handle specific error types
    if (error.message.includes('SDP request failed')) {
      // Handle connection issues
    }
  },
});

// Check error state in UI
if (error) {
  return <div>Error: {error.message}</div>;
}
```

### 🎯 Demo Application

**Try the live demo!** This project includes a comprehensive demo application that showcases:

- **Real-time Voice Conversations**: Natural voice interaction with AI
- **Session Configuration**: Voice selection, temperature, speed controls
- **Event Logging**: Comprehensive debugging and monitoring
- **Responsive UI**: Modern, accessible interface
- **Developer Tools**: API examples and integration patterns

**Quick Start:**

```bash
npm install
npm run dev
# Open http://localhost:3000
```

See [DEMO_README.md](./DEMO_README.md) for detailed demo documentation.

### 🔧 Configuration Options

#### **Environment-Specific Setup**

**Development:**
```env
OPENAI_API_KEY=your_dev_key
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o-realtime-preview-2024-12-17
```

**Production:**
```env
OPENAI_API_KEY=your_prod_key
OPENAI_API_BASE_URL=https://api.openai.com/v1
OPENAI_REALTIME_SESSION_URL=https://api.openai.com/v1/realtime/sessions
NEXT_PUBLIC_OPENAI_REALTIME_WEBRTC_URL=https://api.openai.com/v1/realtime
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o-realtime-preview-2024-12-17
```

**Custom Endpoints:**
```env
# For custom OpenAI-compatible endpoints
OPENAI_API_BASE_URL=https://your-custom-endpoint.com/v1
OPENAI_REALTIME_SESSION_URL=https://your-custom-endpoint.com/v1/realtime/sessions
NEXT_PUBLIC_OPENAI_REALTIME_WEBRTC_URL=https://your-custom-endpoint.com/v1/realtime
```

#### **Session Configuration**

```typescript
const sessionConfig = {
  model: process.env.NEXT_PUBLIC_OPENAI_MODEL,
  voice: 'echo', // or 'alloy', 'fable', 'onyx', 'nova'
  temperature: 0.8,
  speed: 1.0,
  instructions: 'You are a helpful AI assistant.',
  modalities: ['audio', 'text'],
  turn_detection: {
    type: 'server_vad',
  },
};
```

### ⏱️ In Progress

- Adding full React context support
- Multi-session support
- Recording & playback interface

---

Refer to `src/lib/openai-realtime` and the demo page for full integration details.
