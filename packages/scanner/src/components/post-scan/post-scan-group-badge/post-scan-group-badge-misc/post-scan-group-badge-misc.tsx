import type { FC } from 'react';
import { useState } from 'react';
import cn from 'classnames';

import type { Volunteer } from '~/db';
import { Text, Title } from '~/shared/ui/typography';
import { Button } from '~/shared/ui/button';
import { VolAndUpdateInfo } from 'src/components/vol-and-update-info';
import { getPlural } from '~/shared/lib/utils';
import { Input } from '~/shared/ui/input';

import type { ValidatedVol, ValidationGroups } from '../post-scan-group-badge.lib';

import css from './post-scan-group-badge-misc.module.css';

const VolunteerList: FC<{
    errorVols?: Array<Volunteer>;
}> = ({ errorVols }) => (
    <div className={css.volunteerList}>
        {errorVols && errorVols.length > 0 && (
            <Text>
                <b>Без порции: </b>
                {errorVols.map((vol) => vol.name).join(', ')}
            </Text>
        )}
    </div>
);

export const GroupBadgeInfo: FC<{
    name: string;
    vols: Array<Volunteer>;
    volsToFeed?: Array<Volunteer>;
}> = ({ name, vols, volsToFeed }) => {
    const totalVegs = vols.filter((vol) => vol.is_vegan).length;
    const totalMeats = vols.filter((vol) => !vol.is_vegan).length;

    const _volsToFeed = volsToFeed ?? vols;

    return (
        <div className={css.info}>
            <Title>Групповой бейдж</Title>
            <div className={css.detail}>
                <Text>
                    Вы отсканировали групповой бейдж “{name}” ({_volsToFeed.length}):
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
    name: string;
    validationGroups: ValidationGroups;
    doFeed: (vols: Array<ValidatedVol>) => void;
    doFeedAnons: (value: { vegansCount: number; nonVegansCount: number }) => void;
    close: () => void;
}> = ({ close, doFeed, doFeedAnons, name, validationGroups }) => {
    const { greens, reds } = validationGroups;
    const volsToFeed = [...greens];

    const [showOtherCount, setShowOtherCount] = useState(false);
    const [vegansCount, setVegansCount] = useState(0);
    const [nonVegansCount, setNonVegansCount] = useState(0);

    const handleFeed = (): void => {
        if (showOtherCount) {
            doFeedAnons({ vegansCount, nonVegansCount });
        } else {
            doFeed(volsToFeed);
        }

        close();
    };

    const amountToFeed = showOtherCount ? vegansCount + nonVegansCount : volsToFeed.length;

    return (
        <div className={css.groupBadgeCard}>
            <GroupBadgeInfo name={name} vols={volsToFeed} volsToFeed={volsToFeed} />

            {reds.length > 0 && <VolunteerList errorVols={reds} />}

            {showOtherCount ? (
                <FeedOtherCount
                    maxCount={volsToFeed.length * 1.5}
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
                alternativeText={showOtherCount ? 'Вернуться' : 'Другое число'}
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
                <Button onClick={handlePrimaryAction}>Кормить({amountToFeed})</Button>
            </div>
            {alternativeText ? (
                <Button onClick={handleAlternativeAction} variant='alternative'>
                    {alternativeText}
                </Button>
            ) : null}
            <VolAndUpdateInfo textColor='black' />
        </div>
    );
};

export const FeedOtherCount: React.FC<{
    maxCount: number;
    vegansCount: number;
    setVegansCount: (value: number) => void;
    nonVegansCount: number;
    setNonVegansCount: (value: number) => void;
}> = ({ maxCount, nonVegansCount, setNonVegansCount, setVegansCount, vegansCount }) => {
    const fixNumber = (value?: string): number => {
        if (typeof value === 'undefined') {
            return 0;
        }

        return Number(value?.replaceAll(/\D/g, ''));
    };

    return (
        <div style={{ width: '100%' }}>
            <div style={{ paddingBottom: '20px' }}>
                <b>Максимум {maxCount} суммарно</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
                <div>
                    <Text>Веганы</Text>
                    <Input
                        value={vegansCount}
                        onChange={(event) => {
                            const maxVeganCount = maxCount - nonVegansCount;
                            const value = fixNumber(event?.currentTarget?.value);
                            const isMaxCountReached = value >= maxVeganCount;

                            setVegansCount(isMaxCountReached ? maxVeganCount : value);
                        }}
                    />
                </div>
                <div>
                    <Text>Мясоеды</Text>

                    <Input
                        value={nonVegansCount}
                        onChange={(event) => {
                            const maxNonVeganCount = maxCount - vegansCount;
                            const value = fixNumber(event?.currentTarget?.value);
                            const isMaxCountReached = value >= maxNonVeganCount;

                            setNonVegansCount(isMaxCountReached ? maxNonVeganCount : value);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
