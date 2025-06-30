# OpenAI Realtime Client Events Documentation

This document describes all client events that can be sent to the OpenAI Realtime WebSocket server.

## Overview

Client events are messages sent from the client to the server to control the realtime session, manage audio buffers, handle conversation items, and trigger responses.

## Event Structure

All client events follow this base structure:

- `event_id` (string, optional): Client-generated ID for tracking
- `type` (string): The event type identifier

## Client Events

### `session.update`

Send this event to update the session's default configuration.

**Note**: Once a session is initialized with a specific model, it cannot be changed using this event.
The server will respond with a `session.updated` event.

#### Fields:

- `event_id` (string): Optional client-generated ID
- `session` (object): Realtime session configuration
- `type` (string): Must be `session.update`

#### Example:

```json
{
  "event_id": "event_123",
  "type": "session.update",
  "session": {
    "modalities": ["text", "audio"],
    "instructions": "You are a helpful assistant.",
    "voice": "sage",
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16",
    "input_audio_transcription": {
      "model": "whisper-1"
    },
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5,
      "prefix_padding_ms": 300,
      "silence_duration_ms": 500,
      "create_response": true
    },
    "tools": [
      {
        "type": "function",
        "name": "get_weather",
        "description": "Get the current weather...",
        "parameters": {
          "type": "object",
          "properties": {
            "location": { "type": "string" }
          },
          "required": ["location"]
        }
      }
    ],
    "tool_choice": "auto",
    "temperature": 0.8,
    "max_response_output_tokens": "inf",
    "speed": 1.1,
    "tracing": "auto"
  }
}
```

---

### `input_audio_buffer.append`

Append audio bytes to the input buffer.

No confirmation from server.

#### Fields:

- `audio` (string): Base64-encoded audio bytes
- `event_id` (string): Optional ID
- `type` (string): Must be `input_audio_buffer.append`

#### Example:

```json
{
  "event_id": "event_456",
  "type": "input_audio_buffer.append",
  "audio": "Base64EncodedAudioData"
}
```

---

### `input_audio_buffer.commit`

Commit the audio buffer to create a new message item.

#### Fields:

- `event_id` (string): Optional ID
- `type` (string): Must be `input_audio_buffer.commit`

#### Example:

```json
{
  "event_id": "event_789",
  "type": "input_audio_buffer.commit"
}
```

---

### `input_audio_buffer.clear`

Clear the audio buffer.

#### Fields:

- `event_id` (string): Optional ID
- `type` (string): Must be `input_audio_buffer.clear`

#### Example:

```json
{
  "event_id": "event_012",
  "type": "input_audio_buffer.clear"
}
```

---

### `conversation.item.create`

Add a new item to the conversation context.

#### Fields:

- `event_id` (string): Optional ID
- `item` (object): The item to add
- `previous_item_id` (string): Optional ID of the previous item
- `type` (string): Must be `conversation.item.create`

#### Example:

```json
{
  "event_id": "event_345",
  "type": "conversation.item.create",
  "previous_item_id": null,
  "item": {
    "id": "msg_001",
    "type": "message",
    "role": "user",
    "content": [
      {
        "type": "input_text",
        "text": "Hello, how are you?"
      }
    ]
  }
}
```

---

### `conversation.item.retrieve`

Retrieve a specific item from conversation history.

#### Fields:

- `event_id` (string): Optional ID
- `item_id` (string): ID of the item to retrieve
- `type` (string): Must be `conversation.item.retrieve`

#### Example:

```json
{
  "event_id": "event_901",
  "type": "conversation.item.retrieve",
  "item_id": "msg_003"
}
```

---

### `conversation.item.truncate`

Truncate audio from a previous assistant message.

#### Fields:

- `event_id` (string): Optional ID
- `item_id` (string): Target item ID
- `content_index` (integer): Set to 0
- `audio_end_ms` (integer): Truncate up to this duration
- `type` (string): Must be `conversation.item.truncate`

#### Example:

```json
{
  "event_id": "event_678",
  "type": "conversation.item.truncate",
  "item_id": "msg_002",
  "content_index": 0,
  "audio_end_ms": 1500
}
```

---

### `conversation.item.delete`

Delete an item from the conversation history.

#### Fields:

- `event_id` (string): Optional ID
- `item_id` (string): ID of the item to delete
- `type` (string): Must be `conversation.item.delete`

#### Example:

```json
{
  "event_id": "event_901",
  "type": "conversation.item.delete",
  "item_id": "msg_003"
}
```

---

### `response.create`

Trigger model inference to create a response.

#### Fields:

- `event_id` (string): Optional ID
- `response` (object): Inference parameters
- `type` (string): Must be `response.create`

#### Example:

```json
{
  "event_id": "event_234",
  "type": "response.create",
  "response": {
    "modalities": ["text", "audio"],
    "instructions": "Please assist the user.",
    "voice": "sage",
    "output_audio_format": "pcm16",
    "tools": [
      {
        "type": "function",
        "name": "calculate_sum",
        "description": "Calculates the sum of two numbers.",
        "parameters": {
          "type": "object",
          "properties": {
            "a": { "type": "number" },
            "b": { "type": "number" }
          },
          "required": ["a", "b"]
        }
      }
    ],
    "tool_choice": "auto",
    "temperature": 0.8,
    "max_output_tokens": 1024
  }
}
```

---

### `response.cancel`

Cancel an in-progress response.

#### Fields:

- `event_id` (string): Optional ID
- `response_id` (string): Optional ID of response to cancel
- `reason` (string): Optional reason for cancellation
- `metadata` (object): Optional metadata about the cancellation
- `type` (string): Must be `response.cancel`

#### Example:

```json
{
  "event_id": "event_567",
  "type": "response.cancel",
  "response_id": "resp_123",
  "reason": "User interrupted",
  "metadata": {
    "source": "user_action"
  }
}
```

---

### `transcription_session.update`

Update a transcription session.

#### Fields:

- `event_id` (string): Optional ID
- `session` (object): Transcription session config
- `type` (string): Must be `transcription_session.update`

#### Example:

```json
{
  "type": "transcription_session.update",
  "session": {
    "input_audio_format": "pcm16",
    "input_audio_transcription": {
      "model": "gpt-4o-transcribe",
      "prompt": "",
      "language": ""
    },
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5,
      "prefix_padding_ms": 300,
      "silence_duration_ms": 500,
      "create_response": true
    },
    "input_audio_noise_reduction": {
      "type": "near_field"
    },
    "include": ["item.input_audio_transcription.logprobs"]
  }
}
```

---

### `output_audio_buffer.clear`

Stop generating audio (WebRTC only).

#### Fields:

- `event_id` (string): Optional ID
- `type` (string): Must be `output_audio_buffer.clear`

#### Example:

```json
{
  "event_id": "optional_client_event_id",
  "type": "output_audio_buffer.clear"
}
```

## Implementation Notes

This documentation corresponds to the TypeScript types defined in `types/client-events.ts`. All events extend the `BaseClientEvent` interface which provides the optional `event_id` field.

The event types are defined as an enum `ClientEventType` and each event has its corresponding interface that extends `BaseClientEvent` with the specific fields required for that event type.
