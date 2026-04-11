import React from 'react';
import { Show } from '@refinedev/antd';
import { Tabs } from 'antd';
import { useStorageData } from './hooks';
import { PositionsTab } from './tabs/positions';
import { BinsTab } from './tabs/bins';
import { ItemsTab } from './tabs/items';
import { ReceivingsTab } from './tabs/receivings';
import { IssuancesTab } from './tabs/issuances';

export const StorageShow: React.FC = () => {
    const { storage, storageLoading } = useStorageData();

    return (
        <Show isLoading={storageLoading} title={`Склад: ${storage?.name}`}>
            <div style={{ marginBottom: 24 }}>
                <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{storage?.description}</span>
            </div>

            <Tabs defaultActiveKey="positions">
                <Tabs.TabPane tab="Позиции" key="positions">
                    <PositionsTab />
                </Tabs.TabPane>

                <Tabs.TabPane tab="Ячейки" key="bins">
                    <BinsTab />
                </Tabs.TabPane>

                <Tabs.TabPane tab="Предметы" key="items">
                    <ItemsTab />
                </Tabs.TabPane>

                <Tabs.TabPane tab="Приемка" key="receivings">
                    <ReceivingsTab />
                </Tabs.TabPane>

                <Tabs.TabPane tab="Выдача" key="issuances">
                    <IssuancesTab />
                </Tabs.TabPane>
            </Tabs>
        </Show>
    );
};
