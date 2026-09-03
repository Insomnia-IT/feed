import { Component, type ReactNode } from 'react';

type ErrorBoundaryProps = {
    children: ReactNode;
};

type ErrorBoundaryState = {
    hasError: boolean;
    error: unknown;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        hasError: false,
        error: null
    };

    static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
        return { hasError: true, error };
    }

    private reset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            const message = this.state.error instanceof Error ? this.state.error.message : String(this.state.error);

            return (
                <div role="alert">
                    <p>я сломался</p>
                    <pre>{message}</pre>
                    <button onClick={this.reset}>ПЕРЕЗАГРУЗИТЬ</button>
                </div>
            );
        }

        return this.props.children;
    }
}
