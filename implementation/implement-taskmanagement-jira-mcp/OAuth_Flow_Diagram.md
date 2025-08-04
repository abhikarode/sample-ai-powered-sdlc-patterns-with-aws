# OAuth Flow - Visual Diagram

## 🔄 The Complete OAuth Dance

```
┌─────────────┐                 ┌─────────────┐                 ┌─────────────┐
│             │                 │             │                 │             │
│ MCP Client  │                 │OAuth Server │                 │ MCP Server  │
│ (Amazon Q)  │                 │(Security)   │                 │(JIRA Data)  │
│             │                 │             │                 │             │
└──────┬──────┘                 └──────┬──────┘                 └──────┬──────┘
       │                               │                               │
       │ 1. "I want to register"       │                               │
       ├──────────────────────────────►│                               │
       │                               │                               │
       │ 2. "Here's your client_id"    │                               │
       │◄──────────────────────────────┤                               │
       │                               │                               │
       │ 3. "I want authorization"     │                               │
       ├──────────────────────────────►│                               │
       │                               │                               │
       │ 4. "Here's auth code"         │                               │
       │◄──────────────────────────────┤                               │
       │                               │                               │
       │ 5. "Trade code for token"     │                               │
       ├──────────────────────────────►│                               │
       │                               │                               │
       │ 6. "Here's access token"      │                               │
       │◄──────────────────────────────┤                               │
       │                               │                               │
       │ 7. "Give me JIRA data" + token                                │
       ├───────────────────────────────────────────────────────────────►│
       │                               │                               │
       │                               │ 8. "Is this token valid?"     │
       │                               │◄──────────────────────────────┤
       │                               │                               │
       │                               │ 9. "Yes, token is good"       │
       │                               ├──────────────────────────────►│
       │                               │                               │
       │ 10. "Here's your JIRA data"                                   │
       │◄───────────────────────────────────────────────────────────────┤
       │                               │                               │
```

## 🏠 Where Everything Lives

### AWS Infrastructure
```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Account                              │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   Lambda        │    │   Lambda        │    │  DynamoDB   │ │
│  │ OAuth Server    │    │  MCP Server     │    │   Token     │ │
│  │                 │    │                 │    │  Storage    │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│           │                       │                     │      │
│  ┌─────────────────┐    ┌─────────────────┐             │      │
│  │  API Gateway    │    │  API Gateway    │             │      │
│  │ OAuth Endpoints │    │ MCP Endpoints   │             │      │
│  └─────────────────┘    └─────────────────┘             │      │
│           │                       │                     │      │
└───────────┼───────────────────────┼─────────────────────┼──────┘
            │                       │                     │
            ▼                       ▼                     ▼
    OAuth Server URL         MCP Server URL        Token Database
0bmc3y5o9h.execute-api... 4p8xg1e2ii.execute-api...  (Internal)
```

## 🔐 Security Layers

```
Internet Request
       │
       ▼
┌─────────────┐
│   HTTPS     │ ◄── Encryption in transit
│ (SSL/TLS)   │
└─────────────┘
       │
       ▼
┌─────────────┐
│ API Gateway │ ◄── Rate limiting, CORS protection
│   (CORS)    │
└─────────────┘
       │
       ▼
┌─────────────┐
│   Lambda    │ ◄── OAuth token validation
│ (Auth Check)│
└─────────────┘
       │
       ▼
┌─────────────┐
│ JIRA Client │ ◄── Encrypted API token storage
│ (Data Access)│
└─────────────┘
       │
       ▼
    JIRA Cloud ◄── External service (HTTPS)
```

## 📱 Real-World Example

### Scenario: Amazon Q wants to list JIRA projects

```
Step 1: Registration (One-time setup)
Amazon Q → OAuth Server: "Hi, I'm Amazon Q, can I access JIRA?"
OAuth Server → Amazon Q: "Sure! Your client_id is 'abc123'"

Step 2: Getting Permission
Amazon Q → OAuth Server: "User wants JIRA access, here's my client_id"
OAuth Server → Amazon Q: "OK, here's authorization code 'xyz789'"

Step 3: Getting Access Token
Amazon Q → OAuth Server: "Trade code 'xyz789' for access token"
OAuth Server → Amazon Q: "Here's token 'token_456' (valid 1 hour)"

Step 4: Accessing Data
Amazon Q → MCP Server: "List projects" + "Bearer token_456"
MCP Server → OAuth Server: "Is token_456 valid?"
OAuth Server → MCP Server: "Yes, it's good!"
MCP Server → Amazon Q: "Here are the JIRA projects: [Project A, Project B]"
```

## 🎯 Key Benefits

### Before OAuth (Insecure)

**Benefits:**
- ✅ No passwords shared
- ✅ Tokens can be revoked
- ✅ Tokens expire automatically
- ✅ Fine-grained permissions
- ✅ Audit trail of access

---

