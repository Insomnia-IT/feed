import type { FC } from 'react';

import { CardContainer } from '~/components/post-scan-cards/ui/card-container/card-container';
import { Button } from '~/shared/ui/button/button';

import css from './feed-anon-card.module.css';

export const FeedAnonCard: FC<{
    doFeed: (isVegan?: boolean) => void;
    close: () => void;
}> = ({ close, doFeed }) => (
    <CardContainer>
        <div className={css.feedAnonCard}>
            <div className={css.head}>
                <h1>Покормить без бейджа?</h1>
                <p>
                    Кормите Анонимов (без бейджа) в крайних случаях. Если вы не уверены, что перед вами Волонтер, лучше
                    отправьте его в Бюро
                </p>
            </div>
            <div className={css.buttonsBlock}>
                <Button className={css.feedMeatEater} onClick={() => doFeed(false)}>
                    🥩 Мясоеда
                </Button>
                <Button className={css.feedVegan} onClick={() => doFeed(true)}>
                    🥦 Вегана
                </Button>
                <Button variant='secondary' className={css.feedGroup} onClick={close}>
                    Покормить группу
                </Button>
                <Button variant='secondary' className={css.cancel} onClick={close}>
                    Отмена
                </Button>
            </div>
        </div>
    </CardContainer>
);
