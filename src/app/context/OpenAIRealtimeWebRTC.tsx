'use client';

import React, { createContext, useContext, useReducer, useState } from 'react';
import {
  Transcript,
  Modality,
  RealtimeSession,
  RealtimeEventType,
  TranscriptType,
  ConversationRole,
  RealtimeEvent,
  InputAudioBufferAppendEvent,
  InputAudioBufferCommitEvent,
  ResponseCreateEvent,
  ResponseCreateBody,
  ConversationItemCreateEvent,
  ConversationItemType,
  ContentType,
  ResponseOutputItemDoneEvent,
  TokenUsage,
  ResponseDoneEvent,
  StartSession,
  SessionError,
} from '../types';

/**
 * Context type definition for managing OpenAI Realtime WebRTC sessions.
 */
interface OpenAIRealtimeWebRTCContextType {
  /**
   * Gets the list of all active sessions.
   */
  sessions: RealtimeSession[];

  /**
   * Retrieves the state of a specific session by its ID.
   *
   * @param sessionId - The unique identifier for the session.
   * @returns The session object if found, otherwise `null`.
   */
  getSessionById: (sessionId: string) => RealtimeSession | null;

  /**
   * Starts a new WebRTC session with the OpenAI API.
   *
   * @param sessionId - The unique identifier for the new session.
   * @param realtimeSession - The session object containing configuration.
   * @returns A promise that resolves once the session is successfully started.
   */
  startSession: StartSession;

  /**
   * Ends an active WebRTC session and cleans up its resources.
   *
   * @param sessionId - The unique identifier for the session to close.
   * @returns A promise that resolves once the session is successfully closed.
   */
  closeSession: (sessionId: string) => void;

  /**
   * Sends a text message to a specific session.
   *
   * @param sessionId - The unique identifier for the session to send the message to.
   * @param message - The text message content.
   */
  sendTextMessage: (sessionId: string, message: string) => void;

  /**
   * Sends a custom client event to a specific session.
   *
   * @param sessionId - The unique identifier for the session to send the event to.
   * @param event - The custom event payload.
   */
  sendClientEvent: (sessionId: string, event: RealtimeEvent) => void;

  /**
   * Sends an audio chunk to a specific session for processing.
   *
   * @param sessionId - The unique identifier for the session to send the audio to.
   * @param audioData - The Base64-encoded audio chunk to be sent.
   */
  sendAudioChunk: (sessionId: string, audioData: string) => void;

  /**
   * Commits the audio buffer for processing in a specific session.
   *
   * @param sessionId - The unique identifier for the session to commit the audio buffer for.
   */
  commitAudioBuffer: (sessionId: string) => void;

  /**
   * Creates a new response for a specific session.
   * @param sessionId - The unique identifier for the session to send the response to.
   * @param response - The response object to be sent.
   */
  createResponse: (sessionId: string, response?: ResponseCreateBody) => void;

  /**
   * Mutes the audio for a specific session.
   * @param sessionId - The unique identifier for the session to mute.
   */
  muteSessionAudio: (sessionId: string) => void;

  /**
   * Unmutes the audio for a specific session.
   * @param sessionId - The unique identifier for the session to unmute.
   */
  unmuteSessionAudio: (sessionId: string) => void;
}

// Create the OpenAI Realtime WebRTC context
const OpenAIRealtimeWebRTCContext = createContext<
  OpenAIRealtimeWebRTCContextType | undefined
>(undefined);

// Export the context for use in other components
export const useOpenAIRealtimeWebRTC = (): OpenAIRealtimeWebRTCContextType => {
  const context = useContext(OpenAIRealtimeWebRTCContext);
  if (!context) {
    throw new Error(
      'useOpenAIRealtimeWebRTC must be used within an OpenAIRealtimeWebRTCProvider'
    );
  }
  return context;
};

// Enum for action types to avoid hardcoding strings
export enum SessionActionType {
  ADD_SESSION = 'ADD_SESSION',
  REMOVE_SESSION = 'REMOVE_SESSION',
  UPDATE_SESSION = 'UPDATE_SESSION',
  ADD_TRANSCRIPT = 'ADD_TRANSCRIPT',
  ADD_ERROR = 'ADD_ERROR',
  SET_FUNCTION_CALL_HANDLER = 'SET_FUNCTION_CALL_HANDLER',
  UPDATE_TOKEN_USAGE = 'UPDATE_TOKEN_USAGE',
  MUTE_SESSION_AUDIO = 'MUTE_SESSION_AUDIO',
  UNMUTE_SESSION_AUDIO = 'UNMUTE_SESSION_AUDIO',
}

