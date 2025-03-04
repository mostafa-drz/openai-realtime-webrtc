import React, { useEffect } from 'react';
import { useSession } from '../context/OpenAIRealtimeWebRTC';
import { RealtimeEventType, RealtimeEvent } from '../types';

export const EventLogger: React.FC = () => {
  const { on, off } = useSession();

  useEffect(() => {
    // Define event handlers
    const handleTranscriptionCompleted = (event: RealtimeEvent) => {
      console.log('🎤 Transcription completed', {
        timestamp: new Date().toISOString(),
        eventId: event.event_id,
      });
    };

    const handleInputAudioCompleted = (event: RealtimeEvent) => {
      console.log('🛑 Output audio stopped', {
        timestamp: new Date().toISOString(),
        eventId: event.event_id,
      });
    };

    // Subscribe to events
    on(
      RealtimeEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED,
      handleTranscriptionCompleted
    );
    on(RealtimeEventType.INPUT_AUDIO_COMMITTED, handleInputAudioCompleted);

    // Cleanup on unmount
    return () => {
      off(
        RealtimeEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED,
        handleTranscriptionCompleted
      );
      off(RealtimeEventType.INPUT_AUDIO_COMMITTED, handleInputAudioCompleted);
    };
  }, [on, off]); // Only re-run if on/off methods change

  // This component doesn't render anything
  return null;
};
