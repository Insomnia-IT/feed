import type { FC } from 'react';

import type { Volunteer } from '~/db';
import { VolInfo } from '~/components/post-scan/post-scan-cards/vol-info/vol-info';
import { CardContainer } from '~/components/post-scan/post-scan-cards/ui/card-container/card-container';
import { Text, Title } from '~/shared/ui/typography';
import { Button } from '~/shared/ui/button';
import { VolAndUpdateInfo } from '~/components/vol-and-update-info';
import { CardContent } from '~/components/post-scan/post-scan-cards/ui/card-content/card-content';
import { ScannerComment } from '~/components/post-scan/post-scan-cards/ui/scanner-comment/scanner-comment';
import css from './feed-warning-card.module.css';

export const FeedWarningCard: FC<{
    vol: Volunteer;
    doFeed: (isVegan?: boolean, reason?: string) => void;
    doNotFeed: (reason: string) => void;
    close: () => void;
    msg: Array<string>;
}> = ({ close, doFeed, doNotFeed, msg, vol }) => {
    const handleClose = (): void => {
        if (doNotFeed) {
            doNotFeed(msg.join(', '));
        }
        close();
    };
    const handleClickFeed = (): void => {
        doFeed(undefined, msg.join(', '));
    };

    return (
        <CardContainer cardColor='blue'>
            <CardContent>
                <Title className={css.title} color='white'>
                    ⚠️ Вы уверены?
                </Title>
                {msg.length > 1 && (
                    <div className={css.errorList}>
                        {msg.map((m, index) => (
                            <Text color='white' key={m}>
                                {index + 1}. {m}
                            </Text>
                        ))}
                        <br />
                        <Text color='white'>
                            В следующий раз волонтер получит отказ в кормлении. Oтправьте волонтера в бюро за
                            дополнительной информацией
                        </Text>
                    </div>
                )}
                {msg.length === 1 && (
                    <div>
                        <Text color='white'>{msg}</Text>
                        <br />
                        <Text color='white'>
                            В следующий раз волонтер получит отказ в кормлении. Oтправьте волонтера в бюро за
                            дополнительной информацией
                        </Text>
                    </div>
                )}
                <VolInfo vol={vol} />
                {vol?.scanner_comment ? <ScannerComment text={vol.scanner_comment} variant='white' /> : null}
            </CardContent>
            <div className={css.bottomBLock}>
                <div className={css.buttonsBlock}>
                    <Button variant='alternative' onClick={() => handleClose()}>
                        Отмена
                    </Button>
                    <Button variant='alternative' onClick={handleClickFeed}>
                        Все равно покормить
                    </Button>
                </div>
                <VolAndUpdateInfo textColor='white' />
            </div>
        </CardContainer>
    );
};
