#!/usr/bin/env python3
"""Send a smoke-test event to Sentry to verify the DSN works."""
import json, urllib.request, time, uuid

key = "c507891630be22946aae6f4dc35daa2b"
project_id = "4510930062475264"
host = "o4509651128942592.ingest.us.sentry.io"

url = "https://%s/api/%s/store/" % (host, project_id)
event_id = uuid.uuid4().hex

payload = {
    "event_id": event_id,
    "timestamp": time.time(),
    "platform": "javascript",
    "level": "error",
    "logger": "smoke-test",
    "message": {"formatted": "Sentry smoke test - merchant-portal OK!"},
    "tags": {"source": "smoke-test", "environment": "development"},
    "extra": {"test": True},
}

data = json.dumps(payload).encode()
headers = {
    "Content-Type": "application/json",
    "X-Sentry-Auth": "Sentry sentry_version=7,sentry_key=%s,sentry_client=test/1.0" % key,
}

req = urllib.request.Request(url, data=data, headers=headers)
try:
    resp = urllib.request.urlopen(req, timeout=15)
    body = resp.read().decode()
    print("STATUS:", resp.status)
    print("RESPONSE:", body)
    print("EVENT_ID:", event_id)
    print("SUCCESS - Event sent to Sentry!")
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print("BODY:", e.read().decode())
except Exception as e:
    print("ERROR:", e)
