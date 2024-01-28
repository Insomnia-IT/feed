import type { FC } from 'react';
import { useContext, useEffect } from 'react';

import { AppColor, AppContext } from '~/app-context';
import { GreenAnonCard } from '~/components/misc';

import { useFeedVol } from '../post-scan.utils';

export const PostScanAnon: FC<{
    closeFeed: () => void;
}> = ({ closeFeed }) => {
    const { kitchenId, mealTime, setColor } = useContext(AppContext);

    const [doFeed] = useFeedVol(undefined, mealTime, closeFeed, kitchenId);

    useEffect(() => setColor(AppColor.GREEN), []);

    return <GreenAnonCard close={closeFeed} doFeed={doFeed} />;
};
