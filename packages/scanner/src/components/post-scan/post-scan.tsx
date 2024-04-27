import type { FC } from 'react';
import { memo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '~/db';
import { ErrorMsg } from '~/components/misc/misc';

import { PostScanVol } from './post-scan-vol';
import { PostScanAnon } from './post-scan-anon';
import { PostScanGroupBadge } from './post-scan-group-badge';

export const PostScan: FC<{
    qrcode: string;
    closeFeed: () => void;
}> = memo(({ closeFeed, qrcode }) => {
    const vol = useLiveQuery(async () => await db.volunteers.where('qr').equals(qrcode).first(), [qrcode]);
    const groupBadge = useLiveQuery(async () => await db.groupBadges.where('qr').equals(qrcode).first(), [qrcode]);

    const isAnon = qrcode === 'anon';
    const isVol = vol;
    const isGroupBadge = groupBadge;
    const isError = !isAnon && !isVol && !isGroupBadge;

    return (
        <>
            {isAnon && <PostScanAnon closeFeed={closeFeed} />}
            {isVol && <PostScanVol qrcode={qrcode} vol={vol} closeFeed={closeFeed} />}
            {isGroupBadge && <PostScanGroupBadge groupBadge={groupBadge} closeFeed={closeFeed} />}
            {isError && <ErrorMsg close={closeFeed} msg={`Бейдж не найден: ${qrcode}`} />}
        </>
    );
});
PostScan.displayName = 'PostScan';
