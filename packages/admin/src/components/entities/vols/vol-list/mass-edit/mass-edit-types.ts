export type ChangeMassEditField = (params: VolunteerField) => Promise<void>;

export interface VolunteerField {
    fieldName: string;
    fieldValue: string | null;
    isCustom?: boolean;
    isArrival?: boolean;
}
