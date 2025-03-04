'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
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
  TokenUsage,
  ResponseDoneEvent,
  Modality,
  SessionCloseOptions,
  ConnectionStatus,
  RateLimit,
  RateLimitsUpdatedEvent,
  OpenAIRealtimeWebRTCProviderProps,
  Connect,
} from '../types';
import { createNoopLogger } from '../utils/logger';

/**
 * Context type definition for managing OpenAI Realtime WebRTC sessions.
 */
interface OpenAIRealtimeWebRTCContextType {
  /**
   * Gets the list of all active sessions.
   */
  session: RealtimeSession | null;

  /**
   * Starts a new WebRTC session with the OpenAI API.
   * @param realtimeSession - The session object containing configuration.
   * @returns A promise that resolves once the session is successfully started.
   */
  connect: Connect;

  /**
   * Ends an active WebRTC session and cleans up its resources.
   *
   * @param options - Configuration options for closing behavior.
   * @param options.removeAfterConnectionClose - Whether to remove the session from state after closing. Defaults to true.
   */
  disconnect: () => void;

  /**
   * Sends a text message to a specific session.
   *
   * @param message - The text message content.
   */
  sendTextMessage: (message: string) => void;

  /**
   * Sends a custom client event to a specific session.
   *
   * @param event - The custom event payload.
   */
  sendClientEvent: (event: RealtimeEvent) => void;

  /**
   * Sends an audio chunk to a specific session for processing.
   *
   * @param audioData - The Base64-encoded audio chunk to be sent.
   */
  sendAudioChunk: (audioData: string) => void;

  /**
   * Commits the audio buffer for processing in a specific session.
   *
   */
  commitAudioBuffer: () => void;

  /**
   * Creates a new response for a specific session.
   * @param response - The response object to be sent.
   */
  createResponse: (response?: ResponseCreateBody) => void;
}

// Create the OpenAI Realtime WebRTC context
const OpenAIRealtimeWebRTCContext = createContext<
  OpenAIRealtimeWebRTCContextType | undefined
>(undefined);

// Export the context for use in other components
export const useSession = (): OpenAIRealtimeWebRTCContextType => {
  const context = useContext(OpenAIRealtimeWebRTCContext);
  if (!context) {
    throw new Error(
      'useSession must be used within an OpenAIRealtimeWebRTCProvider'
    );
  }
  return context;
};

// Enum for action types to avoid hardcoding strings
export enum SessionActionType {
  INIT_SESSION = 'INIT_SESSION',
  UPDATE_SESSION = 'UPDATE_SESSION',
  ADD_TRANSCRIPT = 'ADD_TRANSCRIPT',
  UPDATE_TOKEN_USAGE = 'UPDATE_TOKEN_USAGE',
  MUTE_SESSION_AUDIO = 'MUTE_SESSION_AUDIO',
  UNMUTE_SESSION_AUDIO = 'UNMUTE_SESSION_AUDIO',
  UPDATE_RATE_LIMITS = 'UPDATE_RATE_LIMITS',
}

interface InitSessionAction {
  type: SessionActionType.INIT_SESSION;
  payload: RealtimeSession;
}

interface UpdateSessionAction {
  type: SessionActionType.UPDATE_SESSION;
  payload: Partial<RealtimeSession>;
}

interface AddTranscriptAction {
  type: SessionActionType.ADD_TRANSCRIPT;
  payload: { transcript: Transcript };
}

interface UpdateTokenUsageAction {
  type: SessionActionType.UPDATE_TOKEN_USAGE;
  payload: { tokenUsage: TokenUsage };
}

interface MuteSessionAudioAction {
  type: SessionActionType.MUTE_SESSION_AUDIO;
}

interface UnmuteSessionAudioAction {
  type: SessionActionType.UNMUTE_SESSION_AUDIO;
}

interface UpdateRateLimitsAction {
  type: SessionActionType.UPDATE_RATE_LIMITS;
  payload: {
    rateLimits: RateLimit[];
    rateLimitResetTime: string;
    isRateLimited: boolean;
  };
}

// Union type for all actions
type SessionAction =
  | InitSessionAction
  | UpdateSessionAction
  | AddTranscriptAction
  | UpdateTokenUsageAction
  | MuteSessionAudioAction
  | UnmuteSessionAudioAction
  | UpdateRateLimitsAction;

