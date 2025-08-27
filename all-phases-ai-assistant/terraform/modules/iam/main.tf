# IAM roles and policies for AI Assistant Lambda functions
# This module creates IAM roles with Bedrock Knowledge Base permissions

# Data source for current AWS caller identity
data "aws_caller_identity" "current" {}

# Lambda execution role for chat functions
resource "aws_iam_role" "lambda_chat_execution" {
  name = "${var.project_name}-lambda-chat-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Lambda execution role for document management functions
resource "aws_iam_role" "lambda_document_execution" {
  name = "${var.project_name}-lambda-document-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Lambda execution role for admin functions
resource "aws_iam_role" "lambda_admin_execution" {
  name = "${var.project_name}-lambda-admin-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Lambda execution role for Knowledge Base sync monitor
resource "aws_iam_role" "lambda_kb_monitor_execution" {
  name = "${var.project_name}-lambda-kb-monitor-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Basic Lambda execution policy attachment for chat role
resource "aws_iam_role_policy_attachment" "lambda_chat_basic_execution" {
  role       = aws_iam_role.lambda_chat_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Basic Lambda execution policy attachment for document role
resource "aws_iam_role_policy_attachment" "lambda_document_basic_execution" {
  role       = aws_iam_role.lambda_document_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Basic Lambda execution policy attachment for admin role
resource "aws_iam_role_policy_attachment" "lambda_admin_basic_execution" {
  role       = aws_iam_role.lambda_admin_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Basic Lambda execution policy attachment for KB monitor role
resource "aws_iam_role_policy_attachment" "lambda_kb_monitor_basic_execution" {
  role       = aws_iam_role.lambda_kb_monitor_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Bedrock Knowledge Base policy for chat functions
resource "aws_iam_role_policy" "lambda_chat_bedrock_kb" {
  name = "${var.project_name}-lambda-chat-bedrock-kb-policy"
  role = aws_iam_role.lambda_chat_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:RetrieveAndGenerate",
          "bedrock:Retrieve",
          "bedrock:InvokeModel"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:knowledge-base/*",
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-opus-4-1-20250805-v1:0",
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-7-sonnet-20250219-v1:0",
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
          "arn:aws:bedrock:${var.aws_region}::foundation-model/amazon.titan-embed-text-v2:0"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:ListKnowledgeBases",
          "bedrock:GetKnowledgeBase"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# S3 and DynamoDB policy for document management functions
resource "aws_iam_role_policy" "lambda_document_storage" {
  name = "${var.project_name}-lambda-document-storage-policy"
  role = aws_iam_role.lambda_document_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.documents_bucket_arn,
          "${var.documents_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.documents_table_arn,
          "${var.documents_table_arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:StartIngestionJob",
          "bedrock:GetIngestionJob",
          "bedrock:ListIngestionJobs",
          "bedrock:GetDataSource"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:knowledge-base/*"
        ]
      }
    ]
  })
}

# Admin policy for Knowledge Base management
resource "aws_iam_role_policy" "lambda_admin_bedrock_kb" {
  name = "${var.project_name}-lambda-admin-bedrock-kb-policy"
  role = aws_iam_role.lambda_admin_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock-agent:GetKnowledgeBase",
          "bedrock-agent:ListKnowledgeBases",
          "bedrock-agent:GetDataSource",
          "bedrock-agent:ListDataSources",
          "bedrock-agent:ListIngestionJobs",
          "bedrock-agent:GetIngestionJob",
          "bedrock-agent:StartIngestionJob",
          "bedrock-agent:StopIngestionJob",
          "bedrock:GetKnowledgeBase",
          "bedrock:ListKnowledgeBases",
          "bedrock:GetDataSource",
          "bedrock:ListDataSources",
          "bedrock:ListIngestionJobs",
          "bedrock:GetIngestionJob",
          "bedrock:StartIngestionJob",
          "bedrock:StopIngestionJob",
          "bedrock:RetrieveAndGenerate",
          "bedrock:Retrieve",
          "bedrock:InvokeModel"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:knowledge-base/*",
          "arn:aws:bedrock:${var.aws_region}::foundation-model/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.documents_bucket_arn,
          "${var.documents_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.documents_table_arn,
          "${var.documents_table_arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Logs policy for all Lambda functions
resource "aws_iam_role_policy" "lambda_cloudwatch_logs" {
  name = "${var.project_name}-lambda-cloudwatch-logs-policy"
  role = aws_iam_role.lambda_chat_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

# Attach CloudWatch Logs policy to document role
resource "aws_iam_role_policy" "lambda_document_cloudwatch_logs" {
  name = "${var.project_name}-lambda-document-cloudwatch-logs-policy"
  role = aws_iam_role.lambda_document_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

# Attach CloudWatch Logs policy to admin role
resource "aws_iam_role_policy" "lambda_admin_cloudwatch_logs" {
  name = "${var.project_name}-lambda-admin-cloudwatch-logs-policy"
  role = aws_iam_role.lambda_admin_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

# Knowledge Base monitoring policy for sync monitor function
resource "aws_iam_role_policy" "lambda_kb_monitor_bedrock" {
  name = "${var.project_name}-lambda-kb-monitor-bedrock-policy"
  role = aws_iam_role.lambda_kb_monitor_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:ListIngestionJobs",
          "bedrock:GetIngestionJob",
          "bedrock:StartIngestionJob",
          "bedrock:GetDataSource",
          "bedrock:GetKnowledgeBase"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:knowledge-base/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.documents_table_arn,
          "${var.documents_table_arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}