import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`FieldMate error (${this.props.label ?? 'page'}):`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card-premium p-6 text-center flex flex-col items-center gap-3">
          <h4 className="font-extrabold text-sm text-primary-850">Something went wrong</h4>
          <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[90%]">
            This page crashed. Hard refresh with Ctrl+Shift+R, or restart the dev server at{' '}
            <strong>http://localhost:5173</strong>.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary py-2.5 px-6 text-xs text-white"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
