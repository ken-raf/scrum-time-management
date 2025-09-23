# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-23

### 🎨 Major Features Added
- **Complete Theme System**: Implemented comprehensive theming with 10 modern color palettes (Blue, Green, Purple, Orange, Red, Teal, Rose, Slate, Emerald, Indigo)
- **Dark Mode Support**: Full dark/light mode switching with system preference detection
- **Theme Persistence**: Automatic theme settings storage in localStorage
- **Floating Media Player**: Added comprehensive audio/video support with complete translations
- **Text-to-Speech Announcements**: Added TTS for spin wheel results and speaking modal interactions

### 🎯 User Experience Improvements
- **90% Default Scale**: Optimized default app scaling for better screen utilization
- **Theme-Aware Components**: All UI components now properly follow selected theme
- **Consistent Button Styling**: Updated all buttons to use theme colors instead of hardcoded values
- **Improved Visual Feedback**: Enhanced contrast and readability across light/dark modes

### 🐛 Bug Fixes
- **Meeting Data Integrity**: Fixed issue where non-speaking participants showed used time from previous meetings
- **Theme Consistency**: Resolved hardcoded colors in history page dashboard and meeting summaries
- **Participant State Management**: Clear participant data when starting new meetings
- **Proper hasSpoken Logic**: Consistent logic using `!== undefined` instead of `> 0` across all components

### 🔧 Technical Improvements
- **ESLint Compliance**: Fixed all ESLint errors for better code quality
- **Vercel Deployment**: Resolved 500 errors and deployment issues
- **CSS Variable System**: Implemented dynamic CSS variables with proper camelCase to kebab-case conversion
- **Theme Context Management**: Added React context for centralized theme state management
- **TypeScript Enhancements**: Improved type safety for theme-related components

### 🎨 Theme System Details
- **Color Palettes**: 10 carefully crafted color schemes with light/dark variants
- **CSS Variables**: Dynamic CSS variable updates for smooth theme transitions
- **Component Coverage**: All components updated to use theme variables
- **Accessibility**: Proper contrast ratios maintained across all themes
- **Visual Consistency**: Unified styling approach across the entire application

### 🌍 Internationalization
- **Complete Translations**: Comprehensive translation support for floating media player
- **Language Switching**: Improved language switching functionality
- **TTS Language Support**: Text-to-speech respects current locale settings

### 📱 UI/UX Enhancements
- **Speaking Modal**: Green start button, theme-aware stop button with overtime indication
- **Meeting Summaries**: Proper theme-aware backgrounds for participant status
- **History Dashboard**: Complete theme integration for all background elements
- **Responsive Design**: Maintained responsiveness across all new features

## [1.0.0] - 2025-01-22

### 🚀 Initial Release
- **Core Scrum Time Management**: Complete meeting time tracking functionality
- **Participant Management**: Add, remove, and manage participant speaking times
- **Meeting Controls**: Start, pause, and end meeting sessions
- **Speaking Queue**: Random participant selection with speaking time tracking
- **Meeting History**: Historical meeting data storage and viewing
- **Time Tracking**: Precise time tracking with overtime detection
- **Meeting Summaries**: Comprehensive meeting reports and statistics
- **Internationalization**: French language support
- **Responsive Design**: Mobile-friendly interface
- **Data Persistence**: Local storage for meeting data
- **Export/Import**: Meeting data export and import functionality

---

### Version Comparison

| Feature | v1.0 | v2.0 |
|---------|------|------|
| Core Meeting Management | ✅ | ✅ |
| Theme System | ❌ | ✅ (10 palettes) |
| Dark Mode | ❌ | ✅ |
| Media Player | ❌ | ✅ |
| TTS Announcements | ❌ | ✅ |
| Theme Persistence | ❌ | ✅ |
| Data Integrity Fixes | ❌ | ✅ |
| Deployment Ready | ❌ | ✅ |

[2.0.0]: https://github.com/ken-raf/scrum-time-management/compare/v1.0...v2.0
[1.0.0]: https://github.com/ken-raf/scrum-time-management/releases/tag/v1.0