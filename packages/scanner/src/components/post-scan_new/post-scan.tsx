import type { FC } from 'react';
import { memo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '~/db';
import { ErrorMsg } from '~/components/misc/misc';
import { PostScanVol } from './post-scan-vol';
import { PostScanGroupBadge } from './post-scan-group-badge';

export const PostScan: FC<{
    qrcode: string;
    closeFeed: () => void;
}> = memo(({ closeFeed, qrcode }) => {
    const vol = useLiveQuery(async () => await db.volunteers.where('qr').equals(qrcode).first(), [qrcode]);
    const groupBadge = useLiveQuery(async () => await db.groupBadges.where('qr').equals(qrcode).first(), [qrcode]);

    if (vol) return <PostScanVol qrcode={qrcode} vol={vol} closeFeed={closeFeed} />;
    else if (groupBadge) return <PostScanGroupBadge qrcode={qrcode} groupBadge={groupBadge} closeFeed={closeFeed} />;
    else return <ErrorMsg close={closeFeed} msg={`Бейдж не найден: ${qrcode}`} />;
});
PostScan.displayName = 'PostScan';
