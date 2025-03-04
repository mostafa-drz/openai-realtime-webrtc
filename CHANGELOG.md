## [2.1.0] - 2024-03-04

### Added
- Event system with EventEmitter for WebRTC events
- Type-safe event handling with `on` and `off` methods
- EventLogger component for debugging WebRTC events

### Changed
- Improved config validation with required field checks
- Enhanced audio settings fallback logic
- Refined default configuration handling
- Added proper type safety for optional configurations

### Fixed
- Audio settings inheritance from default config
- Config validation for required fields (realtimeApiUrl, modelId)

## [2.0.0] - 2024-03-03

### Breaking Changes

- Removed audio control from WebRTC context (mute/unmute functionality)
- Refactored session management from multi-session to single-session architecture
- Renamed session methods for clarity:
  - `startSession` → `connect`
  - `closeSession` → `disconnect`
- Updated connection status handling with new ConnectionStatus enum

### Added

- Configuration panel for API settings
- Sessions debugger with JSON viewer
- Rate limiting support with automatic handling
- Enhanced WebRTC configuration constants
- Development tooling:
  - ESLint and Prettier configuration
  - Husky pre-commit hooks
  - Lint-staged for automated code quality

### Changed

- Improved error handling and state management
- Enhanced TypeScript configuration
- Updated build configuration with next.config.mjs
- Simplified WebRTCPlayer component
- Improved documentation for WebRTC integration

### Removed

- Audio control functionality from core WebRTC context
- Multi-session support in favor of single-session architecture

## [1.2.0] - 2024-02-07

### Added

- Voice selection support with OpenAI's latest voices (alloy, ash, echo, coral, shimmer, ballad, sage, verse)
- Session timing analytics (startTime, endTime, duration)
- New SessionInfo component for displaying session metrics

### Changed

- Session closing behavior now maintains state for analytics
- Improved UI layout with dedicated settings and stats panels

## [1.1.0] - 2025-02-04

### Added

- Mute/Unmute functionality for RealtimeSession
- Adds `isMuted` as a property for RealtimeSession
