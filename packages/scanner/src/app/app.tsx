import '../wdyr';

import type { FC, ReactElement } from 'react';
import type { FallbackProps } from 'react-error-boundary';
import { ErrorBoundary } from 'react-error-boundary';

import '~/shared/lib/date';

import { AppProvider } from '~/model/app-provider/app-provider';
import { useCheckVersion } from '~/shared/hooks/use-check-version';
import { Screens } from '~/app/screens';

import { ViewProvider } from '../model/view-provider/view-provider';

const ErrorFallback: FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
    <div role='alert'>
        <p>я сломался</p>
        <pre>{error.message}</pre>
        <button onClick={resetErrorBoundary}>ПЕРЕЗАГРУЗИТЬ</button>
    </div>
);

const App: FC = () => {
    useCheckVersion();

    return (
        // @ts-ignore
        <ErrorBoundary fallback={ErrorFallback as ReactElement}>
            <AppProvider>
                <ViewProvider>
                    <Screens />
                </ViewProvider>
            </AppProvider>
        </ErrorBoundary>
    );
};

// eslint-disable-next-line import/no-default-export
export default App;
