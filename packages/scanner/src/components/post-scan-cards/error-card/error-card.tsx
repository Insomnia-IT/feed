import type { FC } from 'react';

import css from '~/components/misc/misc.module.css';
import { CardContainer } from '~/components/post-scan-cards/ui/card-container/card-container';

export const ErrorCard: FC<{
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
        <CardContainer>
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
                <div className={css.cardDefault}>
                    <button type='button' onClick={() => handleClose()}>
                        Закрыть
                    </button>
                </div>
            </div>
        </CardContainer>
    );
};
