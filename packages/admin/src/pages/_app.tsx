import { appWithTranslation, useTranslation } from 'next-i18next';
import { ErrorComponent, Icons, Layout, notificationProvider } from '@pankod/refine-antd';
import type { AppProps } from 'next/app';
import { Loader } from '@feed/ui/src/loader';
import { Refine } from '@pankod/refine-core';
import routerProvider from '@pankod/refine-nextjs-router';

import '@pankod/refine-antd/dist/styles.min.css';

// require('~/i18n');

import { CompanyCreate, CompanyEdit, CompanyList /*, CompanyShow*/ } from '~/components/entities/companies';
import { JobCreate, JobEdit, JobList, JobShow } from '~/components/entities/jobs';
import { VolCreate, VolEdit, VolList, VolShow } from '~/components/entities/vols';
import { ACL } from '~/acl';
import { authProvider } from '~/authProvider';
import { CustomSider } from '~/components';
import { Dashboard } from '~/components/dashboard';
import { dataProvider } from '~/dataProvider';
import { LoginPage } from '~/components/login';
import { PublicStats } from '~/components/public-stats';

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
        <Refine
            routerProvider={{
                ...routerProvider,
                routes: [
                    {
                        element: <Dashboard />,
                        path: '/dashboard',
                        layout: true
                    },
                    {
                        element: <PublicStats />,
                        path: '/pstat'
                    }
                ]
            }}
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
                    name: 'companies',
                    list: CompanyList,
                    create: CompanyCreate,
                    edit: CompanyEdit,
                    // show: CompanyShow,
                    icon: <Icons.TeamOutlined />
                },
                {
                    name: 'jobs',
                    list: JobList,
                    create: JobCreate,
                    edit: JobEdit,
                    show: JobShow,
                    icon: <Icons.ProfileOutlined />
                },
                {
                    name: 'vols',
                    list: VolList,
                    create: VolCreate,
                    edit: VolEdit,
                    show: VolShow,
                    icon: <Icons.ProfileOutlined />
                }
            ]}
        >
            <Component {...pageProps} />
        </Refine>
    );
};

// eslint-disable-next-line import/no-default-export
export default appWithTranslation(Feed, i18n);
