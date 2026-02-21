#!/usr/bin/env python3
"""Parse Playwright JSON report to compute flakiness metrics."""
import json
import sys

data = json.load(sys.stdin)
suites = data.get("suites", [])
total = 0
passed = 0
failed = 0
flaky_tests = []


def walk(suites_list):
    global total, passed, failed
    for s in suites_list:
        for spec in s.get("specs", []):
            for t in spec.get("tests", []):
                for r in t.get("results", []):
                    total += 1
                    if r["status"] == "passed":
                        passed += 1
                    else:
                        failed += 1
                        flaky_tests.append(f"{spec['title']} ({r['status']})")
        walk(s.get("suites", []))


walk(suites)
print(f"Total runs: {total}")
print(f"Passed: {passed}")
print(f"Failed: {failed}")
if total > 0:
    print(f"Flake rate: {failed/total*100:.1f}%")
else:
    print("Flake rate: N/A")

if flaky_tests:
    print("\nFlaky tests:")
    for f in flaky_tests[:30]:
        print(f"  - {f}")
else:
    print("\n✅ Zero flakes detected")
