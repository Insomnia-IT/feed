import { useState } from 'react';
import { Button, Form, type FormInstance, Select } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import useCanAccess from '../use-can-access';
import { useSupervisorOptions } from '../use-supervisor-options';
import { useDebouncedCallback } from 'shared/hooks';
import { useScreen } from '../../../../shared/providers';

import connectionsStyles from './connections.module.css';

export const SupervisorField = ({ form }: { form: FormInstance }) => {
    const supervisorId = Form.useWatch('supervisor_id', form);
    const supervisor = Form.useWatch('supervisor', form) as { id: number; name: string } | null;
    const { isMobile } = useScreen();
    const [brigadierSearch, setBrigadierSearch] = useState('');
    const canEditBrigadier = useCanAccess({ action: 'brigadier_edit', resource: 'volunteers' });
    const debouncedBrigadierSearch = useDebouncedCallback((value: string) => setBrigadierSearch(value));

    const { options: supervisorOptions, loading: supervisorsLoading } = useSupervisorOptions({
        search: brigadierSearch,
        selectedSupervisorId: supervisorId,
        selectedSupervisor: supervisor
    });

    return (
        <div className={connectionsStyles.fieldRow}>
            <Form.Item
                className={connectionsStyles.fieldGrow}
                label="Бригадир"
                name="supervisor_id"
                normalize={(value) => value ?? null}
            >
                <Select
                    allowClear
                    showSearch
                    placeholder="Найти бригадира"
                    filterOption={false}
                    onSearch={debouncedBrigadierSearch}
                    options={supervisorOptions}
                    loading={supervisorsLoading}
                    disabled={!canEditBrigadier}
                />
            </Form.Item>

            <Form.Item className={connectionsStyles.fieldAction} label=" " colon={false}>
                <Button
                    title="Открыть бригадира"
                    icon={<EyeOutlined />}
                    disabled={!supervisorId}
                    onClick={() => {
                        if (supervisorId) {
                            window.location.href = `${window.location.origin}/volunteers/edit/${supervisorId}`;
                        }
                    }}
                >
                    {isMobile ? 'Открыть бригадира' : ''}
                </Button>
            </Form.Item>
        </div>
    );
};
