---
inclusion: always
---

# Amazon Bedrock Knowledge Base Architecture

## Mandatory Architecture Approach

**CRITICAL REQUIREMENT**: All document processing, embedding generation, and retrieval-augmented generation (RAG) functionality MUST use Amazon Bedrock Knowledge Bases. No custom implementations are permitted.

## Core Components

### Amazon Bedrock Knowledge Base
- **Central RAG Component**: Handles document ingestion, chunking, embedding generation, and vector storage
- **Managed Service**: AWS handles all the complexity of document processing and vector operations
- **RetrieveAndGenerate API**: Single API call for complete RAG functionality

### S3 Data Source
- **Document Storage**: All documents uploaded to S3 bucket configured as Knowledge Base data source
- **Automatic Sync**: Knowledge Base automatically detects new documents and processes them
- **Supported Formats**: PDF, DOCX, TXT, MD files supported natively

### OpenSearch Serverless Vector Store
- **Managed Vector Database**: AWS-managed vector storage integrated with Knowledge Base
- **Automatic Indexing**: Documents automatically chunked and indexed with embeddings
- **Hybrid Search**: Combines semantic and keyword search for better retrieval

## Prohibited Custom Implementations

### ❌ NEVER Implement These
- Custom document text extraction
- Manual embedding generation using Bedrock Titan directly
- Custom vector storage in OpenSearch
- Manual document chunking logic
- Custom RAG pipeline implementation
- Direct OpenSearch vector operations

### ✅ ALWAYS Use These Instead
- Knowledge Base data source synchronization
- RetrieveAndGenerate API for all chat functionality
- Knowledge Base ingestion job monitoring
- Bedrock Knowledge Base management APIs

## Development Approach

### Infrastructure First
```hcl
# Always start with Knowledge Base infrastructure
resource "aws_bedrockagent_knowledge_base" "main" {
  name        = "ai-assistant-knowledge-base"
  description = "AI Assistant Knowledge Base for development team"
  role_arn    = aws_iam_role.bedrock_kb_role.arn
  
  knowledge_base_configuration {
    vector_knowledge_base_configuration {
      embedding_model_arn = "arn:aws:bedrock:us-west-2::foundation-model/amazon.titan-embed-text-v2:0"
      
      embedding_model_configuration {
        bedrock_embedding_model_configuration {
          dimensions = 1024
        }
      }
    }
  }
  
  storage_configuration {
    opensearch_serverless_configuration {
      collection_arn    = aws_opensearchserverless_collection.kb_collection.arn
      vector_index_name = "ai-assistant-index"
      
      field_mapping {
        vector_field   = "vector"
        text_field     = "text"
        metadata_field = "metadata"
      }
    }
  }
}

resource "aws_bedrockagent_data_source" "s3_source" {
  knowledge_base_id = aws_bedrockagent_knowledge_base.main.id
  name              = "s3-documents-source"
  
  data_source_configuration {
    type = "S3"
    s3_configuration {
      bucket_arn = aws_s3_bucket.documents.arn
      inclusion_prefixes = ["documents/"]
    }
  }
  
  vector_ingestion_configuration {
    chunking_configuration {
      chunking_strategy = "FIXED_SIZE"
      fixed_size_chunking_configuration {
        max_tokens         = 300
        overlap_percentage = 20
      }
    }
  }
}
```

### Document Upload Pattern
```typescript
// Simple upload to S3 - Knowledge Base handles the rest
export async function uploadDocument(file: File, userId: string): Promise<UploadResult> {
  // 1. Upload to S3 (Knowledge Base data source)
  const s3Key = `documents/${userId}/${file.name}`;
  await s3Client.upload({
    Bucket: process.env.DOCUMENTS_BUCKET,
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype
  }).promise();
  
  // 2. Store metadata in DynamoDB
  await dynamoClient.put({
    TableName: process.env.DOCUMENTS_TABLE,
    Item: {
      PK: `DOC#${documentId}`,
      SK: 'METADATA',
      documentId,
      fileName: file.name,
      s3Key,
      status: 'uploaded',
      knowledgeBaseStatus: 'pending', // Will be updated by sync monitoring
      uploadedBy: userId,
      uploadDate: new Date().toISOString()
    }
  }).promise();
  
  // 3. Trigger Knowledge Base sync (optional - can be automatic)
  await bedrockAgent.startIngestionJob({
    knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
    dataSourceId: process.env.DATA_SOURCE_ID
  }).promise();
  
  return { documentId, status: 'uploaded' };
}
```

### Chat Implementation Pattern
```typescript
// Use RetrieveAndGenerate API with inference profile strategy for optimal performance
const CLAUDE_INFERENCE_PROFILE_HIERARCHY = [
  'us.anthropic.claude-opus-4-1-20250805-v1:0',      // Claude Opus 4.1 Cross-Region (Primary)
  'us.anthropic.claude-3-7-sonnet-20250219-v1:0',   // Claude 3.7 Sonnet Cross-Region (Fallback)
  'us.anthropic.claude-3-5-sonnet-20241022-v2:0'    // Claude 3.5 Sonnet v2 Cross-Region (Secondary)
];

// Direct model fallback for specific use cases
const CLAUDE_DIRECT_MODEL_HIERARCHY = [
  'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-opus-4-1-20250805-v1:0',
  'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-7-sonnet-20250219-v1:0',
  'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0'
];

async function getAvailableClaudeModel(): Promise<string> {
  // First try inference profiles for better availability and throughput
  for (const inferenceProfileId of CLAUDE_INFERENCE_PROFILE_HIERARCHY) {
    try {
      // Test inference profile availability
      const testResponse = await bedrockRuntime.invokeModel({
        modelId: inferenceProfileId,
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      }).promise();
      return inferenceProfileId;
    } catch (error) {
      console.log(`Inference profile ${inferenceProfileId} unavailable, trying next...`);
      continue;
    }
  }
  
  // Fallback to direct models if inference profiles fail
  for (const modelArn of CLAUDE_DIRECT_MODEL_HIERARCHY) {
    try {
      const testResponse = await bedrockRuntime.invokeModel({
        modelId: modelArn.split('/').pop(),
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      }).promise();
      return modelArn;
    } catch (error) {
      console.log(`Direct model ${modelArn} unavailable, trying next...`);
      continue;
    }
  }
  
  throw new Error('No Claude models or inference profiles available');
}

export async function handleChatQuery(question: string, userId: string): Promise<ChatResponse> {
  const availableModel = await getAvailableClaudeModel();
  
  const response = await bedrockRuntime.retrieveAndGenerate({
    input: {
      text: question
    },
    retrieveAndGenerateConfiguration: {
      type: 'KNOWLEDGE_BASE',
      knowledgeBaseConfiguration: {
        knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
        modelArn: availableModel,
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: 5,
            overrideSearchType: 'HYBRID' // Semantic + keyword search
          }
        }
      }
    }
  }).promise();
  
  return {
    answer: response.output.text,
    sources: response.citations?.map(citation => ({
      documentId: citation.generatedResponsePart.textResponsePart.span.start,
      excerpt: citation.retrievedReferences[0].content.text,
      confidence: citation.retrievedReferences[0].metadata.score
    })) || [],
    conversationId: generateConversationId(),
    timestamp: new Date().toISOString(),
    modelUsed: availableModel.split('/').pop() // Track which model was used
  };
}
```

## Testing Strategy

### Knowledge Base Integration Tests
```typescript
describe('Knowledge Base Integration', () => {
  test('should upload document and verify Knowledge Base ingestion', async () => {
    // 1. Upload document to S3
    const uploadResult = await uploadDocument(testPDF, 'test-user');
    expect(uploadResult.status).toBe('uploaded');
    
    // 2. Wait for Knowledge Base ingestion
    await waitForIngestionCompletion(uploadResult.documentId);
    
    // 3. Test retrieval
    const chatResponse = await handleChatQuery('What does the document say about testing?');
    expect(chatResponse.answer).toBeDefined();
    expect(chatResponse.sources).toHaveLength.greaterThan(0);
  });
  
  test('should handle Knowledge Base sync failures gracefully', async () => {
    // Test error scenarios and recovery
  });
});
```

### End-to-End Workflow Tests
```typescript
describe('Complete Document Workflow', () => {
  test('should complete full pipeline: upload → ingest → query → response', async () => {
    // Use Playwright MCP to test complete user workflow
    await mcp_playwright_browser_navigate({ 
      url: 'https://deployed-app-url.com' 
    });
    
    // Upload document
    await mcp_playwright_browser_file_upload({ 
      paths: ['/path/to/test-document.pdf'] 
    });
    
    // Wait for Knowledge Base processing (can take several minutes)
    await mcp_playwright_browser_wait_for({ time: 180 });
    
    // Test chat with uploaded document
    await mcp_playwright_browser_type({
      element: 'chat input',
      ref: 'chat-input',
      text: 'What information is in the uploaded document?'
    });
    
    // Verify response includes source citations
    const response = await mcp_playwright_browser_snapshot();
    // Assert response contains document references
  });
});
```

## Monitoring and Observability

### Knowledge Base Metrics
- Ingestion job success/failure rates
- Query response times and accuracy
- Document processing throughput
- Vector search performance

### Custom CloudWatch Metrics
```typescript
// Track Knowledge Base operations
await cloudWatch.putMetricData({
  Namespace: 'AI-Assistant/KnowledgeBase',
  MetricData: [{
    MetricName: 'IngestionJobDuration',
    Value: ingestionDuration,
    Unit: 'Seconds',
    Dimensions: [{
      Name: 'KnowledgeBaseId',
      Value: process.env.KNOWLEDGE_BASE_ID
    }]
  }]
}).promise();
```

## Cost Optimization

### Chunking Strategy
- Use 300 token chunks with 20% overlap for optimal balance
- Monitor token usage and adjust based on document types
- Consider document preprocessing to remove unnecessary content

### Query Optimization
- Limit retrieval to top 5 most relevant documents
- Use hybrid search for better accuracy with fewer results
- Implement query caching for frequently asked questions

### OpenSearch Serverless
- Monitor OCU usage and optimize based on query patterns
- Use minimum 4 OCU configuration for cost predictability
- Consider data lifecycle policies for old documents

## Success Criteria

### Implementation Quality
- Zero custom document processing code
- All chat functionality uses RetrieveAndGenerate API
- Document upload triggers automatic Knowledge Base sync
- Source citations included in all AI responses

### Performance Standards
- Document ingestion completes within 10 minutes
- Chat queries respond within 10 seconds
- Knowledge Base sync success rate > 95%
- Query accuracy meets user satisfaction thresholds

**Remember: Bedrock Knowledge Base handles the complexity - our job is to integrate it properly, not reinvent it.**