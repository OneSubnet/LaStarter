import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
    children: ReactNode;
    fallback?: ReactNode;
};

type State = {
    hasError: boolean;
    error: Error | null;
};

class ErrorBoundaryInner extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    override componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
        this.setState({ hasError: true, error });
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    override render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
        }

        return this.props.children;
    }
}

function ErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8">
            <AlertTriangle className="size-10 text-destructive" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">
                {t('errors.boundary_title')}
            </h2>
            <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                {t('errors.boundary_message')}
            </p>
            {error && (
                <pre className="mt-4 max-w-lg overflow-auto rounded bg-muted p-3 text-xs text-muted-foreground">
                    {error.message}
                </pre>
            )}
            <button
                type="button"
                onClick={onRetry}
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
                <RefreshCw className="size-4" />
                {t('errors.try_again')}
            </button>
        </div>
    );
}

export function ErrorBoundary({ children, fallback }: Props) {
    return <ErrorBoundaryInner fallback={fallback}>{children}</ErrorBoundaryInner>;
}

export function PageErrorBoundary({ children }: { children: ReactNode }) {
    return (
        <ErrorBoundary>
            {children}
        </ErrorBoundary>
    );
}
