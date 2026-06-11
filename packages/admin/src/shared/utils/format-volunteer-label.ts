import type { VolEntity } from 'interfaces';

/**
 * Formats a volunteer's name for display in select dropdowns and labels.
 * Shows full name (last + first) with badge name in parentheses if available.
 *
 * @param volunteer - The volunteer entity to format
 * @returns Formatted label string
 *
 * @example
 * // Returns "Иванов Иван (Позывной)"
 * formatVolunteerLabel({ last_name: 'Иванов', first_name: 'Иван', name: 'Позывной' })
 *
 * @example
 * // Returns "Иванов Иван" (no badge name)
 * formatVolunteerLabel({ last_name: 'Иванов', first_name: 'Иван' })
 *
 * @example
 * // Returns "Позывной" (no full name)
 * formatVolunteerLabel({ name: 'Позывной' })
 *
 * @example
 * // Returns "ID 123" (fallback)
 * formatVolunteerLabel({ id: 123 })
 */
export const formatVolunteerLabel = (volunteer: VolEntity): string => {
    const fullName = [volunteer.last_name, volunteer.first_name].filter(Boolean).join(' ');
    const badgeLabel = volunteer.name;

    if (fullName) {
        return badgeLabel ? `${fullName} (${badgeLabel})` : fullName;
    }

    return badgeLabel || `ID ${volunteer.id}`;
};
