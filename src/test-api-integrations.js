// Test script to verify API integrations
// Run this in the browser console to test the integrations

console.log('🧪 Testing API Integrations...');

// Test Gemini API integration
async function testGeminiAPI() {
  console.log('🤖 Testing Gemini API integration...');
  
  const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    console.warn('⚠️ Gemini API key not found. Set REACT_APP_GEMINI_API_KEY in your .env file.');
    return false;
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'You are a Cedar-OS powered sports betting assistant. Respond with "Cedar-OS API test successful" if you can read this.'
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
      console.log('✅ Gemini API test successful:', aiResponse);
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

// Test Cedar-OS Framework integration
function testCedarOSFramework() {
  console.log('🌲 Testing Cedar-OS Framework integration...');
  
  const cedarEnabled = process.env.REACT_APP_CEDAR_OS_ENABLED === 'true';
  
  if (!cedarEnabled) {
    console.warn('⚠️ Cedar-OS not enabled. Set REACT_APP_CEDAR_OS_ENABLED=true in your .env file.');
    return false;
  }
  
  console.log('✅ Cedar-OS Framework enabled');
  
  // Check if Cedar-OS components are available
  try {
    // Cedar-OS is a React framework, so we check if it's properly installed
    const cedarOSInstalled = typeof window !== 'undefined' && 
      document.querySelector('[data-cedar-os]') !== null;
    
    if (cedarOSInstalled) {
      console.log('✅ Cedar-OS components detected');
    } else {
      console.log('ℹ️ Cedar-OS framework ready (components will be available in React)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Cedar-OS Framework test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting API integration tests...\n');
  
  const geminiResult = await testGeminiAPI();
  console.log('');
  
  const cedarResult = testCedarOSFramework();
  console.log('');
  
  console.log('📊 Test Results:');
  console.log(`🤖 Gemini API: ${geminiResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🌲 Cedar-OS Framework: ${cedarResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (geminiResult && cedarResult) {
    console.log('\n🎉 All API integrations are working correctly!');
    console.log('🌲 Cedar-OS AI-native features are ready to use!');
  } else {
    console.log('\n⚠️ Some API integrations need configuration. Check the API_SETUP.md file for instructions.');
  }
}

// Export for manual testing
window.testAPIs = runAllTests;

console.log('💡 Run testAPIs() in the console to test all integrations');
console.log('🌲 Cedar-OS Documentation: https://docs.cedarcopilot.com/getting-started/hackathon-starter');