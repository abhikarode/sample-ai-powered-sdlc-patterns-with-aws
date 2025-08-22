---
inclusion: manual
---

# Claude Sonnet 4 Model Requirement

## Mandatory Model Usage

**CRITICAL REQUIREMENT**: All AI chat functionality MUST use Claude Sonnet 4 as the ONLY model for generating responses.

## Model Specification

- **Model Name**: Claude Sonnet 4
- **Model ID**: `anthropic.claude-sonnet-4-20250514-v1:0`
- **Inference Profile ID**: `us.anthropic.claude-sonnet-4-20250514-v1:0`
- **Full Inference Profile ARN**: `arn:aws:bedrock:us-west-2:ACCOUNT_ID:inference-profile/us.anthropic.claude-sonnet-4-20250514-v1:0`

## Implementation Requirements

### 1. Inference Profile Usage
- **MUST** use the full inference profile ARN format for RetrieveAndGenerate API calls
- **MUST NOT** use direct model IDs or on-demand throughput
- **MUST** use cross-region inference profiles for better availability

### 2. Code Implementation
```typescript
// CORRECT - Use full inference profile ARN
const modelArn = `arn:aws:bedrock:${region}:${accountId}:inference-profile/us.anthropic.claude-sonnet-4-20250514-v1:0`;

// INCORRECT - Do not use direct model ID
const modelArn = 'anthropic.claude-sonnet-4-20250514-v1:0';
```

### 3. RetrieveAndGenerate Configuration
```typescript
const response = await bedrockAgentRuntime.retrieveAndGenerate({
  input: { text: question },
  retrieveAndGenerateConfiguration: {
    type: 'KNOWLEDGE_BASE',
    knowledgeBaseConfiguration: {
      knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
      modelArn: `arn:aws:bedrock:${region}:${accountId}:inference-profile/us.anthropic.claude-sonnet-4-20250514-v1:0`,
      // ... other configuration
    }
  }
});
```

## Prohibited Models

The following models are **STRICTLY FORBIDDEN**:
- Claude 3.5 Sonnet (any version)
- Claude 3.7 Sonnet
- Claude Opus 4.1
- Any other Claude model variants
- Any non-Claude models

## Error Handling

If Claude Sonnet 4 is unavailable:
- **DO NOT** fall back to other models
- **MUST** return appropriate error message to user
- **MUST** log the unavailability for monitoring

## Rationale

Claude Sonnet 4 is the designated model for this project due to:
- Latest generation capabilities
- Optimal performance for our use cases
- Consistency requirements across all interactions
- Project-specific model selection criteria

## Compliance

**VIOLATION CONSEQUENCES**: Any code that uses models other than Claude Sonnet 4 will be immediately rejected and must be rewritten to use only Claude Sonnet 4.

This requirement applies to:
- All chat handlers
- All AI response generation
- All knowledge base interactions
- All model selection logic
- All fallback mechanisms