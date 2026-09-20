import json
import glob
import os

target_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "SOURCE.md")
plans_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "coding-plans")

files = sorted(glob.glob(os.path.join(plans_dir, "*.json")))
files = [f for f in files if not f.endswith("_schema.json")]

plans = []
for f in files:
    with open(f, encoding="utf-8") as fp:
        d = json.load(fp)
    plans.append(d)

categories = [
    ("coding-ide", "1. Coding IDEs & Autonomous Agents"),
    ("coding-router", "2. Coding Routers & Aggregators"),
    ("api-provider", "3. Direct APIs & Cloud Token Plans")
]

doc = []
doc.append("# 📑 SOURCE.md — Primary Evidence, Stated Usage Limits & Source Index\n")
doc.append("> **Purpose:** This document is the comprehensive, audit-ready index of primary documentation sources, stated quota limits, and token derivation evidence for all **33 coding services and model providers** tracked by [Token-Max](https://github.com/Heretek-AI/Token-Max).\n")
doc.append("> **Audit Date:** September 2026 | **Enforced by:** `npm run validate-data`\n")
doc.append("\n---\n")
doc.append("## Verification Standards & Metadata Schema\n")
doc.append("Every tier in Token-Max is classified with explicit provenance in `estimateMeta`:\n")
doc.append("- **Source Types:** `official` (direct vendor pricing/quota page), `derived` (mathematically inverted from official at-cost rates or credit ratios), `research` (published benchmarks, SWE-bench tracking, BSWEN 100M token study), `community` (forum telemetry, reverse engineering).\n")
doc.append("- **Confidence Levels:** `high` (explicitly published token ceilings/tables), `medium` (official credit multipliers/at-cost API rates), `low` (opaque window/quota caps, research estimates).\n")
doc.append("- **Stacking Policies:** `allowed` (explicitly permitted), `silent` (account sharing banned but multiple paid accounts unaddressed), `prohibited` (terms explicitly ban multiple accounts or proxying).\n")
doc.append("\n---\n")

for cat_id, cat_title in categories:
    cat_plans = [p for p in plans if p.get("category") == cat_id]
    doc.append(f"## {cat_title} ({len(cat_plans)} Services)\n")
    for p in cat_plans:
        p_name = p["name"]
        p_id = p["id"]
        p_url = p.get("url", "")
        p_stacking = p.get("stackingPolicy", "unknown")
        p_stacking_note = p.get("stackingPolicyNote", "")
        p_training = p.get("dataTraining", "Unknown")
        p_indemnity = p.get("ipIndemnity", False)
        
        doc.append(f"### {p_name} (`{p_id}`)\n")
        doc.append(f"- **Primary Pricing & Docs:** [{p_url}]({p_url})")
        doc.append(f"- **Category:** `{cat_id}`")
        doc.append(f"- **Data Privacy & Training:** {p_training}")
        doc.append(f"- **IP Indemnity:** {p_indemnity}")
        doc.append(f"- **Stacking Policy:** `{p_stacking}`" + (f" — *\"{p_stacking_note}\"*" if p_stacking_note else ""))
        doc.append("")
        doc.append("#### Stated Limits & Token Yield Estimates\n")
        doc.append("| Tier | Price | Stated Quotas & Limits | Supported Models | Monthly Token Budget | Source & Evidence |")
        doc.append("| :--- | :--- | :--- | :--- | :--- | :--- |")
        
        for t in p.get("tiers", []):
            t_name = t["name"]
            monthly_price = t.get("monthlyPrice")
            annual_price = t.get("annualPrice")
            if monthly_price is None:
                price_str = "Enterprise"
            elif monthly_price == 0:
                price_str = "Free ($0)"
            else:
                price_str = f"${monthly_price}/mo"
            if annual_price is not None:
                price_str += f"<br/>(${annual_price}/yr)"
            
            # Limits
            limits_list = [f"**{k}**: {v}" for k, v in t.get("limits", {}).items()]
            limits_str = "<br/>".join(limits_list) if limits_list else "None stated"
            
            # Models
            models_list = t.get("models", [])
            if len(models_list) > 4:
                models_str = ", ".join(models_list[:3]) + f"<br/>*(+{len(models_list)-3} more)*"
            else:
                models_str = ", ".join(models_list) if models_list else "Standard suite"
                
            # Budget
            tb = t.get("estimatedTokenBudget", {})
            desc = tb.get("description", "")
            floor = tb.get("estimatedMillionTokens", 0)
            mid = tb.get("midpointEstimate")
            opt = tb.get("optimisticEstimate")
            budget_str = f"**{desc}**<br/>Floor: `{floor}M`"
            if mid is not None:
                budget_str += f" | Mid: `{mid}M`"
            if opt is not None:
                budget_str += f" | Opt: `{opt}M`"
                
            # Evidence
            meta = tb.get("estimateMeta", {})
            s_url = meta.get("sourceUrl", p_url)
            s_type = meta.get("sourceType", "research")
            conf = meta.get("confidence", "low")
            s_quote = meta.get("sourceQuote", "")
            basis_model = meta.get("basisModel", "")
            
            ev_str = f"[{s_type.upper()} ({conf})]({s_url})"
            if basis_model:
                ev_str += f"<br/>*Basis: {basis_model}*"
            if s_quote:
                clean_quote = s_quote.replace("|", "/")
                if len(clean_quote) > 120:
                    clean_quote = clean_quote[:117] + "..."
                ev_str += f"<br/>*\"{clean_quote}\"*"
                
            doc.append(f"| **{t_name}** | {price_str} | {limits_str} | {models_str} | {budget_str} | {ev_str} |")
            
        # Gotchas
        gotchas = p.get("gotchas", [])
        if gotchas:
            doc.append("")
            doc.append("**Key Gotchas & Constraints:**")
            for g in gotchas:
                doc.append(f"- {g}")
        doc.append("\n---\n")

doc.append("## 4. Cross-Reference Index\n")
doc.append("- [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md): End-to-end ingestion pipeline and blended calculation methodology.")
doc.append("- [`docs/TOKEN_ESTIMATE_VALIDATION.md`](docs/TOKEN_ESTIMATE_VALIDATION.md): Empirical OSINT validation for 20:1 agent blends and prompt caching.")
doc.append("- [`docs/VERIFICATION.md`](docs/VERIFICATION.md): Historical verification audit log and provider test passes.")
doc.append("- [`data/estimate-constants.json`](data/estimate-constants.json): Canonical mathematical constants shared across frontend and data scripts.\n")

content = "\n".join(doc)
with open(target_file, "w", encoding="utf-8") as out_fp:
    out_fp.write(content)

print(f"Successfully generated SOURCE.md at {target_file} ({len(content)} characters, {len(doc)} lines).")