// Reducer function
export const sessionReducer = (
  state: RealtimeSession | null,
  action: SessionAction
): RealtimeSession | null => {
  switch (action.type) {
    case SessionActionType.INIT_SESSION:
      return action.payload;
    case SessionActionType.UPDATE_SESSION:
      if (!state) {
        return null;
      }
      return { ...state, ...action.payload };
    case SessionActionType.ADD_TRANSCRIPT:
      if (!state) {
        return null;
      }
      return {
        ...state,
        transcripts: [...(state?.transcripts || []), action.payload.transcript],
      };
    case SessionActionType.UPDATE_TOKEN_USAGE:
      if (!state) {
        return null;
      }
      return { ...state, tokenUsage: action.payload.tokenUsage };
    case SessionActionType.MUTE_SESSION_AUDIO:
      if (!state) {
        return null;
      }
      return { ...state, isMuted: true };
    case SessionActionType.UNMUTE_SESSION_AUDIO:
      if (!state) {
        return null;
      }
      return { ...state, isMuted: false };
    case SessionActionType.UPDATE_RATE_LIMITS:
      if (!state) {
        return null;
      }
      return {
        ...state,
        rateLimits: action.payload.rateLimits,
        rateLimitResetTime: action.payload.rateLimitResetTime,
        isRateLimited: action.payload.isRateLimited,
      };
    default:
      // Ensure exhaustive checks in TypeScript
      throw new Error(`Unhandled action type: ${action}`);
  }
};

export const OpenAIRealtimeWebRTCProvider: React.FC<
  OpenAIRealtimeWebRTCProviderProps
