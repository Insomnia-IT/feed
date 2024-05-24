import type { FC } from 'react';

import type { Volunteer } from '~/db';
import { FeedType } from '~/db';
import { CardContainer } from '~/components/post-scan/post-scan-cards/ui/card-container/card-container';
import { Button } from '~/shared/ui/button/button';
import { Text, Title } from '~/shared/ui/typography';
import { VolAndUpdateInfo } from '~/components/vol-and-update-info';

import css from './feed-card.module.css';

export const FeedCard: FC<{
    vol: Volunteer;
    doFeed: () => void;
    close: () => void;
}> = ({ close, doFeed, vol }) => {
    const isChild = vol.feed_type === FeedType.Child;
    return (
        <CardContainer>
            <div className={css.feedCard}>
                <div className={css.info}>
                    {isChild ? (
                        <Title>
                            👶 Кормить <br /> ребенка
                        </Title>
                    ) : (
                        <Title>
                            Кормить <br /> волонтера
                        </Title>
                    )}
                    <div className={css.detail}>
                        {isChild ? (
                            <Text>Вы отсканировали бейдж ребенка:</Text>
                        ) : (
                            <Text>Вы отсканировали бейдж волонтера:</Text>
                        )}
                        <Text className={css.volInfo}>
                            {vol.name}, {vol.is_vegan ? 'веган🥦' : 'мясоед🥩'}
                        </Text>
                        {vol.directions.length === 1 && <Text>Служба: {vol.directions[0].name}</Text>}
                        {vol.directions.length > 1 && (
                            <Text>Службы: {vol.directions.map((dep) => dep.name).join(', ')}</Text>
                        )}
                    </div>
                </div>
                <div className={css.bottomBLock}>
                    <div className={css.buttonsBlock}>
                        <Button variant='secondary' onClick={close}>
                            Отмена
                        </Button>
                        <Button onClick={doFeed}>Кормить</Button>
                    </div>
                    <VolAndUpdateInfo textColor='black' />
                </div>
            </div>
        </CardContainer>
    );
};
