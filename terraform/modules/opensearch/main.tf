# OpenSearch Serverless resources for Knowledge Base vector storage

# Encryption security policy for OpenSearch Serverless collection
resource "aws_opensearchserverless_security_policy" "encryption" {
  name = "${var.project_name}-${var.environment}-encryption-policy"
  type = "encryption"
  
  policy = jsonencode({
    Rules = [
      {
        Resource = [
          "collection/${var.opensearch_collection_name}"
        ]
        ResourceType = "collection"
      }
    ]
    AWSOwnedKey = true
  })
  
  description = "Encryption policy for ${var.project_name} ${var.environment} OpenSearch collection"
}

# Network security policy for OpenSearch Serverless collection
resource "aws_opensearchserverless_security_policy" "network" {
  name = "${var.project_name}-${var.environment}-network-policy"
  type = "network"
  
  policy = jsonencode([
    {
      Rules = [
        {
          Resource = [
            "collection/${var.opensearch_collection_name}"
          ]
          ResourceType = "collection"
        },
        {
          Resource = [
            "collection/${var.opensearch_collection_name}"
          ]
          ResourceType = "dashboard"
        }
      ]
      AllowFromPublic = true
    }
  ])
  
  description = "Network policy for ${var.project_name} ${var.environment} OpenSearch collection"
}

# Data access policy for OpenSearch Serverless collection
resource "aws_opensearchserverless_access_policy" "data_access" {
  name = "${var.project_name}-${var.environment}-data-access-policy"
  type = "data"
  
  policy = jsonencode([
    {
      Rules = [
        {
          Resource = [
            "collection/${var.opensearch_collection_name}"
          ]
          Permission = [
            "aoss:CreateCollectionItems",
            "aoss:DeleteCollectionItems",
            "aoss:UpdateCollectionItems",
            "aoss:DescribeCollectionItems"
          ]
          ResourceType = "collection"
        },
        {
          Resource = [
            "index/${var.opensearch_collection_name}/*"
          ]
          Permission = [
            "aoss:CreateIndex",
            "aoss:DeleteIndex",
            "aoss:UpdateIndex",
            "aoss:DescribeIndex",
            "aoss:ReadDocument",
            "aoss:WriteDocument"
          ]
          ResourceType = "index"
        }
      ]
      Principal = [
        var.bedrock_kb_role_arn,
        data.aws_caller_identity.current.arn
      ]
    }
  ])
  
  description = "Data access policy for ${var.project_name} ${var.environment} OpenSearch collection"
}

# OpenSearch Serverless collection for vector storage
resource "aws_opensearchserverless_collection" "kb_collection" {
  name = var.opensearch_collection_name
  type = "VECTORSEARCH"
  
  description = "Vector search collection for ${var.project_name} ${var.environment} Knowledge Base"
  
  tags = merge(var.additional_tags, {
    Name        = var.opensearch_collection_name
    Purpose     = "Knowledge Base Vector Storage"
    Environment = var.environment
  })
  
  depends_on = [
    aws_opensearchserverless_security_policy.encryption,
    aws_opensearchserverless_security_policy.network,
    aws_opensearchserverless_access_policy.data_access
  ]
}

# Data source for current AWS account and caller identity
data "aws_caller_identity" "current" {}