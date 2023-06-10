import { Volunteer } from '~/db';

export enum Scenarios {
    'LOADING',
    'GREEN',
    'YELLOW',
    'RED',
    'ERROR_EMPTY',
    'ERROR_VALIDATION'
}

export type ValidatedVol = {
    vol: Volunteer;
    msg: Array<string>;
    isRed: boolean;
};

export type ValidationGroups = Record<'greens' | 'yellows' | 'reds', Array<ValidatedVol>>;
