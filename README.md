## OpenAI Realtime WebRTC Integration (Next.js)

This project provides a reusable, minimal boilerplate to integrate the OpenAI Realtime API with WebRTC using TypeScript and Next.js. It handles session creation, audio + data channel transport, and exposes a clean abstraction for frontend developers.

### 🔧 Features

- Ephemeral token authentication (client-secret)
- WebRTC connection management (audio + data)
- Voice input and output stream support
- Custom `RealtimeClient` class
- `useRealtimeClient` React hook
- Future-ready structure for publishing as an npm package

### 🧠 Architecture

- Audio is streamed via WebRTC audio track
- AI responses arrive as remote audio + data channel messages
- Client setup follows OpenAI's Realtime SDP handshake flow
- Data channel receives token-by-token updates and transcripts

### 📦 Usage

1. Get a `client_secret` token from your backend
2. Pass it to `useRealtimeClient()` hook
3. Call `.connect()`, then use voice or text interaction
4. Handle `onMessageToken`, `onTranscript`, etc.

### ⏱️ In Progress

- Adding full React context support
- Multi-session support
- Recording & playback interface

---

Refer to `src/lib/openai-realtime` and the `/demo` page for full integration details.
