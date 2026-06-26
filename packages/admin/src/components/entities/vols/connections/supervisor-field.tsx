import { Button, Form, type FormInstance, Input, Select } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import useCanAccess from '../use-can-access';
import { useScreen } from '../../../../shared/providers';
import { useSupervisorOptions } from '../use-supervisor-options';

import connectionsStyles from './connections.module.css';

export const SupervisorField = ({ form }: { form: FormInstance }) => {
    const supervisorId = Form.useWatch('supervisor_id', form);
    const { isMobile } = useScreen();
    const canEditBrigadier = useCanAccess({ action: 'brigadier_edit', resource: 'volunteers' });
    const { loading: supervisorsLoading, onSearch, options: supervisorOptions } = useSupervisorOptions({ form });

    return (
        <div className={connectionsStyles.fieldRow}>
            <Form.Item name="supervisor" noStyle>
                <Input type="hidden" />
            </Form.Item>
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
                    onSearch={onSearch}
                    options={supervisorOptions}
                    loading={supervisorsLoading}
                    disabled={!canEditBrigadier}
                />
            </Form.Item>

            <Form.Item className={connectionsStyles.fieldAction} label=" " colon={false}>
                <Button
                    title="Открыть бригадира в новой вкладке"
                    icon={<ExportOutlined />}
                    disabled={!supervisorId}
                    onClick={() => {
                        if (supervisorId) {
                            window.open(
                                `${window.location.origin}/volunteers/edit/${supervisorId}`,
                                '_blank',
                                'noopener,noreferrer'
                            );
                        }
                    }}
                >
                    {!isMobile ? 'Открыть бригадира' : null}
                </Button>
            </Form.Item>
        </div>
    );
};
