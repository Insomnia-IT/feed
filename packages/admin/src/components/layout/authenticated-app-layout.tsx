import { ThemedLayout } from '@refinedev/antd';
import { Outlet, useLocation } from 'react-router';

import CustomSider from 'components/sider/sider';
import { VolunteerCardUiBannerProvider } from 'components/entities/vols/volunteer-card-ui-banner-context';
import { useVolunteerCardLegacyUi } from 'components/entities/vols/volunteer-card-legacy-ui';
import { VolunteerCardUiTopBanner } from 'components/entities/vols/volunteer-card-ui-switch';

import styles from './authenticated-app-layout.module.css';

const isVolunteerCardRoute = (pathname: string) => /^\/volunteers\/(create|edit\/[^/]+)\/?$/.test(pathname);

export const AuthenticatedAppLayout = () => {
    const location = useLocation();
    const legacyUiEnabled = useVolunteerCardLegacyUi();
    const isCardRoute = isVolunteerCardRoute(location.pathname);
    const bannerMode = isCardRoute ? (legacyUiEnabled ? 'legacy' : 'new') : null;

    const layout = (
        <ThemedLayout Sider={() => <CustomSider />}>
            <Outlet />
        </ThemedLayout>
    );

    return (
        <VolunteerCardUiBannerProvider>
            {isCardRoute && bannerMode ? (
                <div className={styles.appLayoutWithBanner}>
                    <VolunteerCardUiTopBanner mode={bannerMode} />
                    <div className={`${styles.appLayoutBody} app-layout-body`}>{layout}</div>
                </div>
            ) : (
                layout
            )}
        </VolunteerCardUiBannerProvider>
    );
};
