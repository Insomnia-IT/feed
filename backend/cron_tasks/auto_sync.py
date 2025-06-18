import requests


if __name__ == "__main__":
    requests.post("http://localhost:8000/feedapi/v1/notion-sync")
    requests.post("http://localhost:8000/feedapi/v1/volunteer-photo-sync")

