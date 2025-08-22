"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const chat_api_handler_1 = require("./chat-api-handler");
// Main handler for all chat API endpoints
const handler = async (event, context) => {
    return await (0, chat_api_handler_1.chatApiHandler)(event, context);
};
exports.handler = handler;
//# sourceMappingURL=chat-endpoints.js.map