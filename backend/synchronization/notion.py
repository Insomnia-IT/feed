from feeder.models import Volunteer, Gender, Direction


class NotionSync:

    def sync_from_notion(self):
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
            "notion_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            # "departments": Department.objects.filter(name__in=["Сайт", "IT"])
        }
        volunteer = Volunteer.objects.create(**data, from_sync=True)

    def sync_to_notion(self):
        pass

    def main(self):
        self.sync_from_notion()
        self.sync_to_notion()