// Action interfaces for type safety
interface AddSessionAction {
  type: SessionActionType.ADD_SESSION;
  payload: RealtimeSession;
}

interface RemoveSessionAction {
  type: SessionActionType.REMOVE_SESSION;
  payload: { id: string }; // Only the channel ID is needed to remove
}

interface UpdateSessionAction {
  type: SessionActionType.UPDATE_SESSION;
  payload: Partial<RealtimeSession> & { id: string }; // Allow partial updates, must include `id`
}

interface AddTranscriptAction {
  type: SessionActionType.ADD_TRANSCRIPT;
  payload: { sessionId: string; transcript: Transcript };
}

interface AddErrorAction {
  type: SessionActionType.ADD_ERROR;
  payload: { sessionId: string; error: SessionError };
}

interface SetFunctionCallHandlerAction {
  type: SessionActionType.SET_FUNCTION_CALL_HANDLER;
  payload: {
    sessionId: string;
    onFunctionCall: (name: string, args: Record<string, unknown>) => void;
  };
}

interface UpdateTokenUsageAction {
  type: SessionActionType.UPDATE_TOKEN_USAGE;
  /**
   * Payload containing the session ID and new token usage data.
   */
  payload: { sessionId: string; tokenUsage: TokenUsage };
}

interface MuteSessionAudioAction {
  type: SessionActionType.MUTE_SESSION_AUDIO;
  payload: { sessionId: string };
}

interface UnmuteSessionAudioAction {
  type: SessionActionType.UNMUTE_SESSION_AUDIO;
  payload: { sessionId: string };
}

// Union type for all actions
type SessionAction =
  | AddSessionAction
  | RemoveSessionAction
  | UpdateSessionAction
  | AddTranscriptAction
  | AddErrorAction
  | SetFunctionCallHandlerAction
  | UpdateTokenUsageAction
  | MuteSessionAudioAction
  | UnmuteSessionAudioAction;

// Reducer state type
type ChannelState = RealtimeSession[];

// Reducer function
export const sessionReducer = (
  state: ChannelState,
  action: SessionAction
): ChannelState => {
  switch (action.type) {
    case SessionActionType.ADD_SESSION:
      return [...state, action.payload]; // Add a new session to the state

    case SessionActionType.REMOVE_SESSION:
      return state.filter((session) => session.id !== action.payload.id); // Remove session by ID

    case SessionActionType.UPDATE_SESSION:
      return state.map((session) =>
        session.id === action.payload.id
          ? { ...session, ...action.payload } // Merge updates with existing session
          : session
      );
    case SessionActionType.ADD_TRANSCRIPT:
      return state.map((session) =>
        session.id === action.payload.sessionId
          ? {
              ...session,
              transcripts: [
                ...(session.transcripts || []),
                action.payload.transcript,
              ],
            }
          : session
      );
    case SessionActionType.ADD_ERROR:
      return state.map((session) =>
        session.id === action.payload.sessionId
          ? {
              ...session,
              errors: [...(session.errors || []), action.payload.error],
            }
          : session
      );
    case SessionActionType.SET_FUNCTION_CALL_HANDLER:
      return state.map((session) =>
        session.id === action.payload.sessionId
          ? { ...session, onFunctionCall: action.payload.onFunctionCall }
          : session
      );
    case SessionActionType.UPDATE_TOKEN_USAGE:
      return state.map((session) =>
        session.id === action.payload.sessionId
          ? { ...session, tokenUsage: action.payload.tokenUsage }
          : session
      );
    case SessionActionType.MUTE_SESSION_AUDIO:
      return state.map((session) =>
        session.id === action.payload.sessionId
          ? { ...session, isMuted: true }
          : session
      );
    case SessionActionType.UNMUTE_SESSION_AUDIO:
      return state.map((session) =>
        session.id === action.payload.sessionId
          ? { ...session, isMuted: false }
          : session
      );

    default:
      // Ensure exhaustive checks in TypeScript
      throw new Error(`Unhandled action type: ${action}`);
  }
};

