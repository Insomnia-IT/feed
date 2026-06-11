import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type MouseEvent,
    type SetStateAction
} from 'react';
import type { TableRowSelection } from 'antd/es/table/interface';

import type { VolEntity } from 'interfaces';

type RenderSelectionCell = NonNullable<TableRowSelection<VolEntity>['renderCell']>;

import { SelectionCell } from './selection-cell';
import {
    getSelectionDragMode,
    getVolunteersInIndexRange,
    mergeVolunteersIntoSelection,
    type SelectionDragMode
} from './volunteer-selection-utils';

type DragState = {
    active: true;
    mode: SelectionDragMode;
    visited: Set<number>;
};

export const useVolunteerTableSelection = ({
    selectedVols,
    setSelectedVols,
    visibleVolunteers
}: {
    selectedVols: VolEntity[];
    setSelectedVols: Dispatch<SetStateAction<VolEntity[]>>;
    visibleVolunteers: VolEntity[];
}) => {
    const [isSelectionDragging, setIsSelectionDragging] = useState(false);
    const dragRef = useRef<DragState | null>(null);
    const lastClickedIndexRef = useRef<number | null>(null);
    const selectedIds = useMemo(() => new Set(selectedVols.map((vol) => vol.id)), [selectedVols]);

    const endDrag = useCallback(() => {
        dragRef.current = null;
        setIsSelectionDragging(false);
    }, []);

    useEffect(() => {
        document.addEventListener('mouseup', endDrag);
        return () => document.removeEventListener('mouseup', endDrag);
    }, [endDrag]);

    const applyDragMode = useCallback(
        (vol: VolEntity, mode: SelectionDragMode) => {
            setSelectedVols((prev) => {
                const isSelected = prev.some((item) => item.id === vol.id);
                if (mode === 'select') {
                    return isSelected ? prev : [...prev, vol];
                }
                return isSelected ? prev.filter((item) => item.id !== vol.id) : prev;
            });
        },
        [setSelectedVols]
    );

    const applyDragToVolunteer = useCallback(
        (vol: VolEntity) => {
            const drag = dragRef.current;
            if (!drag?.active || drag.visited.has(vol.id)) {
                return;
            }

            drag.visited.add(vol.id);
            applyDragMode(vol, drag.mode);
        },
        [applyDragMode]
    );

    const selectIndexRange = useCallback(
        (fromIndex: number, toIndex: number) => {
            const range = getVolunteersInIndexRange({
                volunteers: visibleVolunteers,
                fromIndex,
                toIndex
            });

            setSelectedVols((prev) => mergeVolunteersIntoSelection({ current: prev, volunteers: range }));
        },
        [setSelectedVols, visibleVolunteers]
    );

    const createSelectionCellHandlers = useCallback(
        (params: { index: number; record: VolEntity }) => {
            const { index, record } = params;

            const onMouseDown = (event: MouseEvent<HTMLDivElement>) => {
                if (event.button !== 0) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                if (event.shiftKey && lastClickedIndexRef.current !== null) {
                    selectIndexRange(lastClickedIndexRef.current, index);
                    return;
                }

                const mode = getSelectionDragMode(selectedIds.has(record.id));
                dragRef.current = { active: true, mode, visited: new Set([record.id]) };
                setIsSelectionDragging(true);
                applyDragMode(record, mode);
                lastClickedIndexRef.current = index;
            };

            const onMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
                if (!(event.buttons & 1)) {
                    if (dragRef.current?.active) {
                        endDrag();
                    }
                    return;
                }

                applyDragToVolunteer(record);
            };

            return { onMouseDown, onMouseEnter };
        },
        [applyDragMode, applyDragToVolunteer, endDrag, selectIndexRange, selectedIds]
    );

    const renderSelectionCell: RenderSelectionCell = useCallback(
        (_checked, record, index, originNode) => {
            const rowIndex = index ?? visibleVolunteers.findIndex((vol) => vol.id === record.id);
            const handlers = createSelectionCellHandlers({ index: rowIndex, record });

            return (
                <SelectionCell onMouseDown={handlers.onMouseDown} onMouseEnter={handlers.onMouseEnter}>
                    {originNode}
                </SelectionCell>
            );
        },
        [createSelectionCellHandlers, visibleVolunteers]
    );

    return {
        isSelectionDragging,
        renderSelectionCell
    };
};
