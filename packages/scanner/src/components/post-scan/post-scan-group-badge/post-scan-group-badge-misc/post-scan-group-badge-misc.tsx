import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import type { GroupBadge, MealPlanCell, MealTime, TransactionJoined, Volunteer } from 'db';
import { Text, Title } from 'shared/ui/typography';
import { Button } from 'shared/ui/button';
import { VolAndUpdateInfo } from 'components/vol-and-update-info';
import { FeedOtherCount } from 'components/post-scan/post-scan-group-badge/post-scan-group-badge-misc/feed-other-count';
import { WarningPartiallyFedModal } from 'components/post-scan/post-scan-group-badge/warning-partially-fed-modal/warning-partially-fed-modal';
import { calculateAlreadyFedCount } from 'components/post-scan/post-scan.utils';

import type { GroupBadgeFeedAnonsPayload, ValidatedVol, ValidationGroups } from '../post-scan-group-badge.lib';
import { NotFeedListModalTrigger } from '../not-feed-list-modal/not-feed-list-modal';

import css from './post-scan-group-badge-misc.module.css';

export const GroupBadgeInfo = ({ name }: { name: string; volsToFeed: Array<Volunteer> }) => {
    return (
        <div className={css.info}>
            <Title>Групповой бейдж</Title>
            <div className={css.detail}>
                <Text>Вы отсканировали групповой бейдж “{name}”:</Text>
            </div>
        </div>
    );
};

const useTodayPlannedValues = (
    groupBadge: GroupBadge,
    mealTime: MealTime
): { vegansCount: number | null; nonVegansCount: number | null } => {
    const targetCell = useMemo(() => {
        const today = dayjs();

        let currentTargetCell: MealPlanCell | undefined;

        for (const currentCell of groupBadge.planning_cells) {
            const currentCellDate = dayjs(currentCell.date);

            if (currentCell.meal_time !== mealTime || currentCellDate.isAfter(today)) {
                continue;
            }

            if (!currentTargetCell) {
                currentTargetCell = currentCell;
                continue;
            }

            const targetCellDate = dayjs(currentTargetCell.date);

            if (currentCellDate.isAfter(targetCellDate)) {
                currentTargetCell = currentCell;
            }
        }

        return currentTargetCell;
    }, [groupBadge, mealTime]);

    return {
        vegansCount: targetCell?.amount_vegan ?? null,
        nonVegansCount: targetCell?.amount_meat ?? null
    };
};

export const GroupBadgeWarningCard = ({
    alreadyFedTransactions,
    close,
    doFeedAnons,
    groupBadge,
    mealTime,
    name,
    validationGroups
}: {
    alreadyFedTransactions: Array<TransactionJoined>;
    name: string;
    validationGroups: ValidationGroups;
    doFeed: (vols: Array<ValidatedVol>) => void;
    doFeedAnons: (value: GroupBadgeFeedAnonsPayload) => void;
    close: () => void;
    groupBadge: GroupBadge;
    mealTime: MealTime;
}) => {
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

    const getAlreadyFedCount = (isVegan: boolean): number => {
        return calculateAlreadyFedCount(alreadyFedTransactions.filter((t) => Boolean(t.is_vegan) === isVegan));
    };

    const getDefaultCount = (isVegan: boolean): number => {
        const plannedCount = isVegan ? planned.vegansCount : planned.nonVegansCount;

        if (plannedCount !== null) {
            return Math.max(plannedCount - getAlreadyFedCount(isVegan), 0);
        }

        return calculateDefaultFeedCount(isVegan);
    };

    const buildInitialCounts = (): { vegans: number; nonVegans: number } => ({
        vegans: getDefaultCount(true),
        nonVegans: getDefaultCount(false)
    });

    const [initialCalculatedCounts] = useState(buildInitialCounts);
    const [vegansCount, setVegansCount] = useState<number>(initialCalculatedCounts.vegans);
    const [nonVegansCount, setNonVegansCount] = useState<number>(initialCalculatedCounts.nonVegans);
    const [isWarningModalShown, setIsWarningModalShown] = useState(false);

    const handleFeed = (): void => {
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
            <GroupBadgeInfo name={name} volsToFeed={volsToFeed} />

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

const BottomBlock = ({
    alternativeText,
    amountToFeed,
    handleAlternativeAction,
    handleCancel,
    handlePrimaryAction
}: {
    handleCancel: () => void;
    handlePrimaryAction: () => void;
    handleAlternativeAction?: () => void;
    alternativeText?: string;
    amountToFeed: number;
}) => {
    return (
        <div className={css.bottomBLock}>
            <div className={css.buttonsBlock}>
                <Button variant="secondary" onClick={handleCancel}>
                    Отмена
                </Button>
                <Button disabled={amountToFeed <= 0} onClick={handlePrimaryAction}>
                    Кормить ({amountToFeed})
                </Button>
            </div>
            {alternativeText ? (
                <Button onClick={handleAlternativeAction} variant="secondary">
                    {alternativeText}
                </Button>
            ) : null}
            <VolAndUpdateInfo textColor="black" />
        </div>
    );
};
