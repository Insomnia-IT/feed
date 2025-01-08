import type { FC } from 'react';
import { useState } from 'react';
import cn from 'classnames';

import type { TransactionJoined, Volunteer } from '~/db';
import { Text, Title } from '~/shared/ui/typography';
import { Button } from '~/shared/ui/button';
import { VolAndUpdateInfo } from 'src/components/vol-and-update-info';
import { getPlural } from '~/shared/lib/utils';
import { FeedOtherCount } from '~/components/post-scan/post-scan-group-badge/post-scan-group-badge-misc/feed-other-count';
import { WarningPartiallyFedModal } from '~/components/post-scan/post-scan-group-badge/warning-partially-fed-modal/warning-partially-fed-modal';

import type { ValidatedVol, ValidationGroups } from '../post-scan-group-badge.lib';

import css from './post-scan-group-badge-misc.module.css';

export const GroupBadgeInfo: FC<{
    name: string;
    volsToFeed: Array<Volunteer>;
}> = ({ name, volsToFeed }) => {
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

export const GroupBadgeWarningCard: FC<{
    alreadyFedTransactions: Array<TransactionJoined>;
    name: string;
    validationGroups: ValidationGroups;
    doFeed: (vols: Array<ValidatedVol>) => void;
    doFeedAnons: (value: { vegansCount: number; nonVegansCount: number }) => void;
    close: () => void;
}> = ({ alreadyFedTransactions, close, doFeed, doFeedAnons, name, validationGroups }) => {
    const { greens, reds } = validationGroups;
    const volsToFeed = [...greens];

    const [showOtherCount, setShowOtherCount] = useState(false);
    const [vegansCount, setVegansCount] = useState(0);
    const [nonVegansCount, setNonVegansCount] = useState(0);
    const [isWarningModalShown, setIsWarningModalShown] = useState(false);

    const isPartiallyFed = !!alreadyFedTransactions.length;

    const handleFeed = (): void => {
        if (showOtherCount) {
            doFeedAnons({ vegansCount, nonVegansCount });
        } else {
            if (isPartiallyFed) {
                setIsWarningModalShown(true);
                return;
            }

            doFeed(volsToFeed);
        }

        close();
    };

    // Максимальное количество = количество людей, прошедших валидацию *1.5 - количество уже покормленных. Но не меньше нуля!
    const maxCountOther = Math.max(Math.round(volsToFeed.length * 1.5) - alreadyFedTransactions.length, 0);

    const amountToFeed = showOtherCount
        ? vegansCount + nonVegansCount
        : Math.max(volsToFeed.length - alreadyFedTransactions.length, 0);

    return (
        <div className={css.groupBadgeCard}>
            <WarningPartiallyFedModal
                alreadyFedTransactions={alreadyFedTransactions}
                setShowModal={setIsWarningModalShown}
                doFeedAnons={(value: { vegansCount: number; nonVegansCount: number }) => {
                    doFeedAnons(value);
                    close();
                }}
                greenVols={validationGroups.greens}
                showModal={isWarningModalShown}
            />
            <GroupBadgeInfo name={name} volsToFeed={volsToFeed} />

            {reds.length > 0 && (
                <div className={css.volunteerList}>
                    <Text>
                        <b>Без порции: </b>
                        {reds
                            .filter((vol) => vol.isActivated)
                            .map((vol) => vol.name)
                            .join(', ')}
                    </Text>
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
