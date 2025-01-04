import { useState } from 'react';

import { Button } from '~/shared/ui/button';
import { Modal } from '~/shared/ui/modal';
import { Text } from '~/shared/ui/typography';
import type { MealTime, Volunteer } from '~/db';

import style from './already-fed-modal.module.css';

// Уже покормленные волонтеры
const AlreadyFedModal: React.FC<{
    validatedVolsCount: number;
    allVolsCount: number;
    vols?: Array<Volunteer>;
    groupBadgeId?: number;
    mealTime?: MealTime | null;
}> = ({ groupBadgeId, mealTime, validatedVolsCount, vols = new Array<Volunteer>() }) => {
    // TODO: считать анонимов, когда появится возможность кормить их в ГБ
    const alreadyFedVolsCount = vols.filter((vol) =>
        vol.transactions?.some(
            (transaction) => transaction.mealTime === mealTime && transaction.group_badge === groupBadgeId
        )
    ).length;

    const volsToFeedCount = validatedVolsCount - alreadyFedVolsCount;

    const [modalWasShown, setModalWasShown] = useState<boolean>(false);

    const shouldShowModal = !modalWasShown && alreadyFedVolsCount > 0;

    const onClose = (): void => {
        setModalWasShown(true);
    };

    return (
        <Modal active={shouldShowModal} onClose={onClose}>
            <div className={style.body}>
                <Text>
                    Уже выдали {alreadyFedVolsCount}. Осталось {volsToFeedCount > 0 ? volsToFeedCount : 0}
                </Text>
                <Button onClick={onClose}>Ок</Button>
            </div>
        </Modal>
    );
};

export { AlreadyFedModal };
