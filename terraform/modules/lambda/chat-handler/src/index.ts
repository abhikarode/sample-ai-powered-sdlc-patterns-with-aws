import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BedrockService } from './bedrock-service';
import { BedrockError, ChatRequest } from './types';
import { createValidationErrorResponse, validateChatRequest } from './validation';

const bedrockService = new BedrockService();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Chat handler invoked:', JSON.stringify(event, null, 2));
  
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: ''
      };
    }
    
    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body'
          }
        })
      };
    }
    
    // Validate request
    const validationErrors = validateChatRequest(requestBody);
    if (validationErrors.length > 0) {
      return createValidationErrorResponse(validationErrors);
    }
    
    const chatRequest: ChatRequest = {
      question: requestBody.question,
      userId: requestBody.userId || 'test-user',
      conversationId: requestBody.conversationId,
      queryComplexity: requestBody.queryComplexity
    };
    
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
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error in chat handler:', error);
    
    const bedrockError = error as BedrockError;
    const statusCode = bedrockError.statusCode || 500;
    
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: {
          code: bedrockError.code || 'INTERNAL_ERROR',
          message: bedrockError.message || 'An unexpected error occurred',
          requestId: context.awsRequestId,
          timestamp: new Date().toISOString()
        }
      })
    };
  }
};