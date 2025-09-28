# API Integration Setup Guide

## Required Environment Variables

To use the real APIs instead of mock data, create a `.env` file in the root directory with the following variables:

### Gemini API (AI Assistant)
```
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```
- Get your API key from: https://makersuite.google.com/app/apikey
- This enables the Cedar-OS powered AI sports betting assistant to provide real responses

### Cedar-OS Framework (AI-Native Application Framework)
```
REACT_APP_CEDAR_OS_ENABLED=true
```
- Cedar-OS is a React framework for building AI-native applications
- Documentation: https://docs.cedarcopilot.com/getting-started/hackathon-starter
- This enables advanced AI-native features and agentic interfaces

### Optional: Nessie API (Banking Features)
```
REACT_APP_NESSIE_API_KEY=your_nessie_api_key_here
```
- This enables real banking operations for deposits/withdrawals

## Setup Instructions

1. Create a `.env` file in the project root
2. Add the environment variables above with your actual API keys
3. Restart the development server: `npm start`
4. Check the browser console for connection status messages

## Cedar-OS Integration

Cedar-OS is a React framework specifically designed for building AI-native applications. It provides:

- **Agentic State Access**: Make React state accessible to AI
- **Agentic Actions**: Define how AI can modify your data  
- **Agent Context**: Advanced context management for AI interactions
- **Spells**: Gesture-based interactions and keyboard shortcuts
- **Voice Integration**: Natural voice interactions (Beta)

### Getting Started with Cedar-OS

1. **Install Cedar-OS CLI** (if creating new projects):
   ```bash
   npx cedar-os-cli plant-seed
   ```

2. **Use Cedar-OS Components**: The framework provides pre-built components for AI-native interfaces

3. **Agent Integration**: Connect AI agents to your React state and UI

## Fallback Behavior

- If Gemini API key is missing: AI assistant uses intelligent fallback responses
- If Cedar-OS is disabled: Application runs with standard React components
- If Nessie API key is missing: Banking features use mock transactions

## Testing

The application will log connection status to the browser console:
- ✅ "Cedar-OS AI Assistant ready" - AI assistant active
- 🔧 "Running in fallback mode" - Mock mode active
- 📤 "Sending message to Gemini API" - Real AI responses
- 🤖 "Cedar-OS fallback response" - Mock responses

## Cedar-OS Resources

- **Documentation**: https://docs.cedarcopilot.com/getting-started/hackathon-starter
- **Discord Community**: Join the Cedar-OS Discord for hackathon support
- **GitHub**: https://github.com/cedar-os/cedar-os
- **Mastra Integration**: Cedar-OS works with Mastra for backend AI orchestration
