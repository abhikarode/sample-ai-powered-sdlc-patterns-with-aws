// Simple Node.js test to verify AWS Cognito authentication
const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ 
  region: 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const userPoolId = 'us-west-2_tsucnmtVS';
const testEmail = 'test@example.com';
const testPassword = 'TempPassword123!';

async function testCognitoSetup() {
  try {
    console.log('Testing Cognito User Pool setup...');
    console.log('User Pool ID:', userPoolId);
    
    // Try to create a test user
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: testEmail,
      UserAttributes: [
        {
          Name: 'email',
          Value: testEmail
        },
        {
          Name: 'email_verified',
          Value: 'true'
        },
        {
          Name: 'custom:role',
          Value: 'user'
        }
      ],
      TemporaryPassword: testPassword,
      MessageAction: 'SUPPRESS'
    });
    
    const createResult = await client.send(createUserCommand);
    console.log('✅ Test user created successfully:', createResult.User.Username);
    
    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: testEmail,
      Password: testPassword,
      Permanent: true
    });
    
    await client.send(setPasswordCommand);
    console.log('✅ Test user password set successfully');
    
    console.log('\n🎉 Cognito setup is working correctly!');
    console.log('Test credentials:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    
  } catch (error) {
    if (error.name === 'UsernameExistsException') {
      console.log('✅ Test user already exists - Cognito is working');
      console.log('Test credentials:');
      console.log('Email:', testEmail);
      console.log('Password:', testPassword);
    } else {
      console.error('❌ Error testing Cognito:', error.message);
      console.error('Error name:', error.name);
    }
  }
}

testCognitoSetup();