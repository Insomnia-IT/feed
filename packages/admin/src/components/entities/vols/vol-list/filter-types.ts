export type FilterField = {
    type: string;
    name: string;
    title: string;
    lookup?: () => Array<{ id: unknown; name: string }>;
    skipNull?: boolean;
    single?: boolean;
    getter?: (value: any) => any;
};

export type FilterItem = { name: string; op: 'include' | 'exclude'; value: unknown };

export type FilterListItem = { selected: boolean; value: unknown; text: string; count: number };
