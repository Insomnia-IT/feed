# Observability runtime gate

Run `bash scripts/verify_observability_runtime.sh` on an isolated Linux host with Docker Engine, Compose v2 and curl. It uses a unique Compose project, temporary directories and synthetic credentials, then removes only resources belonging to that project.

Expected report ends with all checks marked `PASS`, including unavailable OTel and Matrix endpoints, and:

```text
RESULT CODE_REVIEW_READY, RUNTIME_GATE_PASSED
```

Any failed assertion exits non-zero. Until this script passes on a Docker-capable machine, status is `RUNTIME_GATE_PENDING`; static WSGI review is not runtime proof.
