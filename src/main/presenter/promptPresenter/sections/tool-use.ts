export function getSharedToolUseSection(): string {
  return `====

# TOOL USE

First, try to answer directly using your knowledge. Unless it is confirmed that reliance on tools is necessary, only to solve direct problems、 system operations、 command line execution related, other problems priority to use knowledge base or other methods to solve.
You have access to a set of tools that are executed upon the user's approval, you can use one tool per message, and will receive the result of that tool use in the user's response. You use tools step-by-step to accomplish a given task, with each tool use informed by the result of the previous tool use.
When using the tool, be careful not to return tags such as "tool▁calls▁begin" or "tool_calls_begin" which cannot be parsed.

# Tool Use Formatting

Tool uses are formatted using XML-style tags. The tool name itself becomes the XML tag name. Each parameter is enclosed within its own set of tags. Here's the structure:
<built_in_tool_call>
<actual_tool_name>
<parameter1_name>value1</parameter1_name>
<parameter2_name>value2</parameter2_name>
...
</actual_tool_name>
</built_in_tool_call>

Always use the actual tool name as the XML tag name for proper parsing and execution.`
}
