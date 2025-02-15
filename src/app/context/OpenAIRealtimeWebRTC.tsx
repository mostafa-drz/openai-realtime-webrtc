'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
} from 'react';
import {
  Transcript,
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
  Modality,
  SessionCloseOptions,
  ConnectionStatus,
  AudioSettings,
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
   * @param options - Configuration options for closing behavior.
   * @param options.removeAfterConnectionClose - Whether to remove the session from state after closing. Defaults to true.
   */
  closeSession: (sessionId: string, options?: SessionCloseOptions) => void;

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
    closeSession: (options?: SessionCloseOptions) =>
      closeSession(sessionId, options),
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

  const startSession: StartSession = async (
    realtimeSession: RealtimeSession,
    functionCallHandler?: (name: string, args: Record<string, unknown>) => void
  ): Promise<void> => {
    const sessionId = realtimeSession.id;
    let iceTimeoutId: NodeJS.Timeout | null = null;

    try {
      const pc = new RTCPeerConnection({
        iceServers: [], // OpenAI handles this
      });

      // Use custom audio settings if provided, otherwise use defaults
      const defaultAudioSettings: AudioSettings = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000, // Optimal for speech
      };

      const audioSettings =
        realtimeSession.audioSettings || defaultAudioSettings;

      // Get user media if audio modality is required
      let localStream: MediaStream | undefined;
      if (realtimeSession.modalities?.includes(Modality.AUDIO)) {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: audioSettings,
          });
          localStream.getAudioTracks().forEach((track) => {
            if (localStream) {
              pc.addTrack(track, localStream);
              dispatch({
                type: SessionActionType.UPDATE_SESSION,
                payload: {
                  id: sessionId,
                  hasAudio: true,
                },
              });
            }
            // Monitor track status
            track.onended = () => {
              console.log('Audio track ended');
              dispatch({
                type: SessionActionType.UPDATE_SESSION,
                payload: {
                  id: sessionId,
                  hasAudio: false,
                },
              });
            };
          });
        } catch (error) {
          console.error('Failed to get user media:', error);
          throw new Error('Microphone access failed');
        }
      }

      // --------------------------------------------
      // NEW: Reconnection mechanism for ICE disconnections
      // --------------------------------------------
      const attemptReconnection = async (
        pc: RTCPeerConnection
      ): Promise<void> => {
        console.log(`Attempting reconnection for session '${sessionId}'`);
        try {
          // Create an offer with ICE restart enabled
          const offer = await pc.createOffer({
            iceRestart: true,
            offerToReceiveAudio: true,
          });
          console.log('Reconnection offer SDP:', offer.sdp);
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

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              'Reconnection failed, error from OpenAI API:',
              errorText
            );
            throw new Error(errorText);
          }

          const answerSdp = await response.text();
          await pc.setRemoteDescription(
            new RTCSessionDescription({
              type: 'answer',
              sdp: answerSdp,
            })
          );
          console.log(`Reconnection successful for session '${sessionId}'`);
          // Update session state to "CONNECTED" after successful reconnection
          dispatch({
            type: SessionActionType.UPDATE_SESSION,
            payload: {
              id: sessionId,
              isConnecting: false,
              isConnected: true,
              connectionStatus: ConnectionStatus.CONNECTED,
              lastStateChange: new Date().toISOString(),
            },
          });
        } catch (error) {
          console.error(`Failed to reconnect session '${sessionId}':`, error);
          // Optionally, update session state to a failed status or retain DISCONNECTED
        }
      };

      // Enhance ICE connection monitoring with reconnection logic
      const monitorConnectionState = (pc: RTCPeerConnection) => {
        pc.oniceconnectionstatechange = () => {
          const state = pc.iceConnectionState;
          console.log(
            `ICE Connection State for session '${sessionId}':`,
            state
          );

          switch (state) {
            case 'checking':
              dispatch({
                type: SessionActionType.UPDATE_SESSION,
                payload: {
                  id: sessionId,
                  isConnecting: true,
                  isConnected: false,
                  connectionStatus: ConnectionStatus.CONNECTING,
                  lastStateChange: new Date().toISOString(),
                },
              });
              break;

            case 'connected':
            case 'completed':
              if (iceTimeoutId) {
                clearTimeout(iceTimeoutId);
                iceTimeoutId = null;
              }
              dispatch({
                type: SessionActionType.UPDATE_SESSION,
                payload: {
                  id: sessionId,
                  isConnecting: false,
                  isConnected: true,
                  connectionStatus: ConnectionStatus.CONNECTED,
                  lastStateChange: new Date().toISOString(),
                },
              });
              break;

            case 'disconnected':
              dispatch({
                type: SessionActionType.UPDATE_SESSION,
                payload: {
                  id: sessionId,
                  isConnecting: false,
                  isConnected: false,
                  connectionStatus: ConnectionStatus.DISCONNECTED,
                  lastStateChange: new Date().toISOString(),
                },
              });
              console.warn(
                `Session '${sessionId}' disconnected. Attempting reconnection...`
              );
              // Delay before starting the reconnection to avoid immediate retry
              setTimeout(() => {
                dispatch({
                  type: SessionActionType.UPDATE_SESSION,
                  payload: {
                    id: sessionId,
                    isConnecting: true,
                    isConnected: false,
                    connectionStatus: ConnectionStatus.RECONNECTING, // using enum value here
                    lastStateChange: new Date().toISOString(),
                  },
                });
                attemptReconnection(pc);
              }, 2000);
              break;

            case 'failed':
              if (iceTimeoutId) {
                clearTimeout(iceTimeoutId);
                iceTimeoutId = null;
              }
              dispatch({
                type: SessionActionType.UPDATE_SESSION,
                payload: {
                  id: sessionId,
                  isConnecting: false,
                  isConnected: false,
                  connectionStatus: ConnectionStatus.FAILED,
                  lastStateChange: new Date().toISOString(),
                },
              });
              dispatch({
                type: SessionActionType.ADD_ERROR,
                payload: {
                  sessionId,
                  error: {
                    event_id: crypto.randomUUID(),
                    related_event_id: null,
                    param: null,
                    type: 'connection_error',
                    code: 'ice_connection_failed',
                    message: 'ICE connection failed',
                    timestamp: Date.now(),
                  },
                },
              });
              cleanupWebRTCResources(getSessionById(sessionId));
              break;

            case 'closed':
              if (iceTimeoutId) {
                clearTimeout(iceTimeoutId);
                iceTimeoutId = null;
              }
              dispatch({
                type: SessionActionType.UPDATE_SESSION,
                payload: {
                  id: sessionId,
                  isConnecting: false,
                  isConnected: false,
                  connectionStatus: ConnectionStatus.CLOSED,
                  lastStateChange: new Date().toISOString(),
                },
              });
              cleanupWebRTCResources(getSessionById(sessionId));
              break;

            default:
              // Ensure exhaustive check using enums where possible
              throw new Error(`Unhandled ICE connection state: ${state}`);
          }
        };

        // Set ICE connection timeout remains as before
        iceTimeoutId = setTimeout(() => {
          console.error(`ICE connection timeout for session '${sessionId}'`);
          dispatch({
            type: SessionActionType.ADD_ERROR,
            payload: {
              sessionId,
              error: {
                event_id: crypto.randomUUID(),
                related_event_id: null,
                param: null,
                type: 'connection_error',
                code: 'ice_connection_timeout',
                message: 'ICE connection timed out',
                timestamp: Date.now(),
              },
            },
          });
          cleanupWebRTCResources(getSessionById(sessionId));
        }, 30000); // 30 second timeout
      };

      // Initialize peer connection with monitoring
      monitorConnectionState(pc);

      // Create data channel
      const dc = pc.createDataChannel(sessionId);

      // Add session to state
      dispatch({
        type: SessionActionType.ADD_SESSION,
        payload: {
          ...realtimeSession,
          peerConnection: pc,
          dataChannel: dc,
          tokenRef: realtimeSession?.client_secret?.value,
          isConnecting: true,
          isConnected: false,
          startTime: new Date().toISOString(),
        } as RealtimeSession,
      });

      pc.onnegotiationneeded = async () => {
        try {
          console.log(`Negotiation needed for session '${sessionId}'`);

          // Create offer with explicit audio
          const offer = await pc.createOffer({
            offerToReceiveAudio: true, // Explicitly request audio
          });

          console.log('Generated offer SDP:', offer.sdp); // Debug log

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

          if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API error:', errorText);
            throw new Error(errorText);
          }

          const answerSdp = await response.text();
          console.log('Received answer SDP:', answerSdp); // Debug log

          await pc.setRemoteDescription(
            new RTCSessionDescription({
              type: 'answer',
              sdp: answerSdp,
            })
          );

          console.log(`Negotiation completed for session '${sessionId}'`);
        } catch (error) {
          console.error(`Failed to negotiate session '${sessionId}':`, error);
          // ... error handling ...
        }
      };

      // Handle tracks with cleanup
      pc.ontrack = (event) => {
        console.log(`Remote stream received for session '${sessionId}'.`);
        event.track.onended = () => {
          const session = getSessionById(sessionId);
          if (session) {
            cleanupWebRTCResources(session);
          }
        };

        dispatch({
          type: SessionActionType.UPDATE_SESSION,
          payload: {
            id: sessionId,
            mediaStream: event.streams[0],
          },
        });
      };

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
            if (
              responseEvent.item.type === ConversationItemType.FUNCTION_CALL
            ) {
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
    } catch (error) {
      console.error(`Failed to start session '${sessionId}':`, error);
      if (iceTimeoutId) {
        clearTimeout(iceTimeoutId);
      }
      throw error;
    }
  };

  /**
   * Closes an existing WebRTC session.
   * Cleans up the peer connection, data channel, and removes the session from the state.
   *
   * @param sessionId - The unique identifier of the session to close.
   */
  const closeSession = (
    sessionId: string,
    options: SessionCloseOptions = { removeAfterConnectionClose: true }
  ): void => {
    const session = getSessionById(sessionId);
    if (!session) {
      console.warn(`Session with ID '${sessionId}' does not exist.`);
      return;
    }

    cleanupWebRTCResources(session);

    const endTime = new Date().toISOString();
    const startTimeMs = session.startTime
      ? new Date(session.startTime).getTime()
      : 0;
    const endTimeMs = new Date(endTime).getTime();
    const duration = startTimeMs ? (endTimeMs - startTimeMs) / 1000 : 0;

    // Update session state
    dispatch({
      type: SessionActionType.UPDATE_SESSION,
      payload: {
        id: sessionId,
        isConnecting: false,
        isConnected: false,
        endTime,
        duration,
      },
    });

    // Only remove the session if explicitly requested
    if (options.removeAfterConnectionClose) {
      dispatch({
        type: SessionActionType.REMOVE_SESSION,
        payload: { id: sessionId },
      });
    }

    console.log(
      `Session '${sessionId}' connection closed. Duration: ${duration}s. Session ${
        options.removeAfterConnectionClose ? 'removed from' : 'kept in'
      } state.`
    );
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

  /**
   * Utility function to properly cleanup WebRTC resources
   */
  const cleanupWebRTCResources = (session: RealtimeSession | null) => {
    if (!session) return;

    // Cleanup media tracks
    if (session.mediaStream) {
      session.mediaStream.getTracks().forEach((track) => {
        track.stop();
        track.dispatchEvent(new Event('ended'));
      });
    }

    // Cleanup data channel
    if (session.dataChannel) {
      session.dataChannel.onmessage = null;
      session.dataChannel.onopen = null;
      session.dataChannel.onclose = null;
      session.dataChannel.onerror = null;
      if (session.dataChannel.readyState !== 'closed') {
        session.dataChannel.close();
      }
    }

    // Cleanup peer connection
    if (session.peer_connection) {
      // Remove all event listeners
      session.peer_connection.onicecandidate = null;
      session.peer_connection.ontrack = null;
      session.peer_connection.oniceconnectionstatechange = null;
      session.peer_connection.onsignalingstatechange = null;
      session.peer_connection.ondatachannel = null;

      // Close the connection if not already closed
      if (session.peer_connection.signalingState !== 'closed') {
        session.peer_connection.close();
      }
    }

    // Clear references
    session.mediaStream = null;
    session.dataChannel = null;
    session.peer_connection = null;
  };

  // Handle cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessions.forEach((session) => {
        cleanupWebRTCResources(session);
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessions]);

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
