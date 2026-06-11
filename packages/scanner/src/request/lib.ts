export interface ApiHook {
    fetching: boolean;
    error: unknown;
    data?: unknown;
    updated: number | null;
    send: (data?: unknown) => Promise<unknown> | void;
}
