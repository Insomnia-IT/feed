import { Button } from '~/shared/ui/button';
import { Modal } from '~/shared/ui/modal';
import { Text } from '~/shared/ui/typography';
import type { ValidatedVol } from '~/components/post-scan/post-scan-group-badge/post-scan-group-badge.lib';
import type { TransactionJoined } from '~/db';
import { getPlural } from '~/shared/lib/utils';

import style from './warning-partially-fed-modal.module.css';

// Уже покормленные волонтеры
const WarningPartiallyFedModal: React.FC<{
    showModal: boolean;
    setShowModal: (isShown: boolean) => void;
    greenVols: Array<ValidatedVol>;
    alreadyFedTransactions: Array<TransactionJoined>;
    doFeedAnons: (value: { vegansCount: number; nonVegansCount: number }) => void;
}> = ({ alreadyFedTransactions, doFeedAnons, greenVols, setShowModal, showModal }) => {
    const onClose = (): void => {
        setShowModal(false);
    };

    const { nonVegans: nonVegansVols, vegans: vegansVols } = reduceVegans<ValidatedVol>(greenVols);
    const { nonVegans: nonVegansTransactions, vegans: vegansTransactions } =
        reduceVegans<TransactionJoined>(alreadyFedTransactions);

    const leftVegans = vegansVols.length - vegansTransactions.length;
    const leftMeats = nonVegansVols.length - nonVegansTransactions.length;

    const primaryAction = (): void => {
        doFeedAnons({ vegansCount: leftVegans, nonVegansCount: leftMeats });
        onClose();
    };

    return (
        <Modal title='Часть уже покормили' active={showModal} onClose={onClose} classModal={style.modal}>
            <div className={style.body}>
                <div>
                    <Text>Покормлены {vegansTransactions.length + nonVegansTransactions.length}:</Text>
                    {nonVegansTransactions.length > 0 && (
                        <Text>
                            {nonVegansTransactions.length}{' '}
                            {getPlural(nonVegansTransactions.length, ['Мясоед', 'Мясоеда', 'Мясоедов'])} 🥩
                        </Text>
                    )}
                    {vegansTransactions.length > 0 && (
                        <Text>
                            {vegansTransactions.length}{' '}
                            {getPlural(vegansTransactions.length, ['Веган', 'Вегана', 'Веганов'])} 🥦
                        </Text>
                    )}
                </div>
                <div>
                    <Text>Остались непокормлены {leftVegans + leftMeats}:</Text>
                    {leftMeats > 0 && (
                        <Text>
                            {leftMeats} {getPlural(leftMeats, ['Мясоед', 'Мясоеда', 'Мясоедов'])} 🥩
                        </Text>
                    )}
                    {leftVegans > 0 && (
                        <Text>
                            {leftVegans} {getPlural(leftVegans, ['Веган', 'Вегана', 'Веганов'])} 🥦
                        </Text>
                    )}
                </div>
                <Button variant='secondary' onClick={onClose}>
                    Отмена
                </Button>
                <Button onClick={primaryAction}>Покорить</Button>
            </div>
        </Modal>
    );
};

const reduceVegans = <T extends { is_vegan?: boolean }>(
    values: Array<T>
): { vegans: Array<T>; nonVegans: Array<T> } => {
    return values.reduce<{ vegans: Array<T>; nonVegans: Array<T> }>(
        (prev: { vegans: Array<T>; nonVegans: Array<T> }, volunteer) => {
            const next = { ...prev };

            if (volunteer.is_vegan) {
                next.vegans.push(volunteer);
            } else {
                next.nonVegans.push(volunteer);
            }

            return next;
        },
        { vegans: [], nonVegans: [] } as { vegans: Array<T>; nonVegans: Array<T> }
    );
};

export { WarningPartiallyFedModal };
