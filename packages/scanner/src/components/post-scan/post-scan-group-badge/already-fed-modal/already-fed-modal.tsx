import { useState } from 'react';

import { Button } from '~/shared/ui/button';
import { Modal } from '~/shared/ui/modal';
import { Text } from '~/shared/ui/typography';
import { useApp } from '~/model/app-provider';
import type { Volunteer } from '~/db';

import style from './already-fed-modal.module.css';

// Уже покормленные волонтеры
const AlreadyFedModal: React.FC<{ vols?: Array<Volunteer> }> = ({ vols = [] }) => {
    const { mealTime } = useApp();

    const [modalWasShown, setModalWasShown] = useState<boolean>(false);

    const volsFedWithSameMealLength = vols.filter((volunteer): boolean =>
        (volunteer?.transactions ?? []).some((transaction): boolean => transaction.mealTime === mealTime)
    ).length;

    const shouldShowModal = !modalWasShown && volsFedWithSameMealLength > 0;

    const leftToFeed = vols.length - volsFedWithSameMealLength;

    const onClose = (): void => {
        setModalWasShown(true);
    };

    return (
        <Modal active={shouldShowModal} onClose={onClose}>
            <div className={style.body}>
                <Text>
                    Уже выдали {volsFedWithSameMealLength}. Осталось {leftToFeed}
                </Text>
                <Button onClick={onClose}>Ок</Button>
            </div>
        </Modal>
    );
};

export { AlreadyFedModal };
