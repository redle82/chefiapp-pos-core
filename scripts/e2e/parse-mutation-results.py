#!/usr/bin/env python3
"""
🧬 Parse Mutation Test Results (stryker output)

Converts StrykerJS JSON report to human-readable summary + dashboard data.

Usage:
    python3 parse-mutation-results.py < artifacts/mutation-report.json

Output:
    - Console: Summary table + per-module scores
    - CSV: artifacts/mutation-score-trend.csv (append mode for trending)
    - JSON: artifacts/mutation-dashboard.json (for dashboards)

Quality Gates:
    - CRITICAL modules: ≥80%
    - IMPORTANT modules: ≥75%
    - EXTENDED modules: ≥70%
    - OVERALL: ≥75% (break if <65%)
"""

import json
import sys
from datetime import datetime
import os
from pathlib import Path

# Module classification
MODULE_LAYERS = {
    "CRITICAL": {
        "modules": [
            "src/core/flow/FlowEngine.ts",
            "src/core/lifecycle/LifecycleState.ts",
            "src/core/readiness/operationalRestaurant.ts",
            "src/core/navigation/routeGuards.ts",
            "src/core/guards/OperationalStateGuard.ts",
        ],
        "target": 80,
        "level": "🔴 CRITICAL",
    },
    "IMPORTANT": {
        "modules": [
            "src/core/auth/useAuthGuard.ts",
            "src/core/tenant/TenantContext.tsx",
            "src/core/tenant/useTenantResolver.ts",
        ],
        "target": 75,
        "level": "🟠 IMPORTANT",
    },
    "EXTENDED": {
        "modules": [
            "src/core/payment/usePaymentGuard.ts",
            "src/core/catalog/CatalogResolver.ts",
        ],
        "target": 70,
        "level": "🟡 EXTENDED",
    },
}


def classify_module(module_path: str) -> str:
    """Return layer (CRITICAL, IMPORTANT, EXTENDED) or UNCLASSIFIED."""
    for layer, config in MODULE_LAYERS.items():
        if module_path in config["modules"]:
            return layer
    return "UNCLASSIFIED"


def parse_mutation_report(report_json: dict) -> dict:
    """Parse stryker mutation-report.json into actionable data."""

    stats = {
        "timestamp": datetime.now().isoformat(),
        "total_mutants": 0,
        "killed": 0,
        "survived": 0,
        "timeout": 0,
        "errors": 0,
        "no_coverage": 0,
        "overall_score": 0.0,
        "by_layer": {},
        "by_module": {},
        "survived_mutants": [],
        "passing": False,
    }

    # Extract file stats
    files = report_json.get("files", {})

    layer_stats = {
        "CRITICAL": {"total": 0, "killed": 0},
        "IMPORTANT": {"total": 0, "killed": 0},
        "EXTENDED": {"total": 0, "killed": 0},
        "UNCLASSIFIED": {"total": 0, "killed": 0},
    }

    for file_path, file_data in files.items():
        mutants = file_data.get("mutants", [])
        layer = classify_module(file_path)

        module_stats = {
            "path": file_path,
            "layer": layer,
            "target": MODULE_LAYERS.get(layer, {}).get("target", 0),
            "total": len(mutants),
            "killed": 0,
            "survived": 0,
            "timeout": 0,
            "errors": 0,
            "no_coverage": 0,
            "score": 0.0,
        }

        for mutant in mutants:
            status = mutant.get("status", "unknown")
            stats["total_mutants"] += 1
            stats[status.lower()] = stats.get(status.lower(), 0) + 1
            layer_stats[layer]["total"] += 1

            if status == "Killed":
                stats["killed"] += 1
                module_stats["killed"] += 1
                layer_stats[layer]["killed"] += 1
            elif status == "Survived":
                stats["survived"] += 1
                module_stats["survived"] += 1
                stats["survived_mutants"].append(
                    {
                        "file": file_path,
                        "mutation": mutant.get("mutatorName"),
                        "line": mutant.get("location", {}).get("start", {}).get("line", "?"),
                        "replacement": str(mutant.get("replacement", "?"))[:50],
                        "status": status,
                    }
                )

        # Calculate module score
        if module_stats["total"] > 0:
            module_stats["score"] = round(
                (module_stats["killed"] / module_stats["total"]) * 100, 1
            )
        stats["by_module"][file_path] = module_stats

    # Calculate layer scores
    for layer, data in layer_stats.items():
        if data["total"] > 0:
            score = round((data["killed"] / data["total"]) * 100, 1)
            target = MODULE_LAYERS.get(layer, {}).get("target", 70)
            stats["by_layer"][layer] = {
                "total": data["total"],
                "killed": data["killed"],
                "score": score,
                "target": target,
                "pass": score >= target,
            }

    # Overall score
    if stats["total_mutants"] > 0:
        stats["overall_score"] = round(
            (stats["killed"] / stats["total_mutants"]) * 100, 1
        )

    # Quality gates
    stats["passing"] = (
        stats["overall_score"] >= 65 and
        all(stats["by_layer"].get(layer, {}).get("pass", True)
            for layer in ["CRITICAL", "IMPORTANT"])
    )

    return stats


