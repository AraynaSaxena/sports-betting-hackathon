# Sports Betting Analytics Platform

A comprehensive sports betting platform with AI-powered assistance and real-time community chat features.

## Features

- 🤖 **AI Sports Assistant**: Powered by Google Gemini API with Cedar-OS framework for intelligent betting advice
- 💬 **Community Chat**: Real-time community chat with interactive polls and reactions
- 📊 **Analytics Dashboard**: Comprehensive betting analytics and insights
- 🏦 **Banking Integration**: Real banking operations via Nessie API
- 🎯 **Betting Polls**: Interactive community polls and predictions
- 📱 **Responsive Design**: Modern, mobile-friendly interface
- 🌲 **Cedar-OS Integration**: AI-native application framework for advanced agentic interfaces

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` (if available)
   - Or create a `.env` file with the required API keys (see API Setup below)

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Setup

The application supports both real APIs and mock fallbacks. For full functionality, configure the following APIs:

### Required APIs

- **Gemini API**: For AI assistant responses
- **Cedar-OS Framework**: For AI-native application features

### Optional APIs

- **Nessie API**: For real banking operations

See [API_SETUP.md](./API_SETUP.md) for detailed setup instructions.

## Testing API Integrations

Run the test script in your browser console to verify API connections:

```javascript
// Import and run the test
import('./src/test-api-integrations.js').then(() => {
  window.testAPIs();
});
```

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder

### `npm run eject`
**Note: This is a one-way operation!** Ejects from Create React App to get full control over configuration

## Fallback Behavior

The application gracefully handles missing API keys:

- **No Gemini API**: AI assistant uses intelligent mock responses
- **No Cedar-OS**: Application runs with standard React components
- **No Nessie API**: Banking features use mock transactions

## Project Structure

```
src/
├── components/          # React components
│   ├── CedarOSAssistant.jsx # Cedar-OS powered AI assistant
│   ├── CedarChat.jsx   # Legacy AI assistant chat
│   ├── CommunityChat.jsx # Community chat with polls
│   └── ...
├── services/           # API integrations
│   ├── cedarClient.jsx # Legacy Cedar client (deprecated)
│   └── nessieclient.jsx # Banking API client
├── community/          # Chat hooks and utilities
└── ...
```

## Learn More

- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React Documentation](https://reactjs.org/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Cedar-OS Documentation](https://docs.cedarcopilot.com/getting-started/hackathon-starter)

## Troubleshooting

### Common Issues

1. **API Connection Errors**: Check your `.env` file and API keys
2. **Cedar-OS Integration Issues**: Verify Cedar-OS framework is properly installed
3. **Build Failures**: Ensure all dependencies are installed with `npm install`

### Getting Help

- Check the browser console for detailed error messages
- Review the API setup guide in `API_SETUP.md`
- Run the API test script to diagnose connection issues
