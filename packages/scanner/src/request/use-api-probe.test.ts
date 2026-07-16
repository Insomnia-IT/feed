import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));

describe('bounded API probe', () => {
    beforeEach(() => vi.resetModules());

    it('distinguishes browser offline without a request', async () => {
        vi.stubGlobal('navigator', { onLine: false });
        const { probeApi } = await import('./use-api-probe');
        expect(await probeApi()).toBe('browser_offline');
        expect(axios.get).not.toHaveBeenCalled();
    });

    it('reports API available and uses a three second timeout', async () => {
        vi.stubGlobal('navigator', { onLine: true });
        vi.mocked(axios.get).mockResolvedValueOnce({});
        const { probeApi } = await import('./use-api-probe');
        expect(await probeApi()).toBe('api_available');
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/health/live'), { timeout: 3000 });
    });

    it('distinguishes local network from unavailable API', async () => {
        vi.stubGlobal('navigator', { onLine: true });
        vi.mocked(axios.get).mockRejectedValueOnce(new Error('synthetic'));
        const { probeApi } = await import('./use-api-probe');
        expect(await probeApi()).toBe('api_unavailable');
    });
});
