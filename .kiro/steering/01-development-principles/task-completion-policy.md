# Task Completion Policy

## Never Skip Steps Rule

**CRITICAL REQUIREMENT**: Never skip or bypass any task or step in the implementation process.

### Core Principles

1. **Complete Every Task**: Each task must be fully completed and verified before moving to the next
2. **Fix All Issues**: If a task has errors or issues, they must be resolved completely
3. **No Shortcuts**: Never mark a task as complete if it has known issues or failures
4. **Thorough Testing**: Every task must be tested and validated on AWS infrastructure
5. **Sequential Execution**: Tasks must be completed in the specified order

### Task Completion Criteria

A task is only considered complete when:
- All code has been written and deployed
- All functionality works as expected on AWS
- All tests pass successfully
- No errors or failures remain
- Requirements are fully satisfied

### Error Resolution Process

When encountering errors in a task:
1. **Identify Root Cause**: Thoroughly investigate the error
2. **Fix the Issue**: Implement the proper solution
3. **Test the Fix**: Verify the fix works on AWS
4. **Validate Completely**: Ensure all functionality works end-to-end
5. **Only Then Proceed**: Move to next task only after complete resolution

### Quality Standards

- Every Lambda function must execute without errors
- Every API endpoint must return proper responses
- Every integration must work with real AWS services
- Every deployment must be successful and stable

### Documentation Requirements

- Document all fixes and solutions implemented
- Update task status only when truly complete
- Provide evidence of successful completion
- Note any dependencies or prerequisites for future tasks

This policy ensures high-quality, reliable implementations and prevents technical debt from accumulating.