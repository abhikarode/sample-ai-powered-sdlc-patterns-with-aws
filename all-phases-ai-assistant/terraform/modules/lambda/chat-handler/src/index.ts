import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BedrockService } from './bedrock-service';
import { BedrockError, ChatRequest } from './types';
import { validateChatRequest } from './validation';

const bedrockService = new BedrockService();

// Security headers for all responses
const SECURITY_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://diaxl2ky359mj.cloudfront.net',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// Enhanced error response function
function createErrorResponse(
  statusCode: number,
  message: string,
  requestId: string,
  code?: string
): APIGatewayProxyResult {
  // Log error without sensitive information
  console.error(`Error ${statusCode}:`, { message, code, requestId });
  
  return {
    statusCode,
    headers: SECURITY_HEADERS,
    body: JSON.stringify({
      error: {
        code: code || 'INTERNAL_ERROR',
        message,
        requestId,
        timestamp: new Date().toISOString()
      }
    })
  };
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Log only non-sensitive request metadata
  console.log('Chat handler invoked:', {
    httpMethod: event.httpMethod,
    path: event.path,
    requestId: context.awsRequestId,
    userAgent: event.headers?.['User-Agent']?.substring(0, 100) || 'unknown'
  });
  
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: SECURITY_HEADERS,
        body: ''
      };
    }

    // Validate HTTP method
    if (event.httpMethod !== 'POST') {
      return createErrorResponse(405, 'Method not allowed', context.awsRequestId, 'METHOD_NOT_ALLOWED');
    }

    // Validate API Gateway event structure
    try {
      APIGatewayEventSchema.parse(event);
    } catch (error) {
      return createErrorResponse(400, 'Invalid request structure', context.awsRequestId, 'INVALID_REQUEST');
    }

    // Validate request size
    if (event.body && event.body.length > 10000) {
      return createErrorResponse(413, 'Request body too large', context.awsRequestId, 'PAYLOAD_TOO_LARGE');
    }
    
    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createErrorResponse(400, 'Invalid JSON in request body', context.awsRequestId, 'INVALID_JSON');
    }
    
    // Validate and sanitize request
    let chatRequest: ChatRequest;
    try {
      chatRequest = validateChatRequest(requestBody);
      // Additional sanitization
      chatRequest.question = sanitizeInput(chatRequest.question);
    } catch (error) {
      return createErrorResponse(400, error instanceof Error ? error.message : 'Validation failed', context.awsRequestId, 'VALIDATION_ERROR');
    }
    
    // chatRequest is already validated and sanitized above
    
    // Validate environment variables
    if (!process.env.KNOWLEDGE_BASE_ID) {
      console.error('KNOWLEDGE_BASE_ID environment variable is not set');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'Knowledge Base is not configured. Please ensure the Knowledge Base is deployed.',
            details: 'KNOWLEDGE_BASE_ID environment variable is missing'
          }
        })
      };
    }

    // Process chat request with advanced RAG if enabled
    const useAdvancedRAG = process.env.ENABLE_ADVANCED_RAG === 'true' || requestBody.useAdvancedRAG;
    const response = useAdvancedRAG 
      ? await bedrockService.handleChatQueryWithAdvancedRAG(chatRequest)
      : await bedrockService.handleChatQuery(chatRequest);
    
    return {
      statusCode: 200,
      headers: SECURITY_HEADERS,
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    const bedrockError = error as BedrockError;
    const statusCode = bedrockError.statusCode || 500;
    
    // Log error details server-side only (no sensitive info)
    console.error('Chat handler error:', {
      code: bedrockError.code,
      statusCode,
      requestId: context.awsRequestId,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error message to client
    return createErrorResponse(
      statusCode,
      bedrockError.message || 'An unexpected error occurred while processing your request',
      context.awsRequestId,
      bedrockError.code
    );
  }
};