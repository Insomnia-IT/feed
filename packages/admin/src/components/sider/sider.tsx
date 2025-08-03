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
import {
    LogoutOutlined,
    QrcodeOutlined,
    SmileOutlined,
    TeamOutlined,
    UnorderedListOutlined,
    UserOutlined
} from '@ant-design/icons';

import { useScreen } from 'shared/providers';
import { AppRoles, UserData } from 'auth';
import { authProvider } from 'authProvider';
import type { AccessRoleEntity } from 'interfaces';

import styles from './sider.module.css';

const MOBILE_PATHS = {
    wash: '/wash',
    vol: '/volunteers',
    gb: '/group-badges',
    dashboard: '/dashboard'
};

const CustomSider: FC = () => {
    const { breakpoint, isDesktop } = useScreen();

    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<UserData>();
    const [accessRoleName, setAccessRoleName] = useState('');

    const Title = useTitle();
    const isAuth = useIsExistAuthentication();
    const { mutate: logout } = useLogout();
    const queryClient = useQueryClient();
    const { menuItems, selectedKey } = useMenu();
    const { push } = useNavigation();
    const location = useLocation();

    const role = user?.roles[0];

    const { data: accessRoles, isLoading: accessRolesIsLoading } = useList<AccessRoleEntity>({
        resource: 'access-roles'
    });

    useEffect(() => {
        if (!authProvider.getIdentity || accessRolesIsLoading) return;

        authProvider.getIdentity().then((res) => {
            const user = res as UserData;
            if (user) {
                setUser(user);
                const role = accessRoles?.data.find((role) => role.id === user.roles[0]);
                setAccessRoleName(role?.name ?? '');
            }
        });
    }, [accessRolesIsLoading, accessRoles]);

    const handleLogout = useCallback(() => {
        queryClient.clear();
        logout();
    }, [logout, queryClient]);

    const renderMenuItems = useCallback(
        (tree: ITreeMenu[]): React.ReactNode[] => {
            return tree
                .map((item) => {
                    const { children, icon, label, name, route } = item;
                    const key = route || name;

                    if (children?.length) {
                        const subItems = renderMenuItems(children);
                        return subItems.length ? (
                            <Menu.SubMenu key={key} icon={icon ?? <UnorderedListOutlined />} title={label}>
                                {subItems}
                            </Menu.SubMenu>
                        ) : null;
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

        if (menuItems) items.push(...renderMenuItems(menuItems));

        if (isAuth) {
            items.push(
                <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                    Выход
                </Menu.Item>
            );
        }

        return items;
    }, [accessRoleName, user, menuItems, renderMenuItems, isAuth, handleLogout]);

    const renderMobileButtons = () => {
        const path = location.pathname;

        return (
            <div className={styles.mobileSider}>
                {role === AppRoles.SOVA ? (
                    <MobileButton
                        active={path.startsWith(MOBILE_PATHS.wash)}
                        icon={<SmileOutlined />}
                        text="Стиратель"
                        onClick={() => push(MOBILE_PATHS.wash)}
                    />
                ) : (
                    <>
                        <MobileButton
                            active={path.startsWith(MOBILE_PATHS.dashboard)}
                            icon={<QrcodeOutlined />}
                            text="Сканнер"
                            onClick={() => push(MOBILE_PATHS.dashboard)}
                        />
                        <MobileButton
                            active={path.startsWith(MOBILE_PATHS.vol)}
                            icon={<UserOutlined />}
                            text="Волонтеры"
                            onClick={() => push(MOBILE_PATHS.vol)}
                        />
                        <MobileButton
                            active={path.startsWith(MOBILE_PATHS.gb)}
                            icon={<TeamOutlined />}
                            text="Группы"
                            onClick={() => push(MOBILE_PATHS.gb)}
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
            {Title && <Title collapsed={collapsed} />}
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[selectedKey]}
                onClick={() => !isDesktop && setCollapsed(true)}
            >
                {userMenuItems}
            </Menu>
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
    icon: React.ReactNode;
    text: string;
    active?: boolean;
    onClick: () => void;
}) => (
    <button className={`${styles.siderButton} ${active ? styles.siderButtonActive : ''}`} onClick={onClick}>
        {icon}
        <span className={styles.buttonText}>{text}</span>
    </button>
);
