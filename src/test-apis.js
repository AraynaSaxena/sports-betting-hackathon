// Test script to verify API integrations
import { Nessie } from './services/nessieclient';

async function testNessieAPI() {
  console.log('🧪 Testing Nessie API integration...');
  
  try {
    // Test customer creation
    const customer = await Nessie.createOrGetCustomer('test@hackathon.com', 'Test', 'User');
    console.log('✅ Customer created:', customer);
    
    // Test account creation
    const account = await Nessie.createOrGetAccount(customer._id);
    console.log('✅ Account created:', account);
    
    // Test deposit
    await Nessie.deposit(account._id, 100, 'Test deposit');
    console.log('✅ Deposit successful');
    
    // Test withdrawal
    await Nessie.withdraw(account._id, 50, 'Test withdrawal');
    console.log('✅ Withdrawal successful');
    
    // Test account balance
    const updatedAccount = await Nessie.getAccount(account._id);
    console.log('✅ Final balance:', updatedAccount.balance);
    
    console.log('🎉 All Nessie API tests passed!');
  } catch (error) {
    console.error('❌ Nessie API test failed:', error);
  }
}

// Run the test
testNessieAPI();
