import { Button } from 'shared/ui/button';
import { Modal } from 'shared/ui/modal';
import { Text } from 'shared/ui/typography';
import type {
    GroupBadgeFeedAnonsPayload,
    ValidatedVol
} from 'components/post-scan/post-scan-group-badge/post-scan-group-badge.lib';
import type { TransactionJoined } from 'db';
import { getPlural } from 'shared/lib/utils';
import { calculateAlreadyFedCount } from 'components/post-scan/post-scan.utils';

import style from './warning-partially-fed-modal.module.css';

// Уже покормленные волонтеры
const WarningPartiallyFedModal = ({
    alreadyFedTransactions,
    doFeedAnons,
    greenVols,
    setShowModal,
    showModal
}: {
    showModal: boolean;
    setShowModal: (isShown: boolean) => void;
    greenVols: Array<ValidatedVol>;
    alreadyFedTransactions: Array<TransactionJoined>;
    doFeedAnons: (value: GroupBadgeFeedAnonsPayload) => void;
}) => {
    const onClose = (): void => {
        setShowModal(false);
    };

    const { nonVegans: nonVegansVols, vegans: vegansVols } = reduceVegans<ValidatedVol>(greenVols);
    const { nonVegans: nonVegansTransactions, vegans: vegansTransactions } =
        reduceVegans<TransactionJoined>(alreadyFedTransactions);

    const alreadyFedVegansCount = calculateAlreadyFedCount(vegansTransactions);
    const alreadyFedNonVegansCount = calculateAlreadyFedCount(nonVegansTransactions);

    // Сколько не покормленных веганов осталось в бейдже
    const leftVegans = vegansVols.length - alreadyFedVegansCount;
    // Сколько дополнительно веганов покормили по бейджу
    const vegansOverFed = Math.min(0, leftVegans) * -1;

    // Сколько не покормленных мясоедов осталось в бейдже
    const leftMeats = nonVegansVols.length - alreadyFedNonVegansCount;
    // Сколько дополнительно мясоедов покормили по бейджу
    const meatsOverFed = Math.min(0, leftMeats) * -1;

    // Итого осталось покормить считается так: осталось <типа> - дополнительно покормленные <другого типа>
    // Ситуация, когда слишком много и тех и других, по идее, не должна возникнуть, так как тогда все значения будут в нуле
    const finalVegans = Math.max(leftVegans - meatsOverFed, 0);
    const finalMeats = Math.max(leftMeats - vegansOverFed, 0);

    const primaryAction = (): void => {
        doFeedAnons({
            vegansCount: finalVegans,
            nonVegansCount: finalMeats,
            anomalyMeta: {
                vegans: { edited: false, calculatedAmount: finalVegans },
                nonVegans: { edited: false, calculatedAmount: finalMeats }
            }
        });
        onClose();
    };

    return (
        <Modal title="Часть уже покормили" active={showModal} onClose={onClose} classModal={style.modal}>
            <div className={style.body}>
                <div>
                    <Text>Покормлены {alreadyFedVegansCount + alreadyFedNonVegansCount}:</Text>
                    {alreadyFedNonVegansCount > 0 && (
                        <Text>
                            {alreadyFedNonVegansCount}{' '}
                            {getPlural(alreadyFedNonVegansCount, ['Мясоед', 'Мясоеда', 'Мясоедов'])} 🥩
                        </Text>
                    )}
                    {alreadyFedVegansCount > 0 && (
                        <Text>
                            {alreadyFedVegansCount} {getPlural(alreadyFedVegansCount, ['Веган', 'Вегана', 'Веганов'])}{' '}
                            🥦
                        </Text>
                    )}
                </div>
                <div>
                    <Text>Остались непокормлены {finalVegans + finalMeats}:</Text>
                    {finalMeats > 0 && (
                        <Text>
                            {finalMeats} {getPlural(finalMeats, ['Мясоед', 'Мясоеда', 'Мясоедов'])} 🥩
                        </Text>
                    )}
                    {finalVegans > 0 && (
                        <Text>
                            {finalVegans} {getPlural(finalVegans, ['Веган', 'Вегана', 'Веганов'])} 🥦
                        </Text>
                    )}
                </div>
                <Button variant="secondary" onClick={onClose}>
                    Отмена
                </Button>
                <Button onClick={primaryAction}>Покормить</Button>
            </div>
        </Modal>
    );
};

const reduceVegans = <T extends { is_vegan?: boolean | null }>(
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
