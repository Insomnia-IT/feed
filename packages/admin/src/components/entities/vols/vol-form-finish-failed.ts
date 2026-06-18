import type { FormInstance, FormProps } from 'antd';

import { createFormMainTabFinishFailedHandler } from 'shared/utils/create-form-main-tab-finish-failed-handler';

/** Обязательные поля анкеты — на первой вкладке (см. `common.tsx` — «Инфо» / «Основное»). */
export const createVolunteerFormFinishFailedHandler = (
    setActiveKey: (key: string) => void,
    form: FormInstance,
    upstream?: FormProps['onFinishFailed']
) =>
    createFormMainTabFinishFailedHandler({
        form,
        setActiveKey,
        upstream,
        scrollInVolTabPane: true
    });
