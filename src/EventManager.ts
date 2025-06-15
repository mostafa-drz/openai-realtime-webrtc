import { ServerEvent, ServerEventType } from '@/app/types/server-events';
import { ClientEvent } from '@/app/types/client-events';

export class EventManager {
  private listeners: Map<ServerEventType, Set<(event: ServerEvent) => void>>;

  constructor() {
    this.listeners = new Map();
  }

  on<T extends ServerEventType>(
    type: T,
    callback: (event: ServerEvent) => void
  ): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(callback);
  }

  off<T extends ServerEventType>(
    type: T,
    callback: (event: ServerEvent) => void
  ): void {
    this.listeners.get(type)?.delete(callback);
  }

  emit(event: ClientEvent): void {
    // Implementation for sending events will be added when we implement WebRTC
    console.log('Emitting event:', event);
  }

  handleServerEvent(event: ServerEvent): void {
    this.listeners.get(event.type)?.forEach((callback) => callback(event));
  }
}
