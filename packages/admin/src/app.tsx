import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Refine, useGetIdentity } from '@refinedev/core';
import { useNotificationProvider } from '@refinedev/antd';
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
    DashboardOutlined,
    ExperimentOutlined
} from '@ant-design/icons';
import antdLocale from 'antd/lib/locale/ru_RU';
import routerProvider from '@refinedev/react-router-v6';
import { DocumentTitleHandler, NavigateToResource, UnsavedChangesNotifier } from '@refinedev/react-router-v6';
import { I18nextProvider, useTranslation } from 'react-i18next';

import i18n from './i18n';
import { ACL } from 'acl';
import { ScreenProvider } from 'shared/providers';
import { authProvider } from 'authProvider';
import { dataProvider } from 'dataProvider';
import { AppRoles, UserData } from 'auth';
import { AppRoutes } from './app-routes';

const InitialNavigation = () => {
    const { data: user } = useGetIdentity<UserData>();

    return user ? <NavigateToResource resource={user.roles[0] === AppRoles.SOVA ? 'wash' : 'volunteers'} /> : null;
};

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
                    <ScreenProvider>
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
                                <AppRoutes initial={<InitialNavigation />} />

                                <UnsavedChangesNotifier />
                                <DocumentTitleHandler />
                            </Refine>
                        </AntdApp>
                    </ScreenProvider>
                </ConfigProvider>
            </I18nextProvider>
        </BrowserRouter>
    );
};

export default App;
