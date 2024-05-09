import type { FC } from 'react';

import type { Volunteer } from '~/db';
import css from '~/components/misc/misc.module.css';
import { VolInfo } from '~/components/post-scan-cards/vol-info/vol-info';
import { CardContainer } from '~/components/post-scan-cards/ui/card-container/card-container';

export const WarningCard: FC<{
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
        <CardContainer>
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
            <div className={css.cardDefault}>
                <button type='button' onClick={() => doFeed(undefined, msg.join(', '))}>
                    Все равно кормить
                </button>
                <button type='button' onClick={() => handleClose()}>
                    Отмена
                </button>
            </div>
        </CardContainer>
    );
};
