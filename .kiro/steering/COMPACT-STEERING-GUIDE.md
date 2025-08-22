---
inclusion: always
---

# Compact Steering Guide - Essential Rules

## 🚨 CRITICAL REQUIREMENTS

### AWS Configuration
- **Region**: MUST use `us-west-2` for ALL resources
- **Profile**: MUST use `--profile aidlc_main` for ALL AWS operations
- **No Exceptions**: Only CloudFront SSL certs can be in us-east-1

### Infrastructure as Code
- **Terraform ONLY**: No CDK, CloudFormation, or other IaC tools
- **MCP Tools Required**: Use `mcp_awslabsterraform_mcp_server_*` tools for all Terraform operations
- **Real AWS Testing**: Never mock AWS services - always test against deployed infrastructure

### Testing Framework
- **Playwright MCP ONLY**: Use `mcp_playwright_browser_*` tools for ALL UI testing
- **PROHIBITED**: React Testing Library, Jest DOM, Cypress, Puppeteer, jsdom
- **Real Environment**: Test against deployed CloudFront URLs, never localhost

### AI Model Requirements
- **Claude Sonnet 4 ONLY**: Model ID `anthropic.claude-sonnet-4-20250514-v1:0`
- **Inference Profile**: Use `arn:aws:bedrock:us-west-2:ACCOUNT_ID:inference-profile/us.anthropic.claude-sonnet-4-20250514-v1:0`
- **NO Fallbacks**: Never use other Claude models or non-Claude models

## 🏗️ ARCHITECTURE PATTERNS

### Bedrock Knowledge Base (Mandatory)
```typescript
// ✅ CORRECT - Use RetrieveAndGenerate API
const response = await bedrockRuntime.retrieveAndGenerate({
  input: { text: question },
  retrieveAndGenerateConfiguration: {
    type: 'KNOWLEDGE_BASE',
    knowledgeBaseConfiguration: {
      knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
      modelArn: `arn:aws:bedrock:${region}:${accountId}:inference-profile/us.anthropic.claude-sonnet-4-20250514-v1:0`
    }
  }
});

// ❌ PROHIBITED - Custom RAG implementation
// Never implement custom document processing, embedding generation, or vector operations
```

### API Gateway Cognito Auth
```typescript
// ✅ CORRECT - Raw JWT token (NO Bearer prefix)
headers: { 'Authorization': token }

// ❌ WRONG - Bearer prefix causes 401 errors
headers: { 'Authorization': `Bearer ${token}` }
```

### CORS Configuration (Complete Pattern)
```hcl
# OPTIONS method - MUST have authorization = "NONE"
resource "aws_api_gateway_method" "options" {
  authorization = "NONE"
}

# Integration responses - MUST include actual header values
resource "aws_api_gateway_integration_response" "options_response" {
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
  }
}
```

## 📋 DEVELOPMENT PROCESS

### Test-Driven Development (Non-Negotiable)
1. **Red**: Write failing test first
2. **Green**: Minimal code to pass test
3. **Refactor**: Improve while keeping tests green
4. **AWS Integration**: Always test against real AWS services

### Task Completion Standards
- ✅ **Complete**: All functionality works on AWS, all tests pass, no errors
- ❌ **Incomplete**: Any errors, failures, or temporary fixes
- **Rule**: Never skip steps or mark incomplete tasks as done

### Code Quality Rules
- **No Temporary Fixes**: Fix root causes, never use workarounds
- **No Mocking**: Test against real AWS services only
- **TypeScript Strict**: Fix all TS errors, never use `any` or `@ts-ignore`
- **Error Handling**: Comprehensive error handling for all AWS operations

## 🧪 TESTING PATTERNS

### Playwright MCP E2E Testing
```typescript
describe('Chat Workflow', () => {
  test('should complete full chat interaction', async () => {
    // Navigate to deployed CloudFront URL
    await mcp_playwright_browser_navigate({ 
      url: 'https://deployed-cloudfront-url.com' 
    });
    
    // Test real user interaction
    await mcp_playwright_browser_type({
      element: 'chat input',
      ref: 'chat-input',
      text: 'Test question'
    });
    
    await mcp_playwright_browser_press_key({ key: 'Enter' });
    
    // Verify real AI response
    await mcp_playwright_browser_wait_for({ time: 10 });
    const snapshot = await mcp_playwright_browser_snapshot();
  });
});
```

### Terraform Testing Pattern
```bash
# Research AWS resources first
mcp_awslabsterraform_mcp_server_SearchAwsProviderDocs(asset_name="aws_lambda_function")

# Validate configuration
mcp_awslabsterraform_mcp_server_ExecuteTerraformCommand(command="validate", working_directory="./terraform")

# Security scan
mcp_awslabsterraform_mcp_server_RunCheckovScan(working_directory="./terraform")

# Deploy to AWS
mcp_awslabsterraform_mcp_server_ExecuteTerraformCommand(command="apply", working_directory="./terraform")
```

## 🚫 PROHIBITED PRACTICES

### Never Do These
- Use localhost or local development servers for testing
- Mock AWS services in tests
- Use Bearer prefix with API Gateway Cognito auth
- Implement custom RAG instead of Bedrock Knowledge Base
- Use non-Terraform IaC tools
- Use non-Playwright UI testing frameworks
- Deploy to regions other than us-west-2
- Use Claude models other than Sonnet 4
- Skip error handling or use temporary fixes
- Mark incomplete tasks as done

### Common Pitfalls
- **CORS Issues**: Missing integration responses or method responses
- **Auth Failures**: Using Bearer prefix instead of raw JWT
- **Model Errors**: Using direct model IDs instead of inference profiles
- **Testing Failures**: Testing against localhost instead of deployed AWS

## 📊 SUCCESS CRITERIA

### Deployment Standards
- All infrastructure deployed via Terraform MCP tools
- All resources in us-west-2 region
- All tests passing against deployed AWS infrastructure
- No temporary fixes or workarounds in code

### Performance Targets
- Chat responses < 10 seconds (95th percentile)
- Document upload and processing < 10 minutes
- API Gateway response times < 2 seconds
- Knowledge Base sync success rate > 95%

### Quality Gates
- TypeScript compilation with zero errors
- All Playwright E2E tests passing
- Checkov security scans passing
- Real AWS integration tests passing

## 🔧 QUICK REFERENCE

### Essential MCP Tools
- `mcp_awslabsterraform_mcp_server_ExecuteTerraformCommand` - All Terraform ops
- `mcp_playwright_browser_navigate` - UI testing navigation
- `mcp_playwright_browser_snapshot` - Element identification
- `mcp_awslabsterraform_mcp_server_SearchAwsProviderDocs` - AWS resource docs

### Key Environment Variables
```bash
AWS_REGION=us-west-2
AWS_PROFILE=aidlc_main
KNOWLEDGE_BASE_ID=<bedrock-kb-id>
COGNITO_USER_POOL_ID=<pool-id>
```

### Critical File Paths
- Terraform: `./terraform/`
- Frontend: `./frontend/src/`
- Lambda: `./terraform/modules/lambda/`
- Tests: `./frontend/tests/` and `./__tests__/`

---

**Remember**: These are non-negotiable requirements. Violations will result in immediate rejection and rework. When in doubt, refer to the full steering documents in their respective directories.