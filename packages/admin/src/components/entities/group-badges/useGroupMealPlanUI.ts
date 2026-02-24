import { useState, useCallback } from 'react';
import dayjs, { type Dayjs } from 'dayjs';

interface SelectedCell {
    date: Dayjs;
    dateStr: string;
    mealType: string;
    mealTypeKey: 'breakfast' | 'lunch' | 'dinner';
    amount_meat: number | null;
    amount_vegan: number | null;
}

interface UseGroupMealPlanUIReturn {
    today: Dayjs;
    modalOpen: boolean;
    selectedCell: SelectedCell | null;
    editMeat: number | null;
    editaVegan: number | null;
    handleCellClick: (
        date: Dayjs,
        mealType: string,
        mealTypeKey: 'breakfast' | 'lunch' | 'dinner',
        meals: { amount_meat: number | null; amount_vegan: number | null }
    ) => void;
    handleModalClose: () => void;
    handleSave: () => void;
    setEditMeat: (value: number | null) => void;
    setEditaVegan: (value: number | null) => void;
    setModalOpen: (open: boolean) => void;
    setSelectedCell: (cell: SelectedCell | null) => void;
}

export const useGroupMealPlanUI = (
    onSave: (
        date: Dayjs,
        mealTypeKey: 'breakfast' | 'lunch' | 'dinner',
        editMeat: number | null,
        editaVegan: number | null
    ) => void
): UseGroupMealPlanUIReturn => {
    const today = dayjs();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
    const [editMeat, setEditMeat] = useState<number | null>(null);
    const [editaVegan, setEditaVegan] = useState<number | null>(null);

    const handleCellClick = useCallback(
        (
            date: Dayjs,
            mealType: string,
            mealTypeKey: 'breakfast' | 'lunch' | 'dinner',
            meals: { amount_meat: number | null; amount_vegan: number | null }
        ) => {
            setSelectedCell({
                date,
                dateStr: date.format('DD.MM.YYYY'),
                mealType,
                mealTypeKey,
                amount_meat: meals.amount_meat,
                amount_vegan: meals.amount_vegan
            });
            setEditMeat(meals.amount_meat);
            setEditaVegan(meals.amount_vegan);
            setModalOpen(true);
        },
        []
    );

    const handleModalClose = useCallback(() => {
        setModalOpen(false);
        setSelectedCell(null);
    }, []);

    const handleSave = useCallback(() => {
        if (!selectedCell) return;
        if ((editMeat !== null && editMeat < 0) || (editaVegan !== null && editaVegan < 0)) return;

        onSave(selectedCell.date, selectedCell.mealTypeKey, editMeat, editaVegan);
        handleModalClose();
    }, [selectedCell, editMeat, editaVegan, onSave, handleModalClose]);

    return {
        today,
        modalOpen,
        selectedCell,
        editMeat,
        editaVegan,
        handleCellClick,
        handleModalClose,
        setEditMeat,
        setEditaVegan,
        handleSave,
        setModalOpen,
        setSelectedCell
    };
};
