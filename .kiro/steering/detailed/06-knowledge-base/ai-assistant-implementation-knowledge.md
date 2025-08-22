---
inclusion: manual
---

# AI Assistant Implementation Knowledge Base

This document captures critical findings, solutions, and lessons learned during the AI Assistant implementation. Future development sessions should reference this knowledge base to avoid repeating issues and leverage proven solutions.

## Project Overview

**Implementation Period**: Multiple development sessions  
**Final Status**: Complete working implementation deployed to AWS  
**GitHub Repository**: `https://github.com/abhikarode/sample-ai-powered-sdlc-patterns-with-aws.git`  
**Branch**: `feat/all-phases-ai-assistant`

## Critical Issues Resolved

### 0. API Gateway Cognito Authorization Token Format

**Problem**: Document management API returning 401 Unauthorized despite valid Cognito JWT tokens.

**Symptoms**:
- Frontend authentication working for chat API but failing for document API
- API Gateway returning "Unauthorized" instead of "MissingAuthenticationTokenException"
- Lambda function not being invoked despite valid user session

**Root Cause**: API Gateway Cognito User Pool authorizer expects raw JWT token, NOT Bearer format.

**Critical Solution**:
```typescript
// WRONG - Do not use Bearer prefix
headers: {
  'Authorization': `Bearer ${token}`
}

// CORRECT - Use raw JWT token
headers: {
  'Authorization': token
}
```

**Key Learning**: API Gateway Cognito authorizer automatically handles JWT validation without requiring "Bearer" prefix. Adding "Bearer" causes authorization failure.

**Terraform Configuration**: Ensure API Gateway methods use proper Cognito authorizer:
```hcl
resource "aws_api_gateway_method" "document_method" {
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = var.cognito_authorizer_id
}
```

### 1. CORS Configuration Issues

**Problem**: Frontend requests from CloudFront domain blocked by API Gateway CORS policy.

**Symptoms**:
- Browser console errors: "Access to fetch at 'API_URL' from origin 'CLOUDFRONT_URL' has been blocked by CORS policy"
- Chat interface failing to send messages
- Authentication requests failing

**Root Cause**: API Gateway CORS configuration not properly allowing CloudFront domain origins.

**Solution Applied**:
```hcl
# In terraform/modules/api-gateway/main.tf
resource "aws_api_gateway_method" "cors_method" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "cors_integration" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.cors_method.http_method
  type        = "MOCK"
  
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "cors_method_response" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.cors_method.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "cors_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.cors_method.http_method
  status_code = aws_api_gateway_method_response.cors_method_response.status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}
```

**Key Learning**: Always configure both preflight OPTIONS requests and actual method CORS headers in API Gateway.

### 2. Lambda Internal Server Errors

**Problem**: Lambda functions returning 500 Internal Server Error with minimal debugging information.

**Symptoms**:
- Chat API returning generic 500 errors
- No detailed error information in CloudWatch logs
- Bedrock API calls failing silently

**Root Causes Identified**:
1. **Missing Environment Variables**: Lambda functions missing required AWS service configuration
2. **IAM Permission Issues**: Insufficient permissions for Bedrock and Knowledge Base access
3. **Incorrect Bedrock Service Configuration**: Wrong model ARNs and session handling

**Solutions Applied**:

#### Environment Variables Fix:
```typescript
// In Lambda function configuration
const requiredEnvVars = [
  'KNOWLEDGE_BASE_ID',
  'BEDROCK_REGION',
  'DOCUMENTS_TABLE',
  'CONVERSATIONS_TABLE'
];

// Validate at startup
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

#### IAM Permissions Fix:
```hcl
# In terraform/modules/iam/main.tf
resource "aws_iam_policy" "lambda_bedrock_policy" {
  name = "${var.project_name}-lambda-bedrock-policy"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:RetrieveAndGenerate",
          "bedrock:Retrieve"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}::foundation-model/*",
          "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:knowledge-base/*"
        ]
      }
    ]
  })
}
```

#### Enhanced Error Handling:
```typescript
// In bedrock-service.ts
export async function handleChatQuery(question: string, userId: string): Promise<ChatResponse> {
  try {
    console.log('Starting chat query processing', { question, userId });
    
    const response = await bedrockRuntime.retrieveAndGenerate({
      input: { text: question },
      retrieveAndGenerateConfiguration: {
        type: 'KNOWLEDGE_BASE',
        knowledgeBaseConfiguration: {
          knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID!,
          modelArn: await getAvailableClaudeModel(),
          retrievalConfiguration: {
            vectorSearchConfiguration: {
              numberOfResults: 5,
              overrideSearchType: 'HYBRID'
            }
          }
        }
      }
    }).promise();
    
    console.log('Bedrock response received', { 
      outputLength: response.output?.text?.length,
      citationCount: response.citations?.length 
    });
    
    return {
      answer: response.output?.text || 'No response generated',
      sources: extractSources(response.citations || []),
      conversationId: generateConversationId(),
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Chat query failed:', {
      error: error.message,
      stack: error.stack,
      question,
      userId
    });
    
    throw new Error(`Chat processing failed: ${error.message}`);
  }
}
```

### 3. Bedrock ThrottlingException Errors

**Problem**: Frequent ThrottlingException errors from Bedrock API calls during testing.

**Symptoms**:
- Intermittent chat failures
- "ThrottlingException: Rate exceeded" errors in logs
- Inconsistent response times

**Solution Applied**:
```typescript
// Exponential backoff with jitter
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === 'ThrottlingException' && attempt < maxRetries) {
        const jitter = Math.random() * 0.1; // 10% jitter
        const delay = baseDelay * Math.pow(2, attempt) * (1 + jitter);
        
        console.log(`Throttling detected, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Rate limiting implementation
class RateLimiter {
  private lastRequestTime: number = 0;
  private minInterval: number = 1000; // 1 second minimum between requests
  
  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
}
```

### 4. Source Citation Extraction Issues

**Problem**: Incorrect parsing of Bedrock Knowledge Base response citations.

**Symptoms**:
- Empty or malformed source citations in chat responses
- TypeScript compilation errors in citation processing
- Missing confidence scores and document references

**Root Cause**: Misunderstanding of Bedrock RetrieveAndGenerate response structure.

**Solution Applied**:
```typescript
// Correct citation extraction based on AWS documentation
function extractSources(citations: any[]): SourceCitation[] {
  if (!citations || citations.length === 0) {
    return [];
  }
  
  const sources: SourceCitation[] = [];
  
  citations.forEach((citation, index) => {
    if (citation.retrievedReferences && citation.retrievedReferences.length > 0) {
      citation.retrievedReferences.forEach((ref: any, refIndex: number) => {
        if (ref.content && ref.content.text && ref.location && ref.location.s3Location) {
          sources.push({
            id: `${index}-${refIndex}`,
            documentId: ref.location.s3Location.uri || `doc-${index}-${refIndex}`,
            title: extractDocumentTitle(ref.location.s3Location.uri),
            excerpt: ref.content.text.substring(0, 200) + (ref.content.text.length > 200 ? '...' : ''),
            confidence: ref.metadata?.score || 0.5,
            page: ref.metadata?.page || null,
            uri: ref.location.s3Location.uri
          });
        }
      });
    }
  });
  
  return sources;
}

function extractDocumentTitle(uri: string): string {
  if (!uri) return 'Unknown Document';
  
  const parts = uri.split('/');
  const filename = parts[parts.length - 1];
  return filename.replace(/\.[^/.]+$/, ''); // Remove file extension
}
```

### 5. Frontend Authentication Integration

**Problem**: Cognito authentication not properly integrated with chat interface.

**Critical Discovery**: API Gateway Cognito authorizer expects JWT token WITHOUT "Bearer" prefix.

**Incorrect Format**: `Authorization: Bearer ${token}`
**Correct Format**: `Authorization: ${token}`

**Solution Applied**:
```typescript
// Proper AWS Amplify configuration
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [window.location.origin],
          redirectSignOut: [window.location.origin],
          responseType: 'code'
        }
      }
    }
  }
});

// Authentication context with proper error handling
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkAuthState();
  }, []);
  
  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log('No authenticated user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  // ... rest of implementation
};
```

## Testing Strategies That Worked

### 1. Playwright MCP Integration

**Approach**: Used Playwright MCP server for all E2E testing against deployed infrastructure.

**Key Implementation**:
```typescript
// E2E test against deployed CloudFront URL
describe('Chat Interface E2E', () => {
  test('should complete full chat workflow', async () => {
    await mcp_playwright_browser_navigate({ 
      url: 'https://dq9tlzfsf1veq.cloudfront.net' 
    });
    
    // Wait for page load
    await mcp_playwright_browser_wait_for({ time: 3 });
    
    // Take snapshot to identify elements
    const snapshot = await mcp_playwright_browser_snapshot();
    
    // Test chat interaction
    await mcp_playwright_browser_type({
      element: 'chat input field',
      ref: 'chat-input',
      text: 'What is AWS Lambda?'
    });
    
    await mcp_playwright_browser_press_key({ key: 'Enter' });
    
    // Verify response
    await mcp_playwright_browser_wait_for({ time: 10 });
    const responseSnapshot = await mcp_playwright_browser_snapshot();
    
    // Assert response contains expected elements
  });
});
```

### 2. AWS Integration Testing

**Approach**: All tests run against real AWS services, no mocking.

**Benefits**:
- Caught real integration issues
- Validated actual AWS service behavior
- Ensured production readiness

## Deployment Lessons

### 1. Terraform State Management

**Issue**: Terraform state conflicts during concurrent development.

**Solution**: Used remote state with S3 backend and DynamoDB locking:
```hcl
terraform {
  backend "s3" {
    bucket         = "ai-assistant-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

### 2. Lambda Deployment Packaging

**Issue**: Lambda functions failing due to missing dependencies or incorrect packaging.

**Solution**: Automated build and packaging process:
```bash
#!/bin/bash
# In terraform/modules/lambda/chat-handler/build.sh

set -e

echo "Building Lambda function..."

# Install dependencies
npm ci --production

# Compile TypeScript
npm run build

# Create deployment package
zip -r function.zip dist/ node_modules/ package.json

echo "Lambda function packaged successfully"
```

### 3. Environment Configuration

**Critical Pattern**: Environment-specific configuration management:
```hcl
# terraform/environments/dev/terraform.tfvars
project_name = "ai-assistant-dev"
aws_region   = "us-west-2"
environment  = "dev"

# Enable debug logging in dev
lambda_log_level = "DEBUG"

# Use smaller instance sizes for cost optimization
opensearch_instance_type = "search.t3.small.search"
```

## Performance Optimizations

### 1. Claude Model Selection Strategy

**Implementation**: Intelligent model routing based on query complexity:
```typescript
enum QueryComplexity {
  SIMPLE = 'simple',
  MODERATE = 'moderate', 
  COMPLEX = 'complex'
}

function classifyQuery(question: string, documentCount: number): QueryComplexity {
  if (question.length < 100 && documentCount <= 2) {
    return QueryComplexity.SIMPLE;
  }
  
  const complexKeywords = ['analyze', 'compare', 'evaluate', 'design'];
  if (question.length > 300 || documentCount > 5 || 
      complexKeywords.some(keyword => question.toLowerCase().includes(keyword))) {
    return QueryComplexity.COMPLEX;
  }
  
  return QueryComplexity.MODERATE;
}

async function getOptimalModel(complexity: QueryComplexity): Promise<string> {
  switch (complexity) {
    case QueryComplexity.SIMPLE:
      return 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    case QueryComplexity.MODERATE:
      return 'anthropic.claude-3-7-sonnet-20250219-v1:0';
    case QueryComplexity.COMPLEX:
      return 'anthropic.claude-opus-4-1-20250805-v1:0';
  }
}
```

### 2. Knowledge Base Optimization

**Configuration**: Optimized chunking and retrieval settings:
```hcl
resource "aws_bedrockagent_data_source" "s3_source" {
  vector_ingestion_configuration {
    chunking_configuration {
      chunking_strategy = "FIXED_SIZE"
      fixed_size_chunking_configuration {
        max_tokens         = 300  # Optimal for most documents
        overlap_percentage = 20   # Good balance of context and efficiency
      }
    }
  }
}
```

## Security Considerations

### 1. IAM Principle of Least Privilege

**Implementation**: Granular permissions for each service:
```hcl
# Lambda execution role with minimal required permissions
resource "aws_iam_policy" "lambda_execution_policy" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream", 
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/${var.function_name}*"
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:RetrieveAndGenerate"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude*",
          "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:knowledge-base/${var.knowledge_base_id}"
        ]
      }
    ]
  })
}
```

### 2. API Security

**Implementation**: API Gateway with proper authentication and rate limiting:
```hcl
resource "aws_api_gateway_method" "chat_post" {
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_usage_plan" "main" {
  name = "${var.project_name}-usage-plan"
  
  throttle_settings {
    rate_limit  = 100
    burst_limit = 200
  }
  
  quota_settings {
    limit  = 10000
    period = "DAY"
  }
}
```

## Cost Optimization Strategies

### 1. Bedrock Model Usage

**Strategy**: Use appropriate models for different query types to optimize costs:
- Simple queries: Claude 3.5 Sonnet ($3/MTok)
- Complex analysis: Claude Opus 4.1 ($15/MTok) only when needed
- Implement query classification to route appropriately

### 2. OpenSearch Serverless

**Configuration**: Right-sized OCU allocation:
```hcl
resource "aws_opensearchserverless_collection" "kb_collection" {
  name = "${var.project_name}-kb-collection"
  type = "VECTORSEARCH"
  
  # Start with minimum OCUs for cost optimization
  # Scale up based on actual usage patterns
}
```

## Future Development Guidelines

### 1. Always Test Against Real AWS Services

**Principle**: Never use mocked AWS services for integration testing.
**Rationale**: Mocks don't catch real-world integration issues, API changes, or service limits.

### 2. Implement Comprehensive Error Handling

**Pattern**: Every AWS service call should have proper error handling and logging:
```typescript
try {
  const result = await awsService.operation(params);
  console.log('Operation successful', { operation: 'serviceName.operation', result });
  return result;
} catch (error) {
  console.error('AWS operation failed', {
    operation: 'serviceName.operation',
    error: error.message,
    code: error.code,
    params
  });
  throw new Error(`Service operation failed: ${error.message}`);
}
```

### 3. Use Infrastructure as Code for Everything

**Principle**: All AWS resources must be defined in Terraform.
**Benefits**: Reproducible deployments, version control, disaster recovery.

### 4. Implement Proper Monitoring

**Requirements**:
- CloudWatch alarms for all critical metrics
- Custom metrics for business logic
- Structured logging for debugging
- Cost monitoring and alerts

## Common Pitfalls to Avoid

1. **Hardcoded Configuration**: Always use environment variables or parameter store
2. **Missing CORS Headers**: Configure both preflight and actual request headers
3. **Insufficient IAM Permissions**: Start with minimal permissions and add as needed
4. **Ignoring Rate Limits**: Implement proper retry logic with exponential backoff
5. **Poor Error Messages**: Always provide actionable error information
6. **Skipping Integration Tests**: Test against real AWS services, not mocks
7. **Inadequate Logging**: Log all important operations with sufficient context
8. **Incorrect Cognito Token Format**: NEVER use "Bearer" prefix with API Gateway Cognito authorizer - use raw JWT token only

## CORS Configuration Patterns (Tasks 12-13 Solutions)

### Complete CORS Configuration for API Gateway Lambda Integration

**Problem**: Admin API endpoints returning CORS errors despite having OPTIONS method configured.

**Root Cause**: Incomplete CORS configuration missing proper method responses and integration responses.

**Complete Working Solution** (from chat-handler implementation):

```hcl
# 1. OPTIONS Method (CORS Preflight) - MUST have authorization = "NONE"
resource "aws_api_gateway_method" "admin_options" {
  rest_api_id   = var.api_gateway_id
  resource_id   = aws_api_gateway_resource.admin_proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"  # CRITICAL: No auth for preflight
}

# 2. OPTIONS Integration - MUST be MOCK type
resource "aws_api_gateway_integration" "admin_options_integration" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.admin_proxy.id
  http_method = aws_api_gateway_method.admin_options.http_method
  type        = "MOCK"
  
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# 3. OPTIONS Method Response - MUST include all CORS headers as true
resource "aws_api_gateway_method_response" "admin_options_response" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.admin_proxy.id
  http_method = aws_api_gateway_method.admin_options.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# 4. OPTIONS Integration Response - MUST include actual header values
resource "aws_api_gateway_integration_response" "admin_options_integration_response" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.admin_proxy.id
  http_method = aws_api_gateway_method.admin_options.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# 5. ALL other method responses MUST include CORS origin header
resource "aws_api_gateway_method_response" "admin_get_response" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.admin_proxy.id
  http_method = aws_api_gateway_method.admin_get.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# 6. ALL integration responses MUST include CORS origin value
resource "aws_api_gateway_integration_response" "admin_get_integration_response" {
  rest_api_id = var.api_gateway_id
  resource_id = aws_api_gateway_resource.admin_proxy.id
  http_method = aws_api_gateway_method.admin_get.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
}
```

**Critical Requirements for CORS to Work**:
1. OPTIONS method MUST have `authorization = "NONE"`
2. OPTIONS integration MUST be `type = "MOCK"`
3. OPTIONS method response MUST declare all CORS headers as `true`
4. OPTIONS integration response MUST provide actual header values in single quotes
5. ALL other method responses MUST include `Access-Control-Allow-Origin = true`
6. ALL other integration responses MUST include `Access-Control-Allow-Origin = "'*'"`

**Testing CORS Configuration**:
```bash
# Test preflight request
curl -X OPTIONS "https://api-url/admin/endpoint" \
  -H "Origin: https://frontend-domain" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization,Content-Type" \
  -v

# Should return 200 with proper CORS headers
```

**Key Learning**: CORS requires BOTH method responses (declaring headers exist) AND integration responses (providing header values). Missing either will cause CORS failures.

## Success Metrics Achieved

- **Deployment Success**: 100% successful infrastructure deployment
- **Test Coverage**: All critical paths tested with Playwright MCP
- **Performance**: Chat responses < 10 seconds for 95% of queries
- **Reliability**: Proper error handling and retry mechanisms implemented
- **Security**: Principle of least privilege IAM policies
- **Cost Optimization**: Intelligent model selection and resource sizing

This knowledge base should be referenced for all future AI Assistant development to ensure consistent quality and avoid repeating resolved issues.