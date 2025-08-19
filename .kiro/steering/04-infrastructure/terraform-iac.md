---
inclusion: always
---

# Terraform Infrastructure as Code Guidelines

## Mandatory Terraform Usage

**CRITICAL REQUIREMENT**: All Infrastructure as Code (IaC) tasks MUST use Terraform with the Terraform MCP tool. Do not use AWS CDK, CloudFormation, or any other IaC tools.

## Terraform MCP Tool Usage

### Required Tools
- Use `mcp_awslabsterraform_mcp_server_ExecuteTerraformCommand` for all Terraform operations
- Use `mcp_awslabsterraform_mcp_server_SearchAwsProviderDocs` for AWS resource documentation
- Use `mcp_awslabsterraform_mcp_server_SearchAwsccProviderDocs` for AWSCC provider resources when needed
- Use `mcp_awslabsterraform_mcp_server_RunCheckovScan` for security scanning

### Terraform Commands via MCP
Always use the Terraform MCP tool for:
- `terraform init` - Initialize Terraform working directory
- `terraform plan` - Create execution plan
- `terraform validate` - Validate configuration files
- `terraform apply` - Apply changes to infrastructure
- `terraform destroy` - Destroy infrastructure when needed

### Project Structure
```
terraform/
├── main.tf              # Main configuration
├── variables.tf         # Input variables
├── outputs.tf          # Output values
├── providers.tf        # Provider configurations
├── modules/            # Custom modules
│   ├── cognito/
│   ├── dynamodb/
│   ├── lambda/
│   └── s3/
└── environments/       # Environment-specific configs
    ├── dev/
    ├── staging/
    └── prod/
```

### Best Practices
1. **Always use the MCP Terraform tool** - Never run terraform commands directly
2. **Research AWS resources** using the AWS provider docs MCP tool before implementation
3. **Validate configurations** using terraform validate via MCP
4. **Security scan** all configurations using Checkov MCP tool
5. **Modular design** - Create reusable modules for common resources
6. **Environment separation** - Use separate state files for dev/staging/prod
7. **State management** - Use remote state with S3 backend and DynamoDB locking

### Example Usage Pattern
```bash
# Research AWS resource documentation first
mcp_awslabsterraform_mcp_server_SearchAwsProviderDocs(asset_name="aws_dynamodb_table")

# Initialize Terraform
mcp_awslabsterraform_mcp_server_ExecuteTerraformCommand(
    command="init",
    working_directory="./terraform"
)

# Validate configuration
mcp_awslabsterraform_mcp_server_ExecuteTerraformCommand(
    command="validate", 
    working_directory="./terraform"
)

# Security scan
mcp_awslabsterraform_mcp_server_RunCheckovScan(
    working_directory="./terraform"
)

# Plan changes
mcp_awslabsterraform_mcp_server_ExecuteTerraformCommand(
    command="plan",
    working_directory="./terraform"
)

# Apply changes
mcp_awslabsterraform_mcp_server_ExecuteTerraformCommand(
    command="apply",
    working_directory="./terraform"
)
```

### Required for All Infrastructure Tasks
- DynamoDB tables and indexes
- S3 buckets and policies
- Lambda functions and layers
- API Gateway and integrations
- Cognito User Pools and clients
- OpenSearch Serverless collections
- IAM roles and policies
- CloudWatch logs and alarms
- All other AWS resources

### Documentation Requirements
- Always research AWS provider documentation using MCP tools before writing Terraform
- Include resource documentation links in Terraform comments
- Document all variables and outputs
- Include examples and usage instructions

This ensures consistent, well-documented, and secure infrastructure deployment using Terraform best practices.