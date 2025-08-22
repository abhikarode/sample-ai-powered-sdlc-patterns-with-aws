# Testing Requirements

## Mandatory Playwright MCP Server Usage

**CRITICAL REQUIREMENT**: All UI and end-to-end tests MUST use the Playwright MCP server. No other testing frameworks are permitted for UI testing.

**ABSOLUTE PROHIBITION**: The following testing frameworks are STRICTLY FORBIDDEN for UI testing:
- React Testing Library
- Jest DOM testing
- Enzyme
- Cypress
- Puppeteer
- Any jsdom-based testing
- Any simulated browser environments

**VIOLATION CONSEQUENCES**: Any code that uses prohibited testing frameworks will be immediately rejected and must be rewritten using Playwright MCP server tools.

### Required Testing Approach

1. **Playwright MCP Server Only**: All UI tests must be written using the Playwright MCP server tools
2. **Real Browser Testing**: Tests must run in actual browser environments, not jsdom or other simulated environments
3. **End-to-End Focus**: Tests should cover complete user workflows from start to finish
4. **AWS Integration Testing**: Tests must validate real AWS service integrations where applicable

### Complete Playwright MCP Tools Reference

#### Navigation and Page Management
- `mcp_playwright_browser_navigate`: Navigate to URLs and pages
- `mcp_playwright_browser_navigate_back`: Go back to the previous page
- `mcp_playwright_browser_navigate_forward`: Go forward to the next page
- `mcp_playwright_browser_close`: Close the current page/browser
- `mcp_playwright_browser_resize`: Resize the browser window to specific dimensions

#### Element Interaction
- `mcp_playwright_browser_click`: Click on UI elements (supports left, right, middle click and double-click)
- `mcp_playwright_browser_type`: Input text into form fields with typing simulation
- `mcp_playwright_browser_hover`: Hover over elements to trigger hover states
- `mcp_playwright_browser_drag`: Perform drag and drop operations between elements
- `mcp_playwright_browser_select_option`: Select options in dropdown menus
- `mcp_playwright_browser_press_key`: Press keyboard keys (arrows, enter, escape, etc.)

#### Page Analysis and Debugging
- `mcp_playwright_browser_snapshot`: Capture accessibility snapshots for element identification and interaction
- `mcp_playwright_browser_take_screenshot`: Capture visual evidence of test states (full page or element-specific)
- `mcp_playwright_browser_evaluate`: Execute JavaScript for complex interactions and data extraction
- `mcp_playwright_browser_console_messages`: Retrieve all console messages for debugging
- `mcp_playwright_browser_network_requests`: Get all network requests since page load for API testing

#### File Operations
- `mcp_playwright_browser_file_upload`: Upload single or multiple files to file inputs

#### Tab Management
- `mcp_playwright_browser_tab_list`: List all open browser tabs
- `mcp_playwright_browser_tab_new`: Open a new tab with optional URL
- `mcp_playwright_browser_tab_select`: Switch to a specific tab by index
- `mcp_playwright_browser_tab_close`: Close a specific tab or current tab

#### Wait and Synchronization
- `mcp_playwright_browser_wait_for`: Wait for text to appear/disappear or specified time to pass
- `mcp_playwright_browser_handle_dialog`: Handle browser dialogs (alerts, confirms, prompts)

#### Browser Setup and Management
- `mcp_playwright_browser_install`: Install the browser if not already installed

### Test Structure Requirements

```typescript
// Example test structure using Playwright MCP
describe('Document Upload Workflow', () => {
  beforeEach(async () => {
    // Navigate to application
    await mcp_playwright_browser_navigate({ url: 'http://localhost:3000' });
    
    // Wait for page load
    await mcp_playwright_browser_wait_for({ time: 2 });
    
    // Take snapshot to identify elements
    const snapshot = await mcp_playwright_browser_snapshot();
  });

  test('should upload document successfully', async () => {
    // Test implementation using MCP tools
  });
});
```

### Prohibited Testing Approaches

- **React Testing Library**: Not permitted for UI tests
- **Jest DOM testing**: Not permitted for UI tests  
- **Enzyme**: Not permitted for UI tests
- **Cypress**: Not permitted (use Playwright MCP instead)
- **Puppeteer**: Not permitted (use Playwright MCP instead)

### Test Coverage Requirements

1. **Critical User Paths**: All primary user workflows must be tested
2. **Authentication Flows**: Login, logout, session management
3. **Document Management**: Upload, view, delete, search documents
4. **Chat Interface**: Send messages, receive responses, view history
5. **Admin Functions**: User management, system analytics, document approval
6. **Error Handling**: Network failures, API errors, validation errors
7. **Responsive Design**: Mobile and desktop viewports

### Test Environment Setup

**CRITICAL REQUIREMENT**: All tests MUST run against deployed AWS infrastructure only. No local testing permitted.

- **CloudFront Distribution**: Tests must use the deployed CloudFront URL (https://diaxl2ky359mj.cloudfront.net)
- **Real Cognito Authentication**: Use actual Cognito User Pool with test users
- **Live AWS Services**: Connect to deployed DynamoDB tables, S3 buckets, and OpenSearch collections
- **Bedrock Integration**: Validate real AI responses from deployed Bedrock models
- **API Gateway**: Test against deployed Lambda functions via API Gateway endpoints
- **No Localhost**: Never use localhost or local development servers for testing
- **No Mocking**: All AWS services must be real, deployed resources

### Test Data Management

- Use dedicated test AWS environment
- Clean up test data after test runs
- Use consistent test user accounts
- Maintain test document library

### Performance Testing

- Measure page load times
- Validate API response times
- Test with realistic data volumes
- Monitor memory usage during tests

### Accessibility Testing

- Use Playwright's accessibility snapshot features
- Validate ARIA labels and roles
- Test keyboard navigation
- Verify screen reader compatibility

This ensures all UI testing follows modern best practices with real browser automation and comprehensive coverage of user workflows.