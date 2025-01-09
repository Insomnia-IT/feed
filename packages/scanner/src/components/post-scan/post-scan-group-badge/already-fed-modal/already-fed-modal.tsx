import { useState } from 'react';

import { Button } from '~/shared/ui/button';
import { Modal } from '~/shared/ui/modal';
import { Text } from '~/shared/ui/typography';

import style from './already-fed-modal.module.css';

// Уже покормленные волонтеры
const AlreadyFedModal: React.FC<{
    leftToFeedCount: number;
    alreadyFedVolsCount?: number;
}> = ({ alreadyFedVolsCount = 0, leftToFeedCount }) => {
    const [modalWasShown, setModalWasShown] = useState<boolean>(false);

    const shouldShowModal = !modalWasShown && alreadyFedVolsCount > 0;

    const onClose = (): void => {
        setModalWasShown(true);
    };

    return (
        <Modal active={shouldShowModal} onClose={onClose}>
            <div className={style.body}>
                <Text>
                    Уже выдали {alreadyFedVolsCount}. Осталось {leftToFeedCount > 0 ? leftToFeedCount : 0}
                </Text>
                <Button onClick={onClose}>Ок</Button>
            </div>
        </Modal>
    );
};

export { AlreadyFedModal };
