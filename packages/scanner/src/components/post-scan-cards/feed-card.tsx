import type { FC } from 'react';

import type { Volunteer } from '~/db';
import css from '~/components/misc/misc.module.css';
import { VolInfo } from '~/components/post-scan-cards/vol-info';
import { CardContainer } from '~/components/post-scan-cards/ui/card-container/card-container';

export const FeedCard: FC<{
    vol: Volunteer;
    doFeed: () => void;
    close: () => void;
}> = ({ close, doFeed, vol }) => (
    <CardContainer>
        <VolInfo vol={vol} />
        {/* <FeedLeft msg={`Осталось: ${vol.balance}`} /> */}
        <div className={css.cardDefault}>
            <button type='button' onClick={doFeed}>
                Кормить
            </button>
            <button type='button' onClick={close}>
                Отмена
            </button>
        </div>
    </CardContainer>
);
