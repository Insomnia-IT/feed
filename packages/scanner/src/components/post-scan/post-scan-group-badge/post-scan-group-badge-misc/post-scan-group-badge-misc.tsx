import { FC, useCallback } from 'react';
import cs from 'classnames';

import type { Volunteer } from '~/db';
import { ValidatedVol, ValidationGroups } from '../post-scan-group-badge.lib';
import { getAllVols } from '../post-scan-group-badge.utils';
import css from './post-scan-group-badge-misc.module.css';
import { ErrorMsg } from '~/components/misc';

type TitleColor = 'red' | 'green';

const VolunteerList: FC<{
    title: string;
    vols: Array<Volunteer>;
    color?: TitleColor;
}> = ({ color, title, vols }) => (
    <div className={css.volunteerList}>
        <div className={css.volonteerListItem}>
            <span className={cs(css.title, color && css[color])}>{`${title}:`}</span>
            <span>{vols[0].nickname}</span>
        </div>
        {vols.length > 1 &&
            vols.slice(1).map((vol) => (
                <div key={vol.id} className={css.volonteerListItem}>
                    <span>{vol.nickname}</span>
                </div>
            ))}
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
        <div className={css.groupBadgeInfo}>
            <div>
                <span>({name})</span>
            </div>
            <div className={css.total}>
                <span>{`Порций: ${_volsToFeed.length}`}</span>
            </div>
            <div className={css.feedTypeInfo}>
                <span>{`Веган: ${_volsToFeed.filter((vol) => vol.is_vegan).length}`}</span>
                <span>{`Мясоед: ${_volsToFeed.filter((vol) => !vol.is_vegan).length}`}</span>
            </div>
            {volsToFeed && (
                <div className={css.fact}>
                    <span>{`Номинал бейджа: ${vols.length}(М${totalMeats}/В${totalVegs})`}</span>
                </div>
            )}
        </div>
    );
};

export const GroupBadgeGreenCard: FC<{
    name: string;
    volsToFeed: Array<ValidatedVol>;
    doFeed: (vols: Array<ValidatedVol>) => void;
    close: () => void;
}> = ({ close, doFeed, name, volsToFeed }) => (
    <>
        <GroupBadgeInfo name={name} vols={volsToFeed} />

        <div className={css.card}>
            <button
                type='button'
                onClick={() => {
                    doFeed(volsToFeed);

                    close();
                }}
            >
                Кормить
            </button>
            <button type='button' onClick={close}>
                Отмена
            </button>
        </div>
    </>
);

export const GroupBadgeYellowCard: FC<{
    name: string;
    validationGroups: ValidationGroups;
    doFeed: (vols: Array<ValidatedVol>) => void;
    doNotFeed: (vols: Array<ValidatedVol>) => void;
    close: () => void;
}> = ({ close, doFeed, doNotFeed, name, validationGroups }) => {
    const { greens, reds, yellows } = validationGroups;
    const volsToFeed = [...greens, ...yellows];

    return (
        <>
            <GroupBadgeInfo name={name} vols={getAllVols(validationGroups)} volsToFeed={volsToFeed} />

            {yellows.length > 0 && <VolunteerList title='В долг' vols={yellows} />}
            {reds.length > 0 && <VolunteerList color='red' title='Не поест' vols={reds} />}

            <div className={css.card}>
                <button
                    type='button'
                    onClick={() => {
                        doFeed(volsToFeed);
                        doNotFeed(reds);

                        close();
                    }}
                >
                    Все равно кормить
                </button>
                <button
                    type='button'
                    onClick={() => {
                        doNotFeed([...reds, ...yellows]);

                        close();
                    }}
                >
                    Отмена
                </button>
            </div>
        </>
    );
};

export const GroupBadgeRedCard: FC<{
    msg: string;
    volsNotToFeed: Array<ValidatedVol>;
    doNotFeed: (vols: Array<ValidatedVol>) => void;
    close: () => void;
}> = ({ close, doNotFeed, msg, volsNotToFeed }) => {
    const handleClose = useCallback(() => {
        doNotFeed(volsNotToFeed);

        close();
    }, [close, doNotFeed, volsNotToFeed]);

    return <ErrorMsg msg={msg} close={handleClose} />;
};
