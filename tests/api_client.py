from __future__ import annotations

import time
import requests
from typing import Optional, Any, Union, List

from constants import API_URL, API_PREFIX, API_TIMEOUT, ADMIN_LOGIN, ADMIN_PASSWORD


class ApiClient:
    def __init__(self, base_url: Optional[str] = None, timeout: int = API_TIMEOUT):
        self.base_url = (base_url or API_URL).rstrip("/")
        self.api_url = f"{self.base_url}{API_PREFIX}"
        self.timeout = timeout
        self._admin_token: Optional[str] = None
        self._default_headers: dict[str, str] = {}

    def get(self, path: str, params: Optional[dict] = None, headers: Optional[dict] = None) -> dict:
        return self._request("GET", path, params=params, headers=headers)

    def post(self, path: str, json: Optional[dict] = None, headers: Optional[dict] = None) -> dict:
        return self._request("POST", path, json=json, headers=headers)

    def patch(self, path: str, json: Optional[dict] = None, headers: Optional[dict] = None) -> dict:
        return self._request("PATCH", path, json=json, headers=headers)

    def delete(self, path: str, headers: Optional[dict] = None) -> dict:
        return self._request("DELETE", path, headers=headers)

    def get_raw(self, path: str, params: Optional[dict] = None, headers: Optional[dict] = None) -> requests.Response:
        return self._request_raw("GET", path, params=params, headers=headers)

    def post_raw(self, path: str, json: Optional[dict] = None, headers: Optional[dict] = None) -> requests.Response:
        return self._request_raw("POST", path, json=json, headers=headers)

    def patch_raw(self, path: str, json: Optional[dict] = None, headers: Optional[dict] = None) -> requests.Response:
        return self._request_raw("PATCH", path, json=json, headers=headers)

    def delete_raw(self, path: str, headers: Optional[dict] = None) -> requests.Response:
        return self._request_raw("DELETE", path, headers=headers)

    def _request(
        self,
        method: str,
        path: str,
        params: Optional[dict] = None,
        json: Optional[dict] = None,
        headers: Optional[dict] = None,
    ) -> dict:
        response = self._request_raw(method, path, params=params, json=json, headers=headers)
        response.raise_for_status()
        if response.status_code == 204:
            return {}
        return response.json()

    def _request_raw(
        self,
        method: str,
        path: str,
        params: Optional[dict] = None,
        json: Optional[dict] = None,
        headers: Optional[dict] = None,
    ) -> requests.Response:
        url = f"{self.api_url}{path}"
        merged_headers = {**self._default_headers, **(headers or {})}
        return requests.request(
            method,
            url,
            params=params,
            json=json,
            headers=merged_headers,
            timeout=self.timeout,
        )

    def authenticate_admin(self) -> str:
        """Получает и кэширует токен админа."""
        if self._admin_token is None:
            auth_response = self.post(
                "/auth/login/",
                json={"username": ADMIN_LOGIN, "password": ADMIN_PASSWORD},
            )
            self._admin_token = str(auth_response["key"])
            self._default_headers["Authorization"] = f"Token {self._admin_token}"
        return self._admin_token

    def set_auth_token(self, token: str) -> None:
        self._default_headers["Authorization"] = f"Token {token}"

    def set_qr_token(self, qr_code: str) -> None:
        self._default_headers["Authorization"] = f"V-TOKEN {qr_code}"

    def clear_auth(self) -> None:
        self._default_headers.pop("Authorization", None)

    def get_directions(self) -> list[dict]:
        return self.get("/directions/").get("results", [])

    def get_kitchens(self) -> list[dict]:
        return self.get("/kitchens/").get("results", [])

    def get_access_roles(self) -> list[dict]:
        return self.get("/access-roles/").get("results", [])

    def get_volunteer_roles(self) -> list[dict]:
        return self.get("/volunteer-roles/").get("results", [])

    def get_feed_types(self) -> list[dict]:
        return self.get("/feed-types/").get("results", [])

    def get_feed_transactions(self, params: Optional[dict] = None) -> list[dict]:
        return self.get("/feed-transaction/", params=params).get("results", [])

    def get_group_badges(self, params: Optional[dict] = None) -> list[dict]:
        return self.get("/group-badges/", params=params).get("results", [])

    def get_custom_fields(self, params: Optional[dict] = None) -> list[dict]:
        return self.get("/volunteer-custom-fields/", params=params).get("results", [])

    def create_volunteer(self, data: dict) -> dict:
        return self.post("/volunteers/", json=data)

    def update_volunteer(self, volunteer_id: Union[int, str], data: dict) -> dict:
        return self.patch(f"/volunteers/{volunteer_id}/", json=data)

    def delete_volunteer(self, volunteer_id: Union[int, str]) -> dict:
        return self.delete(f"/volunteers/{volunteer_id}/")

    def get_volunteer(self, volunteer_id: Union[int, str]) -> dict:
        return self.get(f"/volunteers/{volunteer_id}/")

    def get_volunteers_list(self, params: Optional[dict] = None) -> list[dict]:
        return self.get("/volunteers/", params=params).get("results", [])

    def set_block_state(self, volunteer_id: Union[int, str], is_blocked: bool, qr_token: Optional[str] = None) -> dict:
        headers = {"Authorization": f"V-TOKEN {qr_token}"} if qr_token else None
        return self.patch(f"/volunteers/{volunteer_id}/", json={"is_blocked": is_blocked}, headers=headers)

    def set_supervisor(self, volunteer_id: Union[int, str], supervisor_id: Union[int, str] | None) -> dict:
        return self.patch(f"/volunteers/{volunteer_id}/", json={"supervisor_id": supervisor_id})

    def get_volunteer_supervisor_name(self, volunteer_id: Union[int, str]) -> Optional[str]:
        supervisor = self.get_volunteer(volunteer_id).get("supervisor")
        return supervisor["name"] if supervisor else ""

    def get_volunteer_uuid(self, volunteer_id: Union[int, str]) -> str:
        return self.get_volunteer(volunteer_id)["uuid"]
    
    def get_volunteer_by_qr(self, qr_token: Optional[str]) -> dict:
        headers = {"Authorization": f"V-TOKEN {qr_token}"} if qr_token else None
        params = {
            "limit": 1,
            "qr": qr_token
        }
        return self.get_raw("/volunteers/", params=params, headers=headers)

    def create_group_badge(self, data: dict) -> dict:
        return self.post("/group-badges/", json=data)

    def delete_group_badge(self, badge_id: Union[int, str]) -> dict:
        return self.delete(f"/group-badges/{badge_id}/")

    def create_feed_transaction(self, data: dict) -> dict:
        return self.post("/feed-transaction/", json=data)

    def delete_feed_transaction(self, transaction_id: Union[int, str]) -> dict:
        return self.delete(f"/feed-transaction/{transaction_id}/")

    def create_custom_field(self, data: dict) -> dict:
        return self.post("/volunteer-custom-fields/", json=data)

    def delete_custom_field(self, field_id: Union[int, str]) -> dict:
        return self.delete(f"/volunteer-custom-fields/{field_id}/")

    def get_history(self, volunteer_uuid: str, params: Optional[dict] = None) -> list[dict]:
        merged = {**(params or {}), "volunteer_uuid": volunteer_uuid}
        return self.get("/history/", params=merged).get("results", [])

    def wait_for_block_history_actions(
        self,
        volunteer_uuid: str,
        expected_sequence: Optional[List[bool]] = None,
        timeout: Optional[int] = None,
    ) -> None:
        """Ждёт, пока в истории не появится ожидаемая последовательность is_blocked."""
        expected_sequence = expected_sequence or [False, True]
        deadline = time.time() + (timeout or self.timeout)
        while time.time() < deadline:
            block_history = sorted(
                (
                    item
                    for item in self.get_history(volunteer_uuid, {"limit": 100})
                    if item.get("object_name") == "volunteer" and "is_blocked" in (item.get("data") or {})
                ),
                key=lambda item: item["action_at"],
                reverse=True,
            )
            latest_values = [item["data"]["is_blocked"] for item in block_history[: len(expected_sequence)]]
            if latest_values == expected_sequence:
                return
            time.sleep(1)
        raise AssertionError(
            f"Ошибка: В истории не появились записи блокировки {expected_sequence}."
        )


