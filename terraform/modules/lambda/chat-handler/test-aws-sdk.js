const { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

async function testAwsSdk() {
  console.log('Testing AWS SDK configuration...');
  
  // Create client with profile configuration
  const client = new BedrockAgentRuntimeClient({
    region: 'us-west-2'
    // Let AWS SDK use the profile from environment
  });
  
  const command = new RetrieveAndGenerateCommand({
    input: {
      text: 'What is AWS Lambda?'
    },
    retrieveAndGenerateConfiguration: {
      type: 'KNOWLEDGE_BASE',
      knowledgeBaseConfiguration: {
        knowledgeBaseId: 'PQB7MB5ORO',
        modelArn: 'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0'
      }
    }
  });
  
  try {
    console.log('Sending RetrieveAndGenerate command...');
    const response = await client.send(command);
    console.log('Success!', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error details:', error);
  }
}

testAwsSdk();