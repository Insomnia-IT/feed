import { describe, expect, it } from 'vitest';

import {
    VOLUNTEER_COMPLETED_STATUSES,
    VOLUNTEER_NEUTRAL_STATUSES,
    VOLUNTEER_STATUSES
} from '../constants/volunteer-status';
import { getVolunteerStatusOrder, isVolunteerStatus } from './volunteer-status';

describe('volunteer-status', () => {
    it('includes PLANNED as selectable arrival status', () => {
        expect(isVolunteerStatus('PLANNED')).toBe(true);
        expect(VOLUNTEER_STATUSES).toContain('PLANNED');
    });

    it('orders positive statuses before neutral ones', () => {
        const order = getVolunteerStatusOrder(true);
        const lastPositiveIndex = Math.max(...VOLUNTEER_COMPLETED_STATUSES.map((status) => order.indexOf(status)));
        const firstNeutralIndex = Math.min(...VOLUNTEER_NEUTRAL_STATUSES.map((status) => order.indexOf(status)));

        expect(lastPositiveIndex).toBeLessThan(firstNeutralIndex);
        expect(order).toEqual([...VOLUNTEER_COMPLETED_STATUSES, ...VOLUNTEER_NEUTRAL_STATUSES]);
    });
});
