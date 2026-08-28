'use client';

import React, { Component, ReactNode } from 'react';
import { Warning as AlertTriangle, ArrowsClockwise as RefreshCw, House as Home } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { useLocale } from '@/hooks/use-locale';

function DefaultErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { t } = useLocale();
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t.errors.title}</h1>
          <p className="text-gray-400">{t.errors.description}</p>
        </div>
        {process.env.NODE_ENV === 'development' && error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-left">
            <p className="text-sm font-mono text-red-400 break-all">{error.toString()}</p>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={onReset} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t.errors.retry}
          </Button>
          <Button onClick={() => { window.location.href = '/'; }} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            {t.errors.backHome}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}
