import { FC } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { ConfigProvider, ErrorComponent, Icons, Layout, notificationProvider } from '@pankod/refine-antd';
import { Refine } from '@pankod/refine-core';
import routerProvider from '@pankod/refine-react-router-v6';
import '@pankod/refine-antd/dist/reset.css';
import antdLocale from 'antd/lib/locale/ru_RU';

import { MediaProvider, useMedia } from 'shared/providers';
import { ACL } from 'acl';
import { authProvider } from 'authProvider';
import { CustomSider } from 'components';
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

import i18n from './i18n';

const CustomLayout = ({ children, ...props }: { children?: any }) => {
    const { isMobile } = useMedia();
    return (
        <Layout {...props}>
            <div style={{ paddingBottom: isMobile ? 60 : undefined }}>{children}</div>
        </Layout>
    );
};

const CustomReadyPage: FC = () => <div>Custom Ready Page</div>;

const AppContent: FC = () => {
    const { t, i18n } = useTranslation();

    const i18nProvider = {
        translate: (key: string, params: object) => t(key, params),
        changeLocale: (lang: string) => i18n.changeLanguage(lang),
        getLocale: () => i18n.language
    };

    if (!i18n.isInitialized) {
        return <Loader />;
    }

    return (
        <ConfigProvider
            locale={antdLocale}
            theme={{
                token: {
                    borderRadius: 2
                }
            }}
        >
            <MediaProvider>
                <Refine
                    routerProvider={routerProvider}
                    DashboardPage={Dashboard}
                    ReadyPage={CustomReadyPage}
                    notificationProvider={notificationProvider}
                    catchAll={<ErrorComponent />}
                    Layout={CustomLayout}
                    dataProvider={dataProvider}
                    i18nProvider={i18nProvider}
                    authProvider={authProvider}
                    LoginPage={LoginPage}
                    Sider={CustomSider}
                    accessControlProvider={ACL}
                    options={{ syncWithLocation: true, disableTelemetry: true }}
                    resources={[
                        {
                            name: 'volunteers',
                            list: VolList,
                            create: VolCreate,
                            edit: VolEdit,
                            show: VolShow,
                            icon: <Icons.UserOutlined />
                        },
                        {
                            name: 'volunteer-custom-fields',
                            list: VolunteerCustomFieldList,
                            create: VolunteerCustomFieldCreate,
                            edit: VolunteerCustomFieldEdit,
                            show: VolunteerCustomFieldShow,
                            icon: <Icons.InsertRowRightOutlined />,
                            options: {
                                hide: true
                            }
                        },
                        {
                            name: 'directions',
                            list: DepartmentList,
                            create: DepartmentCreate,
                            edit: DirectionEdit,
                            show: DirectionShow,
                            icon: <Icons.FormatPainterOutlined />
                        },
                        {
                            name: 'group-badges',
                            list: GroupBadgeList,
                            create: GroupBadgeCreate,
                            edit: GroupBadgeEdit,
                            show: GroupBadgeShow,
                            icon: <Icons.ProfileOutlined />
                        },
                        {
                            name: 'feed-transaction',
                            list: FeedTransactionList,
                            create: FeedTransactionCreate,
                            icon: <Icons.HistoryOutlined />
                        },
                        {
                            name: 'stats',
                            list: PublicStatistic,
                            icon: <Icons.LineChartOutlined />
                        },
                        {
                            name: 'scanner-page',
                            list: Scanner,
                            icon: <Icons.MobileOutlined />
                        },
                        {
                            name: 'sync',
                            list: Sync,
                            icon: <Icons.SyncOutlined />
                        }
                    ]}
                ></Refine>
            </MediaProvider>
        </ConfigProvider>
    );
};

const App = () => {
    return (
        <I18nextProvider i18n={i18n}>
            <AppContent />
        </I18nextProvider>
    );
};

export default App;

export const Loader: FC = () => (
    <div className="loader">
        <div className="lds-facebook">
            <div></div>
            <div></div>
            <div></div>
        </div>
    </div>
);
