from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.django import DjangoInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.instrumentation.sqlite3 import SQLite3Instrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
import logging
import os

OTEL_ENDPOINT = os.environ.get("OTEL_ENDPOINT", "http://localhost:4318/v1/traces")


def request_hook(span, request):
    span.add_event(request.body.decode("utf-8"))
    pass

def response_hook(span, request, response):
    span.add_event(response.content.decode("utf-8"))
    pass

def configure_opentelemetry():
    resource = Resource(attributes={"service.name": "feed-app"})
    trace.set_tracer_provider(TracerProvider(resource=resource))
    otlp_exporter = OTLPSpanExporter(
        endpoint=OTEL_ENDPOINT
    )
    span_processor = BatchSpanProcessor(otlp_exporter)
    trace.get_tracer_provider().add_span_processor(span_processor)
    DjangoInstrumentor().instrument(is_sql_commentor_enabled=True, response_hook=response_hook, request_hook=request_hook)
    RequestsInstrumentor().instrument()
    LoggingInstrumentor(log_level=logging.INFO).instrument()
    SQLite3Instrumentor().instrument()
