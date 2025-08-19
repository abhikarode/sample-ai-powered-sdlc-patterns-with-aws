---
inclusion: always
---

# Test-Driven Development (TDD) - Fundamental Tenet

## Core Principle

**Test-Driven Development is our fundamental development approach.** Every feature, function, and component must be developed using TDD principles.

## TDD Cycle

### Red-Green-Refactor
1. **Red**: Write a failing test first
2. **Green**: Write the minimum code to make the test pass
3. **Refactor**: Improve the code while keeping tests green

### Implementation Order
1. Write the test that describes the desired behavior
2. Run the test and verify it fails (Red)
3. Write the simplest code that makes the test pass (Green)
4. Refactor the code for quality while maintaining test coverage
5. Repeat for the next piece of functionality

## TDD on AWS Infrastructure

### Infrastructure Testing
- Write Terraform tests before creating infrastructure
- Use Terraform plan to validate infrastructure changes
- Test infrastructure deployment in isolated environments
- Validate resource creation and configuration

### Bedrock Knowledge Base TDD
- Test Knowledge Base creation and configuration first
- Validate data source synchronization with S3
- Test document ingestion and indexing workflows
- Verify RetrieveAndGenerate API integration before building chat features

### Lambda Function TDD with Bedrock Knowledge Base
```typescript
// 1. Write the test first
describe('DocumentUploadHandler', () => {
  test('should upload document to S3 and trigger Knowledge Base sync', async () => {
    const result = await uploadDocument('sample.pdf', mockUploadEvent);
    expect(result.status).toBe('uploaded');
    expect(result.knowledgeBaseSyncTriggered).toBe(true);
  });
});

describe('ChatHandler', () => {
  test('should use RetrieveAndGenerate API for contextual responses', async () => {
    const response = await handleChatQuery('What is in the uploaded document?');
    expect(response.answer).toBeDefined();
    expect(response.sources).toBeArray();
    expect(response.sources[0].documentId).toBeDefined();
  });
});

// 2. Implement the functions to make tests pass
export async function uploadDocument(fileName: string, event: UploadEvent) {
  // Minimal implementation to pass test
}

export async function handleChatQuery(question: string) {
  // Use Bedrock RetrieveAndGenerate API
}

// 3. Refactor and improve
```

### API Endpoint TDD
```typescript
// 1. Test the API behavior first
describe('Chat API', () => {
  test('POST /chat/ask should return AI response with sources', async () => {
    const response = await request(app)
      .post('/chat/ask')
      .send({ question: 'What is AWS Lambda?' })
      .expect(200);
    
    expect(response.body.answer).toBeDefined();
    expect(response.body.sources).toBeArray();
  });
});

// 2. Implement the endpoint
// 3. Refactor for quality
```

## TDD with Real AWS Services

### No Mocking of AWS Services
- **CRITICAL**: Always test against real AWS services, never mock AWS APIs
- Use dedicated test AWS accounts or isolated environments
- Test with actual S3 buckets, DynamoDB tables, Lambda functions
- Validate real Bedrock Knowledge Base integration

### Test Environment Management
- Create isolated test environments for each test run
- Use unique resource names with timestamps or UUIDs
- Clean up test resources after test completion
- Maintain separate test data sets

### Integration Testing TDD
```typescript
describe('Document Upload Integration', () => {
  beforeEach(async () => {
    // Set up real AWS resources for testing
    await createTestS3Bucket();
    await createTestDynamoDBTable();
    await deployTestLambdaFunction();
  });

  test('should upload document to S3 and trigger processing', async () => {
    // Test against real AWS services
    const uploadResult = await uploadToS3(testDocument);
    const processingResult = await waitForProcessing(uploadResult.key);
    
    expect(processingResult.status).toBe('completed');
  });

  afterEach(async () => {
    // Clean up real AWS resources
    await cleanupTestResources();
  });
});
```

## Frontend TDD with Playwright MCP

### Component Testing
```typescript
describe('Chat Interface', () => {
  test('should send message and display response', async () => {
    // Navigate to deployed application
    await mcp_playwright_browser_navigate({ 
      url: 'https://deployed-app-url.com' 
    });
    
    // Test real user interaction
    await mcp_playwright_browser_type({
      element: 'message input',
      ref: 'chat-input',
      text: 'Test question'
    });
    
    await mcp_playwright_browser_click({
      element: 'send button',
      ref: 'send-btn'
    });
    
    // Verify real response from backend
    const response = await mcp_playwright_browser_snapshot();
    // Assert response contains expected elements
  });
});
```

## TDD Benefits for AWS Development

### Quality Assurance
- Ensures all code works with real AWS services
- Catches integration issues early
- Validates error handling and edge cases
- Provides regression protection

### Documentation
- Tests serve as living documentation
- Examples of how to use each function/API
- Clear specification of expected behavior
- Integration patterns and best practices

### Confidence
- Safe refactoring with test coverage
- Reliable deployments to production
- Predictable behavior under load
- Reduced debugging time

## TDD Enforcement

### Code Review Requirements
- All code must have corresponding tests
- Tests must run against real AWS infrastructure
- No code merges without passing tests
- Test coverage must be maintained

### CI/CD Integration
- All tests must pass before deployment
- Automated test execution on every commit
- Integration tests run against staging environment
- Performance tests validate response times

### Quality Gates
- Minimum test coverage thresholds
- All critical paths must be tested
- Error scenarios must be covered
- Performance benchmarks must be met

## TDD Anti-Patterns to Avoid

### Prohibited Practices
- Writing tests after implementation
- Mocking AWS services instead of testing real integration
- Skipping tests for "simple" functions
- Writing tests that don't actually test behavior
- Ignoring failing tests or marking them as "flaky"

### Common Mistakes
- Testing implementation details instead of behavior
- Writing overly complex tests that are hard to maintain
- Not testing error conditions and edge cases
- Coupling tests too tightly to specific implementations

## Success Metrics

### Test Quality Indicators
- All tests pass consistently
- Tests run quickly (< 30 seconds for unit tests)
- Integration tests complete within reasonable time (< 5 minutes)
- High test coverage (> 90% for critical paths)
- Tests catch regressions before production

### Development Velocity
- Faster debugging with clear test failures
- Confident refactoring with test safety net
- Reduced production bugs and hotfixes
- Predictable development timelines

**Remember: If it's not tested, it's not done. TDD is not optional - it's how we build reliable, maintainable software on AWS.**