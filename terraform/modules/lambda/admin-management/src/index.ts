// Admin Management Lambda Handler
// Handles Knowledge Base administration endpoints

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
    cancelIngestionJob,
    getKnowledgeBaseMetrics,
    getKnowledgeBaseStatus,
    listIngestionJobs,
    logAdminAction,
    retryIngestionJob,
    startDataSourceSync
} from './admin-service';

// CORS headers for API responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Create standardized API response
 */
function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body)
  };
}

/**
 * Extract user information from Cognito JWT token
 */
function extractUserInfo(event: APIGatewayProxyEvent): { userId: string; userRole: string } {
  const claims = event.requestContext.authorizer?.claims;
  
  if (!claims) {
    throw new Error('No authorization claims found');
  }
  
  const userId = claims.sub || claims['cognito:username'] || 'unknown';
  const userRole = claims['custom:role'] || 'user';
  
  return { userId, userRole };
}

/**
 * Validate admin permissions
 */
function validateAdminAccess(userRole: string): void {
  if (userRole !== 'admin') {
    throw new Error('Admin access required');
  }
}

/**
 * Main Lambda handler for admin management endpoints
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;
  
  console.log('Admin management request:', {
    requestId,
    method: event.httpMethod,
    path: event.path,
    resource: event.resource
  });
  
  try {
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: 'CORS preflight successful' })
      };
    }
    
    // Extract and validate user information
    const { userId, userRole } = extractUserInfo(event);
    validateAdminAccess(userRole);
    
    console.log('Admin request authorized:', { requestId, userId, userRole });
    
    // Extract additional request information for audit logging
    const sourceIp = event.requestContext?.identity?.sourceIp;
    const userAgent = event.headers?.['User-Agent'] || event.headers?.['user-agent'];
    
    // Route based on HTTP method and path
    const method = event.httpMethod;
    const pathParameters = event.pathParameters || {};
    const queryParameters = event.queryStringParameters || {};
    
    switch (method) {
      case 'GET':
        return await handleGetRequest(pathParameters, queryParameters, requestId, userId, sourceIp, userAgent);
      case 'POST':
        return await handlePostRequest(pathParameters, event.body, requestId, userId, sourceIp, userAgent);
      default:
        return createResponse(405, {
          error: 'Method not allowed',
          message: `HTTP method ${method} is not supported`
        });
    }
    
  } catch (error: any) {
    console.error('Admin management error:', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    if (error.message === 'Admin access required') {
      return createResponse(403, {
        error: 'Forbidden',
        message: 'Admin access required for this operation'
      });
    }
    
    if (error.message === 'No authorization claims found') {
      return createResponse(401, {
        error: 'Unauthorized',
        message: 'Valid authentication required'
      });
    }
    
    return createResponse(500, {
      error: 'Internal Server Error',
      message: 'An error occurred processing the admin request',
      requestId
    });
  }
};

/**
 * Handle GET requests for admin data retrieval
 */
async function handleGetRequest(
  pathParameters: { [key: string]: string | undefined },
  queryParameters: { [key: string]: string | undefined },
  requestId: string,
  userId?: string,
  sourceIp?: string,
  userAgent?: string
): Promise<APIGatewayProxyResult> {
  
  const resource = pathParameters.proxy || pathParameters.resource;
  
  switch (resource) {
    case 'knowledge-base/status':
      console.log('Getting Knowledge Base status:', { requestId });
      const status = await getKnowledgeBaseStatus();
      
      // Log admin action
      if (userId) {
        await logAdminAction(userId, 'GET_KNOWLEDGE_BASE_STATUS', { requestId }, sourceIp, userAgent);
      }
      
      return createResponse(200, {
        success: true,
        data: status,
        requestId
      });
      
    case 'knowledge-base/ingestion-jobs':
      console.log('Listing ingestion jobs:', { requestId, statusFilter: queryParameters.status });
      const jobs = await listIngestionJobs(queryParameters.status);
      
      // Log admin action
      if (userId) {
        await logAdminAction(userId, 'LIST_INGESTION_JOBS', { 
          requestId, 
          statusFilter: queryParameters.status,
          jobCount: jobs.length 
        }, sourceIp, userAgent);
      }
      
      return createResponse(200, {
        success: true,
        data: jobs,
        count: jobs.length,
        requestId
      });
      
    case 'knowledge-base/metrics':
      console.log('Getting Knowledge Base metrics:', { requestId });
      
      // Parse optional time range parameters
      let startTime: Date | undefined;
      let endTime: Date | undefined;
      
      if (queryParameters.startTime) {
        startTime = new Date(queryParameters.startTime);
      }
      if (queryParameters.endTime) {
        endTime = new Date(queryParameters.endTime);
      }
      
      const metrics = await getKnowledgeBaseMetrics(startTime, endTime);
      
      // Log admin action
      if (userId) {
        await logAdminAction(userId, 'GET_KNOWLEDGE_BASE_METRICS', { 
          requestId,
          startTime: startTime?.toISOString(),
          endTime: endTime?.toISOString()
        }, sourceIp, userAgent);
      }
      
      return createResponse(200, {
        success: true,
        data: metrics,
        requestId
      });
      
    default:
      // Check if it's an ingestion job detail request (pattern: knowledge-base/ingestion-jobs/{jobId})
      if (resource && resource.startsWith('knowledge-base/ingestion-jobs/')) {
        const jobId = resource.split('/')[2];
        if (jobId && !resource.includes('/retry') && !resource.includes('/cancel')) {
          console.log('Getting ingestion job details:', { requestId, jobId });
          // For now, return a message that individual job details are not yet implemented
          return createResponse(501, {
            success: false,
            error: 'Not Implemented',
            message: 'Individual ingestion job details are not yet implemented. Use the list endpoint to see all jobs.',
            requestId
          });
        }
      }
      
      return createResponse(404, {
        error: 'Not Found',
        message: `Admin resource '${resource}' not found`
      });
  }
}

/**
 * Handle POST requests for admin actions
 */
async function handlePostRequest(
  pathParameters: { [key: string]: string | undefined },
  body: string | null,
  requestId: string,
  userId?: string,
  sourceIp?: string,
  userAgent?: string
): Promise<APIGatewayProxyResult> {
  
  const resource = pathParameters.proxy || pathParameters.resource;
  
  switch (resource) {
    case 'knowledge-base/sync':
      console.log('Starting Knowledge Base sync:', { requestId });
      const syncResult = await startDataSourceSync();
      
      // Log admin action
      if (userId) {
        await logAdminAction(userId, 'START_KNOWLEDGE_BASE_SYNC', { 
          requestId,
          ingestionJobId: syncResult.ingestionJobId,
          status: syncResult.status
        }, sourceIp, userAgent);
      }
      
      return createResponse(200, {
        success: true,
        message: 'Data source synchronization started',
        data: syncResult,
        requestId
      });
      
    default:
      // Check for ingestion job actions (pattern: knowledge-base/ingestion-jobs/{jobId}/{action})
      if (resource && resource.startsWith('knowledge-base/ingestion-jobs/')) {
        const pathParts = resource.split('/');
        if (pathParts.length === 4) {
          const jobId = pathParts[2];
          const action = pathParts[3];
          
          if (action === 'retry') {
            console.log('Retrying ingestion job:', { requestId, jobId });
            const retryResult = await retryIngestionJob(jobId);
            
            // Log admin action
            if (userId) {
              await logAdminAction(userId, 'RETRY_INGESTION_JOB', { 
                requestId,
                originalJobId: jobId,
                newJobId: retryResult.ingestionJobId,
                status: retryResult.status
              }, sourceIp, userAgent);
            }
            
            return createResponse(200, {
              success: true,
              message: 'Ingestion job retry initiated',
              data: retryResult,
              requestId
            });
          } else if (action === 'cancel') {
            console.log('Canceling ingestion job:', { requestId, jobId });
            const cancelResult = await cancelIngestionJob(jobId);
            
            // Log admin action
            if (userId) {
              await logAdminAction(userId, 'CANCEL_INGESTION_JOB', { 
                requestId,
                jobId,
                status: cancelResult.status
              }, sourceIp, userAgent);
            }
            
            return createResponse(200, {
              success: true,
              message: 'Ingestion job cancellation initiated',
              data: cancelResult,
              requestId
            });
          }
        }
      }
      
      return createResponse(404, {
        error: 'Not Found',
        message: `Admin action '${resource}' not found`
      });
  }
}