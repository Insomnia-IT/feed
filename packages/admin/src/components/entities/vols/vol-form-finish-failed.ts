import type { FormInstance, FormProps } from 'antd';

/** Все поля анкеты волонтёра сейчас на первой вкладке (см. `common.tsx` — «Основное»). */
const VOLUNTEER_FORM_MAIN_TAB_KEY = '1';

export const createVolunteerFormFinishFailedHandler =
    (setActiveKey: (key: string) => void, form: FormInstance, upstream?: FormProps['onFinishFailed']) =>
    (errorInfo: Parameters<NonNullable<FormProps['onFinishFailed']>>[0]) => {
        const sorted = [...(errorInfo.errorFields ?? [])].sort((a, b) =>
            JSON.stringify(a.name).localeCompare(JSON.stringify(b.name))
        );
        const first = sorted.find((field) => field.name?.length);
        const namePath = first?.name;

        if (namePath?.length) {
            setActiveKey(VOLUNTEER_FORM_MAIN_TAB_KEY);
            window.setTimeout(() => {
                void form.scrollToField(namePath, { behavior: 'smooth', block: 'nearest', focus: true });
            }, 100);
        }

        upstream?.(errorInfo);
    };
