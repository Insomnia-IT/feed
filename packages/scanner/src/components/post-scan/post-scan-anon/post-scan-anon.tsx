import type { FC } from 'react';
import { useEffect } from 'react';

import { AppColor } from '~/model/app-provider/app-provider';
import { GreenAnonCard } from '~/components/misc';
import { useApp } from '~/model/app-provider';

import { useFeedVol } from '../post-scan.utils';

export const PostScanAnon: FC<{
    closeFeed: () => void;
}> = ({ closeFeed }) => {
    const { kitchenId, mealTime, setColor } = useApp();

    const [doFeed] = useFeedVol(undefined, mealTime, closeFeed, kitchenId);

    useEffect(() => setColor(AppColor.GREEN), []);

    return <GreenAnonCard close={closeFeed} doFeed={doFeed} />;
};
