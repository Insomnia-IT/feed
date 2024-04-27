import type { FC } from 'react';

import { useApp } from '~/model/app-provider';
import { FeedAnonCard } from '~/components/post-scan-cards/feed-anon-card/feed-anon-card';

import { useFeedVol } from '../post-scan.utils';

export const PostScanAnon: FC<{
    closeFeed: () => void;
}> = ({ closeFeed }) => {
    const { kitchenId, mealTime } = useApp();

    const [doFeed] = useFeedVol(undefined, mealTime, closeFeed, kitchenId);

    return <FeedAnonCard close={closeFeed} doFeed={doFeed} />;
};
