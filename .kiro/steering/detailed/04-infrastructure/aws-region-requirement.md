# AWS Region Requirement

## Mandatory AWS Region: us-west-2

**CRITICAL REQUIREMENT**: All AWS infrastructure MUST be deployed in the `us-west-2` region.

## Mandatory AWS CLI Profile: aidlc_main

**CRITICAL REQUIREMENT**: All AWS operations for this project MUST use the `--profile aidlc_main` AWS CLI profile.

### Scope
This requirement applies to:
- All Terraform infrastructure deployments
- All AWS resources (Lambda, DynamoDB, S3, OpenSearch, Cognito, etc.)
- All environment configurations (dev, staging, prod)
- All MCP server tool usage with AWS region parameters

### Exceptions
The only exception is for resources that MUST be in specific regions due to AWS service requirements:
- CloudFront SSL certificates (must be in us-east-1)
- Global services that don't have region specification

### Implementation Requirements
1. **AWS CLI Profile**: Always use `--profile aidlc_main` for all AWS operations
2. **Terraform Variables**: All `aws_region` variables must default to `us-west-2`
3. **Environment Files**: All environment-specific tfvars files must specify `aws_region = "us-west-2"`
4. **MCP Tool Usage**: When using Terraform MCP server tools, always specify `aws_region: "us-west-2"`
5. **Provider Configuration**: Primary AWS provider must use `profile = "aidlc_main"` and `region = "us-west-2"`

### Validation
Before any deployment:
1. Verify all terraform.tfvars files specify us-west-2
2. Confirm variables.tf defaults to us-west-2
3. Check that MCP tool calls include the correct region parameter

### Rationale
- Consistent resource location for reduced latency
- Simplified networking and security configurations
- Cost optimization through regional resource grouping
- Compliance with organizational standards

**VIOLATION CONSEQUENCES**: Any infrastructure deployed in other regions (except approved exceptions) must be immediately destroyed and recreated in us-west-2.