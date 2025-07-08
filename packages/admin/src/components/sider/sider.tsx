import { FC, useEffect, useState, useMemo, useCallback } from 'react';
import { Layout, Menu } from 'antd';
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
import { LogoutOutlined, SmileOutlined, TeamOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons';

import { useScreen } from 'shared/providers';
import { AppRoles, UserData } from 'auth';
import { authProvider } from 'authProvider';
import type { AccessRoleEntity } from 'interfaces';

import styles from './sider.module.css';

const CustomSider: FC = () => {
    const { isDesktop } = useScreen();

    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<UserData>();
    const [accessRoleName, setAccessRoleName] = useState('');
    const [currentPath, setCurrentPath] = useState('');

    const Title = useTitle();
    const isExistAuthentication = useIsExistAuthentication();
    const { mutate: logout } = useLogout();
    const queryClient = useQueryClient();
    const { menuItems, selectedKey } = useMenu();

    const role = user?.roles[0];

    const { data: accessRoles, isLoading: accessRolesIsLoading } = useList<AccessRoleEntity>({
        resource: 'access-roles'
    });

    useEffect(() => {
        if (!authProvider.getIdentity || accessRolesIsLoading) return;

        void authProvider.getIdentity().then((res) => {
            const user = res as UserData;
            if (user) {
                setUser(user);
                const roleName = accessRoles?.data.find((role) => role.id === user.roles[0])?.name ?? '';
                setAccessRoleName(roleName);
            }
        });
    }, [accessRolesIsLoading, accessRoles]);

    const handleLogout = useCallback(() => {
        queryClient.clear();
        logout();
    }, [logout, queryClient]);

    const { push } = useNavigation();
    const location = useLocation();
    const myPath = location.pathname;

    useEffect(() => {
        if (myPath.startsWith('/group-badges')) {
            setCurrentPath('gb');
        } else if (myPath.startsWith('/volunteers')) {
            setCurrentPath('vol');
        } else if (myPath.startsWith('/wash')) {
            setCurrentPath('wash');
        } else {
            setCurrentPath('');
        }
    }, [myPath]);

    const renderMenuItems = useCallback(
        (tree: ITreeMenu[]): React.ReactNode[] => {
            return tree
                .map((item) => {
                    const { children, icon, label, name, route } = item;
                    const key = route || name;

                    if (children && children.length > 0) {
                        const subItems = renderMenuItems(children);
                        if (subItems.length === 0) {
                            return null;
                        }
                        return (
                            <Menu.SubMenu key={key} icon={icon ?? <UnorderedListOutlined />} title={label}>
                                {subItems}
                            </Menu.SubMenu>
                        );
                    }

                    return (
                        <CanAccess
                            key={key}
                            resource={name.toLowerCase()}
                            action="list"
                            params={{ resource: item }}
                            fallback={null}
                        >
                            <Menu.Item
                                key={key}
                                icon={icon ?? <UnorderedListOutlined />}
                                style={key === selectedKey ? { fontWeight: 'bold' } : {}}
                            >
                                <Link to={route as string}>{label}</Link>
                            </Menu.Item>
                        </CanAccess>
                    );
                })
                .filter(Boolean) as React.ReactNode[];
        },
        [selectedKey]
    );

    const userMenuItems = useMemo(() => {
        const items: React.ReactNode[] = [
            <Menu.Item key="user-info" disabled>
                {accessRoleName ? `${user?.username} (${accessRoleName})` : user?.username || '—'}
            </Menu.Item>
        ];

        if (menuItems) {
            items.push(...renderMenuItems(menuItems));
        }

        if (isExistAuthentication) {
            items.push(
                <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                    Выход
                </Menu.Item>
            );
        }

        return items;
    }, [accessRoleName, user, menuItems, renderMenuItems, isExistAuthentication, handleLogout]);

    if (role === AppRoles.DIRECTION_HEAD || role === AppRoles.SOVA) {
        return (
            <div className={styles.mobileSider}>
                {role === AppRoles.SOVA ? (
                    <button
                        className={`${styles.siderButton} ${currentPath === 'wash' ? styles.siderButtonActive : ''}`}
                        onClick={() => push('/wash')}
                    >
                        <SmileOutlined style={{ fontSize: 20 }} />
                        <span className={styles.buttonText}>Стиратель</span>
                    </button>
                ) : (
                    <>
                        <button
                            className={`${styles.siderButton} ${currentPath === 'vol' ? styles.siderButtonActive : ''}`}
                            onClick={() => push('/volunteers')}
                        >
                            <UserOutlined style={{ fontSize: 20 }} />
                            <span className={styles.buttonText}>Волонтеры</span>
                        </button>
                        <button
                            className={`${styles.siderButton} ${currentPath === 'gb' ? styles.siderButtonActive : ''}`}
                            onClick={() => push('/group-badges')}
                        >
                            <TeamOutlined style={{ fontSize: 20 }} />
                            <span className={styles.buttonText}>Группы</span>
                        </button>
                    </>
                )}
                <button className={styles.siderButton} onClick={handleLogout}>
                    <LogoutOutlined style={{ fontSize: 20 }} />
                    <span className={styles.buttonText}>Выход</span>
                </button>
            </div>
        );
    }

    return (
        <Layout.Sider
            className={!isDesktop ? styles.antLayoutSiderMobile : styles.antLayoutSider}
            collapsible
            collapsedWidth={!isDesktop ? 0 : 80}
            collapsed={collapsed}
            breakpoint="lg"
            onCollapse={setCollapsed}
        >
            {Title && <Title collapsed={collapsed} />}
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[selectedKey]}
                onClick={() => {
                    if (!isDesktop) setCollapsed(true);
                }}
            >
                {userMenuItems}
            </Menu>
        </Layout.Sider>
    );
};

export default CustomSider;
