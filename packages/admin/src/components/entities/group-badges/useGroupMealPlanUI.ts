import { useState, useCallback } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { type MealTypeKey } from './useGroupMealPlanData';

interface SelectedCell {
    date: Dayjs;
    dateStr: string;
    mealType: string;
    mealTypeKey: MealTypeKey;
    amount_meat: number | null;
    amount_vegan: number | null;
}

interface UseGroupMealPlanUIReturn {
    today: Dayjs;
    modalOpen: boolean;
    modalType: 'edit' | 'readonly';
    selectedCell: SelectedCell | null;
    editMeat: number | null;
    editVegan: number | null;
    readonlyMessage: string;
    handleCellClick: (
        date: Dayjs,
        mealType: string,
        mealTypeKey: MealTypeKey,
        meals: { amount_meat: number | null; amount_vegan: number | null },
        editable: boolean,
        message?: string
    ) => void;
    handleModalClose: () => void;
    handleSave: () => void;
    setEditMeat: (value: number | null) => void;
    setEditVegan: (value: number | null) => void;
    setModalOpen: (open: boolean) => void;
    setSelectedCell: (cell: SelectedCell | null) => void;
}

const DEFAULT_READONLY_MESSAGE = 'Редактирование недоступно';

export const useGroupMealPlanUI = (
    onSave: (date: Dayjs, mealTypeKey: MealTypeKey, editMeat: number | null, editaVegan: number | null) => void
): UseGroupMealPlanUIReturn => {
    const today = dayjs();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'edit' | 'readonly'>('edit');
    const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
    const [editMeat, setEditMeat] = useState<number | null>(null);
    const [editVegan, setEditVegan] = useState<number | null>(null);
    const [readonlyMessage, setReadonlyMessage] = useState<string>('');

    const handleCellClick = useCallback(
        (
            date: Dayjs,
            mealType: string,
            mealTypeKey: MealTypeKey,
            meals: { amount_meat: number | null; amount_vegan: number | null },
            editable: boolean,
            message?: string
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
            setEditVegan(meals.amount_vegan);

            if (editable) {
                setModalType('edit');
                setReadonlyMessage('');
            } else {
                setModalType('readonly');
                setReadonlyMessage(message || DEFAULT_READONLY_MESSAGE);
            }

            setModalOpen(true);
        },
        []
    );

    const handleModalClose = useCallback(() => {
        setModalOpen(false);
        setSelectedCell(null);
        setReadonlyMessage('');
    }, []);

    const handleSave = useCallback(() => {
        if (!selectedCell) {
            return;
        }

        if ((editMeat !== null && editMeat < 0) || (editVegan !== null && editVegan < 0)) {
            return;
        }

        onSave(selectedCell.date, selectedCell.mealTypeKey, editMeat, editVegan);
        handleModalClose();
    }, [selectedCell, editMeat, editVegan, onSave, handleModalClose]);

    return {
        today,
        modalOpen,
        modalType,
        selectedCell,
        editMeat,
        editVegan,
        readonlyMessage,
        handleCellClick,
        handleModalClose,
        setEditMeat,
        setEditVegan,
        handleSave,
        setModalOpen,
        setSelectedCell
    };
};
