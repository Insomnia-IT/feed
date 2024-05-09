import type { FC } from 'react';

import type { Volunteer } from '~/db';
import { CardContainer } from '~/components/post-scan-cards/ui/card-container/card-container';
import { Button } from '~/shared/ui/button/button';
import { Text, Title } from '~/shared/ui/typography';

import css from './feed-card.module.css';

export const FeedCard: FC<{
    vol: Volunteer;
    doFeed: () => void;
    close: () => void;
}> = ({ close, doFeed, vol }) => {
    return (
        <CardContainer>
            <div className={css.feedCard}>
                <div className={css.info}>
                    <Title>
                        {/*👶 Кормить <br /> ребенка*/}
                        Кормить <br /> волонтера
                    </Title>
                    <div className={css.detail}>
                        {/*<Text>Вы отсканировали бейдж ребенка:</Text>*/}
                        <Text className={css.volInfo}>
                            {vol.first_name}, {vol.is_vegan ? 'веган🥦' : 'мясоед🥩'}
                        </Text>
                    </div>
                </div>
                <div className={css.buttonsBlock}>
                    <Button onClick={doFeed}>Кормить</Button>
                    <Button variant='secondary' onClick={close}>
                        Отмена
                    </Button>
                </div>
            </div>
        </CardContainer>
    );
};
