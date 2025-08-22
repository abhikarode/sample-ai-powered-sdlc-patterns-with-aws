"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationService = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const uuid_1 = require("uuid");
class ConversationService {
    constructor() {
        // AWS Lambda automatically sets AWS_REGION, but it's a reserved environment variable
        const region = process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-west-2';
        // Configure DynamoDB client with proper credentials for testing
        const clientConfig = { region };
        // In test environment, use the aidlc_main profile
        if (process.env.NODE_ENV === 'test' || process.env.AWS_PROFILE) {
            clientConfig.credentials = undefined; // Let AWS SDK handle profile-based credentials
        }
        this.dynamoClient = new client_dynamodb_1.DynamoDBClient(clientConfig);
        this.tableName = process.env.DOCUMENTS_TABLE || 'ai-assistant-dev-documents';
        // Validate table name
        if (!this.tableName || this.tableName.trim() === '') {
            throw new Error('DOCUMENTS_TABLE environment variable is required and cannot be empty');
        }
    }
    async createConversation(userId) {
        const conversationId = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const conversation = {
            conversationId,
            userId,
            messages: [],
            createdAt: now,
            lastActivity: now
        };
        await this.dynamoClient.send(new client_dynamodb_1.PutItemCommand({
            TableName: this.tableName,
            Item: (0, util_dynamodb_1.marshall)({
                PK: `CONV#${conversationId}`,
                SK: 'METADATA',
                ...conversation,
                GSI1PK: `USER#${userId}`,
                GSI1SK: `CONV#${now}`
            }, { removeUndefinedValues: true })
        }));
        return conversationId;
    }
    async getConversation(conversationId) {
        try {
            const response = await this.dynamoClient.send(new client_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'PK = :pk',
                ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                    ':pk': `CONV#${conversationId}`
                }, { removeUndefinedValues: true })
            }));
            if (!response.Items || response.Items.length === 0) {
                return null;
            }
            // Find metadata item
            const metadataItem = response.Items.find(item => {
                const unmarshalled = (0, util_dynamodb_1.unmarshall)(item);
                return unmarshalled.SK === 'METADATA';
            });
            if (!metadataItem) {
                return null;
            }
            const conversation = (0, util_dynamodb_1.unmarshall)(metadataItem);
            // Get all messages
            const messageItems = response.Items.filter(item => {
                const unmarshalled = (0, util_dynamodb_1.unmarshall)(item);
                return unmarshalled.SK.startsWith('MSG#');
            });
            conversation.messages = messageItems
                .map(item => (0, util_dynamodb_1.unmarshall)(item))
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            return conversation;
        }
        catch (error) {
            console.error('Error getting conversation:', error);
            return null;
        }
    }
    async addMessage(conversationId, type, content, sources) {
        const messageId = (0, uuid_1.v4)();
        const timestamp = new Date().toISOString();
        const message = {
            messageId,
            type,
            content,
            timestamp,
            sources
        };
        // Add message to conversation
        await this.dynamoClient.send(new client_dynamodb_1.PutItemCommand({
            TableName: this.tableName,
            Item: (0, util_dynamodb_1.marshall)({
                PK: `CONV#${conversationId}`,
                SK: `MSG#${timestamp}#${messageId}`,
                ...message
            }, { removeUndefinedValues: true })
        }));
        // Update conversation last activity
        await this.dynamoClient.send(new client_dynamodb_1.UpdateItemCommand({
            TableName: this.tableName,
            Key: (0, util_dynamodb_1.marshall)({
                PK: `CONV#${conversationId}`,
                SK: 'METADATA'
            }, { removeUndefinedValues: true }),
            UpdateExpression: 'SET lastActivity = :timestamp',
            ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                ':timestamp': timestamp
            }, { removeUndefinedValues: true })
        }));
        return message;
    }
    async getUserConversations(userId, limit = 10) {
        try {
            const response = await this.dynamoClient.send(new client_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :pk',
                ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                    ':pk': `USER#${userId}`
                }, { removeUndefinedValues: true }),
                ScanIndexForward: false, // Most recent first
                Limit: limit
            }));
            if (!response.Items) {
                return [];
            }
            const conversations = [];
            for (const item of response.Items) {
                const conversation = (0, util_dynamodb_1.unmarshall)(item);
                // Get recent messages for preview (last 5 messages)
                const messagesResponse = await this.dynamoClient.send(new client_dynamodb_1.QueryCommand({
                    TableName: this.tableName,
                    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                    ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                        ':pk': `CONV#${conversation.conversationId}`,
                        ':sk': 'MSG#'
                    }, { removeUndefinedValues: true }),
                    ScanIndexForward: false,
                    Limit: 5
                }));
                if (messagesResponse.Items) {
                    conversation.messages = messagesResponse.Items
                        .map(msgItem => (0, util_dynamodb_1.unmarshall)(msgItem))
                        .reverse(); // Reverse to get chronological order
                }
                else {
                    conversation.messages = [];
                }
                conversations.push(conversation);
            }
            return conversations;
        }
        catch (error) {
            console.error('Error getting user conversations:', error);
            return [];
        }
    }
    async deleteConversation(conversationId) {
        try {
            // Get all items for this conversation
            const response = await this.dynamoClient.send(new client_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'PK = :pk',
                ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                    ':pk': `CONV#${conversationId}`
                }, { removeUndefinedValues: true })
            }));
            if (!response.Items) {
                return;
            }
            // Delete all items
            const deletePromises = response.Items.map(item => {
                const key = {
                    PK: item.PK,
                    SK: item.SK
                };
                return this.dynamoClient.send(new client_dynamodb_1.DeleteItemCommand({
                    TableName: this.tableName,
                    Key: key
                }));
            });
            await Promise.all(deletePromises);
        }
        catch (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
    }
    async getConversationHistory(conversationId, limit = 50) {
        try {
            const response = await this.dynamoClient.send(new client_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: (0, util_dynamodb_1.marshall)({
                    ':pk': `CONV#${conversationId}`,
                    ':sk': 'MSG#'
                }, { removeUndefinedValues: true }),
                ScanIndexForward: true, // Chronological order
                Limit: limit
            }));
            if (!response.Items) {
                return [];
            }
            return response.Items.map(item => (0, util_dynamodb_1.unmarshall)(item));
        }
        catch (error) {
            console.error('Error getting conversation history:', error);
            return [];
        }
    }
}
exports.ConversationService = ConversationService;
//# sourceMappingURL=conversation-service.js.map