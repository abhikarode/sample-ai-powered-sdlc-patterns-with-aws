import {
    BedrockAgentRuntimeClient,
    RetrieveAndGenerateCommand,
    RetrieveAndGenerateCommandInput,
    RetrieveAndGenerateCommandOutput
} from '@aws-sdk/client-bedrock-agent-runtime';
import {
    BedrockRuntimeClient,
    InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { v4 as uuidv4 } from 'uuid';
import { AdvancedRAGConfig } from './advanced-rag-config';
import {
    classifyQueryComplexity,
    CLAUDE_DIRECT_MODEL_HIERARCHY,
    getModelConfigByName,
    selectOptimalModel
} from './model-config';
import {
    BedrockError,
    ChatRequest,
    ChatResponse,
    DocumentSource,
    RAGConfiguration,
    ResponseQuality,
    TokenUsage
} from './types';

export class BedrockService {
  private bedrockAgentRuntime: BedrockAgentRuntimeClient;
  private bedrockRuntime: BedrockRuntimeClient;
  private cloudWatch: CloudWatchClient;
  private knowledgeBaseId: string;
  private advancedRAG: AdvancedRAGConfig;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 1000; // Minimum 1 second between requests

  constructor() {
    // AWS Lambda automatically sets AWS_REGION, but it's a reserved environment variable
    // Use the runtime region or default to us-west-2
    const region = process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-west-2';
    
    // Configure AWS clients with proper credentials for testing
    const clientConfig: any = { region };
    
    // In test environment, use the aidlc_main profile
    if (process.env.NODE_ENV === 'test' || process.env.AWS_PROFILE) {
      clientConfig.credentials = undefined; // Let AWS SDK handle profile-based credentials
    }
    
    this.bedrockAgentRuntime = new BedrockAgentRuntimeClient(clientConfig);
    this.bedrockRuntime = new BedrockRuntimeClient(clientConfig);
    this.cloudWatch = new CloudWatchClient(clientConfig);
    this.advancedRAG = new AdvancedRAGConfig();
    // Read Knowledge Base ID at runtime instead of construction time
    this.knowledgeBaseId = '';
  }

  private getKnowledgeBaseId(): string {
    return process.env.KNOWLEDGE_BASE_ID || '';
  }

  async handleChatQuery(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      // Classify query complexity if not provided
      const queryComplexity = request.queryComplexity || 
        classifyQueryComplexity(request.question);
      
      // Select optimal model
      const selectedModel = selectOptimalModel(queryComplexity);
      
      // Get available model (with fallback)
      const availableModel = await this.getAvailableClaudeModel();
      
      // Use RetrieveAndGenerate API with session management
      const response = await this.retrieveAndGenerate(
        request.question,
        availableModel,
        request.conversationId
      );
      
      // Calculate token usage and cost
      const tokenUsage = this.extractTokenUsage(response);
      const modelConfig = getModelConfigByName(availableModel);
      const cost = this.calculateCost(tokenUsage, modelConfig);
      
      // Track metrics
      await this.trackMetrics(availableModel, tokenUsage, Date.now() - startTime);
      
      return {
        answer: response.output?.text || 'No response generated',
        sources: this.extractSources(response),
        conversationId: response.sessionId || request.conversationId || uuidv4(),
        timestamp: new Date().toISOString(),
        modelUsed: this.extractModelName(availableModel),
        tokenUsage,
        cost
      };
      
    } catch (error) {
      console.error('Error in handleChatQuery:', error);
      throw this.handleBedrockError(error as BedrockError);
    }
  }

  async handleChatQueryWithAdvancedRAG(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      // Classify query complexity if not provided
      const queryComplexity = request.queryComplexity || 
        classifyQueryComplexity(request.question);
      
      // Get advanced RAG configuration
      const ragConfig = this.advancedRAG.getRAGConfiguration(queryComplexity);
      
      // Select optimal model
      const selectedModel = selectOptimalModel(queryComplexity);
      
      // Get available model (with fallback)
      const availableModel = await this.getAvailableClaudeModel();
      
      // Use RetrieveAndGenerate API with advanced configuration
      const response = await this.retrieveAndGenerateAdvanced(
        request.question,
        availableModel,
        ragConfig,
        request.conversationId
      );
      
      // Extract enhanced sources with advanced processing
      const enhancedSources = this.advancedRAG.extractEnhancedSources(response);
      
      // Apply relevance filtering and ranking
      const filteredSources = this.advancedRAG.filterByRelevance(
        enhancedSources, 
        ragConfig.qualityThresholds.minConfidence
      );
      
      const rankedSources = this.advancedRAG.enhanceSourceRanking(
        filteredSources,
        request.question
      );
      
      // Validate response quality
      const chatResponse = {
        answer: response.output?.text || 'No response generated',
        sources: rankedSources
      };
      
      const qualityMetrics = this.advancedRAG.validateResponseQuality(chatResponse);
      
      // Calculate token usage and cost
      const tokenUsage = this.extractTokenUsage(response);
      const modelConfig = getModelConfigByName(availableModel);
      const cost = this.calculateCost(tokenUsage, modelConfig);
      
      // Track advanced metrics
      await this.trackAdvancedMetrics(
        availableModel, 
        tokenUsage, 
        Date.now() - startTime,
        qualityMetrics,
        ragConfig
      );
      
      return {
        answer: chatResponse.answer,
        sources: rankedSources,
        conversationId: response.sessionId || request.conversationId || uuidv4(),
        timestamp: new Date().toISOString(),
        modelUsed: this.extractModelName(availableModel),
        tokenUsage,
        cost,
        ragConfig,
        qualityMetrics
      };
      
    } catch (error) {
      console.error('Error in handleChatQueryWithAdvancedRAG:', error);
      throw this.handleBedrockError(error as BedrockError);
    }
  }

  private async getAvailableClaudeModel(): Promise<string> {
    const environment = process.env.ENVIRONMENT || 'development';
    
    // In production, try provisioned throughput first
    if (environment === 'production') {
      const provisionedArn = process.env.CLAUDE_3_7_SONNET_PROVISIONED_ARN;
      if (provisionedArn) {
        try {
          await this.testModelAvailability(provisionedArn);
          return provisionedArn;
        } catch (error) {
          console.log('Provisioned model unavailable, falling back to on-demand');
        }
      }
    }
    
    // For RetrieveAndGenerate, use model IDs that work with Knowledge Base
    const modelIds = [
      'anthropic.claude-opus-4-1-20250805-v1:0',      // Claude Opus 4.1
      'anthropic.claude-3-7-sonnet-20250219-v1:0',   // Claude 3.7 Sonnet
      'anthropic.claude-3-5-sonnet-20241022-v2:0'    // Claude 3.5 Sonnet v2
    ];
    
    for (const modelId of modelIds) {
      try {
        // Test model availability with Knowledge Base compatibility
        await this.testModelAvailability(modelId);
        return modelId;
      } catch (error) {
        console.log(`Model ${modelId} unavailable, trying next...`);
        continue;
      }
    }
    
    // Fallback to direct model ARNs if model IDs don't work
    for (const modelArn of CLAUDE_DIRECT_MODEL_HIERARCHY) {
      try {
        await this.testModelAvailability(modelArn);
        return modelArn;
      } catch (error) {
        console.log(`Direct model ${modelArn} unavailable, trying next...`);
        continue;
      }
    }
    
    throw new Error('No Claude models available');
  }

  private async testModelAvailability(modelId: string): Promise<void> {
    const testCommand = new InvokeModelCommand({
      modelId,
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
    });
    
    await this.executeWithRetry(() => this.bedrockRuntime.send(testCommand));
  }

  private async retrieveAndGenerate(
    question: string,
    modelArn: string,
    sessionId?: string
  ): Promise<RetrieveAndGenerateCommandOutput> {
    const knowledgeBaseId = this.getKnowledgeBaseId();
    
    const input: RetrieveAndGenerateCommandInput = {
      input: {
        text: question
      },
      retrieveAndGenerateConfiguration: {
        type: 'KNOWLEDGE_BASE',
        knowledgeBaseConfiguration: {
          knowledgeBaseId: knowledgeBaseId,
          modelArn: modelArn,
          retrievalConfiguration: {
            vectorSearchConfiguration: {
              numberOfResults: 5,
              overrideSearchType: 'HYBRID' // Semantic + keyword search
            }
          }
        }
      },
      // Add session management for conversation context
      ...(sessionId && { sessionId }),
      // Only include sessionConfiguration if we have a KMS key (it's required)
      ...(process.env.KMS_KEY_ARN && {
        sessionConfiguration: {
          kmsKeyArn: process.env.KMS_KEY_ARN
        }
      })
    };

    const command = new RetrieveAndGenerateCommand(input);
    return await this.executeWithRetry(() => this.bedrockAgentRuntime.send(command));
  }

  private async retrieveAndGenerateAdvanced(
    question: string,
    modelArn: string,
    ragConfig: RAGConfiguration,
    sessionId?: string
  ): Promise<RetrieveAndGenerateCommandOutput> {
    const knowledgeBaseId = this.getKnowledgeBaseId();
    
    // Map our search type to AWS SDK search type
    const awsSearchType = this.mapSearchType(ragConfig.hybridSearch.searchType);
    
    const input: RetrieveAndGenerateCommandInput = {
      input: {
        text: question
      },
      retrieveAndGenerateConfiguration: {
        type: 'KNOWLEDGE_BASE',
        knowledgeBaseConfiguration: {
          knowledgeBaseId: knowledgeBaseId,
          modelArn: modelArn,
          retrievalConfiguration: {
            vectorSearchConfiguration: {
              numberOfResults: ragConfig.retrieval.numberOfResults,
              overrideSearchType: awsSearchType,
              // Note: AWS Bedrock Knowledge Base doesn't currently support 
              // custom semantic/keyword weights in the API, but we track them
              // for future use and for our own relevance scoring
            }
          },
          generationConfiguration: {
            promptTemplate: {
              textPromptTemplate: this.buildAdvancedPromptTemplate(ragConfig)
            }
          }
        }
      },
      // Add session management for conversation context
      ...(sessionId && { sessionId }),
      // Only include sessionConfiguration if we have a KMS key (it's required)
      ...(process.env.KMS_KEY_ARN && {
        sessionConfiguration: {
          kmsKeyArn: process.env.KMS_KEY_ARN
        }
      })
    };

    const command = new RetrieveAndGenerateCommand(input);
    return await this.executeWithRetry(() => this.bedrockAgentRuntime.send(command));
  }

  private extractSources(response: RetrieveAndGenerateCommandOutput): DocumentSource[] {
    if (!response.citations) {
      return [];
    }

    return response.citations.flatMap((citation, citationIndex) => {
      return citation.retrievedReferences?.map((reference, refIndex) => {
        // Extract file name from S3 URI properly
        const s3Uri = reference.location?.s3Location?.uri || '';
        const fileName = s3Uri.split('/').pop() || `Document ${citationIndex}-${refIndex}`;
        
        // Get confidence from retrieval metadata - Bedrock uses different field names
        let confidence = 0.0;
        if (reference.metadata) {
          // Try different possible confidence field names from Bedrock
          const scoreFields = ['score', 'confidence', 'relevanceScore', '_score'];
          for (const field of scoreFields) {
            if (reference.metadata[field] !== undefined) {
              const scoreValue = reference.metadata[field];
              confidence = typeof scoreValue === 'string' ? 
                parseFloat(scoreValue) : 
                typeof scoreValue === 'number' ? scoreValue : 0.0;
              break;
            }
          }
        }
        
        // Extract page number if available
        let pageNumber: number | undefined;
        if (reference.metadata?.page) {
          const pageValue = reference.metadata.page;
          pageNumber = typeof pageValue === 'string' ? 
            parseInt(pageValue) : 
            typeof pageValue === 'number' ? pageValue : undefined;
        }
        
        return {
          documentId: s3Uri || `doc-${citationIndex}-${refIndex}`,
          fileName: fileName.replace(/\.[^/.]+$/, '') || 'Unknown Document', // Remove file extension for display, ensure not empty
          excerpt: reference.content?.text || '',
          confidence: Math.min(Math.max(confidence, 0), 1), // Clamp between 0-1
          s3Location: s3Uri,
          pageNumber
        };
      }) || [];
    });
  }

  private extractTokenUsage(response: RetrieveAndGenerateCommandOutput): TokenUsage {
    // For now, estimate token usage based on text length
    // In a real implementation, this would come from the response metadata
    const outputText = response.output?.text || '';
    
    // Estimate input tokens based on typical question length
    const inputTokens = Math.ceil(200 / 4); // Rough estimate: 4 chars per token, assume 200 char question
    const outputTokens = Math.ceil(outputText.length / 4);
    
    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens
    };
  }

  private calculateCost(tokenUsage: TokenUsage, modelConfig: any): number {
    if (!modelConfig) {
      return 0;
    }
    
    const inputCost = tokenUsage.inputTokens * modelConfig.costPerInputToken;
    const outputCost = tokenUsage.outputTokens * modelConfig.costPerOutputToken;
    
    return inputCost + outputCost;
  }

  private async trackMetrics(
    modelUsed: string,
    tokenUsage: TokenUsage,
    responseTime: number
  ): Promise<void> {
    try {
      const command = new PutMetricDataCommand({
        Namespace: 'AI-Assistant/Chat',
        MetricData: [
          {
            MetricName: 'ResponseTime',
            Value: responseTime,
            Unit: 'Milliseconds',
            Dimensions: [
              {
                Name: 'ModelUsed',
                Value: modelUsed
              }
            ]
          },
          {
            MetricName: 'TokenUsage',
            Value: tokenUsage.totalTokens,
            Unit: 'Count',
            Dimensions: [
              {
                Name: 'ModelUsed',
                Value: modelUsed
              }
            ]
          }
        ]
      });
      
      await this.cloudWatch.send(command);
    } catch (error) {
      console.error('Failed to track metrics:', error);
      // Don't throw - metrics failure shouldn't break the main flow
    }
  }

  private extractModelName(modelArn: string): string {
    // Extract readable model name from ARN
    if (modelArn.includes('claude-opus-4-1')) {
      return 'claude-opus-4-1';
    } else if (modelArn.includes('claude-3-7-sonnet')) {
      return 'claude-3-7-sonnet';
    } else if (modelArn.includes('claude-3-5-sonnet')) {
      return 'claude-3-5-sonnet-v2';
    }
    return modelArn; // Return full ARN if no match
  }

  private mapSearchType(searchType: string): 'HYBRID' | 'SEMANTIC' | undefined {
    // Map our internal search types to AWS SDK types
    switch (searchType) {
      case 'HYBRID':
        return 'HYBRID';
      case 'SEMANTIC':
        return 'SEMANTIC';
      case 'KEYWORD':
        // AWS SDK doesn't have a pure KEYWORD type, use HYBRID as fallback
        return 'HYBRID';
      default:
        return 'HYBRID';
    }
  }

  private buildAdvancedPromptTemplate(ragConfig: RAGConfiguration): string {
    return `
You are an AI assistant helping with software development questions. 
Please provide comprehensive, accurate answers based on the retrieved context.

Guidelines:
- Use the provided context to answer the question thoroughly
- Include specific examples and code snippets when relevant
- If the context doesn't contain sufficient information, clearly state this
- Cite your sources by referencing the document names
- Prioritize information from sources with higher confidence scores
- Ensure your response meets these quality standards:
  - Minimum length: ${ragConfig.qualityThresholds.minAnswerLength} characters
  - Include at least ${ragConfig.qualityThresholds.minSources} supporting sources
  - Maintain confidence threshold of ${ragConfig.qualityThresholds.minConfidence}

Question: $query$

Context: $search_results$

Please provide a detailed, well-structured answer:
    `.trim();
  }

  private async trackAdvancedMetrics(
    modelUsed: string,
    tokenUsage: TokenUsage,
    responseTime: number,
    qualityMetrics: ResponseQuality,
    ragConfig: RAGConfiguration
  ): Promise<void> {
    try {
      const command = new PutMetricDataCommand({
        Namespace: 'AI-Assistant/AdvancedRAG',
        MetricData: [
          {
            MetricName: 'ResponseTime',
            Value: responseTime,
            Unit: 'Milliseconds',
            Dimensions: [
              { Name: 'ModelUsed', Value: modelUsed },
              { Name: 'SearchType', Value: ragConfig.hybridSearch.searchType }
            ]
          },
          {
            MetricName: 'QualityScore',
            Value: qualityMetrics.qualityScore,
            Unit: 'None',
            Dimensions: [
              { Name: 'ModelUsed', Value: modelUsed }
            ]
          },
          {
            MetricName: 'CompletenessScore',
            Value: qualityMetrics.completenessScore,
            Unit: 'None',
            Dimensions: [
              { Name: 'ModelUsed', Value: modelUsed }
            ]
          },
          {
            MetricName: 'ReliabilityScore',
            Value: qualityMetrics.reliabilityScore,
            Unit: 'None',
            Dimensions: [
              { Name: 'ModelUsed', Value: modelUsed }
            ]
          },
          {
            MetricName: 'NumberOfResults',
            Value: ragConfig.retrieval.numberOfResults,
            Unit: 'Count',
            Dimensions: [
              { Name: 'ModelUsed', Value: modelUsed }
            ]
          },
          {
            MetricName: 'TokenUsage',
            Value: tokenUsage.totalTokens,
            Unit: 'Count',
            Dimensions: [
              { Name: 'ModelUsed', Value: modelUsed }
            ]
          }
        ]
      });
      
      await this.cloudWatch.send(command);
    } catch (error) {
      console.error('Failed to track advanced metrics:', error);
      // Don't throw - metrics failure shouldn't break the main flow
    }
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<T> {
    // Implement rate limiting
    await this.enforceRateLimit();
    
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        this.lastRequestTime = Date.now();
        return result;
      } catch (error: any) {
        lastError = error;
        
        // Check if error is retryable
        const isRetryable = this.isRetryableError(error);
        
        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }
        
        // For throttling errors, use longer delays
        let delay = baseDelayMs * Math.pow(2, attempt);
        if (error.name === 'ThrottlingException') {
          delay = Math.max(delay, 5000); // Minimum 5 seconds for throttling
        }
        
        // Add jitter to prevent thundering herd
        delay += Math.random() * 1000;
        
        console.log(`Attempt ${attempt + 1} failed (${error.name}), retrying in ${delay}ms:`, error.message);
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
      await this.sleep(waitTime);
    }
  }

  private isRetryableError(error: any): boolean {
    // Check for retryable error types
    const retryableErrors = [
      'ThrottlingException',
      'ServiceUnavailableException',
      'InternalServerException',
      'ConflictException'
    ];
    
    return retryableErrors.includes(error.name) || 
           error.statusCode >= 500 ||
           error.code === 'ECONNRESET' ||
           error.code === 'ETIMEDOUT';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleBedrockError(error: BedrockError): BedrockError {
    const bedrockError: BedrockError = new Error(error.message);
    
    // Handle specific Bedrock Knowledge Base errors
    if (error.name === 'ResourceNotFoundException') {
      bedrockError.code = 'KNOWLEDGE_BASE_NOT_FOUND';
      bedrockError.statusCode = 404;
      bedrockError.retryable = false;
      bedrockError.message = 'Knowledge Base not found or not accessible';
    } else if (error.name === 'ValidationException') {
      bedrockError.code = 'VALIDATION_ERROR';
      bedrockError.statusCode = 400;
      bedrockError.retryable = false;
      bedrockError.message = error.message || 'Invalid request parameters';
    } else if (error.name === 'ThrottlingException') {
      bedrockError.code = 'RATE_LIMIT_EXCEEDED';
      bedrockError.statusCode = 429;
      bedrockError.retryable = true;
      bedrockError.message = 'Request rate limit exceeded. Please wait a moment and try again.';
    } else if (error.name === 'ServiceQuotaExceededException') {
      bedrockError.code = 'SERVICE_QUOTA_EXCEEDED';
      bedrockError.statusCode = 400;
      bedrockError.retryable = false;
      bedrockError.message = 'Service quota exceeded';
    } else if (error.name === 'AccessDeniedException') {
      bedrockError.code = 'AUTHORIZATION_FAILED';
      bedrockError.statusCode = 403;
      bedrockError.retryable = false;
      bedrockError.message = 'Access denied to Knowledge Base or model';
    } else if (error.name === 'ConflictException') {
      bedrockError.code = 'KNOWLEDGE_BASE_BUSY';
      bedrockError.statusCode = 409;
      bedrockError.retryable = true;
      bedrockError.message = 'Knowledge Base is currently processing, please retry';
    } else {
      bedrockError.code = error.code || 'UNKNOWN_ERROR';
      bedrockError.statusCode = error.statusCode || 500;
      bedrockError.retryable = error.retryable || false;
    }
    
    return bedrockError;
  }
}