/**
 * Document Management Lambda Function Tests - RED Phase
 * Test-driven development tests for document management API endpoints
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler } from '../src/index';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-bedrock-agent');

// Test environment variables
process.env.AWS_REGION = 'us-west-2';
process.env.DOCUMENTS_TABLE = 'test-documents-table';
process.env.DOCUMENTS_BUCKET = 'test-documents-bucket';
process.env.KNOWLEDGE_BASE_ID = 'test-kb-id';
process.env.DATA_SOURCE_ID = 'test-ds-id';

describe('Document Management Lambda Function', () => {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-west-2:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2024/01/01/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    test('should return 401 for unauthenticated requests', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/documents',
        pathParameters: null,
        queryStringParameters: null,
        headers: {},
        multiValueHeaders: {},
        body: null,
        isBase64Encoded: false,
        requestContext: {} as any,
        resource: '',
        stageVariables: null,
        multiValueQueryStringParameters: null
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).error).toContain('Unauthorized');
    });

    test('should authenticate valid user requests', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/documents',
        pathParameters: null,
        queryStringParameters: null,
        headers: {},
        multiValueHeaders: {},
        body: null,
        isBase64Encoded: false,
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
              'custom:role': 'user'
            }
          }
        } as any,
        resource: '',
        stageVariables: null,
        multiValueQueryStringParameters: null
      };

      // Mock DynamoDB response for user documents
      const mockDynamoClient = require('@aws-sdk/client-dynamodb').DynamoDBClient;
      mockDynamoClient.prototype.send = jest.fn().mockResolvedValue({
        Items: []
      });

      // Mock Bedrock response for ingestion jobs
      const mockBedrockClient = require('@aws-sdk/client-bedrock-agent').BedrockAgentClient;
      mockBedrockClient.prototype.send = jest.fn().mockResolvedValue({
        ingestionJobSummaries: []
      });

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.documents).toBeDefined();
      expect(body.userRole).toBe('user');
    });
  });

  describe('GET /documents - List Documents', () => {
    test('should list user documents with Knowledge Base sync status', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/documents',
        pathParameters: null,
        queryStringParameters: null,
        headers: {},
        multiValueHeaders: {},
        body: null,
        isBase64Encoded: false,
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
              'custom:role': 'user'
            }
          }
        } as any,
        resource: '',
        stageVariables: null,
        multiValueQueryStringParameters: null
      };

      // Mock DynamoDB response with sample documents
      const mockDynamoClient = require('@aws-sdk/client-dynamodb').DynamoDBClient;
      mockDynamoClient.prototype.send = jest.fn().mockResolvedValue({
        Items: [
          {
            documentId: { S: 'doc-1' },
            fileName: { S: 'test-document.pdf' },
            originalName: { S: 'test-document.pdf' },
            contentType: { S: 'application/pdf' },
            fileSize: { N: '1024' },
            uploadedBy: { S: 'test-user-id' },
            uploadDate: { S: '2024-01-01T00:00:00.000Z' },
            s3Key: { S: 'documents/test-user-id/doc-1.pdf' },
            s3Bucket: { S: 'test-documents-bucket' },
            status: { S: 'uploaded' },
            knowledgeBaseStatus: { S: 'synced' }
          }
        ]
      });

      // Mock Bedrock response for ingestion jobs
      const mockBedrockClient = require('@aws-sdk/client-bedrock-agent').BedrockAgentClient;
      mockBedrockClient.prototype.send = jest.fn().mockResolvedValue({
        ingestionJobSummaries: []
      });

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.documents).toHaveLength(1);
      expect(body.documents[0].documentId).toBe('doc-1');
      expect(body.documents[0].knowledgeBaseStatus).toBe('synced');
      expect(body.totalCount).toBe(1);
    });

    test('should allow admins to see all documents', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/documents',
        pathParameters: null,
        queryStringParameters: null,
        headers: {},
        multiValueHeaders: {},
        body: null,
        isBase64Encoded: false,
        requestContext: {
          authorizer: {
            claims: {
              sub: 'admin-user-id',
              'custom:role': 'admin'
            }
          }
        } as any,
        resource: '',
        stageVariables: null,
        multiValueQueryStringParameters: null
      };

      // Mock DynamoDB scan response for all documents
      const mockDynamoClient = require('@aws-sdk/client-dynamodb').DynamoDBClient;
      mockDynamoClient.prototype.send = jest.fn().mockResolvedValue({
        Items: [
          {
            documentId: { S: 'doc-1' },
            fileName: { S: 'user1-document.pdf' },
            uploadedBy: { S: 'user-1' },
            knowledgeBaseStatus: { S: 'synced' }
          },
          {
            documentId: { S: 'doc-2' },
            fileName: { S: 'user2-document.pdf' },
            uploadedBy: { S: 'user-2' },
            knowledgeBaseStatus: { S: 'pending' }
          }
        ]
      });

      // Mock Bedrock response
      const mockBedrockClient = require('@aws-sdk/client-bedrock-agent').BedrockAgentClient;
      mockBedrockClient.prototype.send = jest.fn().mockResolvedValue({
        ingestionJobSummaries: []
      });

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.documents).toHaveLength(2);
      expect(body.userRole).toBe('admin');
    });

    test('should handle DynamoDB errors gracefully', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/documents',
        pathParameters: null,
        queryStringParameters: null,
        headers: {},
        multiValueHeaders: {},
        body: null,
        isBase64Encoded: false,
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
              'custom:role': 'user'
            }
          }
        } as any,
        resource: '',
        stageVariables: null,
        multiValueQueryStringParameters: null
      };

      // Mock DynamoDB error
      const mockDynamoClient = require('@aws-sdk/client-dynamodb').DynamoDBClient;
      mockDynamoClient.prototype.send = jest.fn().mockRejectedValue(new Error('DynamoDB error'));

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toContain('Failed to retrieve documents');
    });
  });

  describe('DELETE /documents/{id} - Delete Document', () => {
    test('should delete user document with Knowledge Base cleanup', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'DELETE',
        path: '/documents/doc-1',
        pathParameters: { id: 'doc-1' },
        queryStringParameters: null,
        headers: {},
        multiValueHeaders: {},
        body: null,
        isBase64Encoded: false,
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
              'custom:role': 'user'
            }
          }
        } as any,
        resource: '',
        stageVariables: null,
        multiValueQueryStringParameters: null
      };

      // Mock DynamoDB query response for document lookup
      const mockDynamoClient = require('@aws-sdk/client-dynamodb').DynamoDBClient;
      mockDynamoClient.prototype.send = jest.fn()
        .mockResolvedValueOnce({
          Items: [{
            documentId: { S: 'doc-1' },
            fileName: { S: 'test-document.pdf' },
            uploadedBy: { S: 'test-user-id' },
            s3Key: { S: 'documents/test-user-id/doc-1.pdf' },
            s3Bucket: { S: 'test-documents-bucket' }
          }]
        })
        .mockResolvedValueOnce({}); // Delete response

      // Mock S3 delete response
      const mockS3Client = require('@aws-sdk/client-s3').S3Client;
      mockS3Client.prototype.send = jest.fn().mockResolvedValue({});

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.documentId).toBe('doc-1');
      expect(body.knowledgeBaseCleanup).toContain('next sync');
    });

    test('should return 404 for non-existent document', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'DELETE',
        path: '/documents/non-existent',
        pathParameters: { id: 'non-existent' },
        queryStringParameters: null,
        headers: {},
        multiValueHeaders: {},
        body: null,
        isBase64Encoded: false,
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
              'custom:role': 'user'
            }
          }
        } as any,
        resource: '',
        stageVariables: null,
        multiValueQueryStringParameters: null
      };

      // Mock DynamoDB query response for non-existent document
      const mockDynamoClient = require('@aws-sdk/client-dynamodb').DynamoDBClient;
      mockDynamoClient.prototype.send = jest.fn().mockResolvedValue({
        Items: []
      });

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toContain('Document not found');
    });

    test('should deny deletion of other users documents for regular users', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'DELETE',
        path: '/documents/doc-1',
        pathParameters: { id: 'doc-1' },
        queryStringParameters: null,
        headers: {},
        multiValueHeaders: {},
        body: null,
        isBase64Encoded: false,
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
              'custom:role': 'user'
            }
          }
        } as any,
        resource: '',
        stageVariables: null,
        multiValueQueryStringParameters: null
      };

      // Mock DynamoDB query response for document owned by different user
      const mockDynamoClient = require('@aws-sdk/client-dynamodb').DynamoDBClient;
      mockDynamoClient.prototype.send = jest.fn().mockResolvedValue({
        Items: [{
          documentId: { S: 'doc-1' },
          fileName: { S: 'other-user-document.pdf' },
          uploadedBy: { S: 'other-user-id' },
          s3Key: { S: 'documents/other-user-id/doc-1.pdf' },
          s3Bucket: { S: 'test-documents-bucket' }
        }]
      });

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(403);
      expect(JSON.parse(result.body).error).toContain('Permission denied');
    });

    test('should allow admins to delete any document', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'DELETE',
        path: '/documents/doc-1',
        pathParameters: { id: 'doc-1' },
        queryStringParameters: null,
        headers: {},
        multiValueHeaders: {},
        body: null,
        isBase64Encoded: false,
        requestContext: {
          authorizer: {
            claims: {
              sub: 'admin-user-id',
              'custom:role': 'admin'
            }
          }
        } as any,
        resource: '',
        stageVariables: null,
        multiValueQueryStringParameters: null
      };

      // Mock DynamoDB query response for document owned by different user
      const mockDynamoClient = require('@aws-sdk/client-dynamodb').DynamoDBClient;
      mockDynamoClient.prototype.send = jest.fn()
        .mockResolvedValueOnce({
          Items: [{
            documentId: { S: 'doc-1' },
            fileName: { S: 'user-document.pdf' },
            uploadedBy: { S: 'other-user-id' },
            s3Key: { S: 'documents/other-user-id/doc-1.pdf' },
            s3Bucket: { S: 'test-documents-bucket' }
          }]
        })
        .mockResolvedValueOnce({}); // Delete response

      // Mock S3 delete response
      const mockS3Client = require('@aws-sdk/client-s3').S3Client;
      mockS3Client.prototype.send = jest.fn().mockResolvedValue({});

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });
  });

  describe('GET /documents/status - Document Processing Status', () => {
    test('should return document processing status with ingestion job tracking', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/documents/status',
        pathParameters: null,
        queryStringParameters: null,
        headers: {},
        multiValueHeaders: {},
        body: null,
        isBase64Encoded: false,
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
              'custom:role': 'user'
            }
          }
        } as any,
        resource: '',
        stageVariables: null,
        multiValueQueryStringParameters: null
      };

      // Mock DynamoDB response with documents in various states
      const mockDynamoClient = require('@aws-sdk/client-dynamodb').DynamoDBClient;
      mockDynamoClient.prototype.send = jest.fn().mockResolvedValue({
        Items: [
          {
            documentId: { S: 'doc-1' },
            knowledgeBaseStatus: { S: 'synced' }
          },
          {
            documentId: { S: 'doc-2' },
            knowledgeBaseStatus: { S: 'pending' }
          },
          {
            documentId: { S: 'doc-3' },
            knowledgeBaseStatus: { S: 'ingesting' }
          }
        ]
      });

      // Mock Bedrock response with ingestion jobs
      const mockBedrockClient = require('@aws-sdk/client-bedrock-agent').BedrockAgentClient;
      mockBedrockClient.prototype.send = jest.fn()
        .mockResolvedValueOnce({
          ingestionJobSummaries: [
            {
              ingestionJobId: 'job-1',
              status: 'IN_PROGRESS',
              startedAt: new Date('2024-01-01T00:00:00.000Z')
            },
            {
              ingestionJobId: 'job-2',
              status: 'COMPLETE',
              startedAt: new Date('2024-01-01T00:00:00.000Z'),
              updatedAt: new Date('2024-01-01T00:05:00.000Z')
            }
          ]
        })
        .mockResolvedValue({
          ingestionJob: {
            statistics: {
              numberOfDocumentsScanned: 5,
              numberOfNewDocumentsIndexed: 3
            }
          }
        });

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.statusSummary).toBeDefined();
      expect(body.statusSummary.totalDocuments).toBe(3);
      expect(body.statusSummary.synced).toBe(1);
      expect(body.statusSummary.pending).toBe(1);
      expect(body.statusSummary.currentlyIngesting).toBe(1);
      expect(body.ingestionJobs).toHaveLength(2);
    });

    test('should handle Bedrock API errors gracefully', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/documents/status',
        pathParameters: null,
        queryStringParameters: null,
        headers: {},
        multiValueHeaders: {},
        body: null,
        isBase64Encoded: false,
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
              'custom:role': 'user'
            }
          }
        } as any,
        resource: '',
        stageVariables: null,
        multiValueQueryStringParameters: null
      };

      // Mock DynamoDB response
      const mockDynamoClient = require('@aws-sdk/client-dynamodb').DynamoDBClient;
      mockDynamoClient.prototype.send = jest.fn().mockResolvedValue({
        Items: []
      });

      // Mock Bedrock error
      const mockBedrockClient = require('@aws-sdk/client-bedrock-agent').BedrockAgentClient;
      mockBedrockClient.prototype.send = jest.fn().mockRejectedValue(new Error('Bedrock error'));

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.statusSummary).toBeDefined();
      expect(body.ingestionJobs).toHaveLength(0); // Should handle error gracefully
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown endpoints', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/unknown',
        pathParameters: null,
        queryStringParameters: null,
        headers: {},
        multiValueHeaders: {},
        body: null,
        isBase64Encoded: false,
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
              'custom:role': 'user'
            }
          }
        } as any,
        resource: '',
        stageVariables: null,
        multiValueQueryStringParameters: null
      };

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toContain('Endpoint not found');
    });

    test('should handle unexpected errors gracefully', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/documents',
        pathParameters: null,
        queryStringParameters: null,
        headers: {},
        multiValueHeaders: {},
        body: null,
        isBase64Encoded: false,
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
              'custom:role': 'user'
            }
          }
        } as any,
        resource: '',
        stageVariables: null,
        multiValueQueryStringParameters: null
      };

      // Mock unexpected error
      const mockDynamoClient = require('@aws-sdk/client-dynamodb').DynamoDBClient;
      mockDynamoClient.prototype.send = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toContain('Internal server error');
    });
  });

  describe('CORS Headers', () => {
    test('should include proper CORS headers in all responses', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/documents',
        pathParameters: null,
        queryStringParameters: null,
        headers: {},
        multiValueHeaders: {},
        body: null,
        isBase64Encoded: false,
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
              'custom:role': 'user'
            }
          }
        } as any,
        resource: '',
        stageVariables: null,
        multiValueQueryStringParameters: null
      };

      // Mock successful response
      const mockDynamoClient = require('@aws-sdk/client-dynamodb').DynamoDBClient;
      mockDynamoClient.prototype.send = jest.fn().mockResolvedValue({ Items: [] });

      const mockBedrockClient = require('@aws-sdk/client-bedrock-agent').BedrockAgentClient;
      mockBedrockClient.prototype.send = jest.fn().mockResolvedValue({ ingestionJobSummaries: [] });

      const result = await handler(event, mockContext);

      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Methods', 'GET,DELETE,OPTIONS');
      expect(result.headers).toHaveProperty('Content-Type', 'application/json');
    });
  });
});