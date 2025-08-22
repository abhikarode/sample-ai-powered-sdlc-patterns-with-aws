/**
 * Shared monitoring utilities for Lambda functions
 * This module provides functions to send custom metrics and audit logs
 * to CloudWatch for the AI Assistant monitoring system.
 */

const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand } = require('@aws-sdk/client-cloudwatch-logs');

// Initialize AWS clients
const cloudWatch = new CloudWatchClient({ region: process.env.AWS_REGION });
const cloudWatchLogs = new CloudWatchLogsClient({ region: process.env.AWS_REGION });

// Metrics namespace
const METRICS_NAMESPACE = 'AI-Assistant/KnowledgeBase';

/**
 * Send custom metric to CloudWatch
 */
async function putCustomMetric(metricName, value, unit, dimensions = {}) {
    try {
        const params = {
            Namespace: METRICS_NAMESPACE,
            MetricData: [
                {
                    MetricName: metricName,
                    Value: value,
                    Unit: unit,
                    Timestamp: new Date(),
                    Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value }))
                }
            ]
        };
        
        await cloudWatch.send(new PutMetricDataCommand(params));
        console.log(`Sent metric: ${metricName} = ${value} ${unit}`);
        
    } catch (error) {
        console.error(`Error sending metric ${metricName}:`, error);
        // Don't throw to avoid breaking main functionality
    }
}

/**
 * Log admin action for audit trail
 */
async function logAdminAction(userId, action, details) {
    try {
        const logGroupName = '/aws/ai-assistant/admin-audit';
        const logStreamName = `admin-audit-${new Date().toISOString().split('T')[0]}`;
        
        // Create log stream if it doesn't exist
        try {
            await cloudWatchLogs.send(new CreateLogStreamCommand({
                logGroupName,
                logStreamName
            }));
        } catch (error) {
            if (error.name !== 'ResourceAlreadyExistsException') {
                console.warn('Error creating audit log stream:', error.message);
            }
        }
        
        // Put audit log event
        const auditEvent = {
            timestamp: Date.now(),
            message: JSON.stringify({
                eventType: 'ADMIN_ACTION',
                timestamp: new Date().toISOString(),
                userId,
                action,
                details,
                sourceIp: details.sourceIp || 'unknown',
                userAgent: details.userAgent || 'unknown'
            })
        };
        
        await cloudWatchLogs.send(new PutLogEventsCommand({
            logGroupName,
            logStreamName,
            logEvents: [auditEvent]
        }));
        
        console.log(`Logged admin action: ${action} by ${userId}`);
        
        // Also send a metric for admin actions
        await putCustomMetric('AdminActions', 1, 'Count', {
            Action: action,
            UserId: userId
        });
        
    } catch (error) {
        console.error('Error logging admin action:', error);
        // Don't throw to avoid breaking main functionality
    }
}

/**
 * Log query performance metrics
 */
async function logQueryMetrics(queryData) {
    try {
        const { responseTime, success, userId, queryLength, sourcesFound } = queryData;
        
        // Send query performance metrics
        await putCustomMetric('QueryResponseTime', responseTime, 'Milliseconds');
        await putCustomMetric('QuerySuccessRate', success ? 100 : 0, 'Percent');
        await putCustomMetric('QueriesExecuted', 1, 'Count');
        
        if (sourcesFound !== undefined) {
            await putCustomMetric('SourcesFoundPerQuery', sourcesFound, 'Count');
        }
        
        // Log query event to metrics log group
        const logGroupName = '/aws/ai-assistant/knowledge-base-metrics';
        const logStreamName = `query-metrics-${new Date().toISOString().split('T')[0]}`;
        
        // Create log stream if it doesn't exist
        try {
            await cloudWatchLogs.send(new CreateLogStreamCommand({
                logGroupName,
                logStreamName
            }));
        } catch (error) {
            if (error.name !== 'ResourceAlreadyExistsException') {
                console.warn('Error creating metrics log stream:', error.message);
            }
        }
        
        // Put query metrics event
        const metricsEvent = {
            timestamp: Date.now(),
            message: JSON.stringify({
                eventType: 'QUERY_EXECUTED',
                timestamp: new Date().toISOString(),
                userId,
                responseTime,
                success,
                queryLength,
                sourcesFound
            })
        };
        
        await cloudWatchLogs.send(new PutLogEventsCommand({
            logGroupName,
            logStreamName,
            logEvents: [metricsEvent]
        }));
        
        console.log('Query metrics logged:', { responseTime, success, sourcesFound });
        
    } catch (error) {
        console.error('Error logging query metrics:', error);
        // Don't throw to avoid breaking main functionality
    }
}

