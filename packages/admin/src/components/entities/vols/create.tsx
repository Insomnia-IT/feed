import { Suspense, lazy } from 'react';
import { Spin } from 'antd';

import { useVolunteerCardLegacyUi } from './volunteer-card-legacy-ui';
import { VolCreateNew } from './vol-create-new';

const VolCreateLegacy = lazy(() =>
    import('./legacy/vol-create').then((module) => ({ default: module.VolCreateLegacy }))
);

const legacyFallback = (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
    </div>
);

export const VolCreate = () => {
    const legacyUiEnabled = useVolunteerCardLegacyUi();

    if (legacyUiEnabled) {
        return (
            <Suspense fallback={legacyFallback}>
                <VolCreateLegacy />
            </Suspense>
        );
    }

    return <VolCreateNew />;
};
