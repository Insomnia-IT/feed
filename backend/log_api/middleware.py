def hide_password(request_body: dict):
    for key, value in request_body.items():
        if isinstance(value, dict):
            hide_password(value)
        if "password" in key:
            request_body[key] = "***"


class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.method == "GET":
            return response

        request_body = None
        renderer_context = getattr(response, "renderer_context", {})
        request_processed = renderer_context.get("request")
        if request_processed is not None:
            request_body = getattr(request_processed, "data", request_body)

        if isinstance(request_body, dict):
            hide_password(request_body)

        log_data = {
            "user": getattr(request.user, "email", "anonymous"),
            "user_url": request.META["REMOTE_ADDR"],
            "action_flag": request.method,
            "host": request.get_host(),
            "request_path": request.get_full_path(),
            "request_body": request_body,
            "response_status": response.status_code,
        }
        # todo change check status method and create models for loging
        # if not status.is_success(response.status_code):
        #     if response.get("content-type") == "application/json":
        #         if getattr(response, "streaming", False):
        #             log_data["text_error"] = "<<<Streaming>>>"
        #         else:
        #             log_data["text_error"] = response.content
        #     else:
        #         log_data["text_error"] = "<<<Not JSON>>>"
        #
        # logger_api = LoggerAPI.objects.create(**log_data)

        return response
