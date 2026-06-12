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
    const showVolunteerCardBanner = isVolunteerCardRoute(location.pathname);
    const bannerMode = showVolunteerCardBanner ? (legacyUiEnabled ? 'legacy' : 'new') : null;

    return (
        <VolunteerCardUiBannerProvider>
            <div className={bannerMode ? styles.appLayoutWithBanner : styles.appLayout}>
                {bannerMode ? <VolunteerCardUiTopBanner mode={bannerMode} /> : null}
                <div className={styles.appLayoutBody}>
                    <ThemedLayout Sider={() => <CustomSider />}>
                        <Outlet />
                    </ThemedLayout>
                </div>
            </div>
        </VolunteerCardUiBannerProvider>
    );
};
