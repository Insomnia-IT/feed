import { BrowserRouter } from 'react-router';
import { Refine, useGetIdentity } from '@refinedev/core';
import routerProvider, {
    DocumentTitleHandler,
    NavigateToResource,
    UnsavedChangesNotifier
} from '@refinedev/react-router';
import { useNotificationProvider } from '@refinedev/antd';
import '@refinedev/antd/dist/reset.css';
import { App as AntdApp, ConfigProvider } from 'antd';

import antdLocale from 'antd/lib/locale/ru_RU';
import 'shared/lib/dateHelper';
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
import { AppRoles, type UserData } from 'auth';
import { AppRoutes } from './app-routes';
import { buildDocumentTitle } from './i18n/document-title';
import { i18nProvider } from './i18n/provider';

const InitialNavigation = () => {
    const { data: user } = useGetIdentity<UserData>();
    if (!user) return null;
    return <NavigateToResource resource={user.roles[0] === AppRoles.SOVA ? 'wash' : 'volunteers'} />;
};

const App = () => {
    return (
        <BrowserRouter>
            <ConfigProvider locale={antdLocale} theme={{ token: { borderRadius: 6 } }}>
                <ScreenProvider>
                    <AntdApp>
                        <Refine
                            routerProvider={routerProvider}
                            notificationProvider={useNotificationProvider}
                            dataProvider={dataProvider}
                            i18nProvider={i18nProvider}
                            authProvider={authProvider}
                            accessControlProvider={ACL}
                            options={{ syncWithLocation: true, disableTelemetry: true }}
                            resources={[
                                {
                                    name: 'dashboard',
                                    list: '/dashboard',
                                    meta: { icon: <DashboardOutlined />, label: 'Регистрация' }
                                },
                                {
                                    name: 'volunteers',
                                    list: '/volunteers',
                                    create: '/volunteers/create',
                                    edit: '/volunteers/edit/:id',
                                    show: '/volunteers/show/:id',
                                    meta: { icon: <UserOutlined />, label: 'Волонтеры' }
                                },
                                {
                                    name: 'volunteer-custom-fields',
                                    list: '/volunteer-custom-fields',
                                    create: '/volunteer-custom-fields/create',
                                    edit: '/volunteer-custom-fields/edit/:id',
                                    show: '/volunteer-custom-fields/show/:id',
                                    meta: {
                                        icon: <InsertRowRightOutlined />,
                                        label: 'Кастомные поля',
                                        hide: true
                                    }
                                },
                                {
                                    name: 'directions',
                                    list: '/directions',
                                    create: '/directions/create',
                                    edit: '/directions/edit/:id',
                                    show: '/directions/show/:id',
                                    meta: { icon: <FormatPainterOutlined />, label: 'Службы/Локации' }
                                },
                                {
                                    name: 'group-badges',
                                    list: '/group-badges',
                                    create: '/group-badges/create',
                                    edit: '/group-badges/edit/:id',
                                    show: '/group-badges/show/:id',
                                    meta: { icon: <ProfileOutlined />, label: 'Групповые бейджи' }
                                },
                                {
                                    name: 'feed-transaction',
                                    list: '/feed-transaction',
                                    create: '/feed-transaction/create',
                                    meta: { icon: <HistoryOutlined />, label: 'История питания' }
                                },
                                {
                                    name: 'stats',
                                    list: '/stats',
                                    meta: { icon: <LineChartOutlined />, label: 'Статистика' }
                                },
                                {
                                    name: 'scanner-page',
                                    list: '/scanner-page',
                                    meta: { icon: <MobileOutlined />, label: 'Кормитель' }
                                },
                                {
                                    name: 'wash',
                                    list: '/wash',
                                    meta: { icon: <ExperimentOutlined />, label: 'Стирка' }
                                },
                                {
                                    name: 'sync',
                                    list: '/sync',
                                    meta: { icon: <SyncOutlined />, label: 'Синхронизация' }
                                }
                            ]}
                        >
                            <AppRoutes initial={<InitialNavigation />} />
                            <UnsavedChangesNotifier />
                            <DocumentTitleHandler handler={buildDocumentTitle} />
                        </Refine>
                    </AntdApp>
                </ScreenProvider>
            </ConfigProvider>
        </BrowserRouter>
    );
};

export default App;
