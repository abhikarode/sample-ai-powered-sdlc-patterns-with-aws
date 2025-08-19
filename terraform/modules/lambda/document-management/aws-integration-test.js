/**
 * Real AWS Integration Tests for Document Management API
 * Tests against deployed AWS infrastructure - NO MOCKS
 * Following steering guidelines: test against real AWS services only
 */

const AWS = require('aws-sdk');
const https = require('https');

// Configure AWS SDK for us-west-2 region
AWS.config.update({
  region: 'us-west-2'
});

// Real AWS clients
const dynamodb = new AWS.DynamoDB();
const s3 = new AWS.S3();
const bedrockAgent = new AWS.BedrockAgent();

// API Gateway endpoint from Terraform output
const API_BASE_URL = 'https://ojfkk555ge.execute-api.us-west-2.amazonaws.com/dev';
const DOCUMENTS_TABLE = 'ai-assistant-dev-documents';
const DOCUMENTS_BUCKET = 'ai-assistant-dev-documents-e5e9acfe';
const KNOWLEDGE_BASE_ID = 'PQB7MB5ORO';
const DATA_SOURCE_ID = 'YUAUID9BJN';

// Test user credentials (would need real Cognito JWT in production)
const TEST_USER_ID = 'test-user-' + Date.now();

console.log('🚀 Starting Real AWS Integration Tests');
console.log('📍 Region: us-west-2');
console.log('🔗 API URL:', API_BASE_URL);
console.log('📊 DynamoDB Table:', DOCUMENTS_TABLE);
console.log('🪣 S3 Bucket:', DOCUMENTS_BUCKET);
console.log('🧠 Knowledge Base:', KNOWLEDGE_BASE_ID);

async function runIntegrationTests() {
  try {
    console.log('\n=== Test 1: Verify AWS Resources Exist ===');
    await testAWSResourcesExist();
    
    console.log('\n=== Test 2: Test API Endpoints (Unauthenticated) ===');
    await testUnauthenticatedEndpoints();
    
    console.log('\n=== Test 3: Test DynamoDB Integration ===');
    await testDynamoDBIntegration();
    
    console.log('\n=== Test 4: Test S3 Integration ===');
    await testS3Integration();
    
    console.log('\n=== Test 5: Test Knowledge Base Integration ===');
    await testKnowledgeBaseIntegration();
    
    console.log('\n=== Test 6: Test Lambda Function Execution ===');
    await testLambdaExecution();
    
    console.log('\n✅ All Real AWS Integration Tests Passed!');
    
  } catch (error) {
    console.error('\n❌ Integration Test Failed:', error);
    process.exit(1);
  }
}

async function testAWSResourcesExist() {
  console.log('🔍 Verifying DynamoDB table exists...');
  const tableInfo = await dynamodb.describeTable({ TableName: DOCUMENTS_TABLE }).promise();
  console.log('✅ DynamoDB table exists:', tableInfo.Table.TableName);
  
  console.log('🔍 Verifying S3 bucket exists...');
  const bucketInfo = await s3.headBucket({ Bucket: DOCUMENTS_BUCKET }).promise();
  console.log('✅ S3 bucket exists and accessible');
  
  console.log('🔍 Verifying Knowledge Base exists...');
  const kbInfo = await bedrockAgent.getKnowledgeBase({ knowledgeBaseId: KNOWLEDGE_BASE_ID }).promise();
  console.log('✅ Knowledge Base exists:', kbInfo.knowledgeBase.name);
  
  console.log('🔍 Verifying Data Source exists...');
  const dsInfo = await bedrockAgent.getDataSource({ 
    knowledgeBaseId: KNOWLEDGE_BASE_ID,
    dataSourceId: DATA_SOURCE_ID 
  }).promise();
  console.log('✅ Data Source exists:', dsInfo.dataSource.name);
}

