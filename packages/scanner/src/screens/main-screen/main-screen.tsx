import React, { useEffect } from 'react';

import { PostScan } from '~/components/post-scan';
import { db } from '~/db';
import { Scan } from '~/components/scan';
import { useApp } from '~/model/app-provider';
import { useScan } from '~/model/scan-provider/scan-provider';
import { PostScanGroupBadge } from '~/components/post-scan/post-scan-group-badge';
import { ErrorCard } from 'src/components/post-scan/post-scan-cards';
import { ScreenWrapper } from '~/shared/ui/screen-wrapper';

export const MainScreen = React.memo(function MainScreen() {
    const { setVolCount } = useApp();
    const { errorMessage, groupBadge, handleCloseCard, view } = useScan();

    useEffect(() => {
        void db.volunteers.count().then((c) => setVolCount(c));
    }, [setVolCount]);

    return (
        <ScreenWrapper>
            {['scan', 'loading'].includes(view) && <Scan />}
            {view === 'post-scan' && <PostScan />}
            {view === 'post-scan-group-badge' && (
                <PostScanGroupBadge closeFeed={handleCloseCard} groupBadge={groupBadge!} />
            )}
            {view === 'error' && <ErrorCard close={handleCloseCard} msg={errorMessage} />}
        </ScreenWrapper>
    );
});
