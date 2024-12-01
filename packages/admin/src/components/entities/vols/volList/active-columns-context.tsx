import { createContext, useCallback, useMemo, useState } from 'react';
import {
    VolunteerFieldExtended,
    volunteerTableCommonFields
} from '~/components/entities/vols/volList/volunteer-table-common-fields';
import { CustomFieldEntity } from '~/interfaces';

export const ActiveColumnsContext = createContext<{
    toggleAll: () => void;
    toggleOne: (name: string) => void;
    activeColumns: Array<string>;
    allColumns: Array<VolunteerFieldExtended>;
} | null>(null);

const columnsStorageName = 'volVisibleColumns';

const getSavedColumns = (): Array<string> => {
    const volVisibleColumnsStr = localStorage.getItem(columnsStorageName);
    if (volVisibleColumnsStr) {
        try {
            return JSON.parse(volVisibleColumnsStr) as Array<string>;
        } catch (e) {}
    }
    return [];
};

export const ActiveColumnsContextProvider: FC<React.PropsWithChildren & { customFields: Array<CustomFieldEntity> }> = ({
    children,
    customFields
}) => {
    const [checked, setChecked] = useState<Array<string>>(getSavedColumns());
    const setCheckedWithStorage = useCallback((value: Array<string>): void => {
        setChecked(value);
        localStorage.setItem(columnsStorageName, JSON.stringify(value));
    }, []);

    const allColumns = useMemo(() => {
        const mappedCustomFields = customFields.map((customField) => {
            return {
                fieldName: customField.name,
                title: customField.name,
                isCustom: true
            };
        });

        return [...volunteerTableCommonFields, ...mappedCustomFields];
    }, [customFields]);

    const toggleOne = (value: string): void => {
        if (checked.includes(value)) {
            setCheckedWithStorage(checked.filter((item) => item != value));

            return;
        }

        setCheckedWithStorage([...checked, value]);
    };

    const toggleAll = (): void => {
        if (checked.length < allColumns.length) {
            setCheckedWithStorage(allColumns.map((item) => item.fieldName));

            return;
        }

        setCheckedWithStorage([]);
    };

    return (
        <ActiveColumnsContext.Provider value={{ toggleAll, toggleOne, activeColumns: checked, allColumns }}>
            {children}
        </ActiveColumnsContext.Provider>
    );
};
