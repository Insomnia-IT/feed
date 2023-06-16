import type { ValidatedVol, ValidationGroups } from './post-scan-group-badge.lib';

export const getAllVols = (groups: ValidationGroups): Array<ValidatedVol> =>
    Object.keys(groups).flatMap((key) => groups[key]);
