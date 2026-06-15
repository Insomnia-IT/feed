import type { FormInstance, FormProps } from 'antd';

import { createFormMainTabFinishFailedHandler } from 'shared/utils/create-form-main-tab-finish-failed-handler';

const CONNECTIONS_ROOT_FIELDS = new Set(['supervisor', 'supervisor_id', 'responsible', 'responsible_id']);

const resolveVolunteerFormTabKey = (namePath: (string | number)[]): string => {
    const root = namePath[0];
    return typeof root === 'string' && CONNECTIONS_ROOT_FIELDS.has(root) ? '2' : '1';
};

/** Поля анкеты — на вкладках «Инфо» и «Связи» (см. `common.tsx`). */
export const createVolunteerFormFinishFailedHandler = (
    setActiveKey: (key: string) => void,
    form: FormInstance,
    upstream?: FormProps['onFinishFailed']
) =>
    createFormMainTabFinishFailedHandler({
        form,
        setActiveKey,
        upstream,
        resolveTabKey: resolveVolunteerFormTabKey,
        scrollInVolTabPane: true
    });
