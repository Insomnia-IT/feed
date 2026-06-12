import { useVolunteerFormReadinessContext } from './volunteer-form-readiness-context';

type UseVolunteerFormBaselineReadyParams = {
    formLoading: boolean;
    feedTypesLoading: boolean;
    feedTypesCount: number;
};

export const useVolunteerFormBaselineReady = ({
    formLoading,
    feedTypesLoading,
    feedTypesCount
}: UseVolunteerFormBaselineReadyParams): boolean => {
    const { allGatesReady, hasRegisteredGates } = useVolunteerFormReadinessContext();

    const feedTypesReady = !feedTypesLoading && feedTypesCount > 0;
    const coreDataReady = !formLoading && feedTypesReady;

    return coreDataReady && hasRegisteredGates && allGatesReady;
};
