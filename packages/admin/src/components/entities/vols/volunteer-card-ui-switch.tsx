import { CloseOutlined, InfoCircleOutlined, SwapOutlined } from '@ant-design/icons';
import { Button, Modal, type FormInstance } from 'antd';
import { useCallback, useContext, useState } from 'react';

import { VOLUNTEER_CARD_LEGACY_UI_BANNER_DISMISSED_KEY, VOLUNTEER_CARD_NEW_UI_BANNER_DISMISSED_KEY } from 'const';
import { VolunteerCardUiBannerFormContext } from './volunteer-card-ui-banner-context';
import { setVolunteerCardLegacyUiEnabled } from './volunteer-card-legacy-ui';

import styles from './volunteer-card-ui-switch.module.css';

type VolunteerCardUiTopBannerProps = {
    mode: 'new' | 'legacy';
};

const confirmSwitch = (onConfirm: () => void) => {
    Modal.confirm({
        title: 'Переключить интерфейс?',
        content:
            'Несохранённые изменения в форме будут потеряны. Данные на сервере не изменятся — карточка откроется заново.',
        okText: 'Переключить',
        cancelText: 'Отмена',
        onOk: onConfirm
    });
};

const requestSwitch = (enabled: boolean, form?: FormInstance) => {
    const apply = () => setVolunteerCardLegacyUiEnabled(enabled);

    if (form?.isFieldsTouched(true)) {
        confirmSwitch(apply);
        return;
    }

    apply();
};

const readBannerDismissed = (storageKey: string): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        return window.sessionStorage.getItem(storageKey) === 'true';
    } catch {
        return false;
    }
};

const persistBannerDismissed = (storageKey: string): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.setItem(storageKey, 'true');
    } catch {
        /* empty */
    }
};

export const VolunteerCardUiTopBanner = ({ mode }: VolunteerCardUiTopBannerProps) => {
    const bannerFormContext = useContext(VolunteerCardUiBannerFormContext);
    const storageKey =
        mode === 'legacy' ? VOLUNTEER_CARD_LEGACY_UI_BANNER_DISMISSED_KEY : VOLUNTEER_CARD_NEW_UI_BANNER_DISMISSED_KEY;
    const [dismissed, setDismissed] = useState(() => readBannerDismissed(storageKey));

    const dismissBanner = useCallback(() => {
        persistBannerDismissed(storageKey);
        setDismissed(true);
    }, [storageKey]);

    if (dismissed) {
        return null;
    }

    const isLegacyMode = mode === 'legacy';
    const message = isLegacyMode
        ? 'Вы используете прежний интерфейс карточки волонтёра.'
        : 'Доступен прежний интерфейс карточки волонтёра.';
    const actionLabel = isLegacyMode ? 'Новый интерфейс' : 'Старый интерфейс';

    return (
        <div className={styles.bannerWrap}>
            <div className={styles.topBanner} role="status">
                <div className={styles.topBannerContent}>
                    <InfoCircleOutlined className={styles.topBannerIcon} aria-hidden />
                    <span className={styles.topBannerText}>{message}</span>
                    <Button
                        type="link"
                        size="small"
                        icon={<SwapOutlined />}
                        className={styles.topBannerAction}
                        onClick={() => requestSwitch(!isLegacyMode, bannerFormContext?.formRef.current)}
                    >
                        {actionLabel}
                    </Button>
                </div>
                <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    className={styles.topBannerClose}
                    aria-label="Закрыть"
                    onClick={dismissBanner}
                />
            </div>
        </div>
    );
};
