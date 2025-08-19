
export interface ValidationError {
  field: string;
  message: string;
}

export function validateChatRequest(body: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!body) {
    errors.push({ field: 'body', message: 'Request body is required' });
    return errors;
  }
  
  if (!body.question) {
    errors.push({ field: 'question', message: 'Question is required' });
  } else if (typeof body.question !== 'string') {
    errors.push({ field: 'question', message: 'Question must be a string' });
  } else if (body.question.trim().length === 0) {
    errors.push({ field: 'question', message: 'Question cannot be empty' });
  } else if (body.question.length > 5000) {
    errors.push({ field: 'question', message: 'Question length cannot exceed 5000 characters' });
  }
  
  if (!body.userId) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  } else if (typeof body.userId !== 'string') {
    errors.push({ field: 'userId', message: 'User ID must be a string' });
  }
  
  if (body.conversationId && typeof body.conversationId !== 'string') {
    errors.push({ field: 'conversationId', message: 'Conversation ID must be a string' });
  }
  
  return errors;
}

export function validateChatApiRequest(body: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!body) {
    errors.push({ field: 'body', message: 'Request body is required' });
    return errors;
  }
  
  if (!body.question) {
    errors.push({ field: 'question', message: 'Question is required' });
  } else if (typeof body.question !== 'string') {
    errors.push({ field: 'question', message: 'Question must be a string' });
  } else if (body.question.trim().length === 0) {
    errors.push({ field: 'question', message: 'Question cannot be empty' });
  } else if (body.question.length > 5000) {
    errors.push({ field: 'question', message: 'Question length cannot exceed 5000 characters' });
  }
  
  if (!body.userId) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  } else if (typeof body.userId !== 'string') {
    errors.push({ field: 'userId', message: 'User ID must be a string' });
  }
  
  if (body.conversationId && typeof body.conversationId !== 'string') {
    errors.push({ field: 'conversationId', message: 'Conversation ID must be a string' });
  }

  if (body.queryComplexity && !['simple', 'moderate', 'complex'].includes(body.queryComplexity)) {
    errors.push({ field: 'queryComplexity', message: 'Query complexity must be simple, moderate, or complex' });
  }

  if (body.useAdvancedRAG && typeof body.useAdvancedRAG !== 'boolean') {
    errors.push({ field: 'useAdvancedRAG', message: 'useAdvancedRAG must be a boolean' });
  }

  if (body.enableStreaming && typeof body.enableStreaming !== 'boolean') {
    errors.push({ field: 'enableStreaming', message: 'enableStreaming must be a boolean' });
  }
  
  return errors;
}

export function createValidationErrorResponse(errors: ValidationError[]) {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      error: {
        code: 'VALIDATION_ERROR',
        message: errors.map(e => `${e.field}: ${e.message}`).join(', '),
        details: errors
      }
    })
  };
}