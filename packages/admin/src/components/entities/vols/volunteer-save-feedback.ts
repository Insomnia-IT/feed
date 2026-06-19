import type { HttpError } from '@refinedev/core';
import type { NotificationInstance } from 'antd/es/notification/interface';

type TranslateFn = (key: string, options?: Record<string, unknown>, defaultMessage?: string) => string;

export function showVolunteerSaveErrorNotification(params: {
    error: HttpError;
    notification: NotificationInstance;
    translate: TranslateFn;
    volunteerId?: string | number;
}): void {
    const { error, notification, translate, volunteerId } = params;
    const resourceName = translate('volunteers.volunteers', translate('volunteers.label', 'Волонтеры'));
    const statusCode = error.statusCode ?? '—';

    notification.error({
        key: volunteerId != null ? `volunteer-save-error-${volunteerId}` : 'volunteer-save-error',
        message: translate(
            'notifications.editError',
            { resource: resourceName, statusCode },
            `Ошибка редактирования ${resourceName} (status code: ${statusCode})`
        ),
        description: error.message,
        duration: 0
    });
}
