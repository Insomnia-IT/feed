import type { FormInstance } from 'antd';

type VolunteerRelationField = 'supervisor_id' | 'responsible_id';

export function clearVolunteerRelationSelect(params: {
    form: FormInstance;
    field: VolunteerRelationField;
    extraValues?: Record<string, null>;
    onAfterClear?: () => void;
}): void {
    // Defer after Ant Design Select internal clear handling — needed on iOS Safari/Chrome.
    setTimeout(() => {
        params.form.setFieldsValue({
            [params.field]: null,
            ...(params.extraValues ?? {})
        });
        params.onAfterClear?.();
    }, 0);
}

export function handleVolunteerRelationSelectChange(params: {
    form: FormInstance;
    field: VolunteerRelationField;
    value: number | null | undefined;
    extraValuesOnClear?: Record<string, null>;
    onAfterClear?: () => void;
}): void {
    if (params.value != null) {
        return;
    }

    clearVolunteerRelationSelect({
        form: params.form,
        field: params.field,
        extraValues: params.extraValuesOnClear,
        onAfterClear: params.onAfterClear
    });
}
