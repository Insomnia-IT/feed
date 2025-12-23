import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Refine, useGetIdentity, I18nProvider } from '@refinedev/core';
import routerProvider, {
    DocumentTitleHandler,
    NavigateToResource,
    UnsavedChangesNotifier
} from '@refinedev/react-router-v6';
import { useNotificationProvider } from '@refinedev/antd';
import '@refinedev/antd/dist/reset.css';
import { App as AntdApp, ConfigProvider } from 'antd';
import antdLocale from 'antd/lib/locale/ru_RU';
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

import { ACL } from 'acl';
import { ScreenProvider } from 'shared/providers';
import { authProvider } from 'authProvider';
import { dataProvider } from 'dataProvider';
import { AppRoles, UserData } from 'auth';
import { AppRoutes } from './app-routes';

import common from './locales/ru/common.json';

type SupportedLocale = 'ru';
const messages: Record<SupportedLocale, any> = { ru: common };
let currentLocale: SupportedLocale = 'ru';

function getByPath(obj: any, path: string[]): string | undefined {
    return path.reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
}

const i18nProvider: I18nProvider = {
    translate: (key: string, params?: Record<string, any>): string => {
        const path = key.split('.');
        let msg = getByPath(messages[currentLocale], path) as string | undefined;
        if (!msg) {
            return key;
        }
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                msg = msg!.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
            });
        }
        return msg!;
    },
    changeLocale: async (locale: string): Promise<void> => {
        if (locale === 'ru') {
            currentLocale = 'ru';
        }
    },
    getLocale: (): string => {
        return currentLocale;
    }
};

const InitialNavigation: React.FC = () => {
    const { data: user } = useGetIdentity<UserData>();
    if (!user) return null;
    return <NavigateToResource resource={user.roles[0] === AppRoles.SOVA ? 'wash' : 'volunteers'} />;
};

const App: React.FC = () => {
    const notificationProvider = useNotificationProvider();

    return (
        <BrowserRouter>
            <ConfigProvider locale={antdLocale} theme={{ token: { borderRadius: 6 } }}>
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
        </BrowserRouter>
    );
};

export default App;
