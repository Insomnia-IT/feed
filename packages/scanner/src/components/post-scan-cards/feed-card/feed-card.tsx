import type { FC } from 'react';

import type { Volunteer } from '~/db';
import { CardContainer } from '~/components/post-scan-cards/ui/card-container/card-container';
import { Button } from '~/shared/ui/button/button';
import { Text, Title } from '~/shared/ui/typography';
import { VolAndUpdateInfo } from 'src/components/vol-and-update-info';

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
                        Кормить <br /> волонтера
                    </Title>
                    <div className={css.detail}>
                        <Text>Вы отсканировали бейдж волонтера:</Text>
                        <Text className={css.volInfo}>
                            {vol.first_name}, {vol.is_vegan ? 'веган🥦' : 'мясоед🥩'}
                        </Text>
                        {vol.departments.length === 1 && <Text>Служба: {vol.departments[0].name}</Text>}
                        {vol.departments.length > 1 && (
                            <Text>Службы: {vol.departments.map((dep) => dep.name).join(', ')}</Text>
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