def format_module_report(stats: dict) -> str:
    """Format module-level results as table."""
    output = "\n" + "=" * 100 + "\n"
    output += "📊 MUTATION SCORE BY MODULE\n"
    output += "=" * 100 + "\n"

    # Header
    output += f"{'Module':<50} {'Layer':<15} {'Killed':<12} {'Score':<10} {'Status':<10}\n"
    output += "-" * 100 + "\n"

    # Sort by layer, then score descending
    sorted_modules = sorted(
        stats["by_module"].items(),
        key=lambda x: (
            {"CRITICAL": 0, "IMPORTANT": 1, "EXTENDED": 2, "UNCLASSIFIED": 3}.get(
                x[1]["layer"], 4
            ),
            -x[1]["score"],
        ),
    )

    for path, data in sorted_modules:
        module_name = path.split("/")[-1]
        layer = data["layer"]
        killed = f"{data['killed']}/{data['total']}"
        score = f"{data['score']:.1f}%"

        # Status icon based on target
        if data["score"] >= data["target"]:
            status = "✅ PASS"
        elif data["score"] >= data["target"] - 5:
            status = "⚠️  WARN"
        else:
            status = "❌ FAIL"

        output += f"{module_name:<50} {layer:<15} {killed:<12} {score:<10} {status:<10}\n"

    return output


def format_layer_report(stats: dict) -> str:
    """Format layer-level results."""
    output = "\n" + "=" * 80 + "\n"
    output += "🎯 MUTATION SCORE BY LAYER\n"
    output += "=" * 80 + "\n"

    for layer in ["CRITICAL", "IMPORTANT", "EXTENDED"]:
        if layer in stats["by_layer"]:
            data = stats["by_layer"][layer]
            target = data["target"]
            score = data["score"]
            icon = "✅" if data["pass"] else "❌"

            output += f"\n{MODULE_LAYERS[layer]['level']}\n"
            output += f"  Target:  {target}%\n"
            output += f"  Score:   {score}%\n"
            output += f"  Killed:  {data['killed']}/{data['total']} mutants\n"
            output += f"  Status:  {icon} {'PASS' if data['pass'] else 'FAIL'}\n"

    return output


def format_summary(stats: dict) -> str:
    """Format summary report."""
    output = "\n" + "=" * 80 + "\n"
    output += "📈 OVERALL MUTATION SCORE\n"
    output += "=" * 80 + "\n"
    output += f"Overall:     {stats['overall_score']:.1f}%\n"
    output += f"Total:       {stats['total_mutants']} mutants\n"
    output += f"Killed:      {stats['killed']} ({stats['killed']/max(stats['total_mutants'], 1)*100:.1f}%)\n"
    output += f"Survived:    {stats['survived']} ({stats['survived']/max(stats['total_mutants'], 1)*100:.1f}%)\n"
    output += f"Timeout:     {stats['timeout']}\n"
    output += f"No Coverage: {stats['no_coverage']}\n"
    output += f"Errors:      {stats['errors']}\n"

    # Overall status
    if stats["overall_score"] >= 75:
        status = "✅ EXCELLENT (≥75%)"
    elif stats["overall_score"] >= 70:
        status = "✅ GOOD (≥70%)"
    elif stats["overall_score"] >= 65:
        status = "⚠️  ACCEPTABLE (≥65%)"
    else:
        status = "❌ POOR (<65%)"

    output += f"\nStatus:      {status}\n"
    return output


def write_trend_csv(stats: dict):
    """Append to mutation-score-trend.csv for trending."""
    trend_file = Path("artifacts/mutation-score-trend.csv")
    trend_file.parent.mkdir(parents=True, exist_ok=True)

    # Write header if file is new
    is_new = not trend_file.exists()

    with open(trend_file, "a") as f:
        if is_new:
            f.write("date,overall_score,critical_score,important_score,extended_score,total_mutants,killed\n")

        critical = stats["by_layer"].get("CRITICAL", {}).get("score", 0)
        important = stats["by_layer"].get("IMPORTANT", {}).get("score", 0)
        extended = stats["by_layer"].get("EXTENDED", {}).get("score", 0)

        date_str = datetime.now().strftime("%Y-%m-%d")
        f.write(
            f"{date_str},{stats['overall_score']},{critical},{important},{extended},"
            f"{stats['total_mutants']},{stats['killed']}\n"
        )


def write_dashboard_json(stats: dict):
    """Write dashboard JSON for visualization."""
    dashboard_file = Path("artifacts/mutation-dashboard.json")
    dashboard_file.parent.mkdir(parents=True, exist_ok=True)

    dashboard = {
        "timestamp": stats["timestamp"],
        "overall_score": stats["overall_score"],
        "by_layer": stats["by_layer"],
        "by_module": {
            k: {
                "layer": v["layer"],
                "target": v["target"],
                "score": v["score"],
                "total": v["total"],
                "killed": v["killed"],
            }
            for k, v in stats["by_module"].items()
        },
        "quality_gate": {
            "passing": stats["passing"],
            "overall_threshold": 65,
            "critical_threshold": 80,
            "important_threshold": 75,
        },
    }

    with open(dashboard_file, "w") as f:
        json.dump(dashboard, f, indent=2)


def main():
    try:
        report_json = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON: {e}", file=sys.stderr)
        sys.exit(1)

    stats = parse_mutation_report(report_json)

    # Print console output
    print(format_summary(stats))
    print(format_layer_report(stats))
    print(format_module_report(stats))

    # Write artifacts
    write_trend_csv(stats)
    write_dashboard_json(stats)

    print("\n✅ Artifacts written:")
    print("  - artifacts/mutation-score-trend.csv (for trending)")
    print("  - artifacts/mutation-dashboard.json (for visualization)")

    # Exit code based on quality gates
    if not stats["passing"]:
        print(f"\n❌ Quality gates FAILED: overall {stats['overall_score']}% < 65%")
        sys.exit(1)

    if stats["overall_score"] < 75:
        print(f"\n⚠️  WARNING: overall {stats['overall_score']}% < 75% target")

    sys.exit(0)


if __name__ == "__main__":
    main()
