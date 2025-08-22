/**
 * Lambda function for collecting custom Knowledge Base metrics and audit logging
 * This function runs on a schedule to collect performance metrics and monitor
 * Knowledge Base operations for the AI Assistant system.
 */

const { BedrockAgentClient, ListIngestionJobsCommand, GetIngestionJobCommand } = require('@aws-sdk/client-bedrock-agent');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand } = require('@aws-sdk/client-cloudwatch-logs');

// Initialize AWS clients
const bedrockAgent = new BedrockAgentClient({ region: process.env.AWS_REGION || 'us-west-2' });
const cloudWatch = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-west-2' });
const cloudWatchLogs = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-west-2' });

// Metrics namespace
const METRICS_NAMESPACE = 'AI-Assistant/KnowledgeBase';

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
    console.log('Starting Knowledge Base metrics collection', { event });
    
    try {
        // Collect Knowledge Base ingestion job metrics
        await collectIngestionJobMetrics();
        
        // Collect system health metrics
        await collectSystemHealthMetrics();
        
        // Initialize baseline metrics for new deployments
        await initializeBaselineMetrics();
        
        // Log successful metrics collection
        await logMetricsEvent('METRICS_COLLECTION_SUCCESS', {
            timestamp: new Date().toISOString(),
            message: 'Successfully collected Knowledge Base metrics'
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Metrics collection completed successfully',
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('Error collecting metrics:', error);
        
        // Log error event
        await logMetricsEvent('METRICS_COLLECTION_ERROR', {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack
        });
        
        // Send error metric
        await putCustomMetric('MetricsCollectionErrors', 1, 'Count');
        
        throw error;
    }
};

/**
 * Initialize baseline metrics for new deployments
 */
async function initializeBaselineMetrics() {
    try {
        console.log('Initializing baseline metrics for new deployment');
        
        // Send initial metrics to ensure they exist in CloudWatch
        await putCustomMetric('QueryResponseTime', 0, 'Milliseconds');
        await putCustomMetric('QuerySuccessRate', 100, 'Percent');
        await putCustomMetric('QueriesExecuted', 0, 'Count');
        await putCustomMetric('SourcesFoundPerQuery', 0, 'Count');
        
        console.log('Baseline metrics initialized successfully');
        
    } catch (error) {
        console.error('Error initializing baseline metrics:', error);
        // Don't throw here to avoid breaking the main flow
    }
}

/**
 * Collect Knowledge Base ingestion job metrics
 */
async function collectIngestionJobMetrics() {
    try {
        console.log('Collecting ingestion job metrics for Knowledge Base:', process.env.KNOWLEDGE_BASE_ID);
        
        // First, we need to get the data sources for this Knowledge Base
        const { ListDataSourcesCommand } = require('@aws-sdk/client-bedrock-agent');
        
        const listDataSourcesResponse = await bedrockAgent.send(new ListDataSourcesCommand({
            knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
            maxResults: 10
        }));
        
        const dataSources = listDataSourcesResponse.dataSourceSummaries || [];
        console.log("Found", dataSources.length, "data sources");
        
        if (dataSources.length === 0) {
            console.log('No data sources found, skipping ingestion job metrics');
            return;
        }
        
        // Get ingestion jobs for each data source
        let totalCompletedJobs = 0;
        let totalFailedJobs = 0;
        let totalInProgressJobs = 0;
        let totalDuration = 0;
        let jobsWithDuration = 0;
        
        for (const dataSource of dataSources) {
            try {
                // List recent ingestion jobs for this data source
                const listJobsResponse = await bedrockAgent.send(new ListIngestionJobsCommand({
                    knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
                    dataSourceId: dataSource.dataSourceId,
                    maxResults: 10
                }));
                
                const jobs = listJobsResponse.ingestionJobSummaries || [];
                console.log("Found", jobs.length, "ingestion jobs for data source", dataSource.dataSourceId);
                
                // Analyze each job
                for (const jobSummary of jobs) {
                    try {
                        const jobDetails = await bedrockAgent.send(new GetIngestionJobCommand({
                            knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
                            dataSourceId: dataSource.dataSourceId,
                            ingestionJobId: jobSummary.ingestionJobId
                        }));
                        
                        const job = jobDetails.ingestionJob;
                        
                        switch (job.status) {
                            case 'COMPLETE':
                                totalCompletedJobs++;
                                if (job.startedAt && job.updatedAt) {
                                    const duration = new Date(job.updatedAt) - new Date(job.startedAt);
                                    totalDuration += duration;
                                    jobsWithDuration++;
                                }
                                break;
                            case 'FAILED':
                                totalFailedJobs++;
                                break;
                            case 'IN_PROGRESS':
                            case 'STARTING':
                                totalInProgressJobs++;
                                break;
                        }
                        
                    } catch (jobError) {
                        console.error("Error getting job details for", jobSummary.ingestionJobId, ":", jobError);
                    }
                }
                
            } catch (dataSourceError) {
                console.error("Error getting ingestion jobs for data source", dataSource.dataSourceId, ":", dataSourceError);
            }
        }
        
        // Calculate metrics
        const totalJobs = totalCompletedJobs + totalFailedJobs;
        const successRate = totalJobs > 0 ? (totalCompletedJobs / totalJobs) * 100 : 100;
        const averageDuration = jobsWithDuration > 0 ? totalDuration / jobsWithDuration : 0;
        
        // Send metrics to CloudWatch
        await putCustomMetric('IngestionJobSuccessRate', successRate, 'Percent');
        await putCustomMetric('IngestionJobsCompleted', totalCompletedJobs, 'Count');
        await putCustomMetric('IngestionJobsFailed', totalFailedJobs, 'Count');
        await putCustomMetric('IngestionJobsInProgress', totalInProgressJobs, 'Count');
        
        if (averageDuration > 0) {
            await putCustomMetric('IngestionJobDuration', averageDuration, 'Milliseconds');
        }
        
        console.log('Ingestion job metrics collected:', {
            successRate,
            completedJobs: totalCompletedJobs,
            failedJobs: totalFailedJobs,
            inProgressJobs: totalInProgressJobs,
            averageDuration
        });
        
    } catch (error) {
        console.error('Error collecting ingestion job metrics:', error);
        await putCustomMetric('IngestionJobMetricsErrors', 1, 'Count');
        throw error;
    }
}

/**
 * Collect system health metrics
 */
async function collectSystemHealthMetrics() {
    try {
        console.log('Collecting system health metrics');
        
        // Send a health check metric
        await putCustomMetric('SystemHealthCheck', 1, 'Count');
        
        // Collect Knowledge Base availability metrics
        await collectKnowledgeBaseHealthMetrics();
        
        // Log system status
        await logMetricsEvent('SYSTEM_HEALTH_CHECK', {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID
        });
        
        console.log('System health metrics collected successfully');
        
    } catch (error) {
        console.error('Error collecting system health metrics:', error);
        await putCustomMetric('SystemHealthErrors', 1, 'Count');
        throw error;
    }
}

/**
 * Collect Knowledge Base health and availability metrics
 */
async function collectKnowledgeBaseHealthMetrics() {
    try {
        console.log('Collecting Knowledge Base health metrics');
        
        // Test Knowledge Base availability by checking its status
        const { DescribeKnowledgeBaseCommand } = require('@aws-sdk/client-bedrock-agent');
        
        const describeResponse = await bedrockAgent.send(new DescribeKnowledgeBaseCommand({
            knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID
        }));
        
        const knowledgeBase = describeResponse.knowledgeBase;
        const isHealthy = knowledgeBase && knowledgeBase.status === 'ACTIVE';
        
        // Send availability metrics
        await putCustomMetric('KnowledgeBaseAvailability', isHealthy ? 1 : 0, 'Count');
        await putCustomMetric('KnowledgeBaseHealthCheck', 1, 'Count');
        
        // Log Knowledge Base status
        await logMetricsEvent('KNOWLEDGE_BASE_HEALTH_CHECK', {
            timestamp: new Date().toISOString(),
            knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID,
            status: knowledgeBase.status,
            isHealthy
        });
        
        console.log('Knowledge Base health metrics collected:', {
            status: knowledgeBase.status,
            isHealthy
        });
        
    } catch (error) {
        console.error('Error collecting Knowledge Base health metrics:', error);
        
        // Send error metrics
        await putCustomMetric('KnowledgeBaseAvailability', 0, 'Count');
        await putCustomMetric('KnowledgeBaseHealthErrors', 1, 'Count');
        
        // Don't throw here to avoid breaking the main flow
    }
}

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
        console.log("Sent metric:", metricName, "=", value, unit);
        
    } catch (error) {
        console.error("Error sending metric", metricName, ":", error);
        throw error;
    }
}

/**
 * Log metrics event to CloudWatch Logs
 */
async function logMetricsEvent(eventType, eventData) {
    try {
        const logGroupName = process.env.METRICS_LOG_GROUP;
        const logStreamName = `metrics-${new Date().toISOString().split('T')[0]}`;
        
        // Create log stream if it doesn't exist
        try {
            await cloudWatchLogs.send(new CreateLogStreamCommand({
                logGroupName,
                logStreamName
            }));
        } catch (error) {
            // Log stream might already exist, ignore error
            if (error.name !== "ResourceAlreadyExistsException") {
                console.warn("Error creating log stream:", error.message);
            }
        }
        
        // Put log event
        const logEvent = {
            timestamp: Date.now(),
            message: JSON.stringify({
                eventType,
                ...eventData
            })
        };
        
        await cloudWatchLogs.send(new PutLogEventsCommand({
            logGroupName,
            logStreamName,
            logEvents: [logEvent]
        }));
        
        console.log("Logged event:", eventType);
        
    } catch (error) {
        console.error('Error logging metrics event:', error);
        // Don't throw here to avoid breaking the main flow
    }
}

/**
 * Log admin action for audit trail
 */
exports.logAdminAction = async (userId, action, details) => {
    try {
        const logGroupName = process.env.AUDIT_LOG_GROUP;
        const logStreamName = `admin-audit-${new Date().toISOString().split('T')[0]}`;
        
        // Create log stream if it doesn't exist
        try {
            await cloudWatchLogs.send(new CreateLogStreamCommand({
                logGroupName,
                logStreamName
            }));
        } catch (error) {
            if (error.name !== "ResourceAlreadyExistsException") {
                console.warn("Error creating audit log stream:", error.message);
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
        
        console.log("Logged admin action:", action, "by", userId);
        
        // Also send a metric for admin actions
        await putCustomMetric('AdminActions', 1, 'Count', {
            Action: action,
            UserId: userId
        });
        
    } catch (error) {
        console.error('Error logging admin action:', error);
        throw error;
    }
};

/**
 * Log query performance metrics
 */
exports.logQueryMetrics = async (queryData) => {
    try {
        const { responseTime, success, userId, queryLength, sourcesFound } = queryData;
        
        // Send query performance metrics
        await putCustomMetric('QueryResponseTime', responseTime, 'Milliseconds');
        await putCustomMetric('QuerySuccessRate', success ? 100 : 0, 'Percent');
        await putCustomMetric('QueriesExecuted', 1, 'Count');
        
        if (sourcesFound !== undefined) {
            await putCustomMetric('SourcesFoundPerQuery', sourcesFound, 'Count');
        }
        
        // Log query event
        await logMetricsEvent('QUERY_EXECUTED', {
            timestamp: new Date().toISOString(),
            userId,
            responseTime,
            success,
            queryLength,
            sourcesFound
        });
        
        console.log('Query metrics logged:', { responseTime, success, sourcesFound });
        
    } catch (error) {
        console.error('Error logging query metrics:', error);
        throw error;
    }
};