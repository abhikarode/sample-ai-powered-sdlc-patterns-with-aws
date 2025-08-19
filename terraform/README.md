# AI Assistant Terraform Infrastructure

This Terraform configuration sets up the infrastructure for an AI-powered software development assistant using Amazon Bedrock Knowledge Bases.

## Architecture Overview

The infrastructure includes:

- **Amazon Bedrock Knowledge Base**: Central RAG component for document processing and AI responses
- **S3 Bucket**: Document storage that serves as the Knowledge Base data source
- **OpenSearch Serverless**: Vector database for semantic search (managed by Knowledge Base)
- **IAM Roles and Policies**: Secure access between services
- **Security Policies**: OpenSearch Serverless encryption, network, and data access policies

## Prerequisites

1. **AWS CLI**: Configured with `aidlc_main` profile
2. **Terraform**: Version >= 1.0
3. **AWS Permissions**: Required permissions for Bedrock, S3, OpenSearch Serverless, and IAM

## Quick Start

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Validate Configuration

```bash
terraform validate
```

### 3. Plan Deployment

```bash
terraform plan -var-file="environments/dev/terraform.tfvars"
```

### 4. Deploy Infrastructure

```bash
terraform apply -var-file="environments/dev/terraform.tfvars"
```

## Configuration

### Environment Variables

The configuration uses environment-specific variable files:

- `environments/dev/terraform.tfvars` - Development environment
- `environments/staging/terraform.tfvars` - Staging environment (to be created)
- `environments/prod/terraform.tfvars` - Production environment (to be created)

### Key Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region (must be us-west-2) | `us-west-2` |
| `environment` | Environment name | `dev` |
| `knowledge_base_name` | Name of the Bedrock Knowledge Base | `ai-assistant-knowledge-base` |
| `embedding_model_arn` | ARN of the embedding model | Titan Text Embeddings V2 |
| `chunk_max_tokens` | Maximum tokens per document chunk | `300` |
| `chunk_overlap_percentage` | Overlap between chunks | `20` |

## Outputs

After deployment, Terraform provides these outputs:

- `knowledge_base_id` - ID of the Bedrock Knowledge Base
- `knowledge_base_arn` - ARN of the Knowledge Base
- `data_source_id` - ID of the S3 data source
- `documents_bucket_name` - Name of the S3 documents bucket
- `opensearch_collection_endpoint` - OpenSearch collection endpoint

## Security Features

### S3 Security
- ✅ Server-side encryption (AES256)
- ✅ Public access blocked
- ✅ Versioning enabled
- ✅ Lifecycle policies for cost optimization
- ✅ Abort incomplete multipart uploads

### IAM Security
- ✅ Least privilege access policies
- ✅ Service-specific roles
- ✅ Account condition checks

### OpenSearch Security
- ✅ Encryption at rest (AWS owned keys)
- ✅ Network access policies
- ✅ Data access policies with principal restrictions

## Testing

The configuration includes validation tests that verify:

1. All required resources are defined
2. Knowledge Base uses correct embedding model
3. S3 bucket is in the correct region
4. OpenSearch collection is VECTORSEARCH type

Run tests with:
```bash
terraform plan
```

## Security Scanning

Run Checkov security scan:
```bash
checkov -f main.tf --framework terraform
```

## Troubleshooting

### Common Issues

1. **OpenSearch Policy Name Too Long**
   - Policy names are limited to 32 characters
   - Use shortened names like `ai-assistant-dev-encrypt`

2. **Bedrock Model Access**
   - Ensure Bedrock models are available in us-west-2
   - Check IAM permissions for bedrock:InvokeModel

3. **S3 Bucket Name Conflicts**
   - Bucket names include random suffix for uniqueness
   - Check for existing buckets with similar names

### Useful Commands

```bash
# Format Terraform files
terraform fmt

# Show current state
terraform show

# List resources
terraform state list

# Destroy infrastructure (use with caution)
terraform destroy -var-file="environments/dev/terraform.tfvars"
```

## Next Steps

After infrastructure deployment:

1. Upload test documents to the S3 bucket
2. Trigger Knowledge Base synchronization
3. Test RetrieveAndGenerate API functionality
4. Deploy Lambda functions for chat interface
5. Set up API Gateway and frontend application

## Support

For issues or questions:
1. Check Terraform logs for detailed error messages
2. Verify AWS credentials and permissions
3. Ensure all prerequisites are met
4. Review AWS service quotas and limits