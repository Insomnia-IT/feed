import type { Volunteer } from '~/db';

export type ValidatedVol = Volunteer & {
    msg: Array<string>;
    isRed: boolean;
    isActivated: boolean;
};

export type ValidationGroups = Record<'greens' | 'reds', Array<ValidatedVol>>;

export interface GroupBadgeAnomalyMetaCategory {
    edited: boolean;
    calculatedAmount: number;
}

export interface GroupBadgeAnomalyMeta {
    vegans: GroupBadgeAnomalyMetaCategory;
    nonVegans: GroupBadgeAnomalyMetaCategory;
}

export interface GroupBadgeFeedAnonsPayload {
    vegansCount: number;
    nonVegansCount: number;
    anomalyMeta?: GroupBadgeAnomalyMeta;
}
