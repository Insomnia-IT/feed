import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslate, useWarnAboutChange } from '@refinedev/core';
import { Button, Modal } from 'antd';
import { UNSAFE_NavigationContext as NavigationContext, useLocation } from 'react-router';

import { installNavigationBlocker, type PendingNavigation } from './block-navigation';
import { useUnsavedChangesSaveContext } from './unsaved-changes-save-context';
import styles from './unsaved-changes-notifier.module.css';

type UnsavedChangesNotifierProps = {
    translationKey?: string;
    message?: string;
};

export const UnsavedChangesNotifier = ({
    translationKey = 'warnWhenUnsavedChanges',
    message = 'You have unsaved changes. They will be lost if you leave. What would you like to do?'
}: UnsavedChangesNotifierProps) => {
    const translate = useTranslate();
    const { pathname } = useLocation();
    const { warnWhen, setWarnWhen } = useWarnAboutChange();
    const { getSaveHandler } = useUnsavedChangesSaveContext();
    const { navigator } = useContext(NavigationContext);

    const [modalOpen, setModalOpen] = useState(false);
    const pendingNavigationRef = useRef<PendingNavigation | null>(null);
    const originalPushRef = useRef(navigator.push);
    const originalGoRef = useRef(navigator.go);

    useEffect(() => {
        return () => setWarnWhen?.(false);
    }, [pathname, setWarnWhen]);

    const warnMessage = useMemo(() => translate(translationKey, message), [translationKey, message, translate]);

    useEffect(() => {
        if (!warnWhen) {
            return;
        }

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = warnMessage;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [warnMessage, warnWhen]);

    const openModal = useCallback((navigation: PendingNavigation) => {
        pendingNavigationRef.current = navigation;
        setModalOpen(true);
    }, []);

    useEffect(() => {
        if (!warnWhen) {
            return;
        }

        originalPushRef.current = navigator.push.bind(navigator);
        originalGoRef.current = navigator.go.bind(navigator);

        return installNavigationBlocker({
            navigator,
            onBlock: openModal
        });
    }, [navigator, openModal, warnWhen]);

    const handleStay = useCallback(() => {
        pendingNavigationRef.current = null;
        setModalOpen(false);
    }, []);

    const handleLeaveWithoutSaving = useCallback(() => {
        const pending = pendingNavigationRef.current;
        pendingNavigationRef.current = null;
        setModalOpen(false);
        setWarnWhen?.(false);

        if (!pending) {
            return;
        }

        if (pending.type === 'push') {
            originalPushRef.current.apply(navigator, pending.args);
            return;
        }

        originalGoRef.current.apply(navigator, pending.args);
    }, [navigator, setWarnWhen]);

    const handleSave = useCallback(() => {
        pendingNavigationRef.current = null;
        setModalOpen(false);
        getSaveHandler()?.();
    }, [getSaveHandler]);

    return (
        <Modal
            title="Несохранённые изменения"
            open={modalOpen}
            onCancel={handleStay}
            maskClosable
            closable
            width={720}
            className={styles.modal}
            wrapClassName={styles.modalWrap}
            footer={
                <div className={styles.footer}>
                    <Button onClick={handleLeaveWithoutSaving}>Выйти без сохранения</Button>
                    <div className={styles.footerRight}>
                        <Button onClick={handleStay}>Остаться в карточке</Button>
                        <Button type="primary" onClick={handleSave}>
                            Сохранить изменения
                        </Button>
                    </div>
                </div>
            }
        >
            <p className={styles.message}>{warnMessage}</p>
        </Modal>
    );
};
