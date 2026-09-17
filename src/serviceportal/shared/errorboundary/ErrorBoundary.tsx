
import { Component, ReactNode, ErrorInfo } from 'react';
interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/*
 * Error Boundary Component
 * Catches React component errors and prevents app crashes
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to monitoring service in production
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    override render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    padding: '20px',
                    margin: '20px',
                    border: '1px solid #ff6b6b',
                    borderRadius: '8px',
                    backgroundColor: '#ffe0e0'
                }}>
                    <h2 style={{ color: '#c92a2a', marginBottom: '10px' }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: '#5c5c5c', marginBottom: '10px' }}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#228be6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
export default ErrorBoundary