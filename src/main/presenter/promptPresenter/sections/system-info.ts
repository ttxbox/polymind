import os from 'os'
import osName from 'os-name'

export function getSystemInfoSection(): string {
  return `====

SYSTEM INFORMATION

Operating System: ${osName()}
System Arch: ${os.arch()}
Home Directory: ${os.homedir()}
`
}
