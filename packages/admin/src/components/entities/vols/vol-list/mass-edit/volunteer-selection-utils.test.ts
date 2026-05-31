import { describe, expect, it } from 'vitest';

import type { VolEntity } from 'interfaces';

import {
    getSelectionDragMode,
    getVolunteersInIndexRange,
    mergeVolunteersIntoSelection
} from './volunteer-selection-utils';

const vol = (id: number): VolEntity => ({ id, name: `v${id}` }) as VolEntity;

describe('volunteer-selection-utils', () => {
    it('getSelectionDragMode toggles from current selection', () => {
        expect(getSelectionDragMode(false)).toBe('select');
        expect(getSelectionDragMode(true)).toBe('deselect');
    });

    it('getVolunteersInIndexRange returns inclusive slice', () => {
        const list = [vol(1), vol(2), vol(3), vol(4)];
        expect(getVolunteersInIndexRange({ volunteers: list, fromIndex: 3, toIndex: 1 })).toEqual([
            vol(2),
            vol(3),
            vol(4)
        ]);
    });

    it('mergeVolunteersIntoSelection unions by id', () => {
        const result = mergeVolunteersIntoSelection({
            current: [vol(1)],
            volunteers: [vol(2), vol(1)]
        });
        expect(result.map((v) => v.id).sort()).toEqual([1, 2]);
    });
});
