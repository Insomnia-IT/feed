import type { VolEntity } from 'interfaces';

export type SelectionDragMode = 'select' | 'deselect';

export const mergeVolunteersIntoSelection = (params: {
    current: VolEntity[];
    volunteers: VolEntity[];
}): VolEntity[] => {
    const { current, volunteers } = params;
    const byId = new Map(current.map((vol) => [vol.id, vol]));
    for (const vol of volunteers) {
        byId.set(vol.id, vol);
    }
    return [...byId.values()];
};

export const getVolunteersInIndexRange = (params: {
    volunteers: VolEntity[];
    fromIndex: number;
    toIndex: number;
}): VolEntity[] => {
    const { volunteers, fromIndex, toIndex } = params;
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    return volunteers.slice(start, end + 1);
};

export const getSelectionDragMode = (isCurrentlySelected: boolean): SelectionDragMode =>
    isCurrentlySelected ? 'deselect' : 'select';
