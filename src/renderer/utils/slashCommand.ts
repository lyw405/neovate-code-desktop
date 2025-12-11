function isFilePath(input: string): boolean {
  // If the string starts with '/' and contains another '/', we consider it a file path.
  // This reliably identifies paths like '/path/to/file' while avoiding
  // misclassifying single-segment commands like '/help' or '/agent.run'.
  return input.startsWith('/') && input.indexOf('/', 1) !== -1;
}

export function isSlashCommand(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return false;
  if (trimmed === '/') return false;
  if (trimmed.startsWith('/*')) return false;
  const match = trimmed.match(/^\S+/);
  const commandPart = match ? match[0] : '';
  return commandPart !== '' && !isFilePath(commandPart);
}

export function parseSlashCommand(input: string): {
  command: string;
  args: string;
} {
  const trimmed = input.trim();
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) {
    return {
      command: trimmed.slice(1),
      args: '',
    };
  }
  return {
    command: trimmed.slice(1, spaceIndex),
    args: trimmed.slice(spaceIndex + 1).trim(),
  };
}
