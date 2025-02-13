/**
 * WebRTC Configuration Constants
 */
export const WebRTC = {
  /**
   * Default timeout in milliseconds for ICE connection.
   * Connection attempts will be aborted if not established within this time.
   */
  DEFAULT_CONNECTION_TIMEOUT: 10000, // 10 seconds
} as const; 