import { describe, expect, it } from 'vitest';
import {
    evaluateChangeEligibility,
    validateCreateForm,
    validateRequestedKwh,
    validateSlotStart,
} from './reservationRules';

const policy = { bookingWindowDays: 7, minimumNoticeHours: 12 };
const now = new Date('2026-10-16T10:00:00Z');

describe('reservation rules', () => {
    it('rejects a slot that has already started', () => {
        const result = validateSlotStart('2026-10-16T09:00:00Z', now, policy);

        expect(result).toEqual({
            valid: false,
            message: 'Slot already started: bookings are only accepted for slots that start in the future.',
        });
    });

    it('rejects a slot outside the booking window', () => {
        const result = validateSlotStart('2026-10-24T10:00:00Z', now, policy);

        expect(result.valid).toBe(false);
        expect(result.message).toContain('7 days in advance');
    });

    it('rejects energy greater than available slot capacity', () => {
        const result = validateRequestedKwh(25, 20);

        expect(result.valid).toBe(false);
        expect(result.message).toContain('only 20 kWh');
    });

    it('rejects a create form when direction is not supported', () => {
        const result = validateCreateForm(
            {
                prosumerNic: '123456789V',
                stationId: 'station-id',
                slotId: 'slot-id',
                direction: 'Draw',
                requestedKwh: 10,
            },
            {
                startTime: '2026-10-16T14:00:00Z',
                supportedDirections: ['Inject'],
                capacityKwh: 50,
                reservedKwh: 0,
            },
            now,
            policy,
        );

        expect(result.valid).toBe(false);
        expect(result.errors.direction).toContain('does not accept Draw');
    });

    it('rejects changes inside the minimum notice period', () => {
        const result = evaluateChangeEligibility(
            {
                status: 'Approved',
                canModify: true,
                slotStartUtc: '2026-10-16T20:00:00Z',
            },
            now,
            policy,
        );

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('at least 12 hours');
    });
});
