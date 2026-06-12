import { describe, expect, it } from 'vitest';

import { areFormValuesEqual } from './serialize-form-values';

describe('serialize-form-values', () => {
    it('treats missing, null, and empty string fields as equal', () => {
        expect(areFormValuesEqual({ first_name: 'Alex' }, { first_name: 'Alex', last_name: null })).toBe(true);
        expect(areFormValuesEqual({ first_name: 'Alex' }, { first_name: 'Alex', last_name: '' })).toBe(true);
        expect(areFormValuesEqual({ first_name: 'Alex', last_name: undefined }, { first_name: 'Alex' })).toBe(true);
    });

    it('detects real value changes', () => {
        expect(areFormValuesEqual({ first_name: 'Alex' }, { first_name: 'Alexey' })).toBe(false);
    });

    it('returns to equal after reverting a typed change', () => {
        const baseline = { first_name: 'Alex', kitchen: 3 };
        const edited = { first_name: 'Alex1', kitchen: 3, last_name: undefined };
        const reverted = { first_name: 'Alex', kitchen: 3, last_name: null };

        expect(areFormValuesEqual(baseline, edited)).toBe(false);
        expect(areFormValuesEqual(baseline, reverted)).toBe(true);
    });
});
