// Quick test to verify Gemini API is working
async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API with your key...');
  
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'You are a sports betting assistant. Respond with "Gemini API is working!" if you can read this.'
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (aiResponse) {
      console.log('✅ Gemini API test successful!');
      console.log('🤖 AI Response:', aiResponse);
      return true;
    } else {
      console.error('❌ Gemini API test failed: No response generated');
      return false;
    }
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
    return false;
  }
}

// Export for testing
window.testGeminiAPI = testGeminiAPI;

console.log('💡 Run testGeminiAPI() in the browser console to test your Gemini API key');
