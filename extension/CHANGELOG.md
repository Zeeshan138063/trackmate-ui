# Extension Update Changelog

## [1.5.1] - 2026-01-31
### Fixed
- **Global Logout Sync**: Logging out of the TrackMate Portal now automatically logs out the extension.
- **403 Forbidden Error**: Resolved an issue where aggressive background session sync interfered with portal logout.
- **Polite Sync**: Session synchronization to TrackMate tabs is now "on-demand" (triggered when popup opens) rather than proactive, preventing race conditions.

## [1.5.0] - 2026-01-30
### Added
- **Unified Authentication**: Integrated a direct login form in the extension popup using Supabase.
- **Session Persistence**: Authentication session is now stored in `chrome.storage.local` for cross-tab reliability.
- **Internal API Integration**: Data is now saved directly via Supabase REST API instead of relying on web app redirection.
- **Session Sync**: Extension session is automatically "pushed" to any open TrackMate web app tabs.
- **New UI**: Redesigned popup with Login/Logout flows and a modern, emerald-themed brand aesthetic.

## [1.4.8] - 2026-01-29
### Changes
- **Social Media**: Now saves LinkedIn URL (and future links) into a `social_media` JSON column.
