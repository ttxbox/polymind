export function getToolDescriptionsSection(): string {
  return `# Tool Descriptions

## read_file
Description: Requests to read the content of a file at a specified path. 
Use this tool when you need to inspect an existing file whose content you are unaware of, such as analyzing code, viewing a text file, or extracting information from a configuration file.
The output content will have line numbers prefixed to each line (e.g., "1 | const x = 1"), making it easier to reference specific lines when creating diffs or discussing code. 
It can automatically extract raw text from PDF and DOCX files. It might not work for other types of binary files as it returns the raw content as a string.
Parameters:
- file_path:(Required) The path of the file to read (When the path is uncertain, confirm with the user).
Usage:
<built_in_tool_call>
<read_file>
<file_path>Fill in the file path here</file_path>
</read_file>
</built_in_tool_call>

Example: Request to read the frontend-config.json file
<built_in_tool_call>
<read_file>
<file_path>frontend-config.json</file_path>
</read_file>
</built_in_tool_call>

## write_file
Description: Requests to write the complete content to a file at a specified path. If the file already exists, it will be overwritten with the provided content. 
If the file does not exist, a new file will be created. This tool automatically creates all necessary directories required to write the file.
Parameters:
- file_path: (Required) The path of the file to write to (When the path is uncertain, confirm with the user).
- content: (Required) The content to write to the file. Always provide the complete intended content of the file, without any truncation or omission. You must include all parts of the file, even if they are unmodified. However, do not include line numbers in the content, only provide the actual content of the file.
- line_count:  (Required) The number of lines in the file. Ensure this count is based on the actual content of the file, not the number of lines in the content you provide.
Usage:
<built_in_tool_call>
<write_file>
<file_path>Fill in the file path here</file_path>
<content>
Fill in the file content here
</content>
<line_count>Total number of lines in the file, including empty lines</line_count>
</write_file>
</built_in_tool_call>

Example: Request to write to frontend-config.json
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
Description: Requests to list the names of files and subdirectories in a specified directory. 
Use this tool when you need to understand the directory structure or confirm the existence of files. 
By default, it only lists the current level, recursion can be enabled if necessary.
Parameters:
- directory_path:  (Required) The path of the directory to list (When the path is uncertain, confirm with the user).
- recursive: (Optional) Whether to recursively list subdirectories, boolean type, defaults to false. Set to true only when the complete directory tree is genuinely needed to avoid excessive output.
Usage:
<built_in_tool_call>
<list_files>
<directory_path>Fill in the directory path here</directory_path>
<recursive>false</recursive>
</list_files>
</built_in_tool_call>

Example: Request to list the src/main directory
<built_in_tool_call>
<list_files>
<directory_path>src/main</directory_path>
<recursive>false</recursive>
</list_files>
</built_in_tool_call>

## execute_command
Description: Requests the execution of a command line instruction and returns the standard output and standard error. Use this tool only when needing to run commands related to the system itself; it cannot be used for network requests or accessing external websites. 
That is, use it only when there is a clear need, and carefully evaluate the potential side effects of the command. You must tailor the command to the user's system and clearly explain its function. For command chaining, use the appropriate chaining syntax for the user's shell. 
By default, it runs in the current working directory; other directories or shells can be specified as needed.
Parameters:
- command: (Required) The complete command string to execute.
- working_directory: (Optional) The directory to use when executing the command. When the path is necessary, confirm with the user.
- timeout: (Optional) The maximum allowed runtime for the command in milliseconds, number type. Leave empty for the default of 30000.
- shell: (Optional) The shell used to execute the command, eg \`powershell.exe\`、\`bash\`, Leave empty to use the system default.。
Usage:
<built_in_tool_call>
<execute_command>
<command>Fill in the command here</command>
<working_directory>Optional working directory</working_directory>
<timeout>30000</timeout>
<shell>Optional shell</shell>
</execute_command>
</built_in_tool_call>

Example: Check Node.js version
<built_in_tool_call>
<execute_command>
<command>node -v</command>
<timeout>5000</timeout>
</execute_command>
</built_in_tool_call>
`
}
