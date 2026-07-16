from pathlib import Path

from django.test import SimpleTestCase


ROOT = Path(__file__).resolve().parents[2]


class InfrastructureSafetyTests(SimpleTestCase):
    def test_monitoring_bindings_are_loopback_only(self):
        compose = (ROOT / "docker-compose.opensearch.yml").read_text(encoding="utf-8")
        for port in (16686, 9200, 5601, 9090):
            self.assertIn(f"127.0.0.1:{port}:{port}", compose)
            self.assertNotIn(f"0.0.0.0:{port}:{port}", compose)

    def test_nginx_does_not_log_query_or_trust_arbitrary_real_ip(self):
        nginx = (ROOT / "nginx.conf").read_text(encoding="utf-8")
        log_format = nginx.split("access_log", 1)[0]
        self.assertIn('uri="$uri"', log_format)
        self.assertNotIn('$request_uri', log_format)
        self.assertNotIn("set_real_ip_from 0.0.0.0/0", nginx)
        self.assertNotIn("location /jaeger", nginx)

    def test_backend_and_metrics_have_no_host_port_publication(self):
        compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")
        self.assertNotIn("container_name:", compose)
        backend_section = compose.split("  backend:", 1)[1].split("  front:", 1)[0]
        self.assertNotIn("ports:", backend_section)

    def test_backend_does_not_depend_on_optional_monitoring(self):
        compose = (ROOT / "docker-compose.opensearch.yml").read_text(encoding="utf-8")
        backend_section = compose.split("  backend:", 1)[1].split("  front:", 1)[0]
        self.assertNotIn("depends_on:", backend_section)
