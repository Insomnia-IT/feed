import type { FC } from 'react';

import { CardContainer } from '~/components/post-scan-cards/ui/card-container/card-container';
import { Button } from '~/shared/ui/button/button';
import { Text, Title } from '~/shared/ui/typography';
import { VolInfo } from '~/components/post-scan-cards/vol-info/vol-info';
import type { Volunteer } from '~/db';

import css from './feed-error-card.module.css';

export const FeedErrorCard: FC<{
    msg: string | Array<string>;
    doNotFeed?: (reason: string) => void;
    close: () => void;
    vol: Volunteer;
}> = ({ close, doNotFeed, msg, vol }) => {
    const handleClose = (): void => {
        if (doNotFeed) {
            if (msg instanceof Array) {
                msg = msg.join(', ');
            }
            doNotFeed(msg);
        }
        close();
    };

    let errorMessage = msg;
    if (Array.isArray(msg) && msg.length === 1) {
        errorMessage = msg[0];
    }

    return (
        <CardContainer cardColor='red'>
            <div className={css.errorCard}>
                <div className={css.info}>
                    <Title color='white'>Отказано</Title>
                    {Array.isArray(errorMessage) && (
                        <div className={css.errorList}>
                            {errorMessage.map((m, index) => (
                                <Text color='white' key={m}>
                                    {index + 1}. {m}
                                    <br />
                                </Text>
                            ))}
                            <br />
                            <Text color='white'>Oтправьте волонтера в бюро за дополнительной информацией</Text>
                        </div>
                    )}
                    {!Array.isArray(errorMessage) && (
                        <div>
                            <Text color='white'>{errorMessage}</Text>
                            <br />
                            <Text color='white'>Oтправьте волонтера в бюро за дополнительной информацией</Text>
                        </div>
                    )}
                    <VolInfo vol={vol} />
                </div>
                <div className={css.buttonsBlock}>
                    <Button variant='alternative' onClick={() => handleClose()}>
                        Закрыть
                    </Button>
                </div>
            </div>
        </CardContainer>
    );
};
