import type { FC } from 'react';
import { memo, useState } from 'react';

import { useScan } from 'model/scan-provider/scan-provider';
import { FeedAnonCard, FeedCard, FeedWarningCard } from 'components/post-scan/post-scan-cards';
import { FeedErrorCard } from 'components/post-scan/post-scan-cards/feed-error-card/feed-error-card';
import { useFeedVol, validateVol } from 'components/post-scan/post-scan.utils';
import { useApp } from 'model/app-provider';
import { FeedAnonGroupCard } from 'components/post-scan/post-scan-cards/feed-anon-group-card/feed-anon-group-card';
import { MealTime } from 'db';

enum AvailViews {
    SingleVolunteerError = 'vol-error',
    SingleVolunteerWarning = 'vol-warning',
    SingleVolunteerFeed = 'vol-feed',
    SingleVolunteerAnon = 'anon',
    VolunteerAnonGroup = 'anon-group'
}

/**
 * Функция возвращает тип экрана для отрисовки и список ошибок в случае ошибочного экрана
 * */
type InitialScreenStateParams = {
    kitchenId: number;
    mealTime: MealTime | null;
    qrcode: string;
    vol?: any;
    volTransactions?: any;
};

const getInitialScreenState = ({
    kitchenId,
    mealTime,
    qrcode,
    vol,
    volTransactions
}: InitialScreenStateParams): { view: AvailViews; errors: Array<string> } => {
    let view = AvailViews.SingleVolunteerAnon;
    let errors: Array<string> = [];

    if (qrcode === 'anon') {
        view = AvailViews.SingleVolunteerAnon;
    }

    if (vol && volTransactions) {
        const { isRed, msg } = validateVol({ vol, volTransactions, kitchenId, mealTime });

        if (msg?.length) {
            view = isRed ? AvailViews.SingleVolunteerError : AvailViews.SingleVolunteerWarning;
            errors = msg;
        } else {
            view = AvailViews.SingleVolunteerFeed;
        }
    }

    return { view, errors };
};

export const PostScan: FC = memo(() => {
    const { kitchenId, mealTime } = useApp();
    const { handleCloseCard, qrcode, vol, volTransactions } = useScan();

    const { errors, view } = getInitialScreenState({ kitchenId, mealTime, qrcode, vol, volTransactions });

    const [postScanView, setPostScanView] = useState<AvailViews>(view);

    const { doFeed, doNotFeed } = useFeedVol(vol, mealTime, handleCloseCard, kitchenId);

    return (
        <>
            {postScanView === AvailViews.SingleVolunteerAnon && (
                <FeedAnonCard
                    close={handleCloseCard}
                    doFeed={doFeed}
                    onClickFeedGroup={() => {
                        setPostScanView(AvailViews.VolunteerAnonGroup);
                    }}
                />
            )}
            {postScanView === AvailViews.VolunteerAnonGroup && <FeedAnonGroupCard close={handleCloseCard} />}
            {postScanView === AvailViews.SingleVolunteerFeed && vol && (
                <FeedCard doFeed={doFeed} close={handleCloseCard} vol={vol} />
            )}
            {postScanView === AvailViews.SingleVolunteerWarning && vol && (
                <FeedWarningCard close={handleCloseCard} doFeed={doFeed} doNotFeed={doNotFeed} vol={vol} msg={errors} />
            )}
            {postScanView === AvailViews.SingleVolunteerError && vol && (
                <FeedErrorCard close={handleCloseCard} doNotFeed={doNotFeed} msg={errors} vol={vol} />
            )}
        </>
    );
});

PostScan.displayName = 'PostScan';
