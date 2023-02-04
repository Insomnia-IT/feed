import { AntdLayout, Grid, Menu, useMenu } from '@pankod/refine-antd';
import {
    CanAccess,
    useIsExistAuthentication,
    useLogout,
    useRouterContext,
    useTitle,
    useTranslate
} from '@pankod/refine-core';
import { LogoutOutlined, UnorderedListOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import type { ITreeMenu } from '@pankod/refine-core';

import { antLayoutSider, antLayoutSiderMobile } from './styles';

export const CustomSider: FC = () => {
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const Title = useTitle();
    const { Link } = useRouterContext();
    const { SubMenu } = Menu;
    const isExistAuthentication = useIsExistAuthentication();
    const { mutate: logout } = useLogout();
    const translate = useTranslate();

    const { menuItems, selectedKey } = useMenu();
    const breakpoint = Grid.useBreakpoint();

    const isMobile = typeof breakpoint.lg === 'undefined' ? false : !breakpoint.lg;

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

    return (
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
                selectedKeys={[selectedKey]}
                mode='inline'
                onClick={() => {
                    if (!breakpoint.lg) {
                        setCollapsed(true);
                    }
                }}
            >
                {renderTreeView(menuItems, selectedKey)}
                {isExistAuthentication && (
                    <Menu.Item key='logout' onClick={() => logout()} icon={<LogoutOutlined />}>
                        {translate('buttons.logout', 'Logout')}
                    </Menu.Item>
                )}
            </Menu>
        </AntdLayout.Sider>
    );
};
