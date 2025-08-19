import { ModelConfig, QueryComplexity } from './types';

// Claude model hierarchy with inference profiles for better availability
export const CLAUDE_INFERENCE_PROFILE_HIERARCHY = [
  'us.anthropic.claude-opus-4-1-20250805-v1:0',      // Claude Opus 4.1 Cross-Region (Primary)
  'us.anthropic.claude-3-7-sonnet-20250219-v1:0',   // Claude 3.7 Sonnet Cross-Region (Fallback)
  'us.anthropic.claude-3-5-sonnet-20241022-v2:0'    // Claude 3.5 Sonnet v2 Cross-Region (Secondary)
];

// Direct model fallback for specific use cases
export const CLAUDE_DIRECT_MODEL_HIERARCHY = [
  'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0', // This one works with Knowledge Base
  'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-7-sonnet-20250219-v1:0',
  'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-opus-4-1-20250805-v1:0'
];

export const MODEL_CONFIGS: ModelConfig[] = [
  {
    modelArn: 'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-opus-4-1-20250805-v1:0',
    name: 'claude-opus-4-1',
    costPerInputToken: 0.000015,  // $15/MTok
    costPerOutputToken: 0.000075, // $75/MTok
    latencyTier: 'moderate',
    capabilities: ['multimodal', 'extended-thinking', 'complex-reasoning'],
    maxContextLength: 200000
  },
  {
    modelArn: 'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-7-sonnet-20250219-v1:0',
    name: 'claude-3-7-sonnet',
    costPerInputToken: 0.000003,  // $3/MTok
    costPerOutputToken: 0.000015, // $15/MTok
    latencyTier: 'fast',
    capabilities: ['extended-thinking', 'balanced-performance'],
    maxContextLength: 200000
  },
  {
    modelArn: 'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0',
    name: 'claude-3-5-sonnet-v2',
    costPerInputToken: 0.000003,  // $3/MTok
    costPerOutputToken: 0.000015, // $15/MTok
    latencyTier: 'fast',
    capabilities: ['high-availability', 'multiple-context-lengths'],
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
  
  // For complex queries or multimodal needs, prefer Opus 4.1
  if (queryComplexity === QueryComplexity.COMPLEX || requiresMultimodal) {
    return MODEL_CONFIGS[0]; // Claude Opus 4.1
  }
  
  // For moderate and simple complexity, use 3.7 Sonnet (best balance)
  return MODEL_CONFIGS[1]; // Claude 3.7 Sonnet
}

export function getModelConfigByName(modelName: string): ModelConfig | undefined {
  return MODEL_CONFIGS.find(config => 
    config.name === modelName || config.modelArn.includes(modelName)
  );
}