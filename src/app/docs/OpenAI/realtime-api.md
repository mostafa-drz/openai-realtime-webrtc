# OpenAI Realtime API Documentation (Beta)

Communicate with a GPT-4o class model in real time using WebRTC or WebSockets. Supports text and audio inputs and outputs, along with audio transcriptions. Learn more about the Realtime API.

---

## Session Tokens

REST API endpoint to generate ephemeral session tokens for use in client-side applications.

### Create Session

**POST**
`https://api.openai.com/v1/realtime/sessions`

Create an ephemeral API token for use in client-side applications with the Realtime API. Can be configured with the same session parameters as the `session.update` client event.

It responds with a session object, plus a `client_secret` key which contains a usable ephemeral API token that can be used to authenticate browser clients for the Realtime API.

### Request Body

- `client_secret` (object, Optional): Configuration options for the generated client secret.
- `expires_at` (object, Optional): Configuration for the ephemeral token expiration.

  - `anchor` (string, Optional, Defaults to `created_at`): The anchor point for the ephemeral token expiration. Only `created_at` is currently supported.
  - `seconds` (integer, Optional, Defaults to 600): The number of seconds from the anchor point to the expiration. Select a value between 10 and 7200.

- `input_audio_format` (string, Optional, Defaults to `pcm16`): The format of input audio. Options are `pcm16`, `g711_ulaw`, or `g711_alaw`.
- `input_audio_noise_reduction` (object, Optional, Defaults to `null`): Configuration for input audio noise reduction.

  - `type` (string, Optional): Type of noise reduction. `near_field` or `far_field`.

- `input_audio_transcription` (object, Optional): Configuration for input audio transcription.
- `instructions` (string, Optional): The default system instructions.
- `max_response_output_tokens` (integer or "inf", Optional): Maximum number of output tokens for a single assistant response.
- `modalities` (Optional): The set of modalities the model can respond with.
- `model` (string, Optional): The Realtime model used for this session.
- `output_audio_format` (string, Optional, Defaults to `pcm16`): The format of output audio.
- `speed` (number, Optional, Defaults to `1`): The speed of the model's spoken response.
- `temperature` (number, Optional, Defaults to `0.8`): Sampling temperature for the model.
- `tool_choice` (string, Optional, Defaults to `auto`): How the model chooses tools.
- `tools` (array, Optional): Tools (functions) available to the model.

  - `description` (string, Optional): The description of the function.
  - `name` (string, Optional): The name of the function.
  - `parameters` (object, Optional): Parameters of the function in JSON Schema.
  - `type` (string, Optional): The type of the tool.

- `tracing` ("auto" or object, Optional): Configuration options for tracing.
- `turn_detection` (object, Optional): Configuration for turn detection.

  - `create_response` (boolean, Optional, Defaults to `true`)
  - `eagerness` (string, Optional, Defaults to `auto`)
  - `interrupt_response` (boolean, Optional, Defaults to `true`)
  - `prefix_padding_ms` (integer, Optional, Defaults to `300ms`)
  - `silence_duration_ms` (integer, Optional, Defaults to `500ms`)
  - `threshold` (number, Optional, Defaults to `0.5`)
  - `type` (string, Optional, Defaults to `server_vad`)

- `voice` (string, Optional): The voice the model uses to respond.

### Returns

The created Realtime session object, plus an ephemeral key.

### Example Request

```bash
curl -X POST https://api.openai.com/v1/realtime/sessions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-realtime-preview",
    "modalities": ["audio", "text"],
    "instructions": "You are a friendly assistant."
  }'
```

### Example Response

```json
{
  "id": "sess_001",
  "object": "realtime.session",
  "model": "gpt-4o-realtime-preview",
  "modalities": ["audio", "text"],
  "instructions": "You are a friendly assistant.",
  "voice": "alloy",
  "input_audio_format": "pcm16",
  "output_audio_format": "pcm16",
  "input_audio_transcription": {
    "model": "whisper-1"
  },
  "turn_detection": null,
  "tools": [],
  "tool_choice": "none",
  "temperature": 0.7,
  "max_response_output_tokens": 200,
  "speed": 1.1,
  "tracing": "auto",
  "client_secret": {
    "value": "ek_abc123",
    "expires_at": 1234567890
  }
}
```

---

## Create Transcription Session

**POST**
`https://api.openai.com/v1/realtime/transcription_sessions`

Create an ephemeral API token for use in client-side applications with the Realtime API specifically for realtime transcriptions.

### Request Body

- `client_secret` (object, Optional): Configuration options for the generated client secret.
- `include` (array, Optional): The set of items to include in the transcription.
- `input_audio_format` (string, Optional, Defaults to `pcm16`)
- `input_audio_noise_reduction` (object, Optional, Defaults to `null`)
- `input_audio_transcription` (object, Optional)
- `modalities` (Optional)
- `turn_detection` (object, Optional)

### Returns

The created Realtime transcription session object, plus an ephemeral key.

### Example Request

```bash
curl -X POST https://api.openai.com/v1/realtime/transcription_sessions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Example Response

```json
{
  "id": "sess_BBwZc7cFV3XizEyKGDCGL",
  "object": "realtime.transcription_session",
  "modalities": ["audio", "text"],
  "turn_detection": {
    "type": "server_vad",
    "threshold": 0.5,
    "prefix_padding_ms": 300,
    "silence_duration_ms": 200
  },
  "input_audio_format": "pcm16",
  "input_audio_transcription": {
    "model": "gpt-4o-transcribe",
    "language": null,
    "prompt": ""
  },
  "client_secret": null
}
```

---

## The Session Object

A new Realtime session configuration, with an ephemeral key. Default TTL for keys is one minute.

**Fields:**

- `client_secret` (object): Ephemeral key returned by the API.

  - `expires_at` (integer): Timestamp for when the token expires.
  - `value` (string): Ephemeral key usable in client environments to authenticate connections to the Realtime API.

- `input_audio_format`, `input_audio_transcription`, `instructions`, `max_response_output_tokens`, `modalities`, `output_audio_format`, `speed`, `temperature`, `tool_choice`, `tools`, `tracing`, `turn_detection`, `voice`

### Example

```json
{
  "id": "sess_001",
  "object": "realtime.session",
  "model": "gpt-4o-realtime-preview",
  "modalities": ["audio", "text"],
  "instructions": "You are a friendly assistant.",
  "voice": "alloy",
  "input_audio_format": "pcm16",
  "output_audio_format": "pcm16",
  "input_audio_transcription": {
    "model": "whisper-1"
  },
  "turn_detection": null,
  "tools": [],
  "tool_choice": "none",
  "temperature": 0.7,
  "speed": 1.1,
  "tracing": "auto",
  "max_response_output_tokens": 200,
  "client_secret": {
    "value": "ek_abc123",
    "expires_at": 1234567890
  }
}
```

## Create Transcription Session

**POST**
`https://api.openai.com/v1/realtime/transcription_sessions`

Create an ephemeral API token for use in client-side applications with the Realtime API specifically for realtime transcriptions. Can be configured with the same session parameters as the `transcription_session.update` client event.

It responds with a session object, plus a `client_secret` key which contains a usable ephemeral API token that can be used to authenticate browser clients for the Realtime API.

### Request Body

- `client_secret` (object, Optional): Configuration options for the generated client secret.
- `include` (array, Optional): The set of items to include in the transcription. Current available items are `null`.
- `input_audio_format` (string, Optional, Defaults to `pcm16`): The format of input audio. Options are `pcm16`, `g711_ulaw`, or `g711_alaw`. For `pcm16`, input audio must be 16-bit PCM at a 24kHz sample rate, single channel (mono), and little-endian byte order.
- `input_audio_noise_reduction` (object, Optional, Defaults to `null`): Configuration for input audio noise reduction.
- `input_audio_transcription` (object, Optional): Configuration for input audio transcription. The client can optionally set the language and prompt for transcription.
- `modalities` (Optional): The set of modalities the model can respond with.
- `turn_detection` (object, Optional): Configuration for turn detection, either Server VAD or Semantic VAD.

### Returns

The created Realtime transcription session object, plus an ephemeral key.

### Example Request

```bash
curl -X POST https://api.openai.com/v1/realtime/transcription_sessions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Example Response

```json
{
  "id": "sess_BBwZc7cFV3XizEyKGDCGL",
  "object": "realtime.transcription_session",
  "modalities": ["audio", "text"],
  "turn_detection": {
    "type": "server_vad",
    "threshold": 0.5,
    "prefix_padding_ms": 300,
    "silence_duration_ms": 200
  },
  "input_audio_format": "pcm16",
  "input_audio_transcription": {
    "model": "gpt-4o-transcribe",
    "language": null,
    "prompt": ""
  },
  "client_secret": null
}
```
