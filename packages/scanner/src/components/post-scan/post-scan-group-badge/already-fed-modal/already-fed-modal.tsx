import { useState } from 'react';

import { Button } from '~/shared/ui/button';
import { Modal } from '~/shared/ui/modal';
import { Text } from '~/shared/ui/typography';

import style from './already-fed-modal.module.css';

// Уже покормленные волонтеры
const AlreadyFedModal: React.FC<{ volsToFeedCount: number; allVolsCount: number }> = ({
    allVolsCount,
    volsToFeedCount
}) => {
    const [modalWasShown, setModalWasShown] = useState<boolean>(false);

    const volsFedWithSameMealLength = allVolsCount - volsToFeedCount;

    const shouldShowModal = !modalWasShown && volsFedWithSameMealLength > 0;

    const onClose = (): void => {
        setModalWasShown(true);
    };

    return (
        <Modal active={shouldShowModal} onClose={onClose}>
            <div className={style.body}>
                <Text>
                    Уже выдали {volsFedWithSameMealLength}. Осталось {volsToFeedCount}
                </Text>
                <Button onClick={onClose}>Ок</Button>
            </div>
        </Modal>
    );
};

export { AlreadyFedModal };
