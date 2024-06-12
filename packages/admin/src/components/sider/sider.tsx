import { AntdLayout, Grid, Menu, useMenu } from '@pankod/refine-antd';
import {
    CanAccess,
    useIsExistAuthentication,
    useList,
    useLogout,
    useRouterContext,
    useTitle,
    useTranslate
} from '@pankod/refine-core';
import { LogoutOutlined, TeamOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import type { ITreeMenu } from '@pankod/refine-core';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';

import { authProvider } from '~/authProvider';
import type { AccessRoleEntity } from '~/interfaces';

import { antLayoutSider, antLayoutSiderMobile } from './styles';
import styles from './sider.module.css';

export const CustomSider: FC = () => {
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const Title = useTitle();
    const { Link } = useRouterContext();
    const { SubMenu } = Menu;
    const isExistAuthentication = useIsExistAuthentication();
    const { mutate: logout } = useLogout();
    const translate = useTranslate();
    const queryClient = useQueryClient();

    const { menuItems, selectedKey } = useMenu();
    const breakpoint = Grid.useBreakpoint();

    const isMobile = typeof breakpoint.lg === 'undefined' ? false : !breakpoint.lg;

    const [userName, setUserName] = useState('');
    const [accessRoleName, setAccessRoleName] = useState('');

    const { data: accessRoles, isLoading: accessRolesIsLoading } = useList<AccessRoleEntity>({
        resource: 'access-roles'
    });

    const loadUserName = async () => {
        if (authProvider.getUserIdentity && !accessRolesIsLoading) {
            const user = await authProvider.getUserIdentity();
            setUserName(user.username);
            setAccessRoleName(accessRoles?.data.find((role) => role.id === user.roles[0])?.name ?? '');
        }
    };

    const handleLogout = () => {
        queryClient.clear();
        logout();
    };

    useEffect(() => {
        void loadUserName();
    }, [accessRolesIsLoading, accessRoles]);

    const renderTreeView = (tree: Array<ITreeMenu>, selectedKey: string): React.ReactFragment =>
        tree.map((item: ITreeMenu) => {
            const { children, icon, label, name, parentName, route } = item;

            if (children.length > 0) {
                return (
                    <SubMenu key={route} icon={icon ?? <UnorderedListOutlined />} title={label}>
                        {renderTreeView(children, selectedKey)}
                    </SubMenu>
                );
            }
            const isSelected = route === selectedKey;
            const isRoute = !(parentName !== undefined && children.length === 0);
            return (
                <CanAccess key={route} resource={name.toLowerCase()} action='list' params={{ resource: item }}>
                    <Menu.Item
                        key={route}
                        style={{
                            fontWeight: isSelected ? 'bold' : 'normal'
                        }}
                        icon={icon ?? (isRoute && <UnorderedListOutlined />)}
                    >
                        <Link to={route}>{label}</Link>
                        {!collapsed && isSelected && <div className='ant-menu-tree-arrow' />}
                    </Menu.Item>
                </CanAccess>
            );
        });

    const [screenSize, setScreenSize] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setScreenSize(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    });

    const router = useRouter();

    const handleRedirectToVols = () => {
        void router.push('/volunteers');
    };

    const handleRedirectToGroups = () => {
        void router.push('/group-badges');
    };

    const [currentPath, setCurrentPath] = useState('');

    const myPath = router.asPath;

    useEffect(() => {
        if (myPath.startsWith('/group-badges')) {
            setCurrentPath('gb');
        } else if (myPath.startsWith('/volunteers')) {
            setCurrentPath('vol');
        } else {
            setCurrentPath('');
        }
    }, [myPath]);

    return (
        <>
            {screenSize <= 576 ? (
                <div className={styles.mobileSider}>
                    <button
                        className={`${styles.siderButton} ${currentPath === 'vol' ? styles.siderButtonActive : ''}`}
                        onClick={handleRedirectToVols}
                    >
                        <UserOutlined width={20} style={{ fontSize: '20px' }} />
                        <span className={styles.buttonText}>Волонтеры</span>
                    </button>
                    <button
                        className={`${styles.siderButton} ${currentPath === 'gb' ? styles.siderButtonActive : ''}`}
                        onClick={handleRedirectToGroups}
                    >
                        <TeamOutlined style={{ fontSize: '20px' }} />
                        <span className={styles.buttonText}>Группы</span>
                    </button>
                    <button className={styles.siderButton} onClick={handleLogout}>
                        <LogoutOutlined style={{ fontSize: '20px' }} />
                        <span className={styles.buttonText}>Выход</span>
                    </button>
                </div>
            ) : (
                <AntdLayout.Sider
                    collapsible
                    collapsedWidth={isMobile ? 0 : 80}
                    collapsed={collapsed}
                    breakpoint='lg'
                    onCollapse={(collapsed: boolean): void => setCollapsed(collapsed)}
                    style={isMobile ? antLayoutSiderMobile : antLayoutSider}
                >
                    {Title && <Title collapsed={collapsed} />}
                    <Menu
                        theme='dark'
                        selectedKeys={[selectedKey]}
                        mode='inline'
                        onClick={() => {
                            if (!breakpoint.lg) {
                                setCollapsed(true);
                            }
                        }}
                    >
                        <Menu.Item>
                            {accessRoleName && (
                                <>
                                    {userName} ({accessRoleName})
                                </>
                            )}
                        </Menu.Item>
                        {renderTreeView(menuItems, selectedKey)}
                        {isExistAuthentication && (
                            <Menu.Item key='logout' onClick={handleLogout} icon={<LogoutOutlined />}>
                                {translate('buttons.logout', 'Logout')}
                            </Menu.Item>
                        )}
                    </Menu>
                </AntdLayout.Sider>
            )}
        </>
    );
};
