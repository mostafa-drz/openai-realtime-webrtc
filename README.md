## How OpenAI Realtime API Works with WebRTC

The OpenAI Realtime API enables real-time, multi-modal interactions using WebRTC. This project demonstrates how to leverage the API to build interactive applications with support for audio streaming, text input, and session management. The focus is on providing low-latency interactions using a client-friendly architecture.

![Initial Chat Interface](/public/version2.0.0//screenshot1.png)

### Key Components of the Integration

#### Ephemeral Token Authentication

The integration begins with obtaining an ephemeral token, a temporary credential that authorizes connections to the OpenAI Realtime API. These tokens are fetched securely from a backend endpoint and have a 30-minute validity period to ensure security.

#### WebRTC Peer Connection

A WebRTC peer connection is established between the client application and the OpenAI Realtime API, enabling real-time communication with the following features:

- **Audio Streaming**: Microphone input is streamed to the API in real time, and audio responses are seamlessly played back on the client side.
- **Data Channel Communication**: A dedicated data channel is used to send and receive structured events, such as text inputs, session configuration updates, and transcription results.

![Active Chat Session](/public/version2.0.0/screenshot2.png)

#### Session Management

- **Single-Session Architecture**: The project uses a simplified single-session approach, making it easier to manage state and handle connections.
- **Connection Status Management**: Comprehensive tracking of connection states (connecting, connected, disconnected, etc.) with automatic reconnection handling.
- **Real-Time Transcripts**: Captures and updates transcripts in real time for both user inputs and AI responses.

### Development and Debugging

The application includes a built-in session debugger that provides real-time insight into the WebRTC session state, configuration, and connection status.

![Session Debugger](/public/version2.0.0/screenshot3.png)

### Event Handling and Dynamic Configuration

Events are managed using a clear structure defined in `RealtimeEventType`, ensuring consistency and maintainability. This includes:

- Audio input and output event handling
- Dynamic session configuration updates
- Transcript management for audio and text inputs
- Rate limiting support with automatic tracking
- Type-safe event subscription system with `on` and `off` methods

### Current Project Features

- **Robust Connection Management**: Handles connection lifecycle with automatic reconnection attempts
- **Rate Limiting Support**: Built-in rate limit tracking and management
- **Flexible Audio Controls**: Support for both Voice Activity Detection (VAD) and Push-to-Talk modes
- **Voice Selection**: Multiple AI voice options for responses
- **Development Tools**: Built-in debugging and session monitoring capabilities

## Getting Started

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/openai-realtime-webrtc.git
   cd openai-realtime-webrtc
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   Create a `.env.local` file:

   ```bash
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_OPEN_AI_MODEL_ID=your_model_id
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

## OpenAI Realtime WebRTC Context Provider

The OpenAI Realtime WebRTC Context Provider manages WebRTC sessions and interactions with the OpenAI Realtime API. It exposes the following key functions through the `useSession` hook:

### Context API Overview

#### session

- **Description**: The current active WebRTC session state
- **Type**: `RealtimeSession | null`
- **Example**:
  ```typescript
  const { session } = useSession();
  console.log(session?.connectionStatus); // Logs current connection status
  ```

#### connect(realtimeSession: RealtimeSession, functionCallHandler?: FunctionCallHandler): Promise<void>

- **Description**: Establishes a new WebRTC session with the OpenAI Realtime API
- **Example**:
  ```typescript
  const sessionConfig = {
    id: 'sess_123',
    modalities: [Modality.TEXT, Modality.AUDIO],
    model: 'gpt-4-realtime',
    // ... other configuration
  };
  await connect(sessionConfig);
  ```

#### disconnect(): void

- **Description**: Closes the active WebRTC session and cleans up resources
- **Example**:
  ```typescript
  disconnect();
  ```

#### sendTextMessage(message: string): void

- **Description**: Sends a text message through the active session
- **Example**:
  ```typescript
  sendTextMessage('Hello, how can you help me?');
  ```

#### Event Handling

The context provides type-safe event handling capabilities through `on` and `off` methods:

#### on(eventType: RealtimeEventType, callback: EventCallback): void

- **Description**: Subscribes to specific WebRTC events
- **Example**:
  ```typescript
  const { on } = useSession();
  
  useEffect(() => {
    const handleAudioStart = (event) => {
      console.log('Audio started:', event);
    };
    
    on(RealtimeEventType.OUTPUT_AUDIO_STARTED, handleAudioStart);
    
    // Cleanup
    return () => off(RealtimeEventType.OUTPUT_AUDIO_STARTED, handleAudioStart);
  }, []);
  ```

#### off(eventType: RealtimeEventType, callback?: EventCallback): void

- **Description**: Unsubscribes from specific WebRTC events
- **Example**:
  ```typescript
  const { off } = useSession();
  off(RealtimeEventType.OUTPUT_AUDIO_STARTED, handleAudioStart);
  ```

### Event Handling Example

```typescript
import { useSession } from '../context/OpenAIRealtimeWebRTC';
import { RealtimeEventType } from '../types';

const EventLogger = () => {
  const { on, off } = useSession();

  useEffect(() => {
    const handleTranscription = (event) => {
      console.log('Transcription completed:', event);
    };

    on(RealtimeEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED, handleTranscription);

    return () => {
      off(RealtimeEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED, handleTranscription);
    };
  }, [on, off]);

  return null;
};
```

For a complete example of how to implement these features, including session management, audio controls, and voice selection, refer to the [Chat Component](/src/app/components/Chat.tsx).
