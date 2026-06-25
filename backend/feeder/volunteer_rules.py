from rest_framework import serializers

from feeder import models


SUPERVISOR_ROLE_IDS = ("TEAM_LEAD", "ORGANIZER", "VICE")
DIRECTION_HEAD_EDITABLE_ROLE_IDS = ("VOLUNTEER", "TEAM_LEAD")
DIRECTION_HEAD_ACCESS_ROLE_ID = "DIRECTION_HEAD"


def get_request_volunteer(user):
    if not getattr(user, "is_volunteer", False):
        return None

    volunteer_uuid = getattr(user, "uuid", None)
    if volunteer_uuid:
        return models.Volunteer.objects.filter(uuid=volunteer_uuid).first()

    volunteer_id = getattr(user, "id", None)
    if volunteer_id:
        return models.Volunteer.objects.filter(pk=volunteer_id).first()

    return None


def is_direction_head(user):
    access_role = getattr(user, "access_role", None)
    return getattr(access_role, "pk", access_role) == DIRECTION_HEAD_ACCESS_ROLE_ID


def get_direction_ids(volunteer):
    if not volunteer:
        return set()
    return set(volunteer.directions.values_list("id", flat=True))


def have_shared_direction(first_direction_ids, second_direction_ids):
    return bool(set(first_direction_ids) & set(second_direction_ids))


def get_supervisor_candidates(direction_ids):
    if not direction_ids:
        return models.Volunteer.objects.none()

    return (
        models.Volunteer.objects.filter(
            deleted_at=None,
            main_role_id__in=SUPERVISOR_ROLE_IDS,
            directions__id__in=direction_ids,
        )
        .distinct()
    )


def validate_supervisor(supervisor, target_direction_ids, target_id=None):
    if target_id is not None and supervisor.pk == target_id:
        raise serializers.ValidationError(
            {"supervisor_id": "Нельзя назначить волонтёра бригадиром самому себе."}
        )

    if supervisor.main_role_id not in SUPERVISOR_ROLE_IDS:
        raise serializers.ValidationError(
            {"supervisor_id": "У выбранного бригадира неподходящая роль."}
        )

    supervisor_direction_ids = get_direction_ids(supervisor)
    if not have_shared_direction(target_direction_ids, supervisor_direction_ids):
        raise serializers.ValidationError(
            {"supervisor_id": "Бригадир должен состоять хотя бы в одной общей службе с волонтёром."}
        )


def validate_direction_head_changes(*, user, instance, attrs):
    if not is_direction_head(user):
        return

    actor = get_request_volunteer(user)
    if not actor:
        raise serializers.ValidationError(
            {"permission": "Не удалось определить волонтёра текущего пользователя."}
        )

    actor_direction_ids = get_direction_ids(actor)
    target_direction_ids = get_direction_ids(instance)

    if "directions" in attrs:
        requested_direction_ids = {direction.id for direction in attrs["directions"]}
        if requested_direction_ids != target_direction_ids:
            raise serializers.ValidationError(
                {"directions": "Руководитель службы не может менять службы волонтёра."}
            )

    if "access_role" in attrs:
        requested_access_role_id = getattr(attrs["access_role"], "pk", None)
        if requested_access_role_id != instance.access_role_id:
            raise serializers.ValidationError(
                {"access_role": "Руководитель службы не может менять права доступа волонтёра."}
            )

    requested_main_role_id = getattr(attrs.get("main_role"), "pk", None)
    if "main_role" not in attrs or requested_main_role_id == instance.main_role_id:
        return

    if not have_shared_direction(actor_direction_ids, target_direction_ids):
        raise serializers.ValidationError(
            {"main_role": "Нельзя менять роль волонтёра из другой службы."}
        )

    role_transition = {instance.main_role_id, requested_main_role_id}
    if role_transition != set(DIRECTION_HEAD_EDITABLE_ROLE_IDS):
        raise serializers.ValidationError(
            {"main_role": "Разрешено переключение только между ролями «Волонтёр» и «Бригадир»."}
        )
