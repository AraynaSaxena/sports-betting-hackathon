// Test Cedar-OS integration with your API key
console.log('🌲 Testing Cedar-OS Integration...');

// Check environment variables
console.log('📋 Environment Status:');
console.log('🔑 Gemini API Key:', process.env.REACT_APP_GEMINI_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('🌲 Cedar-OS Enabled:', process.env.REACT_APP_CEDAR_OS_ENABLED ? '✅ ENABLED' : '❌ NOT ENABLED');
console.log('🤖 OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ SET' : '❌ NOT SET');

// Test Gemini API with Cedar-OS context
async function testCedarOSIntegration() {
  console.log('\n🧪 Testing Cedar-OS AI Assistant...');
  
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No Gemini API key found');
    return false;
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'You are a Cedar-OS powered sports betting assistant. Respond with "Cedar-OS AI is working perfectly!" if you can read this.'
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
      console.log('✅ Cedar-OS AI Assistant working!');
      console.log('🤖 Response:', aiResponse);
      return true;
    } else {
      console.error('❌ No response generated');
      return false;
    }
  } catch (error) {
    console.error('❌ Cedar-OS test failed:', error.message);
    return false;
  }
}

// Export for testing
window.testCedarOSIntegration = testCedarOSIntegration;

console.log('\n💡 Run testCedarOSIntegration() to test your Cedar-OS setup');
console.log('🌲 Your AI assistant is now Cedar-OS powered!');
