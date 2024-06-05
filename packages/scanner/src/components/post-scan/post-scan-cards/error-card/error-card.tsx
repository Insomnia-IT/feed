import type { FC } from 'react';

import { CardContainer } from '~/components/post-scan/post-scan-cards/ui/card-container/card-container';
import { Button } from '~/shared/ui/button';
import { Text, Title } from '~/shared/ui/typography';

import css from './error-card.module.css';

export const ErrorCard: FC<{
    title?: string;
    msg: string;
    doNotFeed?: (reason: string) => void;
    close: () => void;
}> = ({ close, msg = 'Бейдж не найден', title = 'Ошибка сканирования' }) => {
    return (
        <CardContainer className={css.errorCard}>
            <div className={css.info}>
                <Title>{title}</Title>
                <Text className={css.text}>{msg}</Text>
            </div>
            <div className={css.buttonsBlock}>
                <Button variant='secondary' onClick={close}>
                    Закрыть
                </Button>
            </div>
        </CardContainer>
    );
};
