from feeder.models import Gender, Volunteer


def sync_from_notion():
    data = {
        "uuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "test create vol",
        "first_name": "test",
        "last_name": "create",
        "gender": Gender.objects.get(id="MALE"),
        # "infant": True,
        "phone": "8 900 000 00 00",
        "is_vegan": True,
        "role": "ORGANIZER",
        "position": "string",
        "photo": "https://upload.wikimedia.org/wikipedia/commons/f/f5/Example_image.jpg",
        # "person": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "comment": "string",
        "notion_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
    volunteer = Volunteer(**data).save(from_sync=True)