export const useSession = (id?: string | undefined) => {
  const [sessionId, setSessionId] = useState<string | undefined>(id);
  const {
    getSessionById,
    closeSession,
    sendTextMessage,
    sendClientEvent,
    sendAudioChunk,
    commitAudioBuffer,
    createResponse,
    startSession,
    muteSessionAudio,
    unmuteSessionAudio,
  } = useOpenAIRealtimeWebRTC();

  const handleStartSession: StartSession = async (
    newSession: RealtimeSession,
    ...rest
  ) => {
    await startSession(newSession, ...rest);
    setSessionId(newSession.id);
  };

  const session = sessionId ? getSessionById(sessionId) : undefined;

  if (!session || !sessionId) {
    return {
      session,
      startSession: (newSession: RealtimeSession) =>
        handleStartSession(newSession),
      closeSession: () => {
        throw new Error('Session not started');
      },
      sendTextMessage: () => {
        throw new Error('Session not started');
      },
      sendClientEvent: () => {
        throw new Error('Session not started');
      },
      sendAudioChunk: () => {
        throw new Error('Session not started');
      },
      commitAudioBuffer: () => {
        throw new Error('Session not started');
      },
      createResponse: () => {
        throw new Error('Session not started');
      },
      muteSessionAudio: () => {
        throw new Error('Session not started');
      },
      unmuteSessionAudio: () => {
        throw new Error('Session not started');
      },
    };
  }

  return {
    session,
    closeSession: () => closeSession(sessionId),
    sendTextMessage: (message: string) => sendTextMessage(sessionId, message),
    sendClientEvent: (event: RealtimeEvent) =>
      sendClientEvent(sessionId, event),
    sendAudioChunk: (audioData: string) => sendAudioChunk(sessionId, audioData),
    commitAudioBuffer: () => commitAudioBuffer(sessionId),
    createResponse: (response?: ResponseCreateBody) =>
      createResponse(sessionId, response),
    startSession: startSession,
    muteSessionAudio: () => {
      muteSessionAudio(sessionId);
    },
    unmuteSessionAudio: () => {
      unmuteSessionAudio(sessionId);
    },
  };
};

export const OpenAIRealtimeWebRTCProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [sessions, dispatch] = useReducer(sessionReducer, []);

  // get session by id
  const getSessionById = (sessionId: string): RealtimeSession | null => {
    return sessions.find((session) => session.id === sessionId) || null;
  };

  const startSession = async (
    realtimeSession: RealtimeSession,
    functionCallHandler?: (name: string, args: Record<string, unknown>) => void
  ): Promise<void> => {
    const sessionId = realtimeSession.id;
    // Create a new peer connection
    const pc = new RTCPeerConnection();

    // Attach local audio stream if AUDIO modality is enabled
    if (realtimeSession.modalities?.includes(Modality.AUDIO)) {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      localStream
        .getAudioTracks()
        .forEach((track) => pc.addTrack(track, localStream));
      // Manage the remote stream
      pc.ontrack = (event) => {
        console.log(`Remote stream received for session '${sessionId}'.`);
        // update the state for this session with event.streams[0] as mediaStream
        dispatch({
          type: SessionActionType.UPDATE_SESSION,
          payload: {
            id: sessionId,
            mediaStream: event.streams[0],
          },
        });
      };
    }

    // Create and manage a data channel
    const dc = pc.createDataChannel(sessionId);

    // Add a temporary session to state with start time
    dispatch({
      type: SessionActionType.ADD_SESSION,
      payload: {
        ...realtimeSession,
        peerConnection: pc,
        dataChannel: dc,
        tokenRef: realtimeSession?.client_secret?.value,
        isConnecting: true,
        isConnected: false,
        startTime: new Date().toISOString(), // Add start time
      } as RealtimeSession,
    });

    // Add event listeners to handle data channel lifecycle
    dc.addEventListener('open', () => {
      dispatch({
        type: SessionActionType.UPDATE_SESSION,
        payload: {
          id: sessionId,
          isConnecting: false,
          isConnected: true,
        } as RealtimeSession,
      });
      console.log(`Data channel for session '${sessionId}' is open.`);
    });

    dc.addEventListener('message', (e: MessageEvent<string>) => {
      const event: RealtimeEvent = JSON.parse(
        e.data
      ) as unknown as RealtimeEvent;
      switch (event.type) {
        /**
         * Triggered when an input audio transcription is completed.
         * This event provides the final transcript for the user's audio input.
         */
        case RealtimeEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED:
          dispatch({
            type: SessionActionType.ADD_TRANSCRIPT,
            payload: {
              sessionId,
              transcript: {
                content: event.transcript,
                timestamp: Date.now(),
                type: TranscriptType.INPUT,
                role: ConversationRole.USER,
              },
            },
          });
          break;
        /**
         * Triggered when an assistant's audio response transcription is finalized.
         * This event provides the final transcript for the assistant's audio output.
         */
        case RealtimeEventType.RESPONSE_AUDIO_TRANSCRIPT_DONE:
          dispatch({
            type: SessionActionType.ADD_TRANSCRIPT,
            payload: {
              sessionId,
              transcript: {
                content: event.transcript,
                timestamp: Date.now(),
                type: TranscriptType.OUTPUT,
                role: ConversationRole.ASSISTANT,
              },
            },
          });
          break;
        /**
         * Trigger when an error occurs during processing.
         * This event provides information about the error that occurred.
         */
        case RealtimeEventType.ERROR:
          dispatch({
            type: SessionActionType.ADD_ERROR,
            payload: {
              sessionId,
              error: event.error,
            },
          });
          break;

        case RealtimeEventType.RESPONSE_OUTPUT_ITEM_DONE:
          const responseEvent = event as ResponseOutputItemDoneEvent;
          // Check if it's a function call
          if (responseEvent.item.type === ConversationItemType.FUNCTION_CALL) {
            functionCallHandler?.(
              responseEvent.item.name as string,
              JSON.parse(responseEvent.item?.arguments || '{}')
            );
          }
          break;

        case RealtimeEventType.RESPONSE_DONE: {
          const responseEvent = event as ResponseDoneEvent;
          const usage = responseEvent.response?.usage;
          if (usage) {
            // Dispatch token usage to the reducer
            dispatch({
              type: SessionActionType.UPDATE_TOKEN_USAGE,
              payload: {
                sessionId,
                tokenUsage: {
                  inputTokens: usage.input_tokens,
                  outputTokens: usage.output_tokens,
                  totalTokens: usage.total_tokens,
                },
              },
            });
          }
          break;
        }
        default:
          break;
      }
    });

    dc.addEventListener('close', () => {
      console.log(`Session '${sessionId}' closed.`);
      dispatch({
        type: SessionActionType.REMOVE_SESSION,
        payload: { id: sessionId },
      });
    });

    // Create an SDP offer and send it to the OpenAI Realtime API
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const response = await fetch(
      `https://api.openai.com/v1/realtime?model=${process.env.NEXT_PUBLIC_OPEN_AI_MODEL_ID}`,
      {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${realtimeSession.client_secret?.value}`,
          'Content-Type': 'application/sdp',
        },
      }
    );

    // Apply the SDP answer from the response
    const answer = { type: 'answer' as RTCSdpType, sdp: await response.text() };
    console.log({ answer });
    await pc.setRemoteDescription(answer);
  };

  /**
   * Closes an existing WebRTC session.
   * Cleans up the peer connection, data channel, and removes the session from the state.
   *
   * @param sessionId - The unique identifier of the session to close.
   */
  const closeSession = (sessionId: string): void => {
    // Find the session by ID
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      console.warn(`Session with ID '${sessionId}' does not exist.`);
      return;
    }

    // Close the data channel if it exists
    if (session.dataChannel) {
      session.dataChannel.close();
      console.log(`Data channel for session '${sessionId}' closed.`);
    }

    // Close the peer connection if it exists
    if (session.peer_connection) {
      session.peer_connection.close();
      console.log(`Peer connection for session '${sessionId}' closed.`);
    }

    const endTime = new Date().toISOString();
    const startTimeMs = session.startTime ? new Date(session.startTime).getTime() : 0;
    const endTimeMs = new Date(endTime).getTime();
    const duration = startTimeMs ? (endTimeMs - startTimeMs) / 1000 : 0;

    // Update the session status with timing information
    dispatch({
      type: SessionActionType.UPDATE_SESSION,
      payload: {
        id: sessionId,
        isConnecting: false,
        isConnected: false,
        dataChannel: null,
        peer_connection: null,
        endTime,
        duration,
      },
    });
    console.log(`Session '${sessionId}' connection closed. Duration: ${duration}s`);
  };

  /**
   * Sends a client event to a specific WebRTC session.
   *
   * @param sessionId - The unique identifier of the session to send the event to.
   * @param event - The event object to be sent.
   */
  const sendClientEvent = (sessionId: string, event: RealtimeEvent): void => {
    // Find the session by ID
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      console.error(`Session with ID '${sessionId}' does not exist.`);
      return;
    }

    const { dataChannel } = session;

    // Ensure the data channel is open before sending the event
    if (!dataChannel || dataChannel.readyState !== 'open') {
      console.error(
        `Data channel for session '${sessionId}' is not open. Cannot send event.`
      );
      return;
    }

    // Attach a unique event ID if not already provided
    event.event_id = event.event_id || crypto.randomUUID();

    // Send the event over the session's data channel
    try {
      dataChannel.send(JSON.stringify(event));
      console.log(`Event sent to session '${sessionId}':`, event);
    } catch (error) {
      console.error(`Failed to send event to session '${sessionId}':`, error);
    }
  };

  /**
   * Sends a text message to a specific WebRTC session.
   *
   * @param sessionId - The unique identifier of the session to send the message to.
   * @param message - The text message to be sent.
   */
  const sendTextMessage = (sessionId: string, message: string): void => {
    // Create the conversation item creation event
    const userEvent: ConversationItemCreateEvent = {
      type: RealtimeEventType.CONVERSATION_ITEM_CREATE,
      event_id: crypto.randomUUID(), // Generate a unique event ID
      item: {
        type: ConversationItemType.MESSAGE,
        role: ConversationRole.USER, // Role is 'user' as it's input
        content: [
          {
            type: ContentType.INPUT_TEXT,
            text: message,
          },
        ],
      },
    };

    // Send the user message event
    sendClientEvent(sessionId, userEvent);
  };

  /**
   * Creates a new response - Typically used for non VAD sessions.
   * @param sessionId - The unique identifier of the session to send the response to.
   * @param response - The response object to be sent.
   */
  const createResponse = (
    sessionId: string,
    response: ResponseCreateBody = {}
  ): void => {
    // Create the response creation event
    const responseEvent: ResponseCreateEvent = {
      type: RealtimeEventType.RESPONSE_CREATE,
      event_id: crypto.randomUUID(),
      response,
    };

    // Send the response creation event
    sendClientEvent(sessionId, responseEvent);
  };

  /**
   * Sends a chunk of audio to a specific WebRTC session.
   *
   * @param sessionId - The unique identifier of the session to send the audio to.
   * @param audioData - The Base64-encoded audio chunk to be sent.
   */
  const sendAudioChunk = (sessionId: string, audioData: string): void => {
    const audioChunkEvent: InputAudioBufferAppendEvent = {
      type: RealtimeEventType.INPUT_AUDIO_BUFFER_APPEND,
      event_id: crypto.randomUUID(), // Generate a unique event ID
      audio: audioData,
    };

    sendClientEvent(sessionId, audioChunkEvent);
  };

  /**
   * Commits the audio buffer for processing in a specific WebRTC session.
   *
   * @param sessionId - The unique identifier of the session to commit the audio buffer for.
   */
  const commitAudioBuffer = (sessionId: string): void => {
    const commitEvent: InputAudioBufferCommitEvent = {
      type: RealtimeEventType.INPUT_AUDIO_BUFFER_COMMIT,
      event_id: crypto.randomUUID(), // Generate a unique event ID
    };

    sendClientEvent(sessionId, commitEvent);
  };

  const muteSessionAudio = (sessionId: string): void => {
    dispatch({
      type: SessionActionType.MUTE_SESSION_AUDIO,
      payload: { sessionId },
    });
  };

  const unmuteSessionAudio = (sessionId: string): void => {
    dispatch({
      type: SessionActionType.UNMUTE_SESSION_AUDIO,
      payload: { sessionId },
    });
  };

  return (
    <OpenAIRealtimeWebRTCContext.Provider
      value={{
        sessions,
        getSessionById,
        startSession,
        closeSession,
        sendTextMessage,
        sendClientEvent,
        sendAudioChunk,
        commitAudioBuffer,
        createResponse,
        muteSessionAudio,
        unmuteSessionAudio,
      }}
    >
      {children}
    </OpenAIRealtimeWebRTCContext.Provider>
  );
};
