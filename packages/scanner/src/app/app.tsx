import type { FallbackProps } from 'react-error-boundary';
import { ErrorBoundary } from 'react-error-boundary';

import 'shared/lib/date';

import { AppProvider } from 'model/app-provider/app-provider';
import { useCheckVersion } from 'shared/hooks/use-check-version';
import { ViewProvider } from 'model/view-provider';
import { ScanProvider } from 'model/scan-provider';
import { Screens } from './screens';

import 'shared/common/colors.css';
import 'shared/common/media.css';
import 'shared/common/vars.css';

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
    const message = error instanceof Error ? error.message : String(error);
    return (
        <div role="alert">
            <p>я сломался</p>
            <pre>{message}</pre>
            <button onClick={resetErrorBoundary}>ПЕРЕЗАГРУЗИТЬ</button>
        </div>
    );
};

const App = () => {
    useCheckVersion();
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <AppProvider>
                <ViewProvider>
                    <ScanProvider>
                        <Screens />
                    </ScanProvider>
                </ViewProvider>
            </AppProvider>
        </ErrorBoundary>
    );
};

export default App;