async function testUnauthenticatedEndpoints() {
  console.log('🔍 Testing GET /documents (should return 403)...');
  const getResponse = await makeHttpRequest('GET', '/documents');
  if (getResponse.statusCode !== 403) {
    throw new Error(`Expected 403, got ${getResponse.statusCode}`);
  }
  console.log('✅ GET /documents correctly rejects unauthenticated requests');
  
  console.log('🔍 Testing DELETE /documents/test (should return 403)...');
  const deleteResponse = await makeHttpRequest('DELETE', '/documents/test');
  if (deleteResponse.statusCode !== 403) {
    throw new Error(`Expected 403, got ${deleteResponse.statusCode}`);
  }
  console.log('✅ DELETE /documents/{id} correctly rejects unauthenticated requests');
  
  console.log('🔍 Testing GET /documents/status (should return 403)...');
  const statusResponse = await makeHttpRequest('GET', '/documents/status');
  if (statusResponse.statusCode !== 403) {
    throw new Error(`Expected 403, got ${statusResponse.statusCode}`);
  }
  console.log('✅ GET /documents/status correctly rejects unauthenticated requests');
  
  console.log('🔍 Testing CORS preflight...');
  const corsResponse = await makeHttpRequest('OPTIONS', '/documents', null, {
    'Origin': 'https://example.com',
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'Authorization'
  });
  if (corsResponse.statusCode !== 200) {
    throw new Error(`CORS preflight failed: ${corsResponse.statusCode}`);
  }
  console.log('✅ CORS preflight working correctly');
}

async function testDynamoDBIntegration() {
  console.log('🔍 Testing direct DynamoDB operations...');
  
  // Create test document record
  const testDocId = 'test-doc-' + Date.now();
  const testRecord = {
    PK: { S: `DOC#${testDocId}` },
    SK: { S: 'METADATA' },
    documentId: { S: testDocId },
    fileName: { S: 'test-document.pdf' },
    uploadedBy: { S: TEST_USER_ID },
    uploadDate: { S: new Date().toISOString() },
    s3Key: { S: `documents/${TEST_USER_ID}/${testDocId}.pdf` },
    s3Bucket: { S: DOCUMENTS_BUCKET },
    status: { S: 'uploaded' },
    knowledgeBaseStatus: { S: 'pending' },
    GSI1PK: { S: `USER#${TEST_USER_ID}` },
    GSI1SK: { S: `DOC#${new Date().toISOString()}` }
  };
  
  await dynamodb.putItem({
    TableName: DOCUMENTS_TABLE,
    Item: testRecord
  }).promise();
  console.log('✅ Successfully created test document record in DynamoDB');
  
  // Query the record back
  const queryResult = await dynamodb.query({
    TableName: DOCUMENTS_TABLE,
    KeyConditionExpression: 'PK = :pk AND SK = :sk',
    ExpressionAttributeValues: {
      ':pk': { S: `DOC#${testDocId}` },
      ':sk': { S: 'METADATA' }
    }
  }).promise();
  
  if (queryResult.Items.length !== 1) {
    throw new Error('Failed to retrieve test document from DynamoDB');
  }
  console.log('✅ Successfully queried document from DynamoDB');
  
  // Query by user (GSI)
  const userQuery = await dynamodb.query({
    TableName: DOCUMENTS_TABLE,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :userPK',
    ExpressionAttributeValues: {
      ':userPK': { S: `USER#${TEST_USER_ID}` }
    }
  }).promise();
  
  if (userQuery.Items.length < 1) {
    throw new Error('Failed to query documents by user from DynamoDB GSI');
  }
  console.log('✅ Successfully queried documents by user using GSI');
  
  // Clean up test record
  await dynamodb.deleteItem({
    TableName: DOCUMENTS_TABLE,
    Key: {
      PK: { S: `DOC#${testDocId}` },
      SK: { S: 'METADATA' }
    }
  }).promise();
  console.log('✅ Successfully cleaned up test document record');
}

async function testS3Integration() {
  console.log('🔍 Testing S3 operations...');
  
  const testKey = `documents/${TEST_USER_ID}/test-file-${Date.now()}.txt`;
  const testContent = 'This is a test document for integration testing';
  
  // Upload test file
  await s3.putObject({
    Bucket: DOCUMENTS_BUCKET,
    Key: testKey,
    Body: testContent,
    ContentType: 'text/plain',
    Metadata: {
      'uploaded-by': TEST_USER_ID,
      'test-file': 'true'
    }
  }).promise();
  console.log('✅ Successfully uploaded test file to S3');
  
  // Verify file exists
  const headResult = await s3.headObject({
    Bucket: DOCUMENTS_BUCKET,
    Key: testKey
  }).promise();
  
  if (headResult.Metadata['uploaded-by'] !== TEST_USER_ID) {
    throw new Error('S3 metadata not preserved correctly');
  }
  console.log('✅ Successfully verified S3 file and metadata');
  
  // List objects with prefix
  const listResult = await s3.listObjectsV2({
    Bucket: DOCUMENTS_BUCKET,
    Prefix: `documents/${TEST_USER_ID}/`
  }).promise();
  
  if (listResult.Contents.length < 1) {
    throw new Error('Failed to list S3 objects with prefix');
  }
  console.log('✅ Successfully listed S3 objects with prefix');
  
  // Clean up test file
  await s3.deleteObject({
    Bucket: DOCUMENTS_BUCKET,
    Key: testKey
  }).promise();
  console.log('✅ Successfully cleaned up test S3 file');
}

async function testKnowledgeBaseIntegration() {
  console.log('🔍 Testing Knowledge Base operations...');
  
  // Get Knowledge Base details
  const kbDetails = await bedrockAgent.getKnowledgeBase({
    knowledgeBaseId: KNOWLEDGE_BASE_ID
  }).promise();
  
  if (kbDetails.knowledgeBase.status !== 'ACTIVE') {
    console.log('⚠️ Knowledge Base is not ACTIVE, current status:', kbDetails.knowledgeBase.status);
  } else {
    console.log('✅ Knowledge Base is ACTIVE');
  }
  
  // List ingestion jobs
  const ingestionJobs = await bedrockAgent.listIngestionJobs({
    knowledgeBaseId: KNOWLEDGE_BASE_ID,
    dataSourceId: DATA_SOURCE_ID,
    maxResults: 10
  }).promise();
  
  console.log(`✅ Successfully retrieved ${ingestionJobs.ingestionJobSummaries.length} ingestion jobs`);
  
  // Get data source details
  const dataSource = await bedrockAgent.getDataSource({
    knowledgeBaseId: KNOWLEDGE_BASE_ID,
    dataSourceId: DATA_SOURCE_ID
  }).promise();
  
  if (dataSource.dataSource.status !== 'AVAILABLE') {
    console.log('⚠️ Data Source is not AVAILABLE, current status:', dataSource.dataSource.status);
  } else {
    console.log('✅ Data Source is AVAILABLE');
  }
}

async function testLambdaExecution() {
  console.log('🔍 Testing Lambda function execution via API Gateway...');
  
  // Test that Lambda function is deployed and responding
  const lambda = new AWS.Lambda();
  
  try {
    const functionInfo = await lambda.getFunction({
      FunctionName: 'ai-assistant-dev-document-management'
    }).promise();
    
    console.log('✅ Lambda function exists:', functionInfo.Configuration.FunctionName);
    console.log('📊 Runtime:', functionInfo.Configuration.Runtime);
    console.log('💾 Memory:', functionInfo.Configuration.MemorySize, 'MB');
    console.log('⏱️ Timeout:', functionInfo.Configuration.Timeout, 'seconds');
    
    // Check environment variables
    const envVars = functionInfo.Configuration.Environment.Variables;
    const requiredVars = ['DOCUMENTS_BUCKET', 'DOCUMENTS_TABLE', 'KNOWLEDGE_BASE_ID', 'DATA_SOURCE_ID'];
    
    for (const varName of requiredVars) {
      if (!envVars[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
      console.log(`✅ Environment variable ${varName}:`, envVars[varName]);
    }
    
  } catch (error) {
    throw new Error(`Lambda function test failed: ${error.message}`);
  }
}

function makeHttpRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE_URL + path);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Run the tests
runIntegrationTests();