---
inclusion: manual
---

# Claude Model Selection Guide - AWS Bedrock Nuances

## Model Characteristics & Use Cases

### Claude Opus 4.1 - Premium Intelligence
- **Model ID**: `anthropic.claude-opus-4-1-20250805-v1:0`
- **Strengths**: Highest intelligence, multimodal (text + image), extended thinking
- **Latency**: Moderately fast (slower than Sonnet models)
- **Cost**: Premium ($15/MTok input, $75/MTok output)
- **Training Cutoff**: March 2025 (most recent knowledge)
- **Best For**: 
  - Complex reasoning tasks requiring deep analysis
  - Multimodal queries (when image support needed)
  - Critical business decisions requiring highest accuracy
  - Research and analysis tasks
- **When NOT to Use**: Simple queries, cost-sensitive applications, latency-critical responses

### Claude 3.7 Sonnet - Balanced Performance
- **Model ID**: `anthropic.claude-3-7-sonnet-20250219-v1:0`
- **Strengths**: Extended thinking, balanced speed/quality, excellent reasoning
- **Latency**: Fast (optimal for production)
- **Cost**: Moderate ($3/MTok input, $15/MTok output)
- **Training Cutoff**: November 2024
- **Best For**:
  - Primary production workload (80% of queries)
  - Software development assistance
  - Technical documentation analysis
  - Balanced cost/performance requirements
- **Ideal Use**: Main production model with Provisioned Throughput

### Claude 3.5 Sonnet v2 - High Availability
- **Model ID**: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- **Strengths**: Multiple context lengths (18k, 51k, 200k), high availability
- **Latency**: Fast (similar to 3.7 Sonnet)
- **Cost**: Moderate ($3/MTok input, $15/MTok output)
- **Training Cutoff**: April 2024
- **Best For**:
  - Fallback when 3.7 Sonnet unavailable
  - Variable context length requirements
  - High availability scenarios
- **Ideal Use**: On-demand fallback model

## AWS Bedrock Invocation Methods

### On-Demand Invocation
**Characteristics:**
- Pay-per-token pricing (input + output tokens)
- Shared capacity with variable latency
- Subject to service quotas and throttling
- No upfront commitment required
- Immediate availability

**Best For:**
- Development and testing environments
- Variable or unpredictable workloads
- Cost optimization for low-volume usage
- Fallback scenarios

**Pricing Model:**
```
Cost = (Input Tokens × Input Rate) + (Output Tokens × Output Rate)
```

### Provisioned Throughput
**Characteristics:**
- Fixed hourly cost regardless of usage
- Dedicated capacity with consistent latency
- Guaranteed throughput (Model Units - MUs)
- Commitment options: None, 1-month, 6-month
- Higher upfront cost but predictable performance

**Best For:**
- Production workloads with predictable traffic
- Latency-sensitive applications
- High-volume consistent usage
- SLA requirements for response times

**Pricing Model:**
```
Cost = Hourly Rate × Hours × Model Units × Commitment Discount
```

## Decision Matrix for AI Assistant

### Query Classification Strategy

```typescript
enum QueryComplexity {
  SIMPLE = 'simple',     // Basic questions, simple lookups
  MODERATE = 'moderate', // Technical questions, code analysis
  COMPLEX = 'complex'    // Deep analysis, multi-step reasoning
}

function classifyQuery(question: string, documentCount: number): QueryComplexity {
  // Simple: Short questions, single document references
  if (question.length < 100 && documentCount <= 2) {
    return QueryComplexity.SIMPLE;
  }
  
  // Complex: Long questions, multiple documents, analysis keywords
  const complexKeywords = ['analyze', 'compare', 'evaluate', 'design', 'architecture'];
  if (question.length > 300 || documentCount > 5 || 
      complexKeywords.some(keyword => question.toLowerCase().includes(keyword))) {
    return QueryComplexity.COMPLEX;
  }
  
  return QueryComplexity.MODERATE;
}
```

### Model Selection Logic

| Query Type | Primary Model | Invocation Method | Fallback Strategy |
|------------|---------------|-------------------|-------------------|
| **Simple** | Claude 3.7 Sonnet | On-Demand | 3.5 Sonnet v2 On-Demand |
| **Moderate** | Claude 3.7 Sonnet | Provisioned (Prod) / On-Demand (Dev) | 3.5 Sonnet v2 On-Demand |
| **Complex** | Claude Opus 4.1 | On-Demand | 3.7 Sonnet Provisioned |
| **Multimodal** | Claude Opus 4.1 | On-Demand | Not applicable |

### Cost Optimization Strategies

#### Development Environment
- Use On-Demand for all models
- Implement cost tracking per query type
- Monitor token usage patterns
- Test model performance characteristics

#### Production Environment
- **Primary**: Claude 3.7 Sonnet with Provisioned Throughput (1-month commitment)
- **Premium**: Claude Opus 4.1 On-Demand for complex queries (< 10% of traffic)
- **Fallback**: Claude 3.5 Sonnet v2 On-Demand
- **Cost Control**: Query classification and routing

#### Capacity Planning
```typescript
// Example capacity calculation for Provisioned Throughput
const EXPECTED_QUERIES_PER_MINUTE = 100;
const AVERAGE_INPUT_TOKENS = 500;
const AVERAGE_OUTPUT_TOKENS = 200;

const REQUIRED_INPUT_CAPACITY = EXPECTED_QUERIES_PER_MINUTE * AVERAGE_INPUT_TOKENS;
const REQUIRED_OUTPUT_CAPACITY = EXPECTED_QUERIES_PER_MINUTE * AVERAGE_OUTPUT_TOKENS;

// Model Units needed (consult AWS for specific MU specifications)
const ESTIMATED_MODEL_UNITS = Math.ceil(
  Math.max(REQUIRED_INPUT_CAPACITY, REQUIRED_OUTPUT_CAPACITY) / MU_CAPACITY_PER_MINUTE
);
```

## Performance Considerations

### Latency Optimization
- **Fastest**: Claude 3.5 Haiku (not in our hierarchy but available)
- **Fast**: Claude 3.7 Sonnet, Claude 3.5 Sonnet v2
- **Moderate**: Claude Opus 4.1
- **Latency-Optimized Inference**: Available for select models in specific regions

### Throughput Management
- **On-Demand Quotas**: Region-specific limits (tokens per minute)
- **Provisioned Throughput**: Guaranteed capacity with Model Units
- **Cross-Region Inference**: Available for increased throughput
- **Fallback Strategy**: Automatic degradation to available models

### Cost Management
- **Token Efficiency**: Optimize prompts to reduce token usage
- **Model Selection**: Route queries to appropriate model tier
- **Caching**: Implement response caching for repeated queries
- **Monitoring**: Track costs per model and query type

## Implementation Best Practices

### Error Handling
```typescript
async function invokeWithIntelligentFallback(
  query: string,
  complexity: QueryComplexity
): Promise<ChatResponse> {
  const modelHierarchy = getModelHierarchy(complexity);
  
  for (const modelConfig of modelHierarchy) {
    try {
      return await invokeModel(modelConfig, query);
    } catch (error) {
      if (error.code === 'ThrottlingException') {
        // Try next model in hierarchy
        continue;
      } else if (error.code === 'ModelNotAvailableException') {
        // Model temporarily unavailable
        continue;
      } else {
        // Unexpected error - log and continue
        console.error(`Model ${modelConfig.name} failed:`, error);
        continue;
      }
    }
  }
  
  throw new Error('All Claude models unavailable');
}
```

### Monitoring and Alerting
- **Cost Alerts**: Set up CloudWatch alarms for unexpected cost spikes
- **Performance Monitoring**: Track latency and success rates per model
- **Capacity Monitoring**: Monitor Provisioned Throughput utilization
- **Fallback Tracking**: Alert when fallback models are used frequently

### Testing Strategy
- **Load Testing**: Test with realistic query distributions
- **Cost Analysis**: Measure actual costs across different scenarios
- **Performance Benchmarking**: Compare On-Demand vs Provisioned latency
- **Failover Testing**: Validate fallback mechanisms work correctly

## Success Metrics

### Performance KPIs
- **Response Time**: < 10 seconds for 95% of queries
- **Availability**: > 99.9% uptime with fallback models
- **Accuracy**: User satisfaction scores by model type
- **Cost Efficiency**: Cost per successful query by complexity

### Operational KPIs
- **Model Utilization**: Distribution of queries across models
- **Fallback Rate**: Percentage of queries using fallback models
- **Token Efficiency**: Average tokens per query by type
- **Capacity Utilization**: Provisioned Throughput usage patterns

This guide ensures optimal Claude model selection for the AI assistant, balancing performance, cost, and reliability across different use cases and environments.