# No Temporary Fixes or Mock Solutions

## Core Principle
**NEVER implement temporary fixes, workarounds, or mock solutions.** Always implement proper, production-ready solutions.

## Prohibited Practices

### ❌ Temporary Fixes
- Commenting out code to "fix later"
- Disabling functions or features temporarily
- Using placeholder values or hardcoded data
- Skipping error handling "for now"
- Quick hacks to make tests pass

### ❌ Mock Solutions
- Returning hardcoded data instead of real API calls
- Using fake services or mock implementations
- Stubbing out functionality with TODO comments
- Creating dummy implementations

### ❌ Workarounds
- Bypassing proper error handling
- Using any/unknown types to avoid TypeScript errors
- Ignoring linting rules or compiler warnings
- Implementing band-aid solutions

## ✅ Required Approach

### Proper Implementation
- Fix root causes, not symptoms
- Implement complete, working solutions
- Handle all error cases properly
- Write production-ready code from the start

### TypeScript Compliance
- Fix all TypeScript errors properly
- Use correct types and interfaces
- Handle undefined/null cases explicitly
- Never use `any` or `@ts-ignore` as shortcuts

### Error Handling
- Implement comprehensive error handling
- Provide meaningful error messages
- Handle edge cases and failure scenarios
- Log errors appropriately for debugging

### Testing
- Write real tests against actual implementations
- Test error conditions and edge cases
- Use real data and scenarios
- Validate complete workflows

## Enforcement
- All code must pass TypeScript compilation without errors
- All tests must use real implementations
- Code reviews must reject temporary solutions
- No deployment with known temporary fixes

## Rationale
Temporary fixes and mocks:
- Create technical debt
- Hide real problems
- Lead to production issues
- Make debugging harder
- Reduce code quality
- Create maintenance burden

**Always do it right the first time.**