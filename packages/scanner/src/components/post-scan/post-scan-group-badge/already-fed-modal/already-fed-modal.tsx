import { useState } from 'react';

import { Button } from 'shared/ui/button';
import { Modal } from 'shared/ui/modal';
import { Text } from 'shared/ui/typography';

import style from './already-fed-modal.module.css';

// Уже покормленные волонтеры
const AlreadyFedModal = ({ alreadyFedCount = 0, totalCount }: { alreadyFedCount?: number; totalCount: number }) => {
    const [modalWasShown, setModalWasShown] = useState<boolean>(false);

    const shouldShowModal = !modalWasShown && alreadyFedCount > 0;

    const onClose = (): void => {
        setModalWasShown(true);
    };

    return (
        <Modal active={shouldShowModal} onClose={onClose}>
            <div className={style.body}>
                <Text>
                    Уже выдали {alreadyFedCount} порций из {totalCount > 0 ? totalCount : 0}
                </Text>
                <Button onClick={onClose}>Ок</Button>
            </div>
        </Modal>
    );
};

export { AlreadyFedModal };
