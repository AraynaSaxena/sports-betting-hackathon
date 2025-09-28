import React from 'react';
import { CedarCopilot } from 'cedar-os';

// Cedar OS Provider Component
export default function CedarProvider({ children }) {
  return (
    <CedarCopilot
      llmProvider={{
        provider: 'openai',
        apiKey: process.env.REACT_APP_OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      }}
    >
      {children}
    </CedarCopilot>
  );
}
