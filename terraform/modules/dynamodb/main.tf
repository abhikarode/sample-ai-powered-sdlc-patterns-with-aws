# DynamoDB table for document metadata
resource "aws_dynamodb_table" "documents" {
  name           = "${var.project_name}-${var.environment}-documents"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "PK"
  range_key      = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-documents"
    Purpose     = "Document Metadata Storage"
    Environment = var.environment
  })
}