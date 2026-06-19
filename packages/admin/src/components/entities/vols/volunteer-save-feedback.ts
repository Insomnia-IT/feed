import type { HttpError, OpenNotificationParams, useTranslate } from '@refinedev/core';

type VolunteerFormErrorNotification = OpenNotificationParams & {
    metaData: {
        duration: 0;
    };
};

export function createVolunteerFormErrorNotification(params: {
    translate: ReturnType<typeof useTranslate>;
    action: 'create' | 'edit';
    volunteerId?: string | number;
}): (error?: HttpError) => VolunteerFormErrorNotification {
    const { translate, action, volunteerId } = params;

    return (error) => {
        const resourceName = translate('volunteers.volunteers', translate('volunteers.label', 'Волонтеры'));
        const statusCode = error?.statusCode ?? '—';
        const notificationKey =
            action === 'create'
                ? 'volunteer-create-error'
                : volunteerId != null
                  ? `volunteer-save-error-${volunteerId}`
                  : 'volunteer-save-error';
        const errorMessageKey = action === 'create' ? 'notifications.createError' : 'notifications.editError';
        const defaultErrorMessage =
            action === 'create'
                ? `Ошибка создания ${resourceName} (status code: ${statusCode})`
                : `Ошибка редактирования ${resourceName} (status code: ${statusCode})`;

        return {
            key: notificationKey,
            message: error?.message ?? '',
            description: translate(errorMessageKey, { resource: resourceName, statusCode }, defaultErrorMessage),
            type: 'error',
            metaData: { duration: 0 }
        };
    };
}

/** @deprecated Use createVolunteerFormErrorNotification with action: 'edit' */
export function createVolunteerSaveErrorNotification(params: {
    translate: ReturnType<typeof useTranslate>;
    volunteerId?: string | number;
}): (error?: HttpError) => VolunteerFormErrorNotification {
    return createVolunteerFormErrorNotification({ ...params, action: 'edit' });
}
