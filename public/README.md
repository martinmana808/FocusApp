# Feed My Brain - Modular Architecture

This application has been refactored into a modular architecture for better maintainability and easier editing.

## File Structure

```
public/
├── main.js          # Main application entry point
├── config.js        # Configuration constants
├── auth.js          # Authentication logic
├── player.js        # Video player modal
├── videoList.js     # Video list component
├── utils.js         # Utility functions
└── index.html       # Main HTML file
```

## Components Overview

### 1. **config.js** - Configuration
- Contains all configuration constants
- Easy to modify settings like Auth0 credentials, API endpoints, and UI selectors
- Centralized configuration management

### 2. **auth.js** - Authentication
- Handles Auth0 authentication flow
- Manages login/logout functionality
- Provides user state management
- **Easy to modify**: Change authentication behavior, add new auth features

### 3. **player.js** - Video Player
- Manages the YouTube video modal
- Handles video playback and modal interactions
- **Easy to modify**: Change player behavior, add new video sources, modify modal styling

### 4. **videoList.js** - Video List Component
- Handles fetching and displaying video data
- Manages video card rendering
- Handles "mark as watched" functionality
- **Easy to modify**: Change video card layout, add new video properties, modify data fetching

### 5. **utils.js** - Utility Functions
- Contains reusable helper functions
- Time formatting, ID cleaning, etc.
- **Easy to modify**: Add new utility functions, modify existing ones

### 6. **main.js** - Application Orchestrator
- Coordinates all components
- Manages application lifecycle
- Handles UI state management
- **Easy to modify**: Change app flow, add new features, modify component interactions

## How to Edit Components

### To modify video cards:
Edit `videoList.js` → `renderVideoCard()` method

### To change authentication behavior:
Edit `auth.js` → Modify AuthManager class methods

### To update video player:
Edit `player.js` → Modify VideoPlayer class methods

### To add new utility functions:
Edit `utils.js` → Add new exported functions

### To change configuration:
Edit `config.js` → Modify CONFIG object

### To change app flow:
Edit `main.js` → Modify App class methods

## Benefits of This Architecture

1. **Separation of Concerns**: Each file has a single responsibility
2. **Easy Maintenance**: Find and modify specific functionality quickly
3. **Reusability**: Components can be easily reused or modified
4. **Testability**: Each component can be tested independently
5. **Scalability**: Easy to add new features without affecting existing code

## Adding New Features

1. **New UI Component**: Create a new `.js` file for the component
2. **New Utility**: Add to `utils.js`
3. **New Configuration**: Add to `config.js`
4. **Integration**: Import and use in `main.js`

This modular structure makes the codebase much more maintainable and easier to work with! 
