import { EventCallback, RealtimeEventType, RealtimeEvent } from '../types';

/**
 * Simple event emitter for handling WebRTC events
 */
export class EventEmitter {
  private listeners: Map<RealtimeEventType, Set<EventCallback>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * Add an event listener
   */
  on(eventType: RealtimeEventType, callback: EventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)?.add(callback);
  }

  /**
   * Remove an event listener
   */
  off(eventType: RealtimeEventType, callback?: EventCallback): void {
    if (!callback) {
      // If no callback provided, remove all listeners for this event type
      this.listeners.delete(eventType);
      return;
    }

    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Emit an event to all listeners
   */
  emit(event: RealtimeEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Remove all event listeners
   */
  removeAll(): void {
    this.listeners.clear();
  }
}
