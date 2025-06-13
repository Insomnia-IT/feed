import { type FC, useState } from 'react';

import type { Volunteer } from '~/db';
import { CardContainer } from '~/components/post-scan/post-scan-cards/ui/card-container/card-container';
import { Button } from '~/shared/ui/button/button';
import { Text, Title } from '~/shared/ui/typography';
import { VolAndUpdateInfo } from '~/components/vol-and-update-info';
import { BureauComment } from '~/components/post-scan/post-scan-cards/ui/bureau-comment/bureau-comment';
import { CardContent } from '~/components/post-scan/post-scan-cards/ui/card-content/card-content';

import css from './feed-card.module.css';

export const FeedCard: FC<{
    vol: Volunteer;
    doFeed: () => void;
    close: () => void;
}> = ({ close, doFeed, vol }) => {
    const isChild = vol.infant;
    const [disabled, setDisabled] = useState(false);

    const handleFeed = (): void => {
        setDisabled(true);
        doFeed();
    };
    return (
        <CardContainer>
            <CardContent>
                {isChild ? (
                    <Title className={css.title}>
                        👶 Кормить <br /> ребенка
                    </Title>
                ) : (
                    <Title className={css.title}>
                        Кормить <br /> волонтера
                    </Title>
                )}
                <div className={css.detail}>
                    {isChild ? (
                        <Text>Вы отсканировали бейдж ребенка:</Text>
                    ) : (
                        <Text>Вы отсканировали бейдж волонтера:</Text>
                    )}
                    <Text className={css.volInfoLarge}>
                        {vol.name}, {vol.is_vegan ? 'веган 🥦' : 'мясоед 🥩'}
                    </Text>
                    {vol.directions.length === 1 && <Text>Служба: {vol.directions[0].name}</Text>}
                    {vol.directions.length > 1 && (
                        <Text>Службы: {vol.directions.map((dep) => dep.name).join(', ')}</Text>
                    )}
                </div>

                {vol?.scanner_comment ? <BureauComment text={vol.scanner_comment} variant='red' /> : null}
            </CardContent>
            <div className={css.bottomBLock}>
                <div className={css.buttonsBlock}>
                    <Button variant='secondary' onClick={close}>
                        Отмена
                    </Button>
                    <Button onClick={handleFeed} disabled={disabled}>
                        Кормить
                    </Button>
                </div>
                <VolAndUpdateInfo textColor='black' />
            </div>
        </CardContainer>
    );
};
