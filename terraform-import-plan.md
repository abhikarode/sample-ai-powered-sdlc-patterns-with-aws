# Terraform Import Plan - AWS Resources Drift Fix

## Issue Summary
Major Infrastructure as Code drift detected. Many AWS resources exist but are not managed by Terraform state.

## Resources to Import

### 1. Knowledge Base Infrastructure
- **Knowledge Base**: `PQB7MB5ORO` (ai-assistant-knowledge-base)
- **OpenSearch Collection**: `bhp9z0d7dyxdo1yik5ej` (ai-assistant-kb-collection)
- **IAM Role**: `ai-assistant-dev-bedrock-kb-role`
- **OpenSearch Security Policies**: encryption, network, data access

### 2. CloudFront Distribution
- **Distribution**: `EL8L41G6CQJCD` (dq9tlzfsf1veq.cloudfront.net)

### 3. Lambda Functions (Missing from State)
- `ai-assistant-chat-endpoints`
- `ai-assistant-dev-admin-management`
- `ai-assistant-dev-document-management`
- `ai-assistant-dev-document-upload`
- `ai-assistant-dev-kb-sync-monitor`
- `ai-assistant-monitoring-metrics`

### 4. IAM Roles (Missing from State)
- `ai-assistant-chat-handler-role`
- `ai-assistant-lambda-admin-execution-role`
- `ai-assistant-lambda-chat-execution-role`
- `ai-assistant-lambda-document-execution-role`
- `ai-assistant-lambda-kb-monitor-execution-role`
- `ai-assistant-monitoring-metrics-role`

### 5. DynamoDB Table
- `ai-assistant-dev-documents`

### 6. API Gateway Mismatch
- Current state has: `jpt8wzkowd`
- Also exists: `ojfkk555ge` (older version?)

## Import Strategy
1. Import missing core infrastructure resources
2. Update Terraform configuration to match actual deployed state
3. Remove duplicate/unused resources
4. Verify all resources are properly managed

## Priority Order
1. Knowledge Base and OpenSearch (critical for current issue)
2. Lambda functions and IAM roles
3. DynamoDB table
4. CloudFront distribution
5. Clean up duplicate API Gateway