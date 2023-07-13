import dayjs from 'dayjs';
import type { FC } from 'react';

import type { Volunteer } from '~/db';
import { FeedType } from '~/db';

import css from './misc.module.css';

const dateTimeFormat = 'DD MMM HH:mm';

export type ValueOf<T> = T[keyof T];

export const isVolExpired = (vol: Volunteer): boolean => {
    return (
        !vol.active_to ||
        !vol.active_from ||
        dayjs() < dayjs(vol.active_from).startOf('day').add(7, 'hours') ||
        dayjs() > dayjs(vol.active_to).endOf('day').add(7, 'hours')
    );
};

export const LastUpdated: FC<{
    ts: number;
    count: number;
}> = ({ count, ts }) => (
    <div className={css.lastUpdated}>{`Обновлено: ${dayjs(ts).format(dateTimeFormat)} (${count})`}</div>
);

export const VolInfo: FC<{
    vol: Volunteer;
}> = ({ vol: { active_from, active_to, departments, feed_type, is_vegan, name, nickname } }) => (
    <div className={css.volInfo}>
        <div className={css.feedType}>
            {feed_type === FeedType.FT2 ? 'платно' : feed_type === FeedType.Child ? 'ребенок' : 'фри'}
        </div>
        <div>{is_vegan ? 'веган' : 'мясоед'}</div>
        <div>
            <span>
                {name} ({nickname})
            </span>
        </div>
        <div className={css.volDates}>
            {active_from && <span>{`c ${dayjs(active_from).format(dateTimeFormat)}`}</span>}
            {active_to && <span>{`по ${dayjs(active_to).format(dateTimeFormat)}`}</span>}
        </div>
        <div className={css.misc}>
            {departments && departments.length > 0 && (
                <div>Службы: {departments.map(({ name }) => name).join(', ')}</div>
            )}
        </div>
    </div>
);

export const ErrorMsg: FC<{
    msg: string | Array<string>;
    doNotFeed?: (reason: string) => void;
    close: () => void;
}> = ({ close, doNotFeed, msg }) => {
    const handleClose = (): void => {
        if (doNotFeed) {
            if (msg instanceof Array) {
                msg = msg.join(', ');
            }
            doNotFeed(msg);
        }
        close();
    };

    return (
        <div className={css.errorMsg}>
            <div>
                {Array.isArray(msg) ? (
                    msg.map((m) => (
                        <span key={m}>
                            {m}
                            <br />
                        </span>
                    ))
                ) : (
                    <span>{msg}</span>
                )}
            </div>
            <div className={css.card}>
                <button type='button' onClick={() => handleClose()}>
                    Закрыть
                </button>
            </div>
        </div>
    );
};

export const FeedLeft: FC<{
    msg: string;
}> = ({ msg }) => <div>{msg}</div>;

export const GreenCard: FC<{
    vol: Volunteer;
    doFeed: () => void;
    close: () => void;
}> = ({ close, doFeed, vol }) => (
    <>
        <VolInfo vol={vol} />
        {/* <FeedLeft msg={`Осталось: ${vol.balance}`} /> */}
        <div className={css.card}>
            <button type='button' onClick={doFeed}>
                Кормить
            </button>
            <button type='button' onClick={close}>
                Отмена
            </button>
        </div>
    </>
);

export const GreenAnonCard: FC<{
    doFeed: (isVegan?: boolean) => void;
    close: () => void;
}> = ({ close, doFeed }) => (
    <>
        {'Вы уверены, что хотите покормить анонима?'}
        <div className={css.anoncard}>
            <button type='button' onClick={() => doFeed(false)}>
                Покормить Мясоеда
            </button>
            <button type='button' onClick={() => doFeed(true)}>
                Покормить Вегана
            </button>
            <br />
            <br />
            <button type='button' onClick={close}>
                Отмена
            </button>
        </div>
    </>
);

export const YellowCard: FC<{
    vol: Volunteer;
    doFeed: (isVegan?: boolean, reason?: string) => void;
    doNotFeed: (reason: string) => void;
    close: () => void;
    msg: Array<string>;
}> = ({ close, doFeed, doNotFeed, msg, vol }) => {
    const handleClose = (): void => {
        doNotFeed(msg.join(', '));
        close();
    };

    return (
        <>
            <h4>
                {msg.map((m) => (
                    <>
                        {m}
                        <br />
                    </>
                ))}
            </h4>
            <VolInfo vol={vol} />
            {/* <FeedLeft msg={`Осталось: ${vol.balance}`} /> */}
            <div className={css.card}>
                <button type='button' onClick={() => doFeed(undefined, msg.join(', '))}>
                    Все равно кормить
                </button>
                <button type='button' onClick={() => handleClose()}>
                    Отмена
                </button>
            </div>
        </>
    );
};
