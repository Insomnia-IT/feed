import React from 'react';
import { Route, Routes, Outlet } from 'react-router-dom';
import { Authenticated } from '@refinedev/core';
import { ThemedLayoutV2, ErrorComponent } from '@refinedev/antd';
import { CatchAllNavigate } from '@refinedev/react-router-v6';

import { useScreen } from 'shared/providers';
import CustomSider from 'components/sider/sider';
import { LoginPage } from 'components/login';
import { Dashboard } from 'components/dashboard';
import { VolList, VolCreate, VolEdit, VolShow } from 'components/entities/vols';
import {
    VolunteerCustomFieldList,
    VolunteerCustomFieldCreate,
    VolunteerCustomFieldEdit,
    VolunteerCustomFieldShow
} from 'components/entities/volunteer-custom-fields';
import { DepartmentList, DepartmentCreate, DirectionEdit, DirectionShow } from 'components/entities/directions';
import { GroupBadgeList, GroupBadgeCreate, GroupBadgeEdit, GroupBadgeShow } from 'components/entities/group-badges';
import { FeedTransactionList, FeedTransactionCreate } from 'components/entities/feed-transaction';
import { PublicStatistic } from 'components/entities/statistic';
import { Scanner } from 'components/scanner';
import { Sync } from 'components/sync';
import { Wash } from 'components/wash';
import { WashesHistory } from 'components/wash/list/washes-history';

interface IProps {
    initial: React.ReactNode;
}

export const AppRoutes: React.FC<IProps> = ({ initial }) => {
    const { isDesktop } = useScreen();

    return (
        <Routes>
            <Route
                element={
                    <Authenticated key="authenticated-inner" fallback={<CatchAllNavigate to="/login" />}>
                        <ThemedLayoutV2 Sider={() => <CustomSider />}>
                            <Outlet />
                        </ThemedLayoutV2>
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
    );
};
