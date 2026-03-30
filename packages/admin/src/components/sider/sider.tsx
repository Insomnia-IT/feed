import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import {
    type TreeMenuItem,
    useGetIdentity,
    useIsExistAuthentication,
    useList,
    useLogout,
    useMenu
} from '@refinedev/core';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router';
import {
    LogoutOutlined,
    QrcodeOutlined,
    SmileOutlined,
    TeamOutlined,
    UnorderedListOutlined,
    UserOutlined
} from '@ant-design/icons';

import { canAccessByRole } from 'acl';
import { useScreen } from 'shared/providers';
import { AppRoles, type UserData } from 'auth';
import type { AccessRoleEntity } from 'interfaces';

import styles from './sider.module.css';

const MOBILE_PATHS = {
    wash: '/wash',
    vol: '/volunteers',
    gb: '/group-badges',
    dashboard: '/dashboard'
} as const;

const CustomSider = () => {
    const { breakpoint, isDesktop } = useScreen();
    const [collapsed, setCollapsed] = useState(false);

    const isAuth = useIsExistAuthentication();
    const { mutate: logout } = useLogout();
    const queryClient = useQueryClient();

    const { menuItems, selectedKey, defaultOpenKeys } = useMenu();
    const location = useLocation();
    const navigate = useNavigate();

    const { data: user, isLoading: userLoading } = useGetIdentity<UserData>();
    const role = user?.roles?.[0];

    const {
        result: { data: accessRoles = [] }
    } = useList<AccessRoleEntity>({
        resource: 'access-roles'
    });

    const accessRoleName = useMemo(() => {
        if (!role) return '';
        return accessRoles.find((item) => item.id === role)?.name ?? '';
    }, [accessRoles, role]);

    const handleLogout = useCallback(() => {
        queryClient.clear();
        logout();
    }, [logout, queryClient]);

    const buildMenuItems = useCallback(
        (tree: TreeMenuItem[]): MenuProps['items'] => {
            const walk = (nodes: TreeMenuItem[]): NonNullable<MenuProps['items']> => {
                return nodes
                    .map((item) => {
                        const { children, icon, label, name, route } = item;
                        const key = String(route || name);

                        if (children?.length) {
                            const subItems = walk(children);
                            if (!subItems.length) return null;

                            return {
                                key,
                                icon: icon ?? <UnorderedListOutlined />,
                                label,
                                children: subItems
                            };
                        }

                        const resource = String(name).toLowerCase();
                        if (!role || !canAccessByRole(role, 'list', resource)) {
                            return null;
                        }

                        return {
                            key,
                            icon: icon ?? <UnorderedListOutlined />,
                            label: <Link to={route as string}>{label}</Link>
                        };
                    })
                    .filter(Boolean) as NonNullable<MenuProps['items']>;
            };

            return walk(tree);
        },
        [role]
    );

    const userMenuItems = useMemo<MenuProps['items']>(() => {
        const items: NonNullable<MenuProps['items']> = [
            {
                key: 'user-info',
                disabled: true,
                label: (
                    <span data-testid="current-user-name">
                        {userLoading
                            ? 'Загрузка...'
                            : accessRoleName
                              ? `${user?.username} (${accessRoleName})`
                              : user?.username || '—'}
                    </span>
                )
            }
        ];

        if (menuItems) {
            items.push(...((buildMenuItems(menuItems) ?? []).filter(Boolean) as NonNullable<MenuProps['items']>));
        }

        if (isAuth) {
            items.push({
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Выход'
            });
        }

        return items;
    }, [accessRoleName, user, userLoading, menuItems, buildMenuItems, isAuth]);

    const renderMobileButtons = () => {
        const path = location.pathname;

        return (
            <div className={styles.mobileSider}>
                {role === AppRoles.SOVA ? (
                    <MobileButton
                        active={path.startsWith(MOBILE_PATHS.wash)}
                        icon={<SmileOutlined />}
                        text="Стиратель"
                        onClick={() => navigate(MOBILE_PATHS.wash)}
                    />
                ) : (
                    <>
                        <MobileButton
                            active={path.startsWith(MOBILE_PATHS.dashboard)}
                            icon={<QrcodeOutlined />}
                            text="Сканнер"
                            onClick={() => navigate(MOBILE_PATHS.dashboard)}
                        />
                        <MobileButton
                            active={path.startsWith(MOBILE_PATHS.vol)}
                            icon={<UserOutlined />}
                            text="Волонтеры"
                            onClick={() => navigate(MOBILE_PATHS.vol)}
                        />
                        <MobileButton
                            active={path.startsWith(MOBILE_PATHS.gb)}
                            icon={<TeamOutlined />}
                            text="Группы"
                            onClick={() => navigate(MOBILE_PATHS.gb)}
                        />
                    </>
                )}
                <MobileButton icon={<LogoutOutlined />} text="Выход" onClick={handleLogout} />
            </div>
        );
    };

    if (breakpoint.xs) return renderMobileButtons();

    return (
        <Layout.Sider
            className={isDesktop ? styles.antLayoutSider : styles.antLayoutSiderMobile}
            collapsible
            collapsedWidth={isDesktop ? 80 : 0}
            collapsed={collapsed}
            breakpoint="lg"
            onCollapse={setCollapsed}
        >
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={selectedKey ? [selectedKey] : []}
                defaultOpenKeys={defaultOpenKeys}
                items={userMenuItems}
                onClick={(info) => {
                    if (!isDesktop) setCollapsed(true);
                    if (info.key === 'logout') handleLogout();
                }}
            />
        </Layout.Sider>
    );
};

export default CustomSider;

const MobileButton = ({
    icon,
    text,
    active,
    onClick
}: {
    icon: ReactNode;
    text: string;
    active?: boolean;
    onClick: () => void;
}) => (
    <button
        className={`${styles.siderButton} ${active ? styles.siderButtonActive : ''}`}
        onClick={onClick}
        type="button"
    >
        {icon}
        <span className={styles.buttonText}>{text}</span>
    </button>
);
