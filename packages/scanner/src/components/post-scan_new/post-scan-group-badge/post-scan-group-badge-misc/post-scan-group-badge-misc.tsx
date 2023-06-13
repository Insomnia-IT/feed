import { FC } from 'react';
import type { Volunteer } from '~/db';
import cs from 'classnames';

import { ValidationGroups } from '../post-scan-group-badge.lib';
import { getAllVols } from '../post-scan-group-badge.utils';
import css from './post-scan-group-badge-misc.module.css';

type TitleColor = 'red' | 'green';

const TotalInfo: FC<{
    title: string;
    total: number;
    fact?: number;
}> = ({ fact, title, total }) => <span>{`${title}: ${Number.isInteger(fact) ? fact + '/' : ''}${total}`}</span>;

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

    return (
        <div className={css.groupBadgeInfo}>
            <div>
                <span>({name})</span>
            </div>
            <div className={css.feedTypeInfo}>
                <>
                    <TotalInfo
                        title='Веганов'
                        total={totalVegs}
                        fact={volsToFeed?.filter((vol) => vol.is_vegan).length}
                    />
                    <TotalInfo
                        title='Мясоедов'
                        total={totalMeats}
                        fact={volsToFeed?.filter((vol) => !vol.is_vegan).length}
                    />
                </>
            </div>
            <div>
                <TotalInfo title={'Всего порций'} total={vols.length} fact={volsToFeed?.length} />
            </div>
        </div>
    );
};

export const GroupBadgeGreenCard: FC<{
    name: string;
    volsToFeed: Array<Volunteer>;
    getDoFeed: (vols: Array<Volunteer>) => () => void;
    close: () => void;
}> = ({ close, getDoFeed, name, volsToFeed }) => (
    <>
        <GroupBadgeInfo name={name} vols={volsToFeed} />

        <div className={css.card}>
            <button type='button' onClick={getDoFeed(volsToFeed)}>
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
    getDoFeed: (vols: Array<Volunteer>) => () => void;
    getDoNotFeed: (vols: Array<Volunteer>) => () => void;
    close: () => void;
}> = ({ close, getDoFeed, getDoNotFeed, name, validationGroups }) => {
    const { greens, reds, yellows } = validationGroups;
    const volsToFeed = [...greens, ...yellows];

    return (
        <>
            <GroupBadgeInfo name={name} vols={getAllVols(validationGroups)} volsToFeed={volsToFeed} />

            {greens.length > 0 && <VolunteerList color='green' title='Поест' vols={greens} />}
            {yellows.length > 0 && <VolunteerList title='Все равно поест' vols={yellows} />}
            {reds.length > 0 && <VolunteerList color='red' title='Не поест' vols={reds} />}

            <div className={css.card}>
                <button type='button' onClick={getDoFeed(volsToFeed)}>
                    Все равно кормить
                </button>
                <button type='button' onClick={close}>
                    Отмена
                </button>
            </div>
        </>
    );
};
