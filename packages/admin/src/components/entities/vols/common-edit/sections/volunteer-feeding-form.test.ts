import type { FormInstance } from 'antd';
import { describe, expect, it, vi } from 'vitest';

import { buildVolunteerSubmitValues } from './volunteer-feeding-form';

const feedTypes = [
    { id: 1, code: 'FREE', name: 'фри', paid: false, daily_amount: 4 },
    { id: 2, code: 'PAID', name: 'платно', paid: true, daily_amount: 3 },
    { id: 3, code: 'CHILD', name: 'ребенок', paid: false, daily_amount: 3 },
    { id: 4, code: 'NO', name: 'без питания', paid: true, daily_amount: 0 }
];

const createMockForm = (snapshot: Record<string, unknown>): FormInstance =>
    ({
        getFieldsValue: vi.fn(() => snapshot),
        getFieldValue: vi.fn((name: string) => snapshot[name])
    }) as unknown as FormInstance;

describe('volunteer-feeding-form', () => {
    it('passes through FREE from feed_type in form like child', () => {
        const form = createMockForm({
            feed_type: 1,
            paid_arrivals: [],
            arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-12' }]
        });

        expect(
            buildVolunteerSubmitValues({
                form,
                feedTypes,
                values: {
                    id: 1,
                    arrivals: [],
                    paid_arrivals: [],
                    feed_type: 4
                } as never
            })
        ).toEqual(
            expect.objectContaining({
                feed_type: 1,
                paid_arrivals: []
            })
        );
    });

    it('sends PAID with intervals from paid_arrivals in form', () => {
        const form = createMockForm({
            feed_type: 2,
            arrivals: [],
            paid_arrivals: [
                {
                    arrival_date: '2026-07-15',
                    departure_date: '2026-07-15',
                    is_free: true
                }
            ]
        });

        expect(
            buildVolunteerSubmitValues({
                form,
                feedTypes
            })
        ).toEqual(
            expect.objectContaining({
                feed_type: 2,
                paid_arrivals: [
                    expect.objectContaining({
                        arrival_date: '2026-07-15',
                        departure_date: '2026-07-15',
                        is_free: true
                    })
                ]
            })
        );
    });

    it('passes through CHILD from feed_type in form', () => {
        const form = createMockForm({
            feed_type: 3,
            arrivals: [{ arrival_date: '2026-06-10', departure_date: '2026-06-12' }],
            paid_arrivals: [
                {
                    arrival_date: '2026-07-01',
                    departure_date: '2026-07-01',
                    is_free: false
                }
            ]
        });

        expect(
            buildVolunteerSubmitValues({
                form,
                feedTypes
            })
        ).toEqual(
            expect.objectContaining({
                feed_type: 3,
                paid_arrivals: []
            })
        );
    });
});
