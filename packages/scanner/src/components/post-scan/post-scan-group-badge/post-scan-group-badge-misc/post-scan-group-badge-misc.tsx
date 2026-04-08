import cn from 'classnames';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import type { GroupBadge, MealPlanCell, MealTime, TransactionJoined, Volunteer } from 'db';
import { Text, Title } from 'shared/ui/typography';
import { Button } from 'shared/ui/button';
import { VolAndUpdateInfo } from 'components/vol-and-update-info';
import { getPlural } from 'shared/lib/utils';
import { FeedOtherCount } from 'components/post-scan/post-scan-group-badge/post-scan-group-badge-misc/feed-other-count';
import { WarningPartiallyFedModal } from 'components/post-scan/post-scan-group-badge/warning-partially-fed-modal/warning-partially-fed-modal';
import { calculateAlreadyFedCount } from 'components/post-scan/post-scan.utils';

import type { GroupBadgeFeedAnonsPayload, ValidatedVol, ValidationGroups } from '../post-scan-group-badge.lib';
import { NotFeedListModalTrigger } from '../not-feed-list-modal/not-feed-list-modal';

import css from './post-scan-group-badge-misc.module.css';

export const GroupBadgeInfo = ({ name, volsToFeed }: { name: string; volsToFeed: Array<Volunteer> }) => {
    const totalVegs = volsToFeed.filter((vol) => vol.is_vegan).length;
    const totalMeats = volsToFeed.filter((vol) => !vol.is_vegan).length;

    return (
        <div className={css.info}>
            <Title>Групповой бейдж</Title>
            <div className={css.detail}>
                <Text>
                    Вы отсканировали групповой бейдж “{name}” ({volsToFeed.length}):
                </Text>
                <div className={cn(css.counts, { [css.oneCount]: totalVegs === 0 || totalMeats === 0 })}>
                    {totalMeats > 0 && (
                        <Text className={css.volInfo}>
                            {totalMeats} {getPlural(totalMeats, ['Мясоед', 'Мясоеда', 'Мясоедов'])} 🥩
                        </Text>
                    )}
                    {totalVegs > 0 && (
                        <Text className={css.volInfo}>
                            {totalVegs} {getPlural(totalVegs, ['Веган', 'Вегана', 'Веганов'])} 🥦
                        </Text>
                    )}
                </div>
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
    doFeed,
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

    const [showOtherCount, setShowOtherCount] = useState(false);
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

    const isPartiallyFed = alreadyFedTransactions.length > 0;

    const handleFeed = (): void => {
        if (showOtherCount) {
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
            return;
        }

        if (isPartiallyFed) {
            setIsWarningModalShown(true);
            return;
        }

        doFeed(volsToFeed);
        close();
    };

    const alreadyFedCount = calculateAlreadyFedCount(alreadyFedTransactions);
    const maxCountOther = Math.max(Math.round(volsToFeed.length * 1.5) - alreadyFedCount, 0);
    const amountToFeed = showOtherCount
        ? Number(vegansCount) + Number(nonVegansCount)
        : Math.max(volsToFeed.length - alreadyFedCount, 0);

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

            {showOtherCount ? (
                <FeedOtherCount
                    maxCount={maxCountOther}
                    vegansCount={vegansCount}
                    nonVegansCount={nonVegansCount}
                    setVegansCount={setVegansCount}
                    setNonVegansCount={setNonVegansCount}
                />
            ) : null}

            <BottomBlock
                amountToFeed={amountToFeed}
                handlePrimaryAction={handleFeed}
                handleCancel={close}
                handleAlternativeAction={() => setShowOtherCount(!showOtherCount)}
                alternativeText={showOtherCount ? 'Кормить всех' : 'Кормить часть'}
            />
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
