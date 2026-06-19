import 'shared/lib/date';

import { AppProvider } from 'model/app-provider/app-provider';
import { useCheckVersion } from 'shared/hooks/use-check-version';
import { ErrorBoundary } from 'shared/ui/error-boundary';
import { ViewProvider } from 'model/view-provider';
import { ScanProvider } from 'model/scan-provider';
import { Screens } from './screens';

import 'shared/common/colors.css';
import 'shared/common/vars.css';

const App = () => {
    useCheckVersion();
    return (
        <ErrorBoundary>
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
