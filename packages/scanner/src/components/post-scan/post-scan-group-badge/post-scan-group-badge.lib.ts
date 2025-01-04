import type { Volunteer } from '~/db';

export type ValidatedVol = Volunteer & {
    msg: Array<string>;
    isRed: boolean;
};

export type ValidationGroups = Record<'greens' | 'reds', Array<ValidatedVol>>;
