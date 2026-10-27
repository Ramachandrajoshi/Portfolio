'use client';

import { Sandpack } from '@codesandbox/sandpack-react';
import type { SandpackTemplateName } from './SandpackLauncher';

export default function SandpackRuntime({
  template,
  files,
  activeFile,
  theme,
}: {
  template: SandpackTemplateName;
  files: Record<string, string>;
  activeFile: string;
  theme: 'light' | 'dark';
}) {
  return (
    <Sandpack
      template={template}
      files={files}
      theme={theme === 'dark' ? 'dark' : 'light'}
      options={{
        activeFile,
        showConsole: true,
        showConsoleButton: true,
        editorHeight: 420,
        showLineNumbers: true,
        wrapContent: true,
      }}
    />
  );
}
