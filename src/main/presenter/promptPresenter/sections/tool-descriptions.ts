export function getToolDescriptionsSection(): string {
  return `## Tool Descriptions

## read_file
描述：请求读取指定路径文件的内容。当您需要检查一个您不知道内容的现有文件时使用此工具，例如分析代码、查看文本文件或从配置文件中提取信息。输出内容会在每行前添加行号（例如："1 | const x = 1"），这样在创建差异或讨论代码时更容易引用特定行。可以自动从PDF和DOCX文件中提取原始文本。可能不适用于其他类型的二进制文件，因为它会将原始内容作为字符串返回。
参数：
- file_path:(必需)要读取的文件路径（当路径不确定时,向用户确认）
用法：
<built_in_tool_call>
<read_file>
<file_path>在此处填写文件路径</file_path>
</read_file>
</built_in_tool_call>

示例：请求读取frontend-config.json文件
<built_in_tool_call>
<read_file>
<file_path>frontend-config.json</file_path>
</read_file>
</built_in_tool_call>

## write_file
描述：请求将完整内容写入指定路径的文件。如果文件已存在，将用提供的内容覆盖它。如果文件不存在，将创建新文件。此工具会自动创建写入文件所需的所有目录。
参数：
- file_path: (必需)要写入的文件路径（当路径不确定时,向用户确认）
- content: (必需)要写入文件的内容。始终提供文件的完整预期内容，不要有任何截断或遗漏。您必须包含文件的所有部分，即使它们没有被修改。但不要在内容中包含行号，只需提供文件的实际内容。
- line_count: (必需）文件中的行数。确保根据文件的实际内容计算行数，而不是根据您提供的内容中的行数计算。
用法：
<built_in_tool_call>
<write_file>
<file_path>在此处填写文件路径</file_path>
<content>
在此处填写文件内容
</content>
<line_count>文件的总行数，包括空行</line_count>
</write_file>
</built_in_tool_call>

示例：请求写入 frontend-config.json
<built_in_tool_call>
<write_file>
<file_path>frontend-config.json</file_path>
<content>
{
  "apiEndpoint": "https://api.example.com",
  "theme": {
    "primaryColor": "#007bff",
    "secondaryColor": "#6c757d",
    "fontFamily": "Arial, sans-serif"
  },
  "features": {
    "darkMode": true,
    "notifications": true,
    "analytics": false
  },
  "version": "1.0.0"
}
</content>
<line_count>14</line_count>
</write_file>
</built_in_tool_call>

## list_files
描述：请求列出指定目录中的文件和子目录名称。当你需要了解目录结构或确认文件是否存在时使用此工具。默认只列出当前层级，必要时可以开启递归。
参数：
- directory_path: (必需)要列出的目录路径（当路径不确定时,向用户确认）
- recursive: (可选)是否递归列出子目录, boolean值类型, 默认为 false。只有在确实需要完整目录树时才设为true,以避免输出过多信息。
用法：
<built_in_tool_call>
<list_files>
<directory_path>在此处填写目录路径</directory_path>
<recursive>false</recursive>
</list_files>
</built_in_tool_call>

示例：请求列出 src/main 目录
<built_in_tool_call>
<list_files>
<directory_path>src/main</directory_path>
<recursive>false</recursive>
</list_files>
</built_in_tool_call>

## execute_command
描述：请求执行命令行指令, 并返回标准输出和标准错误。只有当需要运行系统本身相关的命令,可以使用此工具,但网络请求或访问外部网站,不可使用此工具,即仅在有明确需求时使用,注意评估命令可能带来的副作用。您必须根据用户的系统定制命令,并清楚地解释命令的功能。对于命令链接,请使用适合用户shell的链接语法。默认在当前工作目录运行,可按需指定其它目录或 shell。
参数：
- command: (必需）要执行的完整命令字符串。
- working_directory: (可选）命令执行时使用的目录，当路径必须时，向用户确认。
- timeout: (可选)命令允许运行的最长时间(毫秒),number值类型, 留空默认 30000。
- shell: (可选）用于执行命令的 shell,例如 \`powershell.exe\`、\`bash\`，留空使用系统默认值。
用法：
<built_in_tool_call>
<execute_command>
<command>在此处填写命令</command>
<working_directory>可选工作目录</working_directory>
<timeout>30000</timeout>
<shell>可选 shell</shell>
</execute_command>
</built_in_tool_call>

示例：查看 Node.js 版本
<built_in_tool_call>
<execute_command>
<command>node -v</command>
<timeout>5000</timeout>
</execute_command>
</built_in_tool_call>
`
}
