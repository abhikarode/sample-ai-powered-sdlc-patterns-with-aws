import { ModelConfig, QueryComplexity } from './types';

// Claude inference profiles for better availability and cross-region routing
export const CLAUDE_INFERENCE_PROFILE_HIERARCHY = [
  'us.anthropic.claude-3-5-sonnet-20241022-v2:0',   // Claude 3.5 Sonnet v2 (Primary - proven to work)
  'us.anthropic.claude-3-7-sonnet-20250219-v1:0',   // Claude 3.7 Sonnet (Fallback)
  'us.anthropic.claude-sonnet-4-20250514-v1:0',     // Claude Sonnet 4 (Available via inference profile)
  'us.anthropic.claude-opus-4-1-20250805-v1:0'      // Claude Opus 4.1 (Last resort)
];

// Direct model fallback for specific use cases (if inference profiles fail)
export const CLAUDE_DIRECT_MODEL_HIERARCHY = [
  'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0', // This one works with Knowledge Base
  'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-7-sonnet-20250219-v1:0',
  'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-opus-4-1-20250805-v1:0'
];

// Note: These will be converted to full ARN format in the bedrock service
export const MODEL_CONFIGS: ModelConfig[] = [
  {
    modelArn: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0', // Inference profile ID (converted to ARN at runtime)
    name: 'claude-3-5-sonnet-v2',
    costPerInputToken: 0.000003,  // $3/MTok
    costPerOutputToken: 0.000015, // $15/MTok
    latencyTier: 'fast',
    capabilities: ['high-availability', 'multiple-context-lengths', 'cross-region'],
    maxContextLength: 200000
  },
  {
    modelArn: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0', // Inference profile ID
    name: 'claude-3-7-sonnet',
    costPerInputToken: 0.000003,  // $3/MTok
    costPerOutputToken: 0.000015, // $15/MTok
    latencyTier: 'fast',
    capabilities: ['extended-thinking', 'balanced-performance', 'cross-region'],
    maxContextLength: 200000
  },
  {
    modelArn: 'us.anthropic.claude-sonnet-4-20250514-v1:0', // Inference profile ID for Claude Sonnet 4
    name: 'claude-sonnet-4',
    costPerInputToken: 0.000003,  // Estimated $3/MTok (similar to other Sonnet models)
    costPerOutputToken: 0.000015, // Estimated $15/MTok
    latencyTier: 'fast',
    capabilities: ['multimodal', 'high-availability', 'latest-generation', 'cross-region'],
    maxContextLength: 200000
  },
  {
    modelArn: 'us.anthropic.claude-opus-4-1-20250805-v1:0', // Inference profile ID for Claude Opus 4.1
    name: 'claude-opus-4-1',
    costPerInputToken: 0.000015,  // $15/MTok
    costPerOutputToken: 0.000075, // $75/MTok
    latencyTier: 'moderate',
    capabilities: ['multimodal', 'extended-thinking', 'complex-reasoning', 'cross-region'],
    maxContextLength: 200000
  }
];

export function classifyQueryComplexity(question: string, documentCount: number = 0): QueryComplexity {
  // Simple: Short questions, single document references
  if (question.length < 100 && documentCount <= 2) {
    return QueryComplexity.SIMPLE;
  }
  
  // Complex: Long questions, multiple documents, analysis keywords
  const complexKeywords = ['analyze', 'compare', 'evaluate', 'design', 'architecture', 'comprehensive'];
  if (question.length > 300 || documentCount > 5 || 
      complexKeywords.some(keyword => question.toLowerCase().includes(keyword))) {
    return QueryComplexity.COMPLEX;
  }
  
  return QueryComplexity.MODERATE;
}

export function selectOptimalModel(
  queryComplexity: QueryComplexity,
  requiresMultimodal: boolean = false
): ModelConfig {
  
  // CRITICAL FIX: Use direct model IDs for on-demand invocation, not inference profile IDs
  // All models must use direct model IDs that support ON_DEMAND throughput
  
  // For complex queries, use Claude 3.5 Sonnet v2 (best available with on-demand support)
  if (queryComplexity === QueryComplexity.COMPLEX) {
    return {
      modelArn: 'anthropic.claude-3-5-sonnet-20241022-v2:0', // Direct model ID
      name: 'claude-3-5-sonnet-v2',
      costPerInputToken: 0.000003,
      costPerOutputToken: 0.000015,
      latencyTier: 'fast',
      capabilities: ['high-availability', 'multiple-context-lengths'],
      maxContextLength: 200000
    };
  }
  
  // For all other cases (simple, moderate), use Claude 3.5 Sonnet v2 (proven to work with Knowledge Base)
  return {
    modelArn: 'anthropic.claude-3-5-sonnet-20241022-v2:0', // Direct model ID
    name: 'claude-3-5-sonnet-v2',
    costPerInputToken: 0.000003,
    costPerOutputToken: 0.000015,
    latencyTier: 'fast',
    capabilities: ['high-availability', 'multiple-context-lengths'],
    maxContextLength: 200000
  };
}

export function getModelConfigByName(modelName: string): ModelConfig | undefined {
  return MODEL_CONFIGS.find(config => 
    config.name === modelName || config.modelArn.includes(modelName)
  );
}