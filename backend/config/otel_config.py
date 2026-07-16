import os
import threading
from urllib.parse import urlsplit

# Never allow deployment environment variables to turn on generic header
# capture. Authentication and cookies are not observability data.
for _capture_variable in (
    "OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_SERVER_REQUEST",
    "OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_SERVER_RESPONSE",
    "OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_CLIENT_REQUEST",
    "OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_CLIENT_RESPONSE",
):
    os.environ[_capture_variable] = ""

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.django import DjangoInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
# from opentelemetry.instrumentation.sqlite3 import SQLite3Instrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

OTEL_ENDPOINT = os.environ.get("OTEL_ENDPOINT") # http://localhost:4318/v1/traces
_configure_lock = threading.Lock()
_configured = False

def request_hook(span, request):
    method = getattr(request, "method", None)
    path = getattr(request, "path_info", None) or getattr(request, "path", None)
    if method is None and isinstance(request, dict):
        method = request.get("REQUEST_METHOD")
        path = request.get("PATH_INFO")
    if method:
        span.set_attribute("http.request.method", method)
    if path:
        # Override attributes populated by the framework before this hook. Old
        # semantic conventions put the raw query in http.target; newer ones use
        # url.query/url.full. Query data is never needed for field diagnosis.
        span.set_attribute("http.target", path)
        span.set_attribute("http.url", path)
        span.set_attribute("url.full", path)
        span.set_attribute("url.path", path)
        span.set_attribute("url.query", "")

def response_hook(span, request, response):
    status = getattr(response, "status_code", None)
    if status is not None:
        span.set_attribute("http.response.status_code", status)


def outgoing_request_hook(span, request):
    url = getattr(request, "url", "")
    if not url:
        return
    parsed = urlsplit(url)
    safe_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    span.set_attribute("http.url", safe_url)
    span.set_attribute("url.full", safe_url)
    span.set_attribute("url.path", parsed.path or "/")
    span.set_attribute("url.query", "")
    span.set_attribute("http.target", parsed.path or "/")

def configure_opentelemetry():
    global _configured
    if not OTEL_ENDPOINT:
        return False
    with _configure_lock:
        if _configured:
            return True
        from opentelemetry.sdk.trace.sampling import ParentBased, TraceIdRatioBased
        resource = Resource(attributes={
            "service.name": os.getenv("OTEL_SERVICE_NAME", "feed-backend"),
            "deployment.environment.name": os.getenv("APP_ENVIRONMENT", "development"),
            "service.version": os.getenv("APP_RELEASE", os.getenv("COMMIT_SHA", "unknown")),
        })
        sample_rate = min(1.0, max(0.0, float(os.getenv("OTEL_TRACES_SAMPLE_RATE", "0.1"))))
        trace.set_tracer_provider(TracerProvider(resource=resource, sampler=ParentBased(TraceIdRatioBased(sample_rate))))
        otlp_exporter = OTLPSpanExporter(endpoint=OTEL_ENDPOINT)
        trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(otlp_exporter))
        DjangoInstrumentor().instrument(is_sql_commentor_enabled=True, response_hook=response_hook, request_hook=request_hook)
        RequestsInstrumentor().instrument(request_hook=outgoing_request_hook)
        LoggingInstrumentor().instrument(set_logging_format=False)
        _configured = True
        return True
    # SQLite3Instrumentor().instrument()
