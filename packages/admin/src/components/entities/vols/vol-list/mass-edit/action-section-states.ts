export const ActionSectionStates = {
    Initial: 0,
    GroupBadge: 1,
    Arrivals: 2,
    Kitchen: 3,
    CustomFields: 4
} as const;

export type ActionSectionState = (typeof ActionSectionStates)[keyof typeof ActionSectionStates];
