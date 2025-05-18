import React from 'react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { Authenticated, Refine } from '@refinedev/core';
import { ErrorComponent, ThemedLayoutV2, useNotificationProvider } from '@refinedev/antd';
import '@refinedev/antd/dist/reset.css';
import { App as AntdApp, ConfigProvider } from 'antd';
import {
    UserOutlined,
    InsertRowRightOutlined,
    FormatPainterOutlined,
    ProfileOutlined,
    HistoryOutlined,
    LineChartOutlined,
    MobileOutlined,
    SyncOutlined,
    DashboardOutlined
} from '@ant-design/icons';
import antdLocale from 'antd/lib/locale/ru_RU';
import routerProvider from '@refinedev/react-router-v6';
import {
    CatchAllNavigate,
    DocumentTitleHandler,
    NavigateToResource,
    UnsavedChangesNotifier
} from '@refinedev/react-router-v6';
import { I18nextProvider, useTranslation } from 'react-i18next';

import i18n from './i18n';
import { ACL } from 'acl';
import { MediaProvider } from 'shared/providers';
import { authProvider } from 'authProvider';
import CustomSider from 'components/sider/sider';
import { Dashboard } from 'components/dashboard';
import { dataProvider } from 'dataProvider';
import { LoginPage } from 'components/login';
import { DepartmentCreate, DepartmentList, DirectionEdit, DirectionShow } from 'components/entities/directions';
import { GroupBadgeCreate, GroupBadgeEdit, GroupBadgeList, GroupBadgeShow } from 'components/entities/group-badges';
import { Sync } from 'components/sync';
import { Scanner } from 'components/scanner';
import { VolCreate, VolEdit, VolList, VolShow } from 'components/entities/vols';
import { FeedTransactionCreate, FeedTransactionList } from 'components/entities/feed-transaction';
import { PublicStatistic } from 'components/entities/statistic';
import {
    VolunteerCustomFieldCreate,
    VolunteerCustomFieldEdit,
    VolunteerCustomFieldList,
    VolunteerCustomFieldShow
} from 'components/entities/volunteer-custom-fields';
import { ExperimentOutlined } from '@ant-design/icons/lib/icons';
import { Wash } from 'components/wash';

const App: React.FC = () => {
    const { t, i18n: i18next } = useTranslation();

    const i18nProvider = {
        translate: (key: string, params: Record<string, object>) => t(key, params),
        changeLocale: (lang: string) => i18next.changeLanguage(lang),
        getLocale: () => i18next.language
    };

    const notificationProvider = useNotificationProvider();

    return (
        <BrowserRouter>
            <I18nextProvider i18n={i18n}>
                <ConfigProvider
                    locale={antdLocale}
                    theme={{
                        token: {
                            borderRadius: 2
                        }
                    }}
                >
                    <MediaProvider>
                        <AntdApp>
                            <Refine
                                routerProvider={routerProvider}
                                notificationProvider={notificationProvider}
                                dataProvider={dataProvider}
                                i18nProvider={i18nProvider}
                                authProvider={authProvider}
                                accessControlProvider={ACL}
                                options={{ syncWithLocation: true, disableTelemetry: true }}
                                resources={[
                                    {
                                        name: 'dashboard',
                                        list: '/dashboard',
                                        icon: <DashboardOutlined />
                                    },
                                    {
                                        name: 'volunteers',
                                        list: '/volunteers',
                                        create: '/volunteers/create',
                                        edit: '/volunteers/edit/:id',
                                        show: '/volunteers/show/:id',
                                        icon: <UserOutlined />
                                    },
                                    {
                                        name: 'volunteer-custom-fields',
                                        list: '/volunteer-custom-fields',
                                        create: '/volunteer-custom-fields/create',
                                        edit: '/volunteer-custom-fields/edit/:id',
                                        show: '/volunteer-custom-fields/show/:id',
                                        icon: <InsertRowRightOutlined />,
                                        meta: {
                                            hide: true
                                        }
                                    },
                                    {
                                        name: 'directions',
                                        list: '/directions',
                                        create: '/directions/create',
                                        edit: '/directions/edit/:id',
                                        show: '/directions/show/:id',
                                        icon: <FormatPainterOutlined />
                                    },
                                    {
                                        name: 'group-badges',
                                        list: '/group-badges',
                                        create: '/group-badges/create',
                                        edit: '/group-badges/edit/:id',
                                        show: '/group-badges/show/:id',
                                        icon: <ProfileOutlined />
                                    },
                                    {
                                        name: 'feed-transaction',
                                        list: '/feed-transaction',
                                        create: '/feed-transaction/create',
                                        icon: <HistoryOutlined />
                                    },
                                    {
                                        name: 'stats',
                                        list: '/stats',
                                        icon: <LineChartOutlined />
                                    },
                                    {
                                        name: 'scanner-page',
                                        list: '/scanner-page',
                                        icon: <MobileOutlined />
                                    },
                                    {
                                        name: 'wash',
                                        list: '/wash',
                                        icon: <ExperimentOutlined />
                                    },
                                    {
                                        name: 'sync',
                                        list: '/sync',
                                        icon: <SyncOutlined />
                                    }
                                ]}
                            >
                                <Routes>
                                    <Route
                                        element={
                                            <Authenticated
                                                key="authenticated-inner"
                                                fallback={<CatchAllNavigate to="/login" />}
                                            >
                                                <ThemedLayoutV2 Sider={() => <CustomSider />}>
                                                    <Outlet />
                                                </ThemedLayoutV2>
                                            </Authenticated>
                                        }
                                    >
                                        <Route path="/dashboard" element={<Dashboard />} />

                                        <Route path="/wash" element={<Wash />} />

                                        <Route index element={<NavigateToResource resource="volunteers" />} />

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

                                    <Route
                                        element={
                                            <Authenticated
                                                key="authenticated-outer"
                                                v3LegacyAuthProviderCompatible={false}
                                                fallback={<Outlet />}
                                            >
                                                <NavigateToResource />
                                            </Authenticated>
                                        }
                                    >
                                        <Route path="/login" element={<LoginPage />} />
                                    </Route>
                                </Routes>

                                <UnsavedChangesNotifier />
                                <DocumentTitleHandler />
                            </Refine>
                        </AntdApp>
                    </MediaProvider>
                </ConfigProvider>
            </I18nextProvider>
        </BrowserRouter>
    );
};

export default App;
