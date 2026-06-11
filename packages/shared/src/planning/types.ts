export const FeedTypeCode = {
    Free: 'FREE',
    Paid: 'PAID',
    Child: 'CHILD',
    NoFeed: 'NOFEED'
} as const;

export type FeedTypeCode = (typeof FeedTypeCode)[keyof typeof FeedTypeCode];

export interface PlanningArrival {
    arrival_date: string;
    departure_date: string;
    status?: string | null;
}

export interface PlanningPaidArrival {
    arrival_date: string;
    departure_date: string;
    is_free?: boolean | null;
}

export interface PlanningVolunteer {
    is_blocked?: boolean | null;
    is_vegan?: boolean | null;
    arrivals?: ReadonlyArray<PlanningArrival>;
    paid_arrivals?: ReadonlyArray<PlanningPaidArrival> | null;
    feed_type_code?: FeedTypeCode | string | null;
}
