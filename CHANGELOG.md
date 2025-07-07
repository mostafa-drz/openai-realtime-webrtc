## [2.2.0] - 2024-12-19

### Added

- Complete application refactor with modern architecture
- New demo pages: live-transcription and transcription
- Comprehensive component library with modular design
- Docker support with Dockerfile and docker-compose.yml
- Enhanced documentation with DEMO_README.md
- New RealtimeClient implementation with TypeScript
- Event-driven architecture with client and server events
- Settings panel with configuration management
- Status bar with real-time connection status
- Audio input panel with voice controls
- Conversation panel for chat interface
- Event log for debugging and monitoring
- Info banner for user notifications
- Navbar for navigation between demos          
- Voice transcription demo with advanced features
- Server actions for Next.js 15 integration

### Changed

- Major architectural refactor from single-page to multi-page application
- Improved component organization with dedicated lib directory
- Enhanced TypeScript types with comprehensive event definitions
- Updated layout and styling with modern UI components
- Streamlined API integration with server actions
- Improved error handling and state management

### Removed

- Legacy WebRTC context implementation
- Old component structure and utilities
- Deprecated API routes and session management
- Outdated documentation files

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
