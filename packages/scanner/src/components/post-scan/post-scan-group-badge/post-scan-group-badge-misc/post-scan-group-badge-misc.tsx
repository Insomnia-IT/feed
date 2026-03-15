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
import { calculateAlreadyFedCount } from '~/components/post-scan/post-scan.utils';

import type { ValidatedVol, ValidationGroups } from '../post-scan-group-badge.lib';
import { NotFeedListModalTrigger } from '../not-feed-list-modal/not-feed-list-modal';

import css from './post-scan-group-badge-misc.module.css';

export const GroupBadgeInfo: FC<{
    name: string;
    volsToFeed: Array<Volunteer>;
}> = ({ name, volsToFeed }) => {
    return (
        <div className={css.info}>
            <Title>Групповой бейдж</Title>
            <div className={css.detail}>
                <Text>
                    Вы отсканировали групповой бейдж “{name}” ({volsToFeed.length}):
                </Text>
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
}> = ({ alreadyFedTransactions, close, doFeedAnons, name, validationGroups }) => {
    const { greens, reds } = validationGroups;
    const volsToFeed = [...greens];

    const calculateDefaultFeedCount = (isVegan: boolean) => {
        const alreadyFedCount = calculateAlreadyFedCount(
            alreadyFedTransactions.filter((t) => Boolean(t.is_vegan) === isVegan)
        );
        const volsToFeedCount = volsToFeed.filter((v) => Boolean(v.is_vegan) === isVegan).length;
        return Math.max(volsToFeedCount - alreadyFedCount, 0);
    };

    const [vegansCount, setVegansCount] = useState<number>(() => calculateDefaultFeedCount(true));
    const [nonVegansCount, setNonVegansCount] = useState<number>(() => calculateDefaultFeedCount(false));
    const [isWarningModalShown, setIsWarningModalShown] = useState(false);

    const handleFeed = (): void => {
        if (typeof vegansCount === 'string' || typeof nonVegansCount === 'string') {
            alert('введено некорректное значение');

            return;
        }

        doFeedAnons({ vegansCount, nonVegansCount });

        close();
    };

    alreadyFedTransactions.filter((t) => t.is_vegan);

    const amountToFeed = Number(vegansCount) + Number(nonVegansCount);

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
