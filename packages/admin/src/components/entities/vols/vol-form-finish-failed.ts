import type { FormInstance, FormProps } from 'antd';

import { createFormMainTabFinishFailedHandler } from 'shared/utils/create-form-main-tab-finish-failed-handler';

/** Все поля анкеты волонтёра сейчас на первой вкладке (см. `common.tsx` — «Основное»). */
export const createVolunteerFormFinishFailedHandler =
    (setActiveKey: (key: string) => void, form: FormInstance, upstream?: FormProps['onFinishFailed']) =>
        createFormMainTabFinishFailedHandler({ form, setActiveKey, upstream });
