import { appWithTranslation, useTranslation } from 'next-i18next';
import { ConfigProvider, ErrorComponent, Icons, Layout, notificationProvider } from '@pankod/refine-antd';
import type { AppProps } from 'next/app';
import { Loader } from '@feed/ui/src/loader';
import { Refine } from '@pankod/refine-core';
import routerProvider from '@pankod/refine-nextjs-router';
import type { UserConfig } from 'next-i18next';

import '@pankod/refine-antd/dist/reset.css';

// require('~/i18n');

import antdLocale from 'antd/lib/locale/ru_RU';

import { DepartmentCreate, DepartmentEdit, DepartmentList, DepartmentShow } from '~/components/entities/departments';
import { GroupBadgeCreate, GroupBadgeEdit, GroupBadgeList, GroupBadgeShow } from '~/components/entities/group-badges';
import { Sync } from '~/components/sync';
// import { LocationCreate, LocationEdit, LocationList, LocationShow } from '~/components/entities/locations';
import { VolCreate, VolEdit, VolList, VolShow } from '~/components/entities/vols';
import { FeedTransactionCreate, FeedTransactionList } from '~/components/entities/feed-transaction';
import { ACL } from '~/acl';
import { authProvider } from '~/authProvider';
import { CustomSider } from '~/components';
import { Dashboard } from '~/components/dashboard';
import { dataProvider } from '~/dataProvider';
import { LoginPage } from '~/components/login';
import { PublicStatistic } from '~/components/entities/statistic';

// import enUS from 'antd/lib/locale-provider/ru_RU';

// eslint-disable-next-line no-restricted-imports
import { i18n } from '../../next-i18next.config.mjs';

const CustomReadyPage: FC = () => <div> Custom Ready Page </div>;

const Feed = ({ Component, pageProps }: AppProps): JSX.Element | null => {
    const { i18n, ready, t } = useTranslation();

    const i18nProvider = {
        translate: (key: string, params: object) => {
            // console.log('translate', key, params, t(key, params));
            return t(key, params);
        },
        changeLocale: (lang: string) => {
            // console.log('changeLocale', lang);
            return i18n.changeLanguage(lang);
        },
        getLocale: () => {
            // console.log('getLocale', i18n.language);
            return i18n.language;
        }
    };

    if (!ready) return <Loader />;

    return (
        <ConfigProvider locale={antdLocale}>
            <Refine
                routerProvider={routerProvider}
                DashboardPage={Dashboard}
                ReadyPage={CustomReadyPage}
                notificationProvider={notificationProvider}
                catchAll={<ErrorComponent />}
                Layout={Layout}
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
                        name: 'departments',
                        list: DepartmentList,
                        create: DepartmentCreate,
                        edit: DepartmentEdit,
                        show: DepartmentShow,
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
                    // {
                    //     name: 'stats',
                    //     list: PublicStatistic,
                    //     icon: <Icons.LineChartOutlined />
                    // },
                    {
                        name: 'sync',
                        list: Sync,
                        icon: <Icons.SyncOutlined />
                    }
                ]}
            >
                <Component {...pageProps} />
            </Refine>
        </ConfigProvider>
    );
};

// eslint-disable-next-line import/no-default-export
export default appWithTranslation(Feed, i18n as UserConfig);
