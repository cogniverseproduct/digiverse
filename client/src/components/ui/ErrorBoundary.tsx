import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Short name of the area, shown in the message (for example "Portfolio Engine"). */
  area?: string;
  /** Rendered as a "Back" button when provided. */
  onBack?: () => void;
  /** Changing this value clears a previous error (for example the active view). */
  resetKey?: string | number;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Stops a render error in one area from unmounting the whole app (the "blank page").
 * The real error message is shown, not hidden, and is also logged to the console.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(`[ErrorBoundary${this.props.area ? `: ${this.props.area}` : ''}]`, error, info.componentStack);
  }

  componentDidUpdate(prev: ErrorBoundaryProps): void {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div role="alert" className="mx-auto my-8 max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-base font-bold">{this.props.area ? `${this.props.area} hit a problem` : 'Something went wrong'}</h2>
            <p className="mt-1 text-sm">This screen could not be shown. Nothing was lost; your saved data is unchanged.</p>
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-white/70 p-3 text-xs text-rose-900">{error.message || String(error)}</pre>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => this.setState({ error: null })} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-500">
                <RefreshCw className="h-3.5 w-3.5" />Try again
              </button>
              {this.props.onBack && (
                <button type="button" onClick={() => { this.setState({ error: null }); this.props.onBack?.(); }} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100">
                  <ArrowLeft className="h-3.5 w-3.5" />Back
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
