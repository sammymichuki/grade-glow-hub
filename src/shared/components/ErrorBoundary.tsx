import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { telemetryService } from '../telemetry/telemetryService';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    telemetryService.logError('react_boundary_catch', 'error', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : '',
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleGoHome = () => {
    this.handleReset();
    if (typeof window !== 'undefined') {
      window.location.href = '#/';
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-gray-50/50">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
              <p className="text-xs text-gray-500">
                An unexpected error occurred while rendering this educational view. Our telemetry system has logged this incident.
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                className="gap-1.5 text-xs h-9"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </Button>
              <Button
                size="sm"
                onClick={this.handleGoHome}
                className="gap-1.5 text-xs h-9 bg-education-primary text-white"
              >
                <Home className="w-3.5 h-3.5" /> Return Home
              </Button>
            </div>

            {/* Diagnostics Accordion */}
            <div className="pt-2 border-t text-left">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto"
              >
                {this.state.showDetails ? 'Hide' : 'View'} Technical Diagnostics
                {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-[10px] font-mono overflow-x-auto max-h-40 text-left">
                  <div className="text-rose-400 font-semibold mb-1">
                    {this.state.error?.toString()}
                  </div>
                  <pre className="whitespace-pre-wrap opacity-80">
                    {this.state.errorInfo?.componentStack || this.state.error?.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
