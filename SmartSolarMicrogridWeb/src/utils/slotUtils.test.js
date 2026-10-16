import { describe, expect, it } from 'vitest';
import { batteryColor, bookedPercent, formatKwh, slotDirections } from './slotUtils';

describe('slot utilities', () => {
    it('treats a slot without directions as supporting both directions', () => {
        expect(slotDirections({ supportedDirections: [] })).toEqual(['Inject', 'Draw']);
        expect(slotDirections({})).toEqual(['Inject', 'Draw']);
    });

    it('clamps booked capacity percentage between zero and one hundred', () => {
        expect(bookedPercent({ capacityKwh: 100, reservedKwh: 75 })).toBe(75);
        expect(bookedPercent({ capacityKwh: 100, reservedKwh: 150 })).toBe(100);
        expect(bookedPercent({ capacityKwh: 0, reservedKwh: 10 })).toBe(0);
    });

    it('returns the correct battery colour for status and capacity', () => {
        expect(batteryColor(30, 'Available')).toBe('bg-green-500');
        expect(batteryColor(70, 'Available')).toBe('bg-amber-500');
        expect(batteryColor(95, 'Available')).toBe('bg-red-500');
        expect(batteryColor(95, 'Closed')).toBe('bg-gray-400');
    });

    it('formats energy values to at most two decimals', () => {
        expect(formatKwh(2.567)).toBe('2.57 kWh');
        expect(formatKwh('5')).toBe('5 kWh');
    });
});
