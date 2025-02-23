import { FC, useEffect, useState, useMemo, useCallback } from 'react';
import { Layout as AntdLayout, Grid, Menu, type MenuProps } from 'antd';
import {
    CanAccess,
    ITreeMenu,
    useIsExistAuthentication,
    useList,
    useLogout,
    useMenu,
    useNavigation,
    useTitle
} from '@refinedev/core';
import { Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LogoutOutlined, TeamOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons';
import { ItemType } from 'antd/lib/menu/interface';

import { UserData } from 'auth';
import { authProvider } from 'authProvider';
import type { AccessRoleEntity } from 'interfaces';

import { antLayoutSider, antLayoutSiderMobile } from './styles';
import styles from './sider.module.css';

export const CustomSider: FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [screenSize, setScreenSize] = useState(window.innerWidth);
    const [userName, setUserName] = useState('');
    const [accessRoleName, setAccessRoleName] = useState('');
    const [currentPath, setCurrentPath] = useState('');

    const Title = useTitle();
    const isExistAuthentication = useIsExistAuthentication();
    const { mutate: logout } = useLogout();
    const queryClient = useQueryClient();
    const { menuItems, selectedKey } = useMenu();
    const breakpoint = Grid.useBreakpoint();

    const isMobile = typeof breakpoint.lg === 'undefined' ? false : !breakpoint.lg;

    const { data: accessRoles, isLoading: accessRolesIsLoading } = useList<AccessRoleEntity>({
        resource: 'access-roles'
    });

    useEffect(() => {
        if (!authProvider.getIdentity || accessRolesIsLoading) return;

        void authProvider.getIdentity().then((res) => {
            const user = res as UserData;
            if (user) {
                setUserName(user.username ?? '');
                const roleName = accessRoles?.data.find((role) => role.id === user.roles[0])?.name ?? '';
                setAccessRoleName(roleName);
            }
        });
    }, [accessRolesIsLoading, accessRoles]);

    const handleLogout = useCallback(() => {
        queryClient.clear();
        logout();
    }, [logout, queryClient]);

    const generateMenuItems = useCallback((tree: ITreeMenu[], _selectedKey?: string): MenuProps['items'] => {
        return tree.map((item) => {
            const { children, icon, label, name, parentName, route } = item;
            const key = route || name;
            const isSelected = key === _selectedKey;
            const isParent = parentName !== undefined && children.length === 0;
            const isRoute = !isParent;

            if (children.length > 0) {
                return {
                    key,
                    icon: icon ?? <UnorderedListOutlined />,
                    label,
                    children: generateMenuItems(children, _selectedKey)
                };
            }

            return {
                key,
                icon: icon ?? (isRoute && <UnorderedListOutlined />),
                style: isSelected ? { fontWeight: 'bold' } : {},
                label: (
                    <CanAccess resource={name.toLowerCase()} action="list" params={{ resource: item }}>
                        <Link to={route as string}>{label}</Link>
                    </CanAccess>
                )
            };
        });
    }, []);

    const menuItemsAntd = useMemo(() => {
        const userMenuItem: ItemType = {
            key: 'user-info',
            label: accessRoleName ? `${userName} (${accessRoleName})` : userName || '—',
            disabled: true
        };

        const itemsFromRefine = generateMenuItems(menuItems, selectedKey);

        const logoutItem: ItemType | undefined = isExistAuthentication
            ? {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: 'Выход',
                  onClick: handleLogout
              }
            : undefined;

        return [userMenuItem, ...(itemsFromRefine ?? []), ...(logoutItem ? [logoutItem] : [])];
    }, [accessRoleName, userName, generateMenuItems, menuItems, selectedKey, isExistAuthentication, handleLogout]);

    useEffect(() => {
        const handleResize = () => setScreenSize(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { push } = useNavigation();
    const location = useLocation();
    const myPath = location.pathname;

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
                        onClick={() => push('/volunteers')}
                    >
                        <UserOutlined style={{ fontSize: '20px' }} />
                        <span className={styles.buttonText}>Волонтеры</span>
                    </button>
                    <button
                        className={`${styles.siderButton} ${currentPath === 'gb' ? styles.siderButtonActive : ''}`}
                        onClick={() => push('/group-badges')}
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
                    breakpoint="lg"
                    onCollapse={(c) => setCollapsed(c)}
                    style={isMobile ? antLayoutSiderMobile : antLayoutSider}
                >
                    {Title && <Title collapsed={collapsed} />}
                    <Menu
                        theme="dark"
                        mode="inline"
                        items={menuItemsAntd}
                        selectedKeys={[selectedKey]}
                        onClick={() => {
                            if (!breakpoint.lg) {
                                setCollapsed(true);
                            }
                        }}
                    />
                </AntdLayout.Sider>
            )}
        </>
    );
};
