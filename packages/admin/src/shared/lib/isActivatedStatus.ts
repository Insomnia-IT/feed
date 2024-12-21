export function isActivatedStatus(status: string): boolean {
    return ['ARRIVED', 'STARTED', 'JOINED'].includes(status);
}
