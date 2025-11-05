import React from 'react';

declare global {
  interface Window {
    electron?: {
      platform: string;
      versions: {
        node: string;
        chrome: string;
        electron: string;
      };
    };
  }
}

function App() {
  const electron = window.electron;

  return (
    <div className="p-12 font-sans max-w-3xl mx-auto">
      <h1 className="text-4xl mb-4">Hello World</h1>
      <p className="text-xl text-gray-600 mb-8">
        Welcome to neovate-code-desktop
      </p>

      {electron && (
        <div className="bg-gray-100 p-6 rounded-lg font-mono">
          <h2 className="mt-0 text-xl">System Info:</h2>
          <p>
            <strong>Platform:</strong> {electron.platform}
          </p>
          <p>
            <strong>Node:</strong> {electron.versions.node}
          </p>
          <p>
            <strong>Chrome:</strong> {electron.versions.chrome}
          </p>
          <p>
            <strong>Electron:</strong> {electron.versions.electron}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
