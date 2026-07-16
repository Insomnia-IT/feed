import { db } from 'db';
import { Text } from 'shared/ui/typography';
import { Button } from 'shared/ui/button';
import { useApp } from 'model/app-provider';
import { Switcher } from 'shared/ui/switcher';
import { AppViews, useView } from 'model/view-provider';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDeviceId, recordDiagnostic } from 'diagnostics';
import { useApiProbe } from 'request/use-api-probe';
import { useEffect, useState } from 'react';

import css from './settings.module.css';
const formatDate = (value: number) => {
    return new Date(value).toLocaleString('ru', {
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    });
};
export const Settings = () => {
    const { autoSync, doSync, lastSyncStart, setAuth, setMealTime, setPin, syncError, syncFetching, toggleAutoSync } =
        useApp();
    const { setCurrentView } = useView();
    const appVersion = import.meta.env.VITE_APP_VERSION || 'dev';
    const apiProbe = useApiProbe();
    const [diagnosticsUpload, setDiagnosticsUpload] = useState<'ok' | 'failed' | 'unknown'>('unknown');
    const [currentTime, setCurrentTime] = useState(0);
    useEffect(() => {
        const listener = (event: Event): void => setDiagnosticsUpload((event as CustomEvent<'ok' | 'failed'>).detail);
        window.addEventListener('feed:diagnostics-upload', listener);
        return () => window.removeEventListener('feed:diagnostics-upload', listener);
    }, []);
    useEffect(() => {
        const update = (): void => setCurrentTime(Date.now());
        update();
        const interval = window.setInterval(update, 60_000);
        return () => window.clearInterval(interval);
    }, []);
    const pending = useLiveQuery(() => db.transactions.filter(({ is_new }) => is_new).toArray(), [], []);
    const oldestPending = pending.length ? Math.min(...pending.map(({ ts }) => ts * 1000)) : null;
    const apiAvailable = apiProbe === 'api_available';
    const syncStale = lastSyncStart ? currentTime - lastSyncStart > 30 * 60 * 1000 : true;
    const fieldMessage =
        apiProbe === 'browser_offline'
            ? 'Работаем офлайн. Кормления сохраняются на устройстве.'
            : apiProbe === 'api_unavailable'
              ? 'Интернет есть, но сервер недоступен. Кормления сохраняются на устройстве.'
              : apiProbe === 'api_available'
                ? 'Сервер доступен. Можно продолжать кормление.'
                : 'Проверяем доступность сервера. Кормления сохраняются на устройстве.';

    const copyDiagnostics = async (): Promise<void> => {
        const report = {
            app_version: appVersion,
            device_id: getDeviceId(),
            dexie_schema_version: 23,
            local_database_ready: db.isOpen(),
            browser_online: navigator.onLine,
            api_available: apiAvailable,
            last_successful_exchange: lastSyncStart ? new Date(lastSyncStart).toISOString() : null,
            pending_transaction_count: pending.length,
            oldest_pending_age_seconds: oldestPending ? Math.floor((Date.now() - oldestPending) / 1000) : null,
            secure_context: isSecureContext,
            camera_state: 'unknown',
            clock_skew_seconds: null
        };
        await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
        await recordDiagnostic('heartbeat', { pending_count: pending.length }, syncError ? 'degraded' : 'ok');
    };

    const logout = (): void => {
        setAuth(false);
        setMealTime(null);
        setCurrentView(AppViews.MAIN);
        setPin('');
    };

    const reset = (): void => {
        if ('serviceWorker' in navigator) {
            void caches.keys().then(function (cacheNames) {
                cacheNames.forEach(function (cacheName) {
                    void caches.delete(cacheName);
                });

                window.location.reload();
            });
        }
    };

    return (
        <div className={css.settings}>
            <div>
                <Text>Обновление базы важно делать регулярно (минимум раз в 10 минут).</Text>
                <br />
                <Text>
                    <b>Зачем?</b> Например, если в базу внесли нового Волонтера, а у вас эта информация не обновилась,
                    то Волонтер не сможет покушать :(
                </Text>
            </div>
            <Switcher
                text="Автоматическое обновление"
                checked={autoSync}
                onChange={() => {
                    toggleAutoSync();
                }}
            />
            <div className={css.update}>
                <Button
                    className={css.button}
                    onClick={() => {
                        void doSync();
                    }}
                    disabled={syncFetching}
                >
                    Обновить базу
                </Button>
                {!!lastSyncStart && <Text>Последнее обновление: {formatDate(lastSyncStart)}</Text>}
            </div>
            <div className={css.diagnostics}>
                <Text>
                    <b>{fieldMessage}</b>
                </Text>
                <Text>Локальная база: {db.isOpen() ? 'готова' : 'не готова'}</Text>
                <Text>API: {apiAvailable ? 'доступен' : 'недоступен'}</Text>
                <Text>Синхронизация: {syncError ? 'ошибка' : syncStale ? 'данные устарели' : 'актуальна'}</Text>
                <Text>
                    Отправка диагностики:{' '}
                    {diagnosticsUpload === 'failed' ? 'ошибка' : diagnosticsUpload === 'ok' ? 'работает' : 'неизвестно'}
                </Text>
                <Text>Ожидают отправки: {pending.length}</Text>
                {oldestPending && <Text>Самая старая операция: {formatDate(oldestPending)}</Text>}
                <Text>Камера: неизвестно</Text>
                <Text>Расхождение часов: неизвестно</Text>
                <Text>Grist: неизвестно</Text>
                <Text>Service Worker: неизвестно</Text>
                <Button className={css.button} onClick={() => void copyDiagnostics()}>
                    Скопировать диагностику
                </Button>
            </div>
            <Button
                className={css.button}
                onClick={async () => {
                    if (confirm('Полное обновлене занимает много времени.\nВы уверены?')) {
                        await recordDiagnostic(
                            'full_database_refresh',
                            { pending_count: pending.length },
                            pending.length ? 'critical' : 'ok'
                        );
                        await db.volunteers.clear();
                        await db.groupBadges.clear();
                        localStorage.removeItem('lastSyncStart');
                        localStorage.removeItem('lastUpdatedServerTrans');
                        void doSync({ full: true });
                    }
                }}
                disabled={syncFetching}
                style={{ color: 'white', backgroundColor: 'red' }}
            >
                Полное обновление
            </Button>
            <Button className={css.button} onClick={reset} disabled={syncFetching}>
                Сбросить кеш
            </Button>
            <button className={css.leave} onClick={logout}>
                Выйти из кухни &rarr;
            </button>
            <div className={css.version}>Версия приложения: {appVersion.replace('T', ' ')}</div>
        </div>
    );
};
