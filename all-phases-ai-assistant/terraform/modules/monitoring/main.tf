# CloudWatch Monitoring Module for AI Assistant Knowledge Base
# This module creates comprehensive monitoring for Knowledge Base operations,
# custom metrics, dashboards, and alerting infrastructure

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name         = "${var.project_name}-alerts"
  display_name = "AI Assistant Alerts"

  tags = {
    Name        = "${var.project_name}-alerts"
    Environment = var.environment
    Project     = var.project_name
  }
}

# SNS Topic Subscription for Email Alerts
resource "aws_sns_topic_subscription" "email_alerts" {
  count     = length(var.alert_email_addresses)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email_addresses[count.index]
}

# CloudWatch Log Group for Custom Metrics
resource "aws_cloudwatch_log_group" "knowledge_base_metrics" {
  name              = "/aws/ai-assistant/knowledge-base-metrics"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.project_name}-kb-metrics"
    Environment = var.environment
    Project     = var.project_name
  }
}

# CloudWatch Log Group for Admin Actions Audit
resource "aws_cloudwatch_log_group" "admin_audit" {
  name              = "/aws/ai-assistant/admin-audit"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.project_name}-admin-audit"
    Environment = var.environment
    Project     = var.project_name
  }
}

# CloudWatch Dashboard for Knowledge Base Monitoring
resource "aws_cloudwatch_dashboard" "knowledge_base_dashboard" {
  dashboard_name = "${var.project_name}-knowledge-base-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Bedrock", "InvocationLatency", "ModelId", var.bedrock_model_id],
            [".", "InvocationThrottles", ".", "."],
            [".", "InvocationClientErrors", ".", "."],
            [".", "InvocationServerErrors", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Bedrock Model Performance"
          period  = 300
          stat    = "Average"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", var.chat_lambda_function_name],
            [".", "Errors", ".", "."],
            [".", "Throttles", ".", "."],
            [".", "Invocations", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Chat Lambda Performance"
          period  = 300
          stat    = "Average"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", var.document_lambda_function_name],
            [".", "Errors", ".", "."],
            [".", "Invocations", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Document Management Lambda Performance"
          period  = 300
          stat    = "Average"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.documents_table_name],
            [".", "ConsumedWriteCapacityUnits", ".", "."],
            [".", "ThrottledRequests", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB Performance"
          period  = 300
          stat    = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 24
        height = 6

        properties = {
          metrics = [
            ["AI-Assistant/KnowledgeBase", "QueryResponseTime"],
            [".", "QuerySuccessRate"],
            [".", "IngestionJobDuration"],
            [".", "DocumentProcessingErrors"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Custom Knowledge Base Metrics"
          period  = 300
          stat    = "Average"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AI-Assistant/KnowledgeBase", "IngestionJobsCompleted"],
            [".", "IngestionJobsFailed"],
            [".", "IngestionJobsInProgress"],
            [".", "IngestionJobSuccessRate"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Knowledge Base Ingestion Jobs"
          period  = 300
          stat    = "Average"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 18
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AI-Assistant/KnowledgeBase", "QueryResponseTime"],
            [".", "QueriesExecuted"],
            [".", "SourcesFoundPerQuery"],
            [".", "QuerySuccessRate"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Query Performance Analytics"
          period  = 300
          stat    = "Average"
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 24
        width  = 24
        height = 6

        properties = {
          query   = "SOURCE '/aws/ai-assistant/admin-audit' | fields @timestamp, action, userId, details | sort @timestamp desc | limit 20"
          region  = var.aws_region
          title   = "Recent Admin Actions"
          view    = "table"
        }
      }
    ]
  })
}

# CloudWatch Alarms for Knowledge Base Operations

# Alarm for High Bedrock Invocation Latency
resource "aws_cloudwatch_metric_alarm" "bedrock_high_latency" {
  alarm_name          = "${var.project_name}-bedrock-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "InvocationLatency"
  namespace           = "AWS/Bedrock"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000" # 10 seconds in milliseconds
  alarm_description   = "This metric monitors Bedrock invocation latency"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ModelId = var.bedrock_model_id
  }

  tags = {
    Name        = "${var.project_name}-bedrock-latency-alarm"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Alarm for Bedrock Invocation Errors
resource "aws_cloudwatch_metric_alarm" "bedrock_errors" {
  alarm_name          = "${var.project_name}-bedrock-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "InvocationServerErrors"
  namespace           = "AWS/Bedrock"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Bedrock server errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ModelId = var.bedrock_model_id
  }

  tags = {
    Name        = "${var.project_name}-bedrock-errors-alarm"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Alarm for Chat Lambda Errors
resource "aws_cloudwatch_metric_alarm" "chat_lambda_errors" {
  alarm_name          = "${var.project_name}-chat-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors chat lambda errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = var.chat_lambda_function_name
  }

  tags = {
    Name        = "${var.project_name}-chat-lambda-errors-alarm"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Alarm for Document Lambda Errors
resource "aws_cloudwatch_metric_alarm" "document_lambda_errors" {
  alarm_name          = "${var.project_name}-document-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors document lambda errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = var.document_lambda_function_name
  }

  tags = {
    Name        = "${var.project_name}-document-lambda-errors-alarm"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Alarm for DynamoDB Throttling
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${var.project_name}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DynamoDB throttling"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TableName = var.documents_table_name
  }

  tags = {
    Name        = "${var.project_name}-dynamodb-throttles-alarm"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Custom Metric Alarm for Knowledge Base Query Success Rate
resource "aws_cloudwatch_metric_alarm" "kb_query_success_rate" {
  alarm_name          = "${var.project_name}-kb-query-success-rate"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "QuerySuccessRate"
  namespace           = "AI-Assistant/KnowledgeBase"
  period              = "300"
  statistic           = "Average"
  threshold           = "90" # 90% success rate threshold
  alarm_description   = "This metric monitors Knowledge Base query success rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${var.project_name}-kb-success-rate-alarm"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Custom Metric Alarm for Knowledge Base Response Time
resource "aws_cloudwatch_metric_alarm" "kb_response_time" {
  alarm_name          = "${var.project_name}-kb-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "QueryResponseTime"
  namespace           = "AI-Assistant/KnowledgeBase"
  period              = "300"
  statistic           = "Average"
  threshold           = "15000" # 15 seconds in milliseconds
  alarm_description   = "This metric monitors Knowledge Base query response time"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${var.project_name}-kb-response-time-alarm"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Knowledge Base Ingestion Failure Alarm
resource "aws_cloudwatch_metric_alarm" "kb_ingestion_failures" {
  alarm_name          = "${var.project_name}-kb-ingestion-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "IngestionJobsFailed"
  namespace           = "AI-Assistant/KnowledgeBase"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors Knowledge Base ingestion job failures"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${var.project_name}-kb-ingestion-failures-alarm"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Knowledge Base Query Latency Alarm
resource "aws_cloudwatch_metric_alarm" "kb_query_latency" {
  alarm_name          = "${var.project_name}-kb-query-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "QueryResponseTime"
  namespace           = "AI-Assistant/KnowledgeBase"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000" # 10 seconds in milliseconds
  alarm_description   = "This metric monitors Knowledge Base query latency for performance degradation"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name        = "${var.project_name}-kb-query-latency-alarm"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM Role for CloudWatch to publish to SNS
resource "aws_iam_role" "cloudwatch_sns_role" {
  name = "${var.project_name}-cloudwatch-sns-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-cloudwatch-sns-role"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM Policy for CloudWatch to publish to SNS
resource "aws_iam_role_policy" "cloudwatch_sns_policy" {
  name = "${var.project_name}-cloudwatch-sns-policy"
  role = aws_iam_role.cloudwatch_sns_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}