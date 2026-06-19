import { useMemo } from 'react';
import type { NotificationProvider, OpenNotificationParams } from '@refinedev/core';
import { useNotificationProvider as useRefineNotificationProvider } from '@refinedev/antd';
import { App, notification as staticNotification } from 'antd';

type NotificationOpenParams = OpenNotificationParams & {
    metaData?: {
        duration?: number;
    };
};

export const useNotificationProvider = (): NotificationProvider => {
    const refineProvider = useRefineNotificationProvider();
    const { notification: notificationFromContext } = App.useApp();
    const notification = 'open' in notificationFromContext ? notificationFromContext : staticNotification;

    return useMemo(
        () => ({
            open: (params: NotificationOpenParams) => {
                const { metaData, type } = params;

                if (metaData?.duration !== undefined && type !== 'progress') {
                    notification.open({
                        key: params.key,
                        description: params.message,
                        message: params.description ?? null,
                        type: type as 'success' | 'error' | 'info' | 'warning',
                        duration: metaData.duration
                    });
                    return;
                }

                refineProvider.open(params);
            },
            close: refineProvider.close
        }),
        [notification, refineProvider]
    );
};
