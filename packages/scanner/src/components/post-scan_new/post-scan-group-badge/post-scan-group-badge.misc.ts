import {
    ValidatedVol,
    ValidationGroups
} from '~/components/post-scan_new/post-scan-group-badge/post-scan-group-badge.lib';

export const getTotalCount = (groups: ValidationGroups): number => {
    return Object.keys(groups).reduce((prev, key) => {
        return prev + (groups[key] as Array<ValidatedVol>).length;
    }, 0);
};
