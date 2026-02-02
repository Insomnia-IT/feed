import { createContext, type PropsWithChildren, useCallback, useMemo, useState } from 'react';

import {
    type VolunteerFieldExtended,
    volunteerTableCommonFields
} from 'components/entities/vols/vol-list/volunteer-table-common-fields';
import type { CustomFieldEntity } from 'interfaces';

export const ActiveColumnsContext = createContext<{
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
        } catch {
            /* empty */
        }
    }

    return volunteerTableCommonFields.filter((item) => item.isDefault).map((item) => item.fieldName);
};

export const ActiveColumnsContextProvider = ({
    children,
    customFields
}: PropsWithChildren & { customFields: Array<CustomFieldEntity> }) => {
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
                isCustom: true,
                customFieldId: customField.id
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

    return (
        <ActiveColumnsContext.Provider value={{ toggleOne, activeColumns: checked, allColumns }}>
            {children}
        </ActiveColumnsContext.Provider>
    );
};