/**
 * Log document processing metrics
 */
async function logDocumentMetrics(documentData) {
    try {
        const { operation, success, userId, documentId, processingTime, fileSize } = documentData;
        
        // Send document processing metrics
        await putCustomMetric('DocumentOperations', 1, 'Count', {
            Operation: operation,
            Success: success ? 'true' : 'false'
        });
        
        if (processingTime !== undefined) {
            await putCustomMetric('DocumentProcessingTime', processingTime, 'Milliseconds');
        }
        
        if (fileSize !== undefined) {
            await putCustomMetric('DocumentSize', fileSize, 'Bytes');
        }
        
        // Log document event to metrics log group
        const logGroupName = '/aws/ai-assistant/knowledge-base-metrics';
        const logStreamName = `document-metrics-${new Date().toISOString().split('T')[0]}`;
        
        // Create log stream if it doesn't exist
        try {
            await cloudWatchLogs.send(new CreateLogStreamCommand({
                logGroupName,
                logStreamName
            }));
        } catch (error) {
            if (error.name !== 'ResourceAlreadyExistsException') {
                console.warn('Error creating metrics log stream:', error.message);
            }
        }
        
        // Put document metrics event
        const metricsEvent = {
            timestamp: Date.now(),
            message: JSON.stringify({
                eventType: 'DOCUMENT_OPERATION',
                timestamp: new Date().toISOString(),
                userId,
                operation,
                success,
                documentId,
                processingTime,
                fileSize
            })
        };
        
        await cloudWatchLogs.send(new PutLogEventsCommand({
            logGroupName,
            logStreamName,
            logEvents: [metricsEvent]
        }));
        
        console.log('Document metrics logged:', { operation, success, documentId });
        
    } catch (error) {
        console.error('Error logging document metrics:', error);
        // Don't throw to avoid breaking main functionality
    }
}

/**
 * Log Knowledge Base ingestion job metrics
 */
async function logIngestionJobMetrics(jobData) {
    try {
        const { jobId, status, duration, documentsProcessed, errorCount } = jobData;
        
        // Send ingestion job metrics
        await putCustomMetric('IngestionJobs', 1, 'Count', {
            Status: status
        });
        
        if (duration !== undefined) {
            await putCustomMetric('IngestionJobDuration', duration, 'Milliseconds');
        }
        
        if (documentsProcessed !== undefined) {
            await putCustomMetric('DocumentsProcessed', documentsProcessed, 'Count');
        }
        
        if (errorCount !== undefined) {
            await putCustomMetric('IngestionErrors', errorCount, 'Count');
        }
        
        console.log('Ingestion job metrics logged:', { jobId, status, duration });
        
    } catch (error) {
        console.error('Error logging ingestion job metrics:', error);
        // Don't throw to avoid breaking main functionality
    }
}

/**
 * Log system error metrics
 */
async function logErrorMetrics(errorData) {
    try {
        const { errorType, component, userId, errorMessage } = errorData;
        
        // Send error metrics
        await putCustomMetric('SystemErrors', 1, 'Count', {
            ErrorType: errorType,
            Component: component
        });
        
        // Log error event to metrics log group
        const logGroupName = '/aws/ai-assistant/knowledge-base-metrics';
        const logStreamName = `error-metrics-${new Date().toISOString().split('T')[0]}`;
        
        // Create log stream if it doesn't exist
        try {
            await cloudWatchLogs.send(new CreateLogStreamCommand({
                logGroupName,
                logStreamName
            }));
        } catch (error) {
            if (error.name !== 'ResourceAlreadyExistsException') {
                console.warn('Error creating metrics log stream:', error.message);
            }
        }
        
        // Put error metrics event
        const metricsEvent = {
            timestamp: Date.now(),
            message: JSON.stringify({
                eventType: 'SYSTEM_ERROR',
                timestamp: new Date().toISOString(),
                errorType,
                component,
                userId,
                errorMessage
            })
        };
        
        await cloudWatchLogs.send(new PutLogEventsCommand({
            logGroupName,
            logStreamName,
            logEvents: [metricsEvent]
        }));
        
        console.log('Error metrics logged:', { errorType, component });
        
    } catch (error) {
        console.error('Error logging error metrics:', error);
        // Don't throw to avoid breaking main functionality
    }
}

module.exports = {
    putCustomMetric,
    logAdminAction,
    logQueryMetrics,
    logDocumentMetrics,
    logIngestionJobMetrics,
    logErrorMetrics
};