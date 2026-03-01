export type FilterField = {
    type: FilterFieldType;
    name: string;
    title: string;
    lookup?: () => Array<{ id: unknown; name: string }>;
    skipNull?: boolean;
    single?: boolean;
    getter?: (value: unknown) => unknown;
};

export const FilterFieldType = {
    Date: 'date',
    String: 'string',
    Custom: 'custom',
    Boolean: 'boolean',
    Lookup: 'lookup'
} as const;

export type FilterFieldType = (typeof FilterFieldType)[keyof typeof FilterFieldType];

export type FilterItem = { name: string; op: 'include' | 'exclude'; value: unknown };

export type FilterListItem = { selected: boolean; value: FilterListItemValue; text: string; count: number };

export type FilterListItemValue = Array<boolean | string> | boolean | string | unknown;
