import type { FC } from 'react';
import { useState } from 'react';

import type { TransactionJoined, GroupBadge, MealTime } from '~/db';
import dayjs from 'dayjs';
import { Text, Title } from '~/shared/ui/typography';
import { Button } from '~/shared/ui/button';
import { VolAndUpdateInfo } from 'src/components/vol-and-update-info';
import { FeedOtherCount } from '~/components/post-scan/post-scan-group-badge/post-scan-group-badge-misc/feed-other-count';
import { WarningPartiallyFedModal } from '~/components/post-scan/post-scan-group-badge/warning-partially-fed-modal/warning-partially-fed-modal';
import { calculateAlreadyFedCount } from '~/components/post-scan/post-scan.utils';

import type { GroupBadgeFeedAnonsPayload, ValidatedVol, ValidationGroups } from '../post-scan-group-badge.lib';
import { NotFeedListModalTrigger } from '../not-feed-list-modal/not-feed-list-modal';

import css from './post-scan-group-badge-misc.module.css';

export const GroupBadgeInfo: FC<{
    name: string;
}> = ({ name }) => {
    return (
        <div className={css.info}>
            <Title>Групповой бейдж</Title>
            <div className={css.detail}>
                <Text>Вы отсканировали групповой бейдж “{name}”:</Text>
            </div>
        </div>
    );
};

const useTodayPlannedValues = (groupBadge: GroupBadge, mealTime: MealTime) => {
    const today = dayjs().format('YYYY-MM-DD');
    const cell = groupBadge.planning_cells.find((c) => c.date === today && c.meal_time === mealTime);
    return {
        vegansCount: cell?.amount_vegan ?? null,
        nonVegansCount: cell?.amount_meat ?? null
    };
};

export const GroupBadgeWarningCard: FC<{
    alreadyFedTransactions: Array<TransactionJoined>;
    name: string;
    validationGroups: ValidationGroups;
    doFeed: (vols: Array<ValidatedVol>) => void;
    doFeedAnons: (value: GroupBadgeFeedAnonsPayload) => void;
    close: () => void;
    groupBadge: GroupBadge;
    mealTime: MealTime;
}> = ({ alreadyFedTransactions, close, doFeedAnons, groupBadge, mealTime, name, validationGroups }) => {
    const { greens, reds } = validationGroups;
    const volsToFeed = [...greens];

    const planned = useTodayPlannedValues(groupBadge, mealTime);

    const calculateDefaultFeedCount = (isVegan: boolean): number => {
        const alreadyFedCount = calculateAlreadyFedCount(
            alreadyFedTransactions.filter((t) => Boolean(t.is_vegan) === isVegan)
        );
        const volsToFeedCount = volsToFeed.filter((v) => Boolean(v.is_vegan) === isVegan).length;
        return Math.max(volsToFeedCount - alreadyFedCount, 0);
    };

    const [initialCalculatedCounts] = useState(() => ({
        vegans: calculateDefaultFeedCount(true),
        nonVegans: calculateDefaultFeedCount(false)
    }));

    const getDefaultCount = (isVegan: boolean): number => {
        const plannedCount = isVegan ? planned.vegansCount : planned.nonVegansCount;
        if (plannedCount !== null) {
            return plannedCount;
        }
        return calculateDefaultFeedCount(isVegan);
    };

    const [vegansCount, setVegansCount] = useState<number>(() => getDefaultCount(true));
    const [nonVegansCount, setNonVegansCount] = useState<number>(() => getDefaultCount(false));
    const [isWarningModalShown, setIsWarningModalShown] = useState(false);

    const handleFeed = (): void => {
        if (typeof vegansCount === 'string' || typeof nonVegansCount === 'string') {
            alert('введено некорректное значение');

            return;
        }

        doFeedAnons({
            vegansCount,
            nonVegansCount,
            anomalyMeta: {
                vegans: {
                    edited: vegansCount !== initialCalculatedCounts.vegans,
                    calculatedAmount: initialCalculatedCounts.vegans
                },
                nonVegans: {
                    edited: nonVegansCount !== initialCalculatedCounts.nonVegans,
                    calculatedAmount: initialCalculatedCounts.nonVegans
                }
            }
        });

        close();
    };

    const amountToFeed = Number(vegansCount) + Number(nonVegansCount);

    return (
        <div className={css.groupBadgeCard}>
            <WarningPartiallyFedModal
                alreadyFedTransactions={alreadyFedTransactions}
                setShowModal={setIsWarningModalShown}
                doFeedAnons={(value) => {
                    doFeedAnons(value);
                    close();
                }}
                greenVols={validationGroups.greens}
                showModal={isWarningModalShown}
            />
            <GroupBadgeInfo name={name} />

            {reds.length > 0 && (
                <div className={css.volunteerList}>
                    <NotFeedListModalTrigger doNotFeedVols={reds} />
                </div>
            )}

            <FeedOtherCount
                vegansCount={vegansCount}
                nonVegansCount={nonVegansCount}
                setVegansCount={setVegansCount}
                setNonVegansCount={setNonVegansCount}
            />

            <BottomBlock amountToFeed={amountToFeed} handlePrimaryAction={handleFeed} handleCancel={close} />
        </div>
    );
};

const BottomBlock: React.FC<{
    handleCancel: () => void;
    handlePrimaryAction: () => void;
    handleAlternativeAction?: () => void;
    alternativeText?: string;
    amountToFeed: number;
}> = ({ alternativeText, amountToFeed, handleAlternativeAction, handleCancel, handlePrimaryAction }) => {
    return (
        <div className={css.bottomBLock}>
            <div className={css.buttonsBlock}>
                <Button variant='secondary' onClick={handleCancel}>
                    Отмена
                </Button>
                <Button disabled={amountToFeed <= 0} onClick={handlePrimaryAction}>
                    Кормить ({amountToFeed})
                </Button>
            </div>
            {alternativeText ? (
                <Button onClick={handleAlternativeAction} variant='secondary'>
                    {alternativeText}
                </Button>
            ) : null}
            <VolAndUpdateInfo textColor='black' />
        </div>
    );
};
