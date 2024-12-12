import type { FC } from 'react';
import cn from 'classnames';

import type { Volunteer } from '~/db';
import { CardContainer } from '~/components/post-scan/post-scan-cards/ui/card-container/card-container';
import { Text, Title } from '~/shared/ui/typography';
import { Button } from '~/shared/ui/button';
import { VolAndUpdateInfo } from 'src/components/vol-and-update-info';
import { getPlural } from '~/shared/lib/utils';

import type { ValidatedVol, ValidationGroups } from '../post-scan-group-badge.lib';

import css from './post-scan-group-badge-misc.module.css';

const VolunteerList: FC<{
    warningVols?: Array<Volunteer>;
    errorVols?: Array<Volunteer>;
}> = ({ errorVols, warningVols }) => (
    <div className={css.volunteerList}>
        {warningVols && warningVols.length > 0 && (
            <Text>
                <b>В долг: </b>
                {warningVols.map((vol) => vol.name).join(', ')}
            </Text>
        )}
        {errorVols && errorVols.length > 0 && (
            <Text>
                <b>Без порции: </b>
                {errorVols.map((vol) => vol.name).join(', ')}
            </Text>
        )}
    </div>
);
const GroupBadgeInfo: FC<{
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

export const GroupBadgeSuccessCard: FC<{
    name: string;
    volsToFeed: Array<ValidatedVol>;
    doFeed: (vols: Array<ValidatedVol>) => void;
    close: () => void;
}> = ({ close, doFeed, name, volsToFeed }) => {
    return (
        <CardContainer>
            <div className={css.groupBadgeCard}>
                <GroupBadgeInfo name={name} vols={volsToFeed} volsToFeed={volsToFeed} />
                <div className={css.bottomBLock}>
                    <div className={css.buttonsBlock}>
                        <Button variant='secondary' onClick={close}>
                            Отмена
                        </Button>
                        <Button
                            onClick={() => {
                                doFeed(volsToFeed);
                                close();
                            }}
                        >
                            Кормить({volsToFeed.length})
                        </Button>
                    </div>
                    <VolAndUpdateInfo textColor='black' />
                </div>
            </div>
        </CardContainer>
    );
};
export const GroupBadgeWarningCard: FC<{
    name: string;
    validationGroups: ValidationGroups;
    doFeed: (vols: Array<ValidatedVol>) => void;
    close: () => void;
}> = ({ close, doFeed, name, validationGroups }) => {
    const { greens, reds, yellows } = validationGroups;
    const volsToFeed = [...greens, ...yellows];
    const handleCancel = (): void => {
        close();
    };
    const handleFeed = (): void => {
        doFeed(volsToFeed);
        close();
    };

    return (
        <CardContainer>
            <div className={css.groupBadgeCard}>
                <GroupBadgeInfo name={name} vols={volsToFeed} volsToFeed={volsToFeed} />
                {(reds.length > 0 || yellows.length > 0) && <VolunteerList errorVols={reds} warningVols={yellows} />}
                <div className={css.bottomBLock}>
                    <div className={css.buttonsBlock}>
                        <Button variant='secondary' onClick={handleCancel}>
                            Отмена
                        </Button>
                        <Button onClick={handleFeed}>Кормить({volsToFeed.length})</Button>
                    </div>
                    <VolAndUpdateInfo textColor='black' />
                </div>
            </div>
        </CardContainer>
    );
};
