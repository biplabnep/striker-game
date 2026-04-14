'use client';
import { Component } from 'react';
import { useGameStore } from '@/store/gameStore';

interface Props { children: React.ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }

  goHome = () => {
    this.setState({ error: null });
    try {
      const store = useGameStore.getState();
      store.setScreen('main_menu');
    } catch { /* store may not be ready */ }
  };

  render() {
    if (!this.state.error) return this.props.children;

    const { message, stack } = this.state.error;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] p-4">
        <div className="w-full max-w-lg bg-[#161b22] border border-red-500/30 border-l-2 border-l-red-500/50 rounded-lg p-6">
          {/* Warning icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-red-500/10 border border-red-500/20">
              <svg
                width="20" height="20" viewBox="0 0 20 20" fill="none"
                className="text-red-400"
              >
                <path
                  d="M10 2L1 18h18L10 2z"
                  stroke="currentColor" strokeWidth="1.5"
                  strokeLinejoin="round" fill="none"
                />
                <line
                  x1="10" y1="7" x2="10" y2="12"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                />
                <circle cx="10" cy="14.5" r="0.75" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-center text-lg font-semibold text-[#c9d1d9] mb-2">
            Something went wrong
          </h2>

          {/* Error message */}
          <p className="text-sm text-red-400 font-mono text-center mb-4 break-words">
            {message}
          </p>

          {/* Collapsible stack trace */}
          <details className="mb-6">
            <summary className="text-xs text-[#484f58] cursor-pointer select-none hover:text-[#6e7681] transition-colors">
              Stack Trace
            </summary>
            <pre className="mt-2 p-3 bg-[#0d1117] rounded-md border border-[#21262d] text-xs text-[#484f58] font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
              {stack}
            </pre>
          </details>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition-colors cursor-pointer"
            >
              Try Again
            </button>
            <button
              onClick={this.goHome}
              className="flex-1 py-2 px-4 border border-[#30363d] text-[#c9d1d9] text-sm font-medium rounded-md hover:border-[#484f58] hover:text-white transition-colors cursor-pointer"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
