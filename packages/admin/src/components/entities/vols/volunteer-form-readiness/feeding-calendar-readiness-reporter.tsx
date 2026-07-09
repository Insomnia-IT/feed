import { useVolunteerFormReadinessGate } from './use-volunteer-form-readiness-gate';
import { VOLUNTEER_FORM_READINESS_GATES } from './volunteer-form-readiness-gates';

export const FeedingCalendarReadinessReporter = ({ ready }: { ready: boolean }) => {
    useVolunteerFormReadinessGate(VOLUNTEER_FORM_READINESS_GATES.feedingCalendarSync, ready);
    return null;
};
