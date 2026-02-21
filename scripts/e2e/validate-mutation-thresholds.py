#!/usr/bin/env python3
"""
🎯 Mutation Testing Quality Gate Validator

Enforces thresholds for CI/CD pipeline.
Used before deployment to ensure mutation score meets quality gates.

Usage:
    python3 validate-mutation-thresholds.py artifacts/mutation-report.json

Exit Codes:
    0 = PASS (all thresholds met)
    1 = FAIL (thresholds not met)
    2 = ERROR (invalid report)

Quality Gates (from MUTATION_TESTING_GUIDE):
    - CRITICAL modules: ≥ 80%
    - IMPORTANT modules: ≥ 75%
    - OVERALL: ≥ 75% (break if < 65%)
"""

import json
import sys
from pathlib import Path

# Module classification (must match stryker.config.mjs)
MODULE_LAYERS = {
    "CRITICAL": {
        "modules": [
            "src/core/flow/FlowEngine.ts",
            "src/core/lifecycle/LifecycleState.ts",
            "src/core/readiness/operationalRestaurant.ts",
            "src/core/navigation/routeGuards.ts",
            "src/core/guards/OperationalStateGuard.ts",
        ],
        "threshold": 80,
    },
    "IMPORTANT": {
        "modules": [
            "src/core/auth/useAuthGuard.ts",
            "src/core/tenant/TenantContext.tsx",
            "src/core/tenant/useTenantResolver.ts",
        ],
        "threshold": 75,
    },
    "EXTENDED": {
        "modules": [
            "src/core/payment/usePaymentGuard.ts",
            "src/core/catalog/CatalogResolver.ts",
        ],
        "threshold": 70,
    },
}


def classify_module(module_path: str) -> str:
    """Return layer or 'UNCLASSIFIED'."""
    for layer, config in MODULE_LAYERS.items():
        if module_path in config["modules"]:
            return layer
    return "UNCLASSIFIED"


def validate_thresholds(report_json: dict) -> bool:
    """Validate all quality gates. Return True if PASS."""
    files = report_json.get("files", {})

    # Collect layer scores
    layer_scores = {
        "CRITICAL": {"total": 0, "killed": 0},
        "IMPORTANT": {"total": 0, "killed": 0},
        "EXTENDED": {"total": 0, "killed": 0},
    }

    overall_total = 0
    overall_killed = 0

    for file_path, file_data in files.items():
        mutants = file_data.get("mutants", [])
        layer = classify_module(file_path)

        for mutant in mutants:
            status = mutant.get("status", "")
            overall_total += 1

            if status == "Killed":
                overall_killed += 1

            if layer in layer_scores:
                layer_scores[layer]["total"] += 1
                if status == "Killed":
                    layer_scores[layer]["killed"] += 1

    # Calculate scores
    passing = True
    print("\n" + "=" * 80)
    print("🎯 MUTATION QUALITY GATES VALIDATION")
    print("=" * 80 + "\n")

    for layer, config in [
        ("CRITICAL", MODULE_LAYERS["CRITICAL"]),
        ("IMPORTANT", MODULE_LAYERS["IMPORTANT"]),
    ]:
        data = layer_scores[layer]
        if data["total"] == 0:
            print(f"⚠️  {layer}: No mutants (skipped)")
            continue

        score = (data["killed"] / data["total"]) * 100
        threshold = config["threshold"]
        passed = score >= threshold

        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {layer:12} {score:6.1f}% (target ≥{threshold}%) — {data['killed']}/{data['total']}")

        if not passed:
            passing = False

    # Overall score
    overall_score = (overall_killed / overall_total * 100) if overall_total > 0 else 0

    print(f"\n{'─' * 80}")

    if overall_score >= 75:
        print(f"✅ OVERALL:     {overall_score:6.1f}% (EXCELLENT)")
    elif overall_score >= 70:
        print(f"✅ OVERALL:     {overall_score:6.1f}% (GOOD)")
    elif overall_score >= 65:
        print(f"⚠️  OVERALL:     {overall_score:6.1f}% (ACCEPTABLE, but < 75% target)")
    else:
        print(f"❌ OVERALL:     {overall_score:6.1f}% (POOR, < 65% break)")
        passing = False

    print(f"{'─' * 80}\n")

    return passing


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 validate-mutation-thresholds.py <mutation-report.json>")
        sys.exit(2)

    report_path = Path(sys.argv[1])

    # Load report
    try:
        with open(report_path, "r") as f:
            report_json = json.load(f)
    except FileNotFoundError:
        print(f"❌ Report not found: {report_path}", file=sys.stderr)
        sys.exit(2)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}", file=sys.stderr)
        sys.exit(2)

    # Validate
    passed = validate_thresholds(report_json)

    if passed:
        print("✅ All quality gates PASSED")
        sys.exit(0)
    else:
        print("❌ Quality gates FAILED")
        print("\nAction: Review mutation report and strengthen tests for survived mutants.")
        print(f"Report: {report_path}")
        sys.exit(1)


if __name__ == "__main__":
    main()
