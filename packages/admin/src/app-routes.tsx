import { Suspense, lazy, type ComponentType, type ReactNode } from 'react';
import { Route, Routes, Outlet } from 'react-router';
import { Authenticated } from '@refinedev/core';
import { ThemedLayout, ErrorComponent } from '@refinedev/antd';
import { CatchAllNavigate } from '@refinedev/react-router';
import { Spin } from 'antd';

import { useScreen } from 'shared/providers';
import CustomSider from 'components/sider/sider';

interface IProps {
    initial: ReactNode;
}

function lazyNamed<TModule extends Record<string, ComponentType>, TName extends keyof TModule>(
    loader: () => Promise<TModule>,
    name: TName
) {
    return lazy(async () => ({
        default: (await loader())[name]
    }));
}

const LoginPage = lazyNamed(() => import('components/login/login'), 'LoginPage');
const Dashboard = lazyNamed(() => import('components/dashboard/dashboard'), 'Dashboard');
const VolList = lazyNamed(() => import('components/entities/vols/list'), 'VolList');
const VolCreate = lazyNamed(() => import('components/entities/vols/create'), 'VolCreate');
const VolEdit = lazyNamed(() => import('components/entities/vols/edit'), 'VolEdit');
const VolShow = lazyNamed(() => import('components/entities/vols/show'), 'VolShow');
const VolunteerCustomFieldList = lazyNamed(
    () => import('components/entities/volunteer-custom-fields/list'),
    'VolunteerCustomFieldList'
);
const VolunteerCustomFieldCreate = lazyNamed(
    () => import('components/entities/volunteer-custom-fields/create'),
    'VolunteerCustomFieldCreate'
);
const VolunteerCustomFieldEdit = lazyNamed(
    () => import('components/entities/volunteer-custom-fields/edit'),
    'VolunteerCustomFieldEdit'
);
const VolunteerCustomFieldShow = lazyNamed(
    () => import('components/entities/volunteer-custom-fields/show'),
    'VolunteerCustomFieldShow'
);
const DepartmentList = lazyNamed(() => import('components/entities/directions/list'), 'DepartmentList');
const DepartmentCreate = lazyNamed(() => import('components/entities/directions/create'), 'DepartmentCreate');
const DirectionEdit = lazyNamed(() => import('components/entities/directions/edit'), 'DirectionEdit');
const DirectionShow = lazyNamed(() => import('components/entities/directions/show'), 'DirectionShow');
const GroupBadgeList = lazyNamed(() => import('components/entities/group-badges/list'), 'GroupBadgeList');
const GroupBadgeCreate = lazyNamed(() => import('components/entities/group-badges/create'), 'GroupBadgeCreate');
const GroupBadgeEdit = lazyNamed(() => import('components/entities/group-badges/edit'), 'GroupBadgeEdit');
const GroupBadgeShow = lazyNamed(() => import('components/entities/group-badges/show'), 'GroupBadgeShow');
const FeedTransactionList = lazyNamed(() => import('components/entities/feed-transaction/list'), 'FeedTransactionList');
const FeedTransactionCreate = lazyNamed(
    () => import('components/entities/feed-transaction/create'),
    'FeedTransactionCreate'
);
const PublicStatistic = lazyNamed(() => import('components/entities/statistic/ui/public-statistic'), 'PublicStatistic');
const Scanner = lazyNamed(() => import('components/scanner/scanner'), 'Scanner');
const Sync = lazyNamed(() => import('components/sync/sync'), 'Sync');
const Wash = lazyNamed(() => import('components/wash/create/wash'), 'Wash');
const WashesHistory = lazyNamed(() => import('components/wash/list/washes-history'), 'WashesHistory');

const routeFallback = (
    <div style={{ display: 'grid', minHeight: '40vh', placeItems: 'center' }}>
        <Spin size="large" />
    </div>
);

export const AppRoutes = ({ initial }: IProps) => {
    const { isDesktop } = useScreen();

    return (
        <Suspense fallback={routeFallback}>
            <Routes>
                <Route
                    element={
                        <Authenticated key="authenticated-inner" fallback={<CatchAllNavigate to="/login" />}>
                            <ThemedLayout Sider={() => <CustomSider />}>
                                <Outlet />
                            </ThemedLayout>
                        </Authenticated>
                    }
                >
                    <Route index element={initial} />

                    <Route path="/dashboard" element={<Dashboard />} />

                    {!isDesktop ? (
                        <Route path="/wash" element={<Wash />} />
                    ) : (
                        <Route path="/wash">
                            <Route index element={<WashesHistory />} />
                            <Route path="create" element={<Wash />} />
                        </Route>
                    )}

                    <Route path="/volunteers">
                        <Route index element={<VolList />} />
                        <Route path="create" element={<VolCreate />} />
                        <Route path="edit/:id" element={<VolEdit />} />
                        <Route path="show/:id" element={<VolShow />} />
                    </Route>

                    <Route path="/volunteer-custom-fields">
                        <Route index element={<VolunteerCustomFieldList />} />
                        <Route path="create" element={<VolunteerCustomFieldCreate />} />
                        <Route path="edit/:id" element={<VolunteerCustomFieldEdit />} />
                        <Route path="show/:id" element={<VolunteerCustomFieldShow />} />
                    </Route>

                    <Route path="/directions">
                        <Route index element={<DepartmentList />} />
                        <Route path="create" element={<DepartmentCreate />} />
                        <Route path="edit/:id" element={<DirectionEdit />} />
                        <Route path="show/:id" element={<DirectionShow />} />
                    </Route>

                    <Route path="/group-badges">
                        <Route index element={<GroupBadgeList />} />
                        <Route path="create" element={<GroupBadgeCreate />} />
                        <Route path="edit/:id" element={<GroupBadgeEdit />} />
                        <Route path="show/:id" element={<GroupBadgeShow />} />
                    </Route>

                    <Route path="/feed-transaction">
                        <Route index element={<FeedTransactionList />} />
                        <Route path="create" element={<FeedTransactionCreate />} />
                    </Route>

                    <Route path="/stats" element={<PublicStatistic />} />

                    <Route path="/scanner-page" element={<Scanner />} />

                    <Route path="/sync" element={<Sync />} />

                    <Route path="*" element={<ErrorComponent />} />
                </Route>

                <Route path="/login" element={<LoginPage />} />
            </Routes>
        </Suspense>
    );
};