> = ({ config, children }) => {
  const [session, dispatch] = useReducer(sessionReducer, null);

  const logger = config.logger || createNoopLogger();

  useEffect(() => {
    logger.info('OpenAIRealtimeWebRTCProvider initialized', {
      config,
    });

    return () => {
      logger.info('OpenAIRealtimeWebRTCProvider unmounted', {
        config,
      });
    };
  }, [config, logger]);

  const connect: Connect = async (
    realtimeSession: RealtimeSession,
    functionCallHandler?: (name: string, args: Record<string, unknown>) => void
  ): Promise<void> => {
    const sessionId = realtimeSession.id;
    let iceTimeoutId: NodeJS.Timeout | null = null;
    dispatch({
      type: SessionActionType.INIT_SESSION,
      payload: realtimeSession,
    });
    try {
      const pc = new RTCPeerConnection({
        iceServers: [], // OpenAI handles this
      });

      // Use config audio settings if provided
      const audioSettings = realtimeSession.audioSettings ||
        config.defaultAudioSettings || {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        };

      // Get user media if audio modality is required
      let localStream: MediaStream | undefined;
      if (realtimeSession.modalities?.includes(Modality.AUDIO)) {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: audioSettings,
          });
          logger.info('Local stream created', { sessionId });
          localStream.getAudioTracks().forEach((track) => {
            if (localStream) {
              pc.addTrack(track, localStream);
              logger.info('Audio track added', { sessionId });
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
              logger.info('Audio track ended', { sessionId });
              dispatch({
                type: SessionActionType.UPDATE_SESSION,
                payload: {
                  id: sessionId,
                  hasAudio: false,
                },
              });
            };
          });
        } catch (error: unknown) {
          logger.error('Failed to get user media:', { sessionId, error });
          throw new Error('Microphone access failed');
        }
      }

      const attemptReconnection = async (
        pc: RTCPeerConnection
      ): Promise<void> => {
        logger.info(`Attempting reconnection for session '${sessionId}'`);
        try {
          const offer = await pc.createOffer({
            iceRestart: true,
            offerToReceiveAudio: true,
          });
          await pc.setLocalDescription(offer);
          logger.info('Offer created and set local description', {
            sessionId,
            offer,
          });
          const response = await fetch(
            `${config.realtimeApiUrl}?model=${config.modelId}`,
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
            logger.error('Reconnection failed, error from OpenAI API:', {
              sessionId,
              errorText,
            });
            throw new Error(errorText);
          }
          logger.info('Reconnection successful, received answer SDP', {
            sessionId,
            response,
          });

          const answerSdp = await response.text();
          await pc.setRemoteDescription(
            new RTCSessionDescription({
              type: 'answer',
              sdp: answerSdp,
            })
          );
          logger.info(`Reconnection successful for session '${sessionId}'`, {
            sessionId,
            answerSdp,
          });
          // Update session state to "CONNECTED" after successful reconnection
          dispatch({
            type: SessionActionType.UPDATE_SESSION,
            payload: {
              id: sessionId,
              connectionStatus: ConnectionStatus.CONNECTED,
              lastStateChange: new Date().toISOString(),
            },
          });
        } catch (error: unknown) {
          logger.error(`Failed to reconnect session '${sessionId}':`, {
            sessionId,
            error,
          });
        }
      };

      // Set ICE timeout from config
      const iceTimeout = config.defaultIceTimeout || 30000;
      iceTimeoutId = setTimeout(() => {
        if (pc.iceConnectionState !== 'connected') {
          logger.error(`ICE connection timeout for session '${sessionId}'`);
          // handle timeout
          cleanupWebRTCResources();
        }
      }, iceTimeout);

      // Enhance ICE connection monitoring with reconnection logic
      const monitorConnectionState = (pc: RTCPeerConnection) => {
        pc.oniceconnectionstatechange = () => {
          const state = pc.iceConnectionState;
          logger.info(`ICE Connection State for session '${sessionId}':`, {
            sessionId,
            state,
          });

          switch (state) {
            case 'checking':
              dispatch({
                type: SessionActionType.UPDATE_SESSION,
                payload: {
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
                  connectionStatus: ConnectionStatus.CONNECTED,
                  lastStateChange: new Date().toISOString(),
                },
              });
              break;

            case 'disconnected':
              dispatch({
                type: SessionActionType.UPDATE_SESSION,
                payload: {
                  connectionStatus: ConnectionStatus.DISCONNECTED,
                  lastStateChange: new Date().toISOString(),
                },
              });
              logger.warn(
                `Session '${sessionId}' disconnected. Attempting reconnection...`
              );
              // Delay before starting the reconnection to avoid immediate retry
              setTimeout(() => {
                dispatch({
                  type: SessionActionType.UPDATE_SESSION,
                  payload: {
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
                  connectionStatus: ConnectionStatus.FAILED,
                  lastStateChange: new Date().toISOString(),
                },
              });
              cleanupWebRTCResources();
              break;

            case 'closed':
              if (iceTimeoutId) {
                clearTimeout(iceTimeoutId);
                iceTimeoutId = null;
              }
              dispatch({
                type: SessionActionType.UPDATE_SESSION,
                payload: {
                  connectionStatus: ConnectionStatus.CLOSED,
                  lastStateChange: new Date().toISOString(),
                },
              });
              cleanupWebRTCResources();
              break;

            default:
              // Ensure exhaustive check using enums where possible
              throw new Error(`Unhandled ICE connection state: ${state}`);
          }
        };

        // Set ICE connection timeout remains as before
        iceTimeoutId = setTimeout(() => {
          logger.error(`ICE connection timeout for session '${sessionId}'`);
          cleanupWebRTCResources();
        }, 30000); // 30 second timeout
      };

      // Initialize peer connection with monitoring
      monitorConnectionState(pc);

      // Create data channel
      const dc = pc.createDataChannel(sessionId);

      pc.onnegotiationneeded = async () => {
        try {
          logger.info(`Negotiation needed for session '${sessionId}'`);

          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
          });

          logger.info('Generated offer SDP:', { sessionId, offer: offer.sdp }); // Debug log

          await pc.setLocalDescription(offer);

          const response = await fetch(
            `${config.realtimeApiUrl}?model=${config.modelId}`,
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
            logger.error('OpenAI API error:', { sessionId, errorText });
            throw new Error(errorText);
          }

          const answerSdp = await response.text();
          logger.info('Received answer SDP:', { sessionId, answerSdp }); // Debug log

          await pc.setRemoteDescription(
            new RTCSessionDescription({
              type: 'answer',
              sdp: answerSdp,
            })
          );

          logger.info(`Negotiation completed for session '${sessionId}'`, {
            sessionId,
            answerSdp,
          });
        } catch (error: unknown) {
          logger.error(`Failed to negotiate session '${sessionId}':`, {
            sessionId,
            error,
          });
          throw error;
        }
      };

      // Handle tracks with cleanup
      pc.ontrack = (event) => {
        logger.info(`Remote stream received for session '${sessionId}'.`);
        event.track.onended = () => {
          if (session) {
            cleanupWebRTCResources();
          }
        };

        dispatch({
          type: SessionActionType.UPDATE_SESSION,
          payload: {
            mediaStream: event.streams[0],
          },
        });
      };

      // Add event listeners to handle data channel lifecycle
      dc.addEventListener('open', () => {
        dispatch({
          type: SessionActionType.UPDATE_SESSION,
          payload: {
            connectionStatus: ConnectionStatus.CONNECTED,
          },
        });

        logger.info(`Data channel for session '${sessionId}' is open.`);
      });

      dc.addEventListener('message', (e: MessageEvent<string>) => {
        logger.info('Received message from data channel', {
          sessionId,
          data: e.data,
        });
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
                transcript: {
                  content: event.transcript,
                  timestamp: Date.now(),
                  type: TranscriptType.OUTPUT,
                  role: ConversationRole.ASSISTANT,
                },
              },
            });
            break;
          case RealtimeEventType.RESPONSE_OUTPUT_ITEM_DONE:
            // Check if it's a function call
            if (event.item.type === ConversationItemType.FUNCTION_CALL) {
              functionCallHandler?.(
                event.item.name as string,
                JSON.parse(event.item?.arguments || '{}')
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

          case RealtimeEventType.RATE_LIMITS_UPDATED: {
            const rateLimitsEvent = event as RateLimitsUpdatedEvent;
            const maxResetSeconds = Math.max(
              ...rateLimitsEvent.rate_limits.map((limit) => limit.reset_seconds)
            );
            const resetTime = new Date(
              Date.now() + maxResetSeconds * 1000
            ).toISOString();
            const isRateLimited = rateLimitsEvent.rate_limits.some(
              (limit) => limit.remaining <= 0
            );

            dispatch({
              type: SessionActionType.UPDATE_RATE_LIMITS,
              payload: {
                rateLimits: rateLimitsEvent.rate_limits,
                rateLimitResetTime: resetTime,
                isRateLimited,
              },
            });

            // If rate limited, add an error
            if (isRateLimited) {
              logger.error(`Rate limit exceeded for session '${sessionId}'`);
            }
            break;
          }
          default:
            break;
        }
      });

      dc.addEventListener('close', () => {
        logger.info(`Session '${sessionId}' closed.`);
        disconnect();
      });
    } catch (error: unknown) {
      logger.error(`Failed to start session '${sessionId}':`, {
        sessionId,
        error,
      });
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
  const disconnect = (
    options: SessionCloseOptions = { removeAfterConnectionClose: true }
  ): void => {
    if (!session) {
      return;
    }

    cleanupWebRTCResources();
    const sessionId = session.id;
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
        connectionStatus: ConnectionStatus.CLOSED,
        endTime,
        duration,
      },
    });

    logger.info(
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
  const sendClientEvent = (event: RealtimeEvent): void => {
    if (!session) {
      return;
    }

    const { dataChannel } = session;
    const sessionId = session.id;

    // Ensure the data channel is open before sending the event
    if (!dataChannel || dataChannel.readyState !== 'open') {
      logger.error(
        `Data channel for session '${sessionId}' is not open. Cannot send event.`
      );
      return;
    }

    // Attach a unique event ID if not already provided
    event.event_id = event.event_id || crypto.randomUUID();

    // Send the event over the session's data channel
    try {
      dataChannel.send(JSON.stringify(event));
      logger.info(`Event sent to session '${sessionId}':`, {
        sessionId,
        event,
      });
    } catch (error: unknown) {
      logger.error(`Failed to send event to session '${sessionId}':`, {
        sessionId,
        error,
      });
    }
  };

  /**
   * Sends a text message to a specific WebRTC session.
   * @param message - The text message to be sent.
   */
  const sendTextMessage = (message: string): void => {
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
    sendClientEvent(userEvent);
  };

  /**
   * Creates a new response - Typically used for non VAD sessions.
   * @param response - The response object to be sent.
   */
  const createResponse = (response: ResponseCreateBody = {}): void => {
    // Create the response creation event
    const responseEvent: ResponseCreateEvent = {
      type: RealtimeEventType.RESPONSE_CREATE,
      event_id: crypto.randomUUID(),
      response,
    };

    // Send the response creation event
    sendClientEvent(responseEvent);
  };

  /**
   * Sends a chunk of audio to a specific WebRTC session.
   *
   * @param sessionId - The unique identifier of the session to send the audio to.
   * @param audioData - The Base64-encoded audio chunk to be sent.
   */
  const sendAudioChunk = (audioData: string): void => {
    const audioChunkEvent: InputAudioBufferAppendEvent = {
      type: RealtimeEventType.INPUT_AUDIO_BUFFER_APPEND,
      event_id: crypto.randomUUID(), // Generate a unique event ID
      audio: audioData,
    };

    sendClientEvent(audioChunkEvent);
  };

  /**
   * Commits the audio buffer for processing in a specific WebRTC session.
   *
   */
  const commitAudioBuffer = (): void => {
    const commitEvent: InputAudioBufferCommitEvent = {
      type: RealtimeEventType.INPUT_AUDIO_BUFFER_COMMIT,
      event_id: crypto.randomUUID(), // Generate a unique event ID
    };

    sendClientEvent(commitEvent);
  };

  /**
   * Utility function to properly cleanup WebRTC resources
   */
  const cleanupWebRTCResources = useCallback(() => {
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
  }, [session]);

  // Handle cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupWebRTCResources();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session, cleanupWebRTCResources]);

  return (
    <OpenAIRealtimeWebRTCContext.Provider
      value={{
        session,
        connect,
        disconnect,
        sendTextMessage,
        sendClientEvent,
        sendAudioChunk,
        commitAudioBuffer,
        createResponse,
      }}
    >
      {children}
    </OpenAIRealtimeWebRTCContext.Provider>
  );
};
