import { Suspense, lazy } from 'react';
import { Spin } from 'antd';

import { useVolunteerCardLegacyUi } from './volunteer-card-legacy-ui';
import { VolEditNew } from './vol-edit-new';

const VolEditLegacy = lazy(() => import('./legacy/vol-edit').then((module) => ({ default: module.VolEditLegacy })));

const legacyFallback = (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
    </div>
);

export const VolEdit = () => {
    const legacyUiEnabled = useVolunteerCardLegacyUi();

    if (legacyUiEnabled) {
        return (
            <Suspense fallback={legacyFallback}>
                <VolEditLegacy />
            </Suspense>
        );
    }

    return <VolEditNew />;
};
