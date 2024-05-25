import type { FC } from 'react';

import { CardContainer } from '~/components/post-scan/post-scan-cards/ui/card-container/card-container';
import { Button } from '~/shared/ui/button/button';
import { Text, Title } from '~/shared/ui/typography';
import { VolInfo } from '~/components/post-scan/post-scan-cards/vol-info/vol-info';
import type { Volunteer } from '~/db';
import { VolAndUpdateInfo } from '~/components/vol-and-update-info';
import { CardContent } from '~/components/post-scan/post-scan-cards/ui/card-content/card-content';

import css from './feed-error-card.module.css';

export const FeedErrorCard: FC<{
    msg: Array<string>;
    doNotFeed?: (reason: string) => void;
    close: () => void;
    vol: Volunteer;
}> = ({ close, doNotFeed, msg, vol }) => {
    const handleClose = (): void => {
        if (doNotFeed) {
            doNotFeed(msg.join(', '));
        }
        close();
    };

    return (
        <CardContainer className={css.errorCard} cardColor='red'>
            <CardContent>
                <Title color='white'>Отказано</Title>
                <div className={css.errorList}>
                    {msg.length > 1 && (
                        <div className={css.errorList}>
                            {msg.map((m, index) => (
                                <Text color='white' key={m}>
                                    {index + 1}. {m}
                                </Text>
                            ))}
                            <br />
                            <Text color='white'>Oтправьте волонтера в бюро за дополнительной информацией</Text>
                        </div>
                    )}
                    {msg.length === 1 && (
                        <div className={css.errorMessage}>
                            <Text color='white'>{msg}</Text>
                            <br />
                            <Text color='white'>Oтправьте волонтера в бюро за дополнительной информацией</Text>
                        </div>
                    )}
                </div>
                <VolInfo vol={vol} />
            </CardContent>
            <div className={css.bottomBLock}>
                <div className={css.buttonsBlock}>
                    <Button variant='alternative' onClick={() => handleClose()}>
                        Закрыть
                    </Button>
                </div>
                <VolAndUpdateInfo textColor='white' />
            </div>
        </CardContainer>
    );
};
