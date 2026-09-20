import json
import os

null = None
false = False
true = True

LAST_VERIFIED = "2026-09-19"
target_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "coding-plans")
os.makedirs(target_dir, exist_ok=True)

# Multi-subscription ("Dangerous Dave") stacking policy per plan, with evidence.
# prohibited = terms explicitly ban multiple accounts / account sharing / bulking;
# silent     = terms ban credential sharing but do not address one person holding
#              multiple paid accounts (or no relevant clause found);
# unknown    = policy not yet researched.
STACKING_POLICY = {
    "alibaba-cloud": (
        "prohibited",
        'Token Plan FAQ: "Can multiple people share one account? No... sharing the same account or API Key among multiple people is not allowed"; Team seats are bound to one member and one API key.',
    ),
    "commandcode": (
        "prohibited",
        'Terms: "One account per person. You may not register, operate, or control more than one account... Creating, operating, or controlling multiple accounts is a material breach."',
    ),
    "kimi-code": (
        "prohibited",
        'User agreement: "not register or operate multiple accounts for abusive purposes" and "You may not share your account credentials or make your account available to anyone else."',
    ),
    "ollama-cloud": (
        "prohibited",
        'Pricing FAQ: "Can I have multiple Ollama accounts? No. Ollama is one account per person."',
    ),
    "opencode": (
        "prohibited",
        'Terms of Service: prohibits users who "create, maintain, or use multiple accounts to circumvent usage limits, access restrictions, billing obligations... or any other restriction or policy."',
    ),
    "openrouter": (
        "prohibited",
        'Terms: "create multiple accounts as a single user, for purposes of bypassing or circumventing use limits... or for any other reason" is prohibited.',
    ),
    "replit": (
        "prohibited",
        'Terms: "Creating accounts with automation or registering multiple accounts" is prohibited.',
    ),
    "z-ai": (
        "prohibited",
        'Subscription terms: benefits are "exclusive to the subscriber"; "Account sharing or multi-user access is prohibited" and the licence is tied to a single natural person with no aggregation/proxying.',
    ),
    "anthropic-api": (
        "silent",
        "Consumer/commercial terms ban sharing account credentials and API keys but do not address one person holding multiple paid accounts.",
    ),
    "augment-code": (
        "silent",
        'Terms ban sharing credentials across users ("unique usernames and passwords cannot be shared or used by more than one individual Authorized User") but do not address multiple paid accounts.',
    ),
    "claude-code": (
        "silent",
        'Consumer terms: "You may not share your Account login information... or make your Account available to anyone else"; multiple paid accounts are not addressed.',
    ),
    "cursor": (
        "silent",
        "Terms of Service contain no account-sharing or multi-account clause; only resale/lease/lending of the Service is prohibited.",
    ),
    "github-copilot": (
        "silent",
        'GitHub ToS: "Your login may only be used by one person - i.e., a single login may not be shared by multiple people"; multiple paid accounts are not addressed (one free account per person).',
    ),
    "google-antigravity": (
        "silent",
        "Google consumer terms and Generative AI Additional Terms reviewed; no multi-account or account-sharing clause found. Third-party tooling against Antigravity OAuth is banned.",
    ),
    "kiro": (
        "silent",
        'FAQ: "subscriptions and usage limits are calculated per individual user"; sharing is not permitted, multiple paid accounts are not addressed.',
    ),
    "lovable": (
        "silent",
        "Terms ban sharing credentials; workspaces support unlimited members and are priced by credits, not seats - multiple paid subscriptions on one account are not addressed.",
    ),
    "openai-api": (
        "silent",
        "Terms ban sharing account credentials; multiple paid accounts are not addressed.",
    ),
    "openai-codex": (
        "silent",
        "Terms ban sharing account credentials; multiple paid accounts are not addressed.",
    ),
    "minimax": (
        "silent",
        'App terms: "your account is personal to you... not to provide any other person with access"; platform terms: "the Account should be used solely by you". Multiple paid accounts are not addressed.',
    ),
    "together-ai": (
        "silent",
        "Terms of Service reviewed; no multiple-account, sharing or seat clause found.",
    ),
    "byteplus": (
        "silent",
        'BytePlus AI terms cover data training but contain no multi-account clause; plans are "primarily intended for individual developers" and non-coding use may be treated as abuse.',
    ),
    "kilo-code": (
        "silent",
        "Per-seat Teams licensing; terms ban credential sharing but no multiple-account clause was found.",
    ),
    "tabnine": (
        "silent",
        "Terms ban sharing an Account/Login and sell seats per registered user; multiple paid accounts are not addressed.",
    ),
    "windsurf": (
        "silent",
        'Acceptable Use Policy bans "sharing credentials"; multiple paid accounts are not addressed.',
    ),
}


def write_json(filename, data):
    plan_id = filename.replace(".json", "")
    policy, note = STACKING_POLICY.get(plan_id, ("unknown", None))
    data.setdefault("stackingPolicy", policy)
    if note:
        data.setdefault("stackingPolicyNote", note)
    # Every token estimate carries provenance. Curated tiers can override this
    # default with an explicit official/derived estimateMeta.
    for tier in data.get("tiers", []):
        budget = tier.get("estimatedTokenBudget")
        if isinstance(budget, dict):
            budget.setdefault(
                "estimateMeta",
                {
                    "sourceUrl": data.get("url", ""),
                    "sourceType": "research",
                    "confidence": "low",
                    "verifiedAt": LAST_VERIFIED,
                },
            )
    filepath = os.path.join(target_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Wrote {filename}")


# OSINT agent-task band shared with the frontend + Node scripts.
# Rationale: docs/TOKEN_ESTIMATE_VALIDATION.md (autonomous tasks measure
# 200-800K input + 30-100K output; interactive CLI sessions measure 60-240K).
with open(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "estimate-constants.json"),
    encoding="utf-8",
) as _f:
    _ESTIMATE_CONSTANTS = json.load(_f)

TASK_FLOOR_TOKENS = _ESTIMATE_CONSTANTS["agentTask"]["conservativeTokens"]
TASK_MID_TOKENS = _ESTIMATE_CONSTANTS["agentTask"]["midpointTokens"]
TASK_OPT_TOKENS = _ESTIMATE_CONSTANTS["agentTask"]["optimisticTokens"]


def task_estimate(tasks, factor=1):
    """Million-token floor/midpoint/ceiling for `tasks` agent tasks per month.

    Opaque-quota plans (Antigravity, Windsurf, Codex) use this instead of the
    retired 150K-per-task basis, which was below the OSINT autonomous-task band.
    """
    return {
        "estimatedMillionTokens": round(
            tasks * factor * TASK_FLOOR_TOKENS / 1_000_000, 2
        ),
        "midpointEstimate": round(tasks * factor * TASK_MID_TOKENS / 1_000_000, 2),
        "optimisticEstimate": round(tasks * factor * TASK_OPT_TOKENS / 1_000_000, 2),
    }


def scale_estimate(base, factor):
    """Scale a floor/midpoint/ceiling estimate by an official multiplier."""
    return {
        "estimatedMillionTokens": round(base["estimatedMillionTokens"] * factor, 2),
        "midpointEstimate": round(base["midpointEstimate"] * factor, 2),
        "optimisticEstimate": round(base["optimisticEstimate"] * factor, 2),
    }


# Agent-blended cost engine for dollar/credit-denominated subscription pools.
# Subscription credits drain at each model's own published API rate, so the
# per-model token yield = model's agent-blended $/M inverted into token
# equivalents. Mirrors src/lib/pricing.ts agent blend at 95% cache, reading
# request sizes / cache-write premium from the shared constants file.
_CWP = _ESTIMATE_CONSTANTS["cacheWritePremium"]
_IN_TOK = _ESTIMATE_CONSTANTS["agentRequest"]["inputTokens"]
_OUT_TOK = _ESTIMATE_CONSTANTS["agentRequest"]["outputTokens"]
_PER_MODEL_CACHE_RATE = 0.95
_PER_MODEL_WRITE_SHARE = 0.1


def agent_blend_cost(prices, cache_rate=_PER_MODEL_CACHE_RATE):
    """Agent-blended $/M for a model given its officially published token prices.

    `prices`: {input, output, cacheRead, cacheWrite ($/M; None => input × premium), writeShare}
    Returns the blended $ per million tokens under the 20K-in/1K-out agent shape.
    """
    write_share = prices.get("writeShare", 0.1)
    cache_write = prices["cacheWrite"]
    if cache_write is None:
        cache_write = prices["input"] * _CWP
    fresh = _IN_TOK * (1 - cache_rate)
    cached = _IN_TOK * cache_rate
    cost = (
        fresh * prices["input"]
        + cached * prices["cacheRead"]
        + cached * write_share * cache_write
        + _OUT_TOK * prices["output"]
    ) / 1e6
    return cost / ((_IN_TOK + _OUT_TOK) / 1e6)


def per_model_pool(
    pool_usd, slug_prices, basis="list-price-credit", confidence="medium"
):
    """Per-model token budgets (M/mo) for one tier whose quota is a $ or credit
    pool draining at each model's published API rate.

    `slug_prices`: {lowercase model key: ("prices dict", conservativeFraction, ...)}
    Each model consumes the WHOLE pool exclusively -> tokens = pool / blended $/M.
    """
    out = {}
    for key, prices in slug_prices.items():
        blended = agent_blend_cost(prices)
        out[key] = {
            "estimatedMillionTokens": round(pool_usd / blended, 2),
            "basis": basis,
            "confidence": confidence,
        }
    return out


# CommandCode officially bills subscriptions at each model's at-cost API rate
# (https://commandcode.ai/docs/resources/pricing-limits, "Model pricing. At
# cost."). Off-peak/DeepSeek rates shown are the primary 17h/day rates.
_CMD_PRICES = {
    "gpt-5.6 luna": {
        "input": 0.20,
        "output": 1.20,
        "cacheRead": 0.02,
        "cacheWrite": 0.25,
    },
    "grok 4.5": {"input": 2.00, "output": 6.00, "cacheRead": 0.50, "cacheWrite": None},
    "qwen 3.8 max": {
        "input": 2.00,
        "output": 6.00,
        "cacheRead": 0.25,
        "cacheWrite": 2.50,
    },
    "minimax m3": {
        "input": 0.30,
        "output": 1.20,
        "cacheRead": 0.06,
        "cacheWrite": None,
    },
    "gpt-5.6 sol": {
        "input": 5.00,
        "output": 30.00,
        "cacheRead": 0.50,
        "cacheWrite": 6.25,
    },
    "glm-5.2": {"input": 1.40, "output": 4.40, "cacheRead": 0.26, "cacheWrite": None},
    "tencent hy3": {
        "input": 0.14,
        "output": 0.58,
        "cacheRead": 0.035,
        "cacheWrite": None,
    },
    "qwen 3.8 27b": {
        "input": 0.40,
        "output": 3.00,
        "cacheRead": 0.04,
        "cacheWrite": None,
    },
    "deepseek v4 flash": {
        "input": 0.15,
        "output": 0.60,
        "cacheRead": 0.003,
        "cacheWrite": None,
    },
    "claude opus 4.8": {
        "input": 5.00,
        "output": 25.00,
        "cacheRead": 0.50,
        "cacheWrite": 6.25,
    },
    "gemini": {"input": 1.50, "output": 7.50, "cacheRead": 0.15, "cacheWrite": None},
}
_CMD_GPT_POOL = per_model_pool(
    10.0,
    {
        "gpt-5.6 luna": _CMD_PRICES["gpt-5.6 luna"],
        "grok 4.5": _CMD_PRICES["grok 4.5"],
        "qwen 3.8 max": _CMD_PRICES["qwen 3.8 max"],
        "minimax m3": _CMD_PRICES["minimax m3"],
    },
)
_CMD_GOAT_POOL = per_model_pool(
    70.0,
    {
        "gpt-5.6 sol": _CMD_PRICES["gpt-5.6 sol"],
        "glm-5.2": _CMD_PRICES["glm-5.2"],
        "tencent hy3": _CMD_PRICES["tencent hy3"],
        "qwen 3.8 27b": _CMD_PRICES["qwen 3.8 27b"],
        "deepseek v4 flash": _CMD_PRICES["deepseek v4 flash"],
    },
)
_CMD_PRO_POOL = per_model_pool(
    80.0,
    {
        "claude opus 4.8": _CMD_PRICES["claude opus 4.8"],
        "gpt-5.6 sol": _CMD_PRICES["gpt-5.6 sol"],
        "gemini": _CMD_PRICES["gemini"],
        "glm-5.2": _CMD_PRICES["glm-5.2"],
        "minimax m3": _CMD_PRICES["minimax m3"],
    },
)

# Cursor publishes per-token rates for both usage pools
# (https://cursor.com/docs/account/pricing). Included pools are modeled on
# ~$20/$60/$200 of equivalent API-rate spend (see tier assumptions).
_CURSOR_PRICES = {
    "cursor grok 4.6": {
        "input": 2.00,
        "output": 6.00,
        "cacheRead": 0.50,
        "cacheWrite": None,
    },
    "composer 2.5": {
        "input": 0.50,
        "output": 2.50,
        "cacheRead": 0.20,
        "cacheWrite": None,
    },
    "claude fable 5.1": {
        "input": 10.00,
        "output": 50.00,
        "cacheRead": 0.25,
        "cacheWrite": 12.50,
    },
    "claude opus 5": {
        "input": 5.00,
        "output": 25.00,
        "cacheRead": 0.50,
        "cacheWrite": 6.25,
    },
    "claude sonnet 5": {
        "input": 2.00,
        "output": 10.00,
        "cacheRead": 0.20,
        "cacheWrite": 2.50,
    },
    "gpt-5.6 sol": {
        "input": 4.00,
        "output": 20.00,
        "cacheRead": 0.40,
        "cacheWrite": 5.00,
    },
    "gemini 3.1 pro": {
        "input": 2.00,
        "output": 12.00,
        "cacheRead": 0.20,
        "cacheWrite": None,
    },
    "gemini 3.8 flash": {
        "input": 0.75,
        "output": 3.50,
        "cacheRead": 0.075,
        "cacheWrite": None,
    },
    "muse spark 1.3": {
        "input": 1.25,
        "output": 4.25,
        "cacheRead": 0.15,
        "cacheWrite": None,
    },
}
_CURSOR_PRO_POOL = per_model_pool(
    20.0,
    _CURSOR_PRICES,
)
_CURSORPROPLUS_POOL = per_model_pool(
    60.0,
    {
        k: v
        for k, v in _CURSOR_PRICES.items()
        if k != "gemini 3.1 pro" and k != "muse spark 1.3"
    },
)
_CURSOR_ULTRA_POOL = per_model_pool(
    200.0,
    {
        k: v
        for k, v in _CURSOR_PRICES.items()
        if k
        in (
            "cursor grok 4.6",
            "composer 2.5",
            "claude fable 5.1",
            "claude opus 5",
            "gemini 3.8 flash",
        )
    }
    | {
        "gpt-6 astra": {
            "input": 10.00,
            "output": 50.00,
            "cacheRead": 1.00,
            "cacheWrite": 12.50,
        },
    },
)


# Claude usage credits drain at each model's official API rate
# (https://claude.com/pricing); Fable officially draws weekly limits at 50%.
_CLAUDE_PRICES = {
    "claude opus 5": {
        "input": 5.00,
        "output": 25.00,
        "cacheRead": 0.50,
        "cacheWrite": 6.25,
    },
    "claude sonnet 5": {
        "input": 2.00,
        "output": 10.00,
        "cacheRead": 0.20,
        "cacheWrite": 2.50,
    },
    "claude haiku 4.5": {
        "input": 1.00,
        "output": 5.00,
        "cacheRead": 0.10,
        "cacheWrite": 1.25,
    },
    "claude fable 5.1": {
        "input": 10.00,
        "output": 50.00,
        "cacheRead": 0.25,
        "cacheWrite": 12.50,
    },
}
_CLAUDE_SONNET_BLENDED = agent_blend_cost(_CLAUDE_PRICES["claude sonnet 5"])


def _claude_pool(pool_million_tokens, include_fable=False):
    """Per-model yields for a usage-credit pool whose drain scales with each
    model's blended API rate; Sonnet 5 is the reference basis. Fable draws
    weekly limits at 50% (official)."""
    usd = pool_million_tokens * _CLAUDE_SONNET_BLENDED
    out = per_model_pool(
        usd,
        {k: v for k, v in _CLAUDE_PRICES.items() if k != "claude fable 5.1"},
        basis="list-price-credit",
        confidence="low",
    )
    fable_entry = dict(
        per_model_pool(
            usd,
            {"claude fable 5.1": _CLAUDE_PRICES["claude fable 5.1"]},
            basis="list-price-credit",
            confidence="low",
        )["claude fable 5.1"]
    )
    fable_entry["estimatedMillionTokens"] = round(
        fable_entry["estimatedMillionTokens"] * 0.5, 2
    )
    if include_fable:
        out["claude fable 5.1"] = fable_entry
    return out



# GitHub Copilot drains included GitHub AI Credits (1 credit = $0.01) at each
# model's per-token price (https://docs.github.com/en/copilot/reference/
# copilot-billing/models-and-pricing). Included pools: Pro ~= 300 credits
# ($3), Pro+ 3x Pro, Max 10x Pro (modeled%; see tier assumptions).
_COPILOT_PRICES = {
    "claude sonnet 5": {"input": 2.00, "output": 10.00, "cacheRead": 0.20, "cacheWrite": 2.50},
    "claude haiku 4.5": {"input": 1.00, "output": 5.00, "cacheRead": 0.10, "cacheWrite": 1.25},
    "gpt-5.4": {"input": 2.50, "output": 15.00, "cacheRead": 0.25, "cacheWrite": None},
    "gpt-5.3-codex": {"input": 1.75, "output": 14.00, "cacheRead": 0.175, "cacheWrite": None},
    "gemini 3.5 flash": {"input": 1.50, "output": 9.00, "cacheRead": 0.15, "cacheWrite": None},
    "gemini 3.6 flash": {"input": 0.75, "output": 3.75, "cacheRead": 0.075, "cacheWrite": None},
    "gemini 3.7 flash": {"input": 0.75, "output": 3.75, "cacheRead": 0.075, "cacheWrite": None},
    "gemini 3.8 flash": {"input": 0.75, "output": 3.75, "cacheRead": 0.075, "cacheWrite": None},
    "claude opus 5": {"input": 5.00, "output": 25.00, "cacheRead": 0.50, "cacheWrite": 6.25},
    "claude fable 5.1": {"input": 10.00, "output": 50.00, "cacheRead": 0.25, "cacheWrite": 12.50},
    "gpt-5.4 nano": {"input": 0.20, "output": 1.25, "cacheRead": 0.02, "cacheWrite": None},
    "gpt-6 astra": {"input": 10.00, "output": 50.00, "cacheRead": 1.00, "cacheWrite": 12.50},
}
def _copilot_pool(usd, keys):
    return per_model_pool(
        usd,
        {k: v for k, v in _COPILOT_PRICES.items() if k in keys},
        basis="list-price-credit",
        confidence="medium",
    )

_POOL_PRO_KEYS = ("claude sonnet 5", "claude haiku 4.5", "gpt-5.4", "gpt-5.3-codex",
                  "gemini 3.5 flash", "gemini 3.6 flash", "gemini 3.7 flash", "gemini 3.8 flash")
_POOL_PPLUS_KEYS = ("claude opus 5", "claude fable 5.1", "claude sonnet 5", "gpt-5.3-codex", "gpt-5.4 nano", "gpt-6 astra", "gemini 3.8 flash")
_POOL_MAX_KEYS = ("claude opus 5", "claude fable 5.1", "gpt-5.3-codex", "gpt-6 astra", "gemini 3.8 flash")
_COPILOT_PRO = _copilot_pool(3.0, _POOL_PRO_KEYS)
_COPILOTPPLUS = _copilot_pool(9.0, _POOL_PPLUS_KEYS)
_SS_SS = _copilot_pool(30.0, _POOL_MAX_KEYS)

# Kimi Code shares one membership quota billed by actual usage ~= the Kimi
# Open Platform API rates (official docs). K2.7 Code drains at half the K3
# rate pattern (0.95/4.00/0.19 vs K3 3.00/15.00/0.30).
_KIMI_PRICES = {
    "kimi k3": {"input": 3.00, "output": 15.00, "cacheRead": 0.30, "cacheWrite": None},
    "k2.7 code": {"input": 0.95, "output": 4.00, "cacheRead": 0.19, "cacheWrite": None},
}
_KIMI_K3_BLENDED = agent_blend_cost(_KIMI_PRICES["kimi k3"])


def _kimi_pool(pool_million_tokens, models=None):
    usd = pool_million_tokens * _KIMI_K3_BLENDED
    if models is not None:
        lower_models = [m.lower() for m in models]
        prices = {k: v for k, v in _KIMI_PRICES.items() if any(k in m for m in lower_models)}
    else:
        prices = _KIMI_PRICES
    return per_model_pool(usd, prices, basis="list-price-credit", confidence="low")

# OpenAI Codex drains ChatGPT-plan usage at each GPT model's API rate
# (illustrated via OpenAI's published pricing mirrors: https://platform.openai.com/docs/pricing).
_GPT_PRICES = {
    "gpt-5.6 luna": {"input": 0.20, "output": 1.20, "cacheRead": 0.02, "cacheWrite": 0.25},
    "gpt-5.6 terra": {"input": 2.00, "output": 12.00, "cacheRead": 0.20, "cacheWrite": 2.50},
    "gpt-5.6 sol": {"input": 4.00, "output": 20.00, "cacheRead": 0.40, "cacheWrite": 5.00},
    "gpt-6 astra": {"input": 10.00, "output": 50.00, "cacheRead": 1.00, "cacheWrite": 12.50},
}
_LUNA_BLENDED = agent_blend_cost(_GPT_PRICES["gpt-5.6 luna"])


def _gpt_pool(pool_million_tokens, models=None, basis_model="gpt-5.6 luna"):
    usd = pool_million_tokens * agent_blend_cost(_GPT_PRICES[basis_model])
    if models is not None:
        lower_models = [m.lower() for m in models]
        prices = {k: v for k, v in _GPT_PRICES.items() if any(k in m for m in lower_models)}
    else:
        prices = _GPT_PRICES
    return per_model_pool(usd, prices, basis="list-price-credit", confidence="medium")

# Meta Model API: Muse Spark 1.1/1.2/1.3 share identical Standard pricing
# (https://dev.meta.ai/docs/pricing-rate-limits) -> true equal-rate models.
_META_PRICES = {
    "muse spark 1.3": {"input": 1.25, "output": 4.25, "cacheRead": 0.15, "cacheWrite": None},
    "muse spark 1.2": {"input": 1.25, "output": 4.25, "cacheRead": 0.15, "cacheWrite": None},
}

# Google Antigravity / Google AI plan model rates
_ANTIGRAVITY_PRICES = {
    "gemini 3.8 flash": {"input": 0.10, "output": 0.40, "cacheRead": 0.025, "cacheWrite": None},
    "gemini 3.7 flash": {"input": 0.10, "output": 0.40, "cacheRead": 0.025, "cacheWrite": None},
    "gemini 3.6 flash": {"input": 0.10, "output": 0.40, "cacheRead": 0.025, "cacheWrite": None},
    "gemini 3.1 pro": {"input": 1.25, "output": 5.00, "cacheRead": 0.31, "cacheWrite": None},
    "claude sonnet 4.6": {"input": 3.00, "output": 15.00, "cacheRead": 0.30, "cacheWrite": None},
    "claude opus 4.6": {"input": 15.00, "output": 75.00, "cacheRead": 1.50, "cacheWrite": None},
    "gpt-oss-120b": {"input": 0.20, "output": 0.80, "cacheRead": 0.02, "cacheWrite": None},
}

def _antigravity_pool(pool_million_tokens, models, basis_model="gemini 3.1 pro"):
    usd = pool_million_tokens * agent_blend_cost(_ANTIGRAVITY_PRICES[basis_model])
    lower_models = [m.lower() for m in models]
    prices = {k: v for k, v in _ANTIGRAVITY_PRICES.items() if any(k in m for m in lower_models)}
    return per_model_pool(usd, prices, basis="list-price-credit", confidence="medium")

# BytePlus ModelArk Coding Plan models
_BYTEPLUS_PRICES = {
    "dola-seed-2.0-pro": {"input": 0.25, "output": 1.00, "cacheRead": 0.05, "cacheWrite": None},
    "dola-seed-2.0-lite": {"input": 0.08, "output": 0.24, "cacheRead": 0.015, "cacheWrite": None},
    "glm-5.3-flash": {"input": 0.05, "output": 0.15, "cacheRead": 0.01, "cacheWrite": None},
    "dola-seed-2.0-code": {"input": 0.20, "output": 0.80, "cacheRead": 0.04, "cacheWrite": None},
    "deepseek-v4-flash": {"input": 0.08, "output": 0.25, "cacheRead": 0.015, "cacheWrite": None},
    "deepseek-v4-pro": {"input": 0.50, "output": 2.00, "cacheRead": 0.10, "cacheWrite": None},
    "kimi k2.5": {"input": 0.35, "output": 1.40, "cacheRead": 0.07, "cacheWrite": None},
    "gpt-oss-120b": {"input": 0.20, "output": 0.80, "cacheRead": 0.02, "cacheWrite": None},
}

def _byteplus_pool(pool_million_tokens, models, basis_model="dola-seed-2.0-pro"):
    usd = pool_million_tokens * agent_blend_cost(_BYTEPLUS_PRICES[basis_model])
    lower_models = [m.lower() for m in models]
    prices = {k: v for k, v in _BYTEPLUS_PRICES.items() if any(k in m for m in lower_models)}
    return per_model_pool(usd, prices, basis="list-price-credit", confidence="medium")

# Alibaba Cloud Model Studio token plan models
_ALIBABA_PRICES = {
    "qwen 3.7 plus": {"input": 0.80, "output": 2.00, "cacheRead": 0.10, "cacheWrite": None},
    "qwen 3.6 plus": {"input": 0.40, "output": 1.20, "cacheRead": 0.05, "cacheWrite": None},
    "kimi k2.5": {"input": 0.35, "output": 1.40, "cacheRead": 0.07, "cacheWrite": None},
    "glm-5": {"input": 0.60, "output": 2.20, "cacheRead": 0.10, "cacheWrite": None},
    "minimax m2.5": {"input": 0.30, "output": 1.20, "cacheRead": 0.05, "cacheWrite": None},
}

def _alibaba_pool(pool_million_tokens, models, basis_model="qwen 3.6 plus"):
    usd = pool_million_tokens * agent_blend_cost(_ALIBABA_PRICES[basis_model])
    lower_models = [m.lower() for m in models]
    prices = {k: v for k, v in _ALIBABA_PRICES.items() if any(k in m for m in lower_models)}
    return per_model_pool(usd, prices, basis="list-price-credit", confidence="medium")

# Meta Muse Code models
_MUSE_PRICES = {
    "muse spark 1.3": {"input": 1.25, "output": 4.25, "cacheRead": 0.15, "cacheWrite": None},
    "llama 4 scout": {"input": 0.20, "output": 0.80, "cacheRead": 0.02, "cacheWrite": None},
    "llama 4 maverick": {"input": 1.00, "output": 3.00, "cacheRead": 0.10, "cacheWrite": None},
}

def _muse_pool(pool_million_tokens, models, basis_model="muse spark 1.3"):
    usd = pool_million_tokens * agent_blend_cost(_MUSE_PRICES[basis_model])
    lower_models = [m.lower() for m in models]
    prices = {k: v for k, v in _MUSE_PRICES.items() if any(k in m for m in lower_models)}
    return per_model_pool(usd, prices, basis="list-price-credit", confidence="medium")

# MiniMax Token Plan models
_MINIMAX_PRICES = {
    "minimax m3": {"input": 0.30, "output": 1.20, "cacheRead": 0.06, "cacheWrite": None},
    "m2.7": {"input": 0.20, "output": 0.80, "cacheRead": 0.04, "cacheWrite": None},
}

def _minimax_pool(pool_million_tokens, models=None, basis_model="minimax m3"):
    usd = pool_million_tokens * agent_blend_cost(_MINIMAX_PRICES[basis_model])
    if models is not None:
        lower_models = [m.lower() for m in models]
        prices = {k: v for k, v in _MINIMAX_PRICES.items() if any(k in m for m in lower_models)}
    else:
        prices = _MINIMAX_PRICES
    return per_model_pool(usd, prices, basis="list-price-credit", confidence="low")

def osint_meta(basis, source_url):
    """Provenance block for OSINT-derived task estimates."""
    return {
        "sourceUrl": source_url,
        "sourceQuote": (
            "Autonomous coding-agent tasks consume 200-800K input + 30-100K output "
            "tokens per task; interactive CLI sessions 60-240K"
        ),
        "sourceType": "research",
        "confidence": "low",
        "verifiedAt": LAST_VERIFIED,
        "basisModel": basis,
        "cacheAssumption": "Provider prompt caching at the plan's assumed cache rate",
    }


# 1. Cursor
write_json(
    "cursor.json",
    {
        "id": "cursor",
        "name": "Cursor",
        "category": "coding-ide",
        "url": "https://cursor.com/docs/account/pricing",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Hobby",
                "monthlyPrice": 0,
                "annualPrice": null,
                "limits": {
                    "agentRequests": "Limited Agent requests",
                    "composer": "Access to Composer",
                },
                "models": ["Cursor Grok 4.5", "Claude Haiku 4.5"],
                "estimatedTokenBudget": {
                    "description": "Limited Agent requests (~0.5M tokens/mo)",
                    "estimatedMillionTokens": 0.5,
                    "assumptions": "Limited agent requests at ~10-20K tokens/request with prompt-cache discount; exact quota unpublished",
                },
                "notes": "Free tier; no credit card required",
            },
            {
                "name": "Pro",
                "monthlyPrice": 20,
                "annualPrice": 192,
                "limits": {
                    "agentRequests": "Extended Agent limits",
                    "usagePools": "Cursor Models pool + Other Models pool (third-party at API rate), monthly reset",
                    "onDemand": "Extra usage on-demand at API rates, billed in arrears",
                },
                "models": [
                    "Cursor Grok 4.6",
                    "Composer 2.5",
                    "Claude Fable 5.1",
                    "Claude Opus 5",
                    "Claude Sonnet 5",
                    "GPT-5.6 Sol",
                    "Gemini 3.1 Pro",
                    "Gemini 3.8 Flash",
                    "Muse Spark 1.3",
                ],
                "perModelTokenBudgets": dict(_CURSOR_PRO_POOL),
                "estimatedTokenBudget": {
                    "description": "Pro Cursor-Models + Other-Models pools (~10M tokens/mo modeled)",
                    "estimatedMillionTokens": 10,
                    "assumptions": "Cursor does not publish pool sizes; modeled at ~$20 of equivalent API-rate spend at a blended ~$2/M with cache discounts ~= 10M tokens. Pro+ and Ultra are officially 3x and 20x this pool",
                },
                "notes": "Pools reset monthly; legacy request-based plans closed to new subs",
            },
            {
                "name": "Pro Plus",
                "monthlyPrice": 60,
                "annualPrice": 576,
                "limits": {
                    "agentRequests": "Larger usage pools",
                    "usagePools": "Same two pools as Pro, expanded",
                },
                "models": [
                    "Cursor Grok 4.6",
                    "Composer 2.5",
                    "Claude Fable 5.1",
                    "Claude Opus 5",
                    "Claude Sonnet 5",
                    "GPT-5.6 Sol",
                    "Gemini 3.8 Flash",
                ],
                "perModelTokenBudgets": dict(_CURSORPROPLUS_POOL),
                "estimatedTokenBudget": {
                    "description": "Official 3x Pro limits (~30M tokens/mo)",
                    "estimatedMillionTokens": 30,
                    "assumptions": "Cursor lists Pro+ as 3x Pro limits; 3 x our 10M Pro model = 30M tokens/mo",
                },
                "notes": "Recommended for daily agent users",
            },
            {
                "name": "Ultra",
                "monthlyPrice": 200,
                "annualPrice": 1920,
                "limits": {
                    "agentRequests": "Largest usage pools",
                    "usagePools": "Same two pools, maximum size",
                },
                "models": [
                    "Cursor Grok 4.6",
                    "Composer 2.5",
                    "Claude Fable 5.1",
                    "Claude Opus 5",
                    "GPT-6 Astra",
                    "Gemini 3.8 Flash",
                ],
                "perModelTokenBudgets": dict(_CURSOR_ULTRA_POOL),
                "estimatedTokenBudget": {
                    "description": "Official 20x Pro limits (~200M tokens/mo)",
                    "estimatedMillionTokens": 200,
                    "assumptions": "Cursor lists Ultra as 20x Pro limits; 20 x our 10M Pro model = 200M tokens/mo",
                },
                "notes": "For daily-driver agent power users",
            },
        ],
        "gotchas": [
            "Pricing uses two usage pools (Cursor Models vs Other Models at API rates) resetting monthly - not request counts",
            "On-demand usage after pool exhaustion is billed in arrears at API rates",
            "Max Mode and fast-request tiers exist only for grandfathered legacy subscriptions",
            "Teams adds a Cursor token rate ($0.25/M tokens) on third-party models",
            "India-only Start plan (Rs 649) limits users to the Cursor Models pool only",
            "Teams Standard ($40/user) and Premium ($120/user) plans are sold separately and are not modeled as tiers here",
            "Subscriptions are only sold directly via cursor.com; resellers are unauthorized and may be suspended",
        ],
        "tosHighlights": [
            "Privacy mode guarantees code is not used for training by Cursor or its model providers",
            "SOC 2 / ISO 27001 / ISO 42001 certified",
        ],
        "dataTraining": "Opt-out available in Privacy Mode",
        "ipIndemnity": false,
    },
)

# 2. GitHub Copilot
write_json(
    "github-copilot.json",
    {
        "id": "github-copilot",
        "name": "GitHub Copilot",
        "category": "coding-ide",
        "url": "https://github.com/features/copilot/plans",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Free",
                "monthlyPrice": 0,
                "limits": {
                    "completions": "2,000 completions/mo",
                    "aiCredits": "Limited allowance (auto model selection only)",
                    "agents": "Limited",
                },
                "models": ["Auto model selection only"],
                "estimatedTokenBudget": {
                    "description": "Limited free allowance (~0.4M tokens/mo)",
                    "estimatedMillionTokens": 0.4,
                    "assumptions": "2,000 completions * ~20 tokens + limited agent credits * $0.01/credit at ~$2/M blended = ~0.4M tokens; low confidence (allowance size not published)",
                },
                "notes": "Basic completions and limited chat; auto model selection only",
            },
            {
                "name": "Pro",
                "monthlyPrice": 10,
                "limits": {
                    "completions": "Unlimited completions on paid tiers",
                    "aiCredits": "1,000 base + 500 flex = 1,500 GitHub AI credits/mo",
                },
                "models": [
                    "Claude Sonnet 5",
                    "Claude Haiku 4.5",
                    "GPT-5.4",
                    "GPT-5.3-Codex",
                    "Gemini 3.5 Flash",
                    "Gemini 3.6 Flash",
                    "Gemini 3.7 Flash",
                    "Gemini 3.8 Flash",
                ],
                "perModelTokenBudgets": dict(_COPILOT_PRO),
                "estimatedTokenBudget": {
                    "description": "1,000 base AI credits/mo (~4.8M tokens; up to 1,500 with Flex)",
                    "estimatedMillionTokens": 4.8,
                    "midpointEstimate": 7.1,
                    "assumptions": "1 credit = $0.01; conservative counts only the $10 base credits (~4.8M at ~$2.10/M blended); midpoint includes the full $5 variable Flex allotment (~7.1M from $15). Copilot may reduce Flex, so base-only is the floor",
                },
                "notes": "Claude Sonnet 4.6 only for annual subscribers; premium models cost multiple credits",
            },
            {
                "name": "Pro+",
                "monthlyPrice": 39,
                "limits": {
                    "completions": "Unlimited completions",
                    "aiCredits": "3,900 base + 3,100 flex = 7,000 GitHub AI credits/mo",
                    "agents": "Delegate to Claude/Codex agents",
                },
                "models": [
                    "Claude Opus 5",
                    "Claude Fable 5.1",
                    "Claude Sonnet 5",
                    "GPT-5.3-Codex",
                    "GPT-5.4 nano",
                    "GPT-6 Astra",
                    "Gemini 3.8 Flash",
                ],
                "perModelTokenBudgets": dict(_COPILOTPPLUS),
                "estimatedTokenBudget": {
                    "description": "3,900 base AI credits/mo (~18.6M tokens; up to 7,000 with Flex)",
                    "estimatedMillionTokens": 18.6,
                    "midpointEstimate": 33,
                    "assumptions": "1 credit = $0.01; conservative counts only the $39 base credits (~18.6M at ~$2.10/M); midpoint adds the $31 variable Flex allotment (~33M from $70); premium models (Opus/Fable) burn credits faster",
                },
                "notes": "Priority premium-model access; agent delegation Pro+ only",
            },
            {
                "name": "Max",
                "monthlyPrice": 100,
                "limits": {
                    "completions": "Unlimited completions",
                    "aiCredits": "10,000 base + 10,000 flex = 20,000 GitHub AI credits/mo",
                },
                "models": [
                    "Claude Opus 5",
                    "Claude Fable 5.1",
                    "GPT-6 Astra",
                    "GPT-5.3-Codex",
                    "Gemini 3.8 Flash",
                ],
                "perModelTokenBudgets": dict(_SS_SS),
                "estimatedTokenBudget": {
                    "description": "10,000 base AI credits/mo (~47.6M tokens; up to 20,000 with Flex)",
                    "estimatedMillionTokens": 47.6,
                    "midpointEstimate": 95,
                    "assumptions": "1 credit = $0.01; conservative counts only the $100 base credits (~47.6M at ~$2.10/M); midpoint adds the $100 variable Flex allotment (~95M from $200)",
                },
                "notes": "Highest individual AI-credit allowance ($200 compute value)",
            },
            {
                "name": "Business",
                "monthlyPrice": 19,
                "limits": {
                    "aiCredits": "1,900 AI credits/user/mo (org-level billing)",
                    "policy": "Org policy control, no model training on org content",
                },
                "models": ["All premium models (per-user allowance)"],
                "estimatedTokenBudget": {
                    "description": "1,900 AI credits/user/mo (~9M tokens/user)",
                    "estimatedMillionTokens": 9,
                    "assumptions": "1 credit = $0.01; $19.00/user budget / ~$2.10/M blended = ~9M tokens/user",
                },
                "notes": "Centralized management and Copilot policy control",
            },
            {
                "name": "Enterprise",
                "monthlyPrice": 39,
                "limits": {
                    "aiCredits": "3,900 AI credits/user/mo (org pool)",
                    "overage": "$0.01 per credit",
                },
                "models": ["All premium models (org pool)"],
                "estimatedTokenBudget": {
                    "description": "3,900 AI credits/user/mo pooled (~19M tokens/user)",
                    "estimatedMillionTokens": 19,
                    "assumptions": "1 credit = $0.01; $39.00/user budget / ~$2.10/M blended = ~19M tokens/user",
                },
                "notes": "Enterprise Cloud features; unlicensed code-review users draw org credits",
            },
        ],
        "gotchas": [
            "Premium requests were replaced by GitHub AI Credits: 1 credit = $0.01, monthly reset with a variable 'Flex' allotment on top of base credits",
            "Opus 5, Fable 5/5.1 and GPT-5.4 nano are Pro+/Max only; Free/Student tiers only get auto model selection",
            "o3-mini, o1 and GPT-4.1 were retired from Copilot in Oct 2025-2026; Opus 4.5/4.6, Sonnet 4.5 and Gemini 3.1 Pro retired Sep 1 2026",
            "Premium models cost multiple credits per request; task cost varies with model and complexity",
            "Use of interaction data to train models can be opted out on individual plans; never on Business/Enterprise",
        ],
        "tosHighlights": [
            "Individual plans may use interaction data for model training with opt-out",
            "Business/Enterprise content is excluded from model training",
            "Claude Fable models retain data under Anthropic EFS rollout (ZDR exemption runs through end of 2026)",
        ],
        "dataTraining": "Opt-out available (individual); excluded on Business/Enterprise",
        "ipIndemnity": false,
    },
)

write_json(
    "claude-code.json",
    {
        "id": "claude-code",
        "name": "Claude Code",
        "category": "coding-ide",
        "url": "https://claude.com/pricing",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Pro",
                "monthlyPrice": 20,
                "annualPrice": 200,
                "limits": {
                    "rollingCap": "Shared 5-hour rolling session limit (>=5x Free tier)",
                    "weeklyAllocation": "Weekly caps on top of the 5-hour window",
                    "overage": "Opt-in usage credits billed at standard API rates, with optional monthly spend cap",
                },
                "models": ["Claude Opus 5", "Claude Sonnet 5", "Claude Haiku 4.5"],
                "estimatedTokenBudget": {
                    "description": "Shared 5h rolling cap (~12M agentic tokens/mo)",
                    "estimatedMillionTokens": 12,
                    "assumptions": "Anthropic publishes no numeric quota; research estimate ~= 12M mid-complexity agent tokens/mo within the Pro 5h+weekly window; exact size intentionally unpublished and varies by task complexity",
                },
                "perModelTokenBudgets": _claude_pool(12),
                "notes": "Annual Pro is $17/mo ($200 billed up front). Claude Code shares one pool with Claude.ai chat",
            },
            {
                "name": "Max5x",
                "monthlyPrice": 100,
                "limits": {
                    "rollingCap": "5x Pro usage per 5-hour session",
                    "weeklyAllocation": "Weekly sliding window scales with 5x multiplier",
                    "overage": "Usage credits at API rates (Fable draws weekly limits at 50%)",
                },
                "models": [
                    "Claude Opus 5",
                    "Claude Fable 5.1",
                    "Claude Sonnet 5",
                    "Claude Haiku 4.5",
                ],
                "estimatedTokenBudget": {
                    "description": "5x Pro rolling limit (~60M agentic tokens/mo)",
                    "estimatedMillionTokens": 60,
                    "assumptions": "5x the Pro research estimate; no official token figures published, low confidence",
                },
                "perModelTokenBudgets": _claude_pool(60, include_fable=True),
                "notes": "Higher output limits and priority access at peak times",
            },
            {
                "name": "Max20x",
                "monthlyPrice": 200,
                "limits": {
                    "rollingCap": "20x Pro usage per 5-hour session",
                    "weeklyAllocation": "Weekly sliding window scales with 20x multiplier",
                    "overage": "Usage credits at API rates",
                },
                "models": [
                    "Claude Opus 5",
                    "Claude Fable 5.1",
                    "Claude Sonnet 5",
                    "Claude Haiku 4.5",
                ],
                "estimatedTokenBudget": {
                    "description": "20x Pro rolling limit (~240M agentic tokens/mo)",
                    "estimatedMillionTokens": 240,
                    "assumptions": "20x the Pro research estimate; no official token figures published, low confidence",
                },
                "perModelTokenBudgets": _claude_pool(240, include_fable=True),
                "notes": "Maximum plan for full-time agent workflows; billed monthly",
            },
        ],
        "gotchas": [
            "Usage is quota-based per rolling 5-hour session plus weekly caps, deliberately NOT token- or message-metered",
            "After limits, work continues only if you opt into usage credits billed at standard API rates (with optional monthly spend cap)",
            "Claude Code shares the same usage pool as Claude.ai chat, desktop and mobile",
            "On Pro, Claude Fable 5.1 runs via usage credits only; on Max it consumes 50% of weekly limits",
            "Cache TTL is 1 hour on subscriptions but drops to 5 minutes while drawing usage credits",
        ],
        "tosHighlights": [],
        "dataTraining": "Model training opt-out available on individual plans",
        "ipIndemnity": false,
    },
)

write_json(
    "openai-codex.json",
    {
        "id": "openai-codex",
        "name": "OpenAI Codex (ChatGPT)",
        "category": "coding-ide",
        "url": "https://openai.com/chatgpt/pricing/",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Free",
                "monthlyPrice": 0,
                "limits": {"codex": "Limited Codex access"},
                "models": ["GPT-5.6 Luna"],
                "estimatedTokenBudget": {
                    "description": "Limited Codex (~0.75M tokens/mo)",
                    **task_estimate(3),
                    "assumptions": "Occasional Codex tasks: 3 tasks/mo x the 250K-900K OSINT agent-task band (0.75M floor / 1.65M / 2.7M); exact limit not published",
                    "estimateMeta": osint_meta(
                        "OpenAI Codex free quota (3 tasks/mo research estimate)",
                        "https://openai.com/chatgpt/pricing/",
                    ),
                },
                "notes": "Unlimited GPT-5.6 Luna text chats included",
            },
            {
                "name": "Go",
                "monthlyPrice": 8,
                "limits": {
                    "codex": "Limited Codex access; limited GPT-5.6 Terra",
                    "bonus": "More uploads/voice/deep research, longer memory; may include ads",
                },
                "models": ["GPT-5.6 Luna", "GPT-5.6 Terra"],
                "estimatedTokenBudget": {
                    "description": "Light coding assistance (~4.3M tokens/mo)",
                    **task_estimate(17),
                    "assumptions": "Limited tasks: ~17 tasks/mo x the 250K-900K OSINT agent-task band (4.25M floor / 9.35M / 15.3M); $8 price commonly cited but the scraped page did not render USD amounts",
                    "estimateMeta": osint_meta(
                        "OpenAI Codex Go quota (17 tasks/mo research estimate)",
                        "https://openai.com/chatgpt/pricing/",
                    ),
                },
                "perModelTokenBudgets": _gpt_pool(4.25, models=["GPT-5.6 Luna", "GPT-5.6 Terra"]),
                "notes": "Entry tier; ads possible",
            },
            {
                "name": "Plus",
                "monthlyPrice": 20,
                "limits": {
                    "codex": "Expanded Codex usage",
                    "context": "GPT Reasoning 256K",
                },
                "models": ["GPT-6 Astra", "GPT-5.6 Sol", "GPT-5.6 Terra"],
                "estimatedTokenBudget": {
                    "description": "Expanded Codex (~20M tokens/mo)",
                    **task_estimate(80),
                    "assumptions": "Research estimate: ~80 tasks/mo x the 250K-900K OSINT agent-task band (20M floor / 44M / 72M); no official numeric task limits",
                    "estimateMeta": osint_meta(
                        "OpenAI Codex Plus quota (80 tasks/mo research estimate)",
                        "https://openai.com/chatgpt/pricing/",
                    ),
                },
                "perModelTokenBudgets": _gpt_pool(20, models=["GPT-6 Astra", "GPT-5.6 Sol", "GPT-5.6 Terra"], basis_model="gpt-6 astra"),
                "notes": "More uploads/projects",
            },
            {
                "name": "Pro (5x)",
                "monthlyPrice": 100,
                "limits": {"codex": "5x Plus usage; high-volume Codex"},
                "models": ["GPT-6 Astra", "GPT-5.6 Sol"],
                "estimatedTokenBudget": {
                    "description": "5x Plus (~100M tokens/mo)",
                    **scale_estimate(task_estimate(80), 5),
                    "assumptions": "5x the Plus research estimate (100M floor / 220M / 360M)",
                    "estimateMeta": osint_meta(
                        "OpenAI Codex Pro 5x (official 5x Plus multiplier x 80-task band)",
                        "https://openai.com/chatgpt/pricing/",
                    ),
                },
                "perModelTokenBudgets": _gpt_pool(100, models=["GPT-6 Astra", "GPT-5.6 Sol"], basis_model="gpt-6 astra"),
                "notes": "Intermediate tier; price unconfirmed (JS-hidden on page)",
            },
            {
                "name": "Pro (maximum)",
                "monthlyPrice": 200,
                "limits": {
                    "codex": "Maximum Codex tasks",
                    "context": "GPT Reasoning 400K context",
                },
                "models": ["GPT-6 Astra", "GPT-5.6 Sol Pro"],
                "estimatedTokenBudget": {
                    "description": "Maximum Codex (~400M tokens/mo)",
                    **scale_estimate(task_estimate(80), 20),
                    "assumptions": "Research estimate: 20x the Plus research estimate (400M floor / 880M / 1,440M); maximum Codex tasks",
                    "estimateMeta": osint_meta(
                        "OpenAI Codex Pro maximum (20x Plus x 80-task band)",
                        "https://openai.com/chatgpt/pricing/",
                    ),
                },
                "perModelTokenBudgets": _gpt_pool(400, models=["GPT-6 Astra", "GPT-5.6 Sol Pro"], basis_model="gpt-6 astra"),
                "notes": "Pro tier per official page; USD not rendered in scrape (commonly cited $200)",
            },
        ],
        "gotchas": [
            "Codex ships inside ChatGPT plans, not a separate product",
            "Codex access is Limited on Free/Go, Expanded on Plus, Maximum on Pro",
            "GPT-5.3-Codex appears in other registries (GitHub Copilot) but is not marketed on ChatGPT pricing",
            "Content is used to train OpenAI models; opt-out available on all tiers",
        ],
        "tosHighlights": ["Training opt-out available on all tiers"],
        "dataTraining": "Used for training; opt-out available",
        "ipIndemnity": false,
    },
)

# 5. Google Antigravity
write_json(
    "google-antigravity.json",
    {
        "id": "google-antigravity",
        "name": "Google Antigravity",
        "category": "coding-ide",
        "url": "https://antigravity.google/pricing",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Individual",
                "monthlyPrice": 0,
                "limits": {
                    "quota": "Meaningful weekly quota, refreshed weekly (no 5-hour refresh)",
                    "rateLimit": "Basic weekly rate limits per model",
                    "tabCompletions": "Unlimited",
                    "commandRequests": "Unlimited",
                    "creditOverage": "Not available (Pro/Ultra only)",
                },
                "models": [
                    "Gemini 3.8 Flash",
                    "Gemini 3.7 Flash",
                    "Gemini 3.6 Flash",
                    "Gemini 3.1 Pro",
                    "Claude Sonnet 4.6",
                    "Claude Opus 4.6",
                    "gpt-oss-120b",
                ],
                "estimatedTokenBudget": {
                    "description": "Weekly-refresh baseline quota (~6.3M tokens/mo)",
                    **task_estimate(25),
                    "assumptions": "Research-based estimate: ~25 agent tasks/mo x the 250K-900K OSINT agent-task band (6.25M floor / 13.75M / 22.5M). Official quotas are undocumented and 'correlated with the amount of work done by the agent', so treat as low confidence",
                    "estimateMeta": osint_meta(
                        "Google Antigravity free quota (25 tasks/mo research estimate)",
                        "https://antigravity.google/pricing",
                    ),
                },
                "perModelTokenBudgets": _antigravity_pool(6.25, models=["Gemini 3.8 Flash", "Gemini 3.7 Flash", "Gemini 3.6 Flash", "Gemini 3.1 Pro", "Claude Sonnet 4.6", "Claude Opus 4.6", "gpt-oss-120b"]),
                "notes": "Free tier; no purchased AI-credit overage",
            },
            {
                "name": "Google AI Pro",
                "monthlyPrice": 19.99,
                "limits": {
                    "quota": "High quota, refreshed every 5 hours until weekly limit reached",
                    "rateLimit": "Higher weekly rate limit per model",
                    "tabCompletions": "Unlimited",
                    "creditOverage": "AI credits consumed at standard Gemini Enterprise Agent Platform pricing ('Never' or 'Always' toggle)",
                },
                "models": [
                    "Gemini 3.8 Flash",
                    "Gemini 3.7 Flash",
                    "Gemini 3.6 Flash",
                    "Gemini 3.1 Pro",
                    "Claude Sonnet 4.6",
                    "Claude Opus 4.6",
                    "gpt-oss-120b",
                ],
                "estimatedTokenBudget": {
                    "description": "5-hour refresh quota with weekly caps (~75M tokens/mo)",
                    **task_estimate(300),
                    "assumptions": "Research-based estimate: ~300 agent tasks/mo x the 250K-900K OSINT agent-task band (75M floor / 165M / 270M). No official task counts published; low confidence",
                    "estimateMeta": osint_meta(
                        "Google Antigravity Pro quota (300 tasks/mo research estimate)",
                        "https://antigravity.google/pricing",
                    ),
                },
                "perModelTokenBudgets": _antigravity_pool(75, models=["Gemini 3.8 Flash", "Gemini 3.7 Flash", "Gemini 3.6 Flash", "Gemini 3.1 Pro", "Claude Sonnet 4.6", "Claude Opus 4.6", "gpt-oss-120b"]),
                "notes": "Includes purchased AI-credit overage above baseline quota",
            },
            {
                "name": "Google AI Ultra 5x",
                "monthlyPrice": 99.99,
                "limits": {
                    "quota": "Highest quota, refreshed every 5 hours until weekly limit reached",
                    "rateLimit": "Highest weekly rate limit per model",
                    "tabCompletions": "Unlimited",
                    "creditOverage": "AI credits consumed at standard GEAP consumption pricing",
                },
                "models": [
                    "Gemini 3.8 Flash",
                    "Gemini 3.7 Flash",
                    "Gemini 3.6 Flash",
                    "Gemini 3.1 Pro",
                    "Claude Sonnet 4.6",
                    "Claude Opus 4.6",
                    "gpt-oss-120b",
                ],
                "estimatedTokenBudget": {
                    "description": "Official 5x Google AI Pro limits (~375M tokens/mo)",
                    **scale_estimate(task_estimate(300), 5),
                    "assumptions": "Google AI Ultra is officially 5x the Google AI Pro plan; 5 x our 75M Pro floor = 375M (midpoint 825M, ceiling 1,350M; low confidence, same basis as Pro)",
                    "estimateMeta": {
                        "sourceUrl": "https://one.google.com/about/google-ai-plans/",
                        "sourceQuote": "Google AI Ultra 5x: 5x higher usage limits than Google AI Pro",
                        "sourceType": "derived",
                        "confidence": "low",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "Google AI Pro research estimate (75M floor x 250K-900K task band)",
                    },
                },
                "perModelTokenBudgets": _antigravity_pool(375, models=["Gemini 3.8 Flash", "Gemini 3.7 Flash", "Gemini 3.6 Flash", "Gemini 3.1 Pro", "Claude Sonnet 4.6", "Claude Opus 4.6", "gpt-oss-120b"]),
                "notes": "Daily-driver tier; docs note access to third-party models (also available on non-Enterprise tiers)",
            },
            {
                "name": "Google AI Ultra 20x",
                "monthlyPrice": 199.99,
                "limits": {
                    "quota": "Highest quota, refreshed every 5 hours until weekly limit reached",
                    "rateLimit": "Highest weekly rate limit per model",
                    "tabCompletions": "Unlimited",
                    "creditOverage": "AI credits consumed at standard GEAP consumption pricing",
                },
                "models": [
                    "Gemini 3.8 Flash",
                    "Gemini 3.7 Flash",
                    "Gemini 3.6 Flash",
                    "Gemini 3.1 Pro",
                    "Claude Sonnet 4.6",
                    "Claude Opus 4.6",
                    "gpt-oss-120b",
                ],
                "estimatedTokenBudget": {
                    "description": "Official 20x Google AI Pro limits (~1.5B tokens/mo)",
                    **scale_estimate(task_estimate(300), 20),
                    "assumptions": "Google AI Ultra 20x is officially 20x the Google AI Pro plan; 20 x our 75M Pro floor = 1,500M (midpoint 3,300M, ceiling 5,400M; low confidence, same basis as Pro)",
                    "estimateMeta": {
                        "sourceUrl": "https://one.google.com/about/google-ai-plans/",
                        "sourceQuote": "Google AI Ultra 20x: 20x higher usage limits than Google AI Pro",
                        "sourceType": "derived",
                        "confidence": "low",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "Google AI Pro research estimate (75M floor x 250K-900K task band)",
                    },
                },
                "perModelTokenBudgets": _antigravity_pool(1500, models=["Gemini 3.8 Flash", "Gemini 3.7 Flash", "Gemini 3.6 Flash", "Gemini 3.1 Pro", "Claude Sonnet 4.6", "Claude Opus 4.6", "gpt-oss-120b"]),
                "notes": "Highest individual tier; supersedes the former $249.99 Ultra listing",
            },
            {
                "name": "Organization (Google Cloud)",
                "monthlyPrice": null,
                "limits": {
                    "billing": "Consumption-based pricing via Gemini Enterprise Agent Platform",
                    "governance": "Google Cloud Terms of Service; Cloud project integration",
                    "exclusion": "Claude and GPT-OSS reasoning models not available",
                },
                "models": [
                    "Gemini 3.8 Flash",
                    "Gemini 3.7 Flash",
                    "Gemini 3.6 Flash",
                    "Gemini 3.1 Pro",
                ],
                "estimatedTokenBudget": {
                    "description": "Pay-per-use at actual GEAP consumption rates - no fixed monthly token bundle",
                    "estimatedMillionTokens": 0,
                    "assumptions": "Token cost equals actual API consumption; included for tier completeness, not comparable to fixed-quota tiers",
                },
                "notes": "Included in select Gemini Enterprise app subscriptions (rolling out)",
            },
        ],
        "gotchas": [
            "Quotas are NOT token- or task-metered: rate limits are 'correlated with the amount of work done by the agent', so harder tasks consume allowance faster",
            "No official task or token counts are published; estimatedTokenBudget figures are research estimates and low confidence",
            "Pro/Ultra use a 5-hour refresh until the weekly cap is hit; free tier refreshes weekly only",
            "AI-credit overage is billed at standard Gemini Enterprise Agent Platform consumption pricing once baseline quota is exhausted",
            "Using third-party software/tools against Antigravity OAuth (e.g. OpenClaw) breaches the ToS and can lead to account suspension",
            "No BYOK or bring-your-own-endpoint support, even on paid tiers",
            "Google Cloud/Enterprise usage is governed by Google Cloud terms instead of the consumer terms",
        ],
        "tosHighlights": [
            "Interactions are recorded and used to evaluate and improve Google/Alphabet ML; in-settings opt-out available, deletion via antigravity-support@google.com",
            "Selecting Claude models binds you to Anthropic commercial terms in addition to Google's",
            "You are solely responsible for AI Agent actions, access grants, and production supervision",
        ],
        "dataTraining": "Interactions used for ML improvement with in-settings opt-out; deletion on request via antigravity-support@google.com",
        "ipIndemnity": false,
    },
)

# 6. Meta Muse Code
write_json(
    "meta-muse-code.json",
    {
        "id": "meta-muse-code",
        "name": "Meta Muse Code",
        "category": "coding-ide",
        "url": "https://developer.meta.com/ai/products/muse-code",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Everyday",
                "monthlyPrice": 5,
                "limits": {
                    "prompts": "10-50 prompts / 5h (official)",
                },
                "models": ["Muse Spark 1.3", "Llama 4 Scout"],
                "perModelTokenBudgets": _muse_pool(5, ["Muse Spark 1.3", "Llama 4 Scout"]),
                "estimatedTokenBudget": {
                    "description": "Light usage tier (~5M tokens/mo)",
                    "estimatedMillionTokens": 5,
                    "assumptions": "10-50 req/5h on lightweight models",
                },
                "notes": "Affordable entry-level coding assistance",
            },
            {
                "name": "High",
                "monthlyPrice": 15,
                "limits": {
                    "prompts": "5x Everyday usage (official)",
                },
                "models": ["Muse Spark 1.3", "Llama 4 Scout", "Llama 4 Maverick"],
                "perModelTokenBudgets": _muse_pool(25, ["Muse Spark 1.3", "Llama 4 Scout", "Llama 4 Maverick"]),
                "estimatedTokenBudget": {
                    "description": "5x Everyday usage (~25M tokens/mo, official multiplier)",
                    "estimatedMillionTokens": 25,
                    "assumptions": "Official multiplier: 5x the Everyday usage plan; applied to our 5M Everyday estimate",
                },
                "notes": "Standard developer tier with generous limits",
            },
            {
                "name": "Power",
                "monthlyPrice": 50,
                "limits": {
                    "prompts": "20x Everyday usage (official)",
                },
                "models": ["Muse Spark 1.3", "Llama 4 Maverick"],
                "perModelTokenBudgets": _muse_pool(100, ["Muse Spark 1.3", "Llama 4 Maverick"]),
                "estimatedTokenBudget": {
                    "description": "20x Everyday usage (~100M tokens/mo, official multiplier)",
                    "estimatedMillionTokens": 100,
                    "assumptions": "Official multiplier: 20x the Everyday usage plan; applied to our 5M Everyday estimate",
                },
                "notes": "Maximum rate limits and concurrent workflows",
            },
        ],
        "gotchas": [
            "Muse Code subscription keys work only with Muse Code, not the general Model API",
            "Training terms depend on which models you select; the Contributor/Standard choice changes them",
            "Regional availability restrictions apply",
        ],
        "tosHighlights": [
            "Contributor tier grants Meta royalty-free training rights on inputs/outputs",
            "Standard tier guarantees zero data retention and no model training",
        ],
        "dataTraining": "Depends on the selected models and API tier; Muse Code keys are limited to Muse Code and training terms are not uniform across models",
        "ipIndemnity": false,
    },
)

# 7. Kiro
write_json(
    "kiro.json",
    {
        "id": "kiro",
        "name": "Kiro",
        "category": "coding-ide",
        "url": "https://kiro.dev/pricing/",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Free",
                "monthlyPrice": 0,
                "limits": {
                    "credits": "50 credits/mo",
                    "models": "Rate-limited Sonnet-class + open-weight models",
                },
                "models": [
                    "Claude Sonnet 4.5",
                    "Qwen3 Coder Next",
                    "DeepSeek V3.2",
                    "MiniMax M2.1",
                ],
                "perModelTokenBudgets": {
                    "claude sonnet 4.5": {
                        "estimatedMillionTokens": 1,
                        "basis": "official-multiplier",
                        "confidence": "medium",
                    },
                    "qwen3 coder next": {
                        "estimatedMillionTokens": 26,
                        "basis": "official-multiplier",
                        "confidence": "medium",
                    },
                    "deepseek v3.2": {
                        "estimatedMillionTokens": 5,
                        "basis": "official-multiplier",
                        "confidence": "medium",
                    },
                    "minimax m2.1": {
                        "estimatedMillionTokens": 9,
                        "basis": "official-multiplier",
                        "confidence": "medium",
                    },
                },
                "estimatedTokenBudget": {
                    "description": "50 credits/mo (~1M tokens)",
                    "estimatedMillionTokens": 1,
                    "assumptions": "Credits consumed fractionally per request at ~$0.04/credit equivalent on Sonnet blended rate",
                },
                "notes": "Usage cap renews at start of next billing cycle",
            },
            {
                "name": "Pro",
                "monthlyPrice": 20,
                "limits": {
                    "credits": "1,000 credits/mo",
                    "overage": "Add-on credit packs available",
                },
                "models": [
                    "Claude Sonnet 5",
                    "Claude Opus 5",
                    "Auto mode",
                    "Qwen3 Coder Next",
                    "DeepSeek V3.2",
                    "MiniMax M2.1",
                ],
                "perModelTokenBudgets": {
                    "claude sonnet 5": {
                        "estimatedMillionTokens": 20,
                        "basis": "official-multiplier",
                        "confidence": "high",
                    },
                    "claude opus 5": {
                        "estimatedMillionTokens": 12,
                        "basis": "official-multiplier",
                        "confidence": "high",
                    },
                    "qwen3 coder next": {
                        "estimatedMillionTokens": 520,
                        "basis": "official-multiplier",
                        "confidence": "high",
                    },
                    "deepseek v3.2": {
                        "estimatedMillionTokens": 104,
                        "basis": "official-multiplier",
                        "confidence": "high",
                    },
                    "minimax m2.1": {
                        "estimatedMillionTokens": 173,
                        "basis": "official-multiplier",
                        "confidence": "high",
                    },
                },
                "estimatedTokenBudget": {
                    "description": "1,000 credits/mo (~20M tokens on Sonnet 5)",
                    "estimatedMillionTokens": 20,
                    "assumptions": "1 credit ~= $0.04; $40 equivalent / ~$2/M blended on Sonnet 5 ~= 20M tokens",
                },
                "notes": "Premium models + open-weight pool; monthly billing cycle",
            },
            {
                "name": "Pro+",
                "monthlyPrice": 40,
                "limits": {
                    "credits": "2,000 credits/mo",
                    "overage": "Add-on credit packs available",
                },
                "models": [
                    "Claude Sonnet 5",
                    "Claude Opus 5",
                    "Auto mode",
                    "Qwen3 Coder Next",
                    "DeepSeek V3.2",
                    "MiniMax M2.1",
                ],
                "perModelTokenBudgets": {
                    "claude sonnet 5": {
                        "estimatedMillionTokens": 40,
                        "basis": "official-multiplier",
                        "confidence": "high",
                    },
                    "claude opus 5": {
                        "estimatedMillionTokens": 24,
                        "basis": "official-multiplier",
                        "confidence": "high",
                    },
                    "qwen3 coder next": {
                        "estimatedMillionTokens": 1040,
                        "basis": "official-multiplier",
                        "confidence": "high",
                    },
                    "deepseek v3.2": {
                        "estimatedMillionTokens": 208,
                        "basis": "official-multiplier",
                        "confidence": "high",
                    },
                    "minimax m2.1": {
                        "estimatedMillionTokens": 347,
                        "basis": "official-multiplier",
                        "confidence": "high",
                    },
                },
                "estimatedTokenBudget": {
                    "description": "2,000 credits/mo (~40M tokens on Sonnet 5)",
                    "estimatedMillionTokens": 40,
                    "assumptions": "2,000 credits ~= $80 equivalent / ~$2/M blended ~= 40M tokens",
                },
                "notes": "Double Pro capacity",
            },
            {
                "name": "Pro Max",
                "monthlyPrice": 100,
                "limits": {
                    "credits": "5,000 credits/mo",
                    "overage": "Add-on credit packs available",
                },
                "models": [
                    "Claude Sonnet 5",
                    "Claude Opus 5",
                    "Auto mode",
                    "Open-weight models",
                ],
                "perModelTokenBudgets": {
                    "claude sonnet 5": {
                        "estimatedMillionTokens": 100,
                        "basis": "official-multiplier",
                        "confidence": "high",
                    },
                    "claude opus 5": {
                        "estimatedMillionTokens": 59,
                        "basis": "official-multiplier",
                        "confidence": "high",
                    },
                },
                "estimatedTokenBudget": {
                    "description": "5,000 credits/mo (~100M tokens on Sonnet 5)",
                    "estimatedMillionTokens": 100,
                    "assumptions": "5,000 credits ~= $200 equivalent / ~$2/M blended ~= 100M tokens",
                },
                "notes": "Heavier agentic usage",
            },
            {
                "name": "Power",
                "monthlyPrice": 200,
                "limits": {
                    "credits": "10,000 credits/mo",
                    "overage": "Add-on credit packs available",
                },
                "models": [
                    "Claude Sonnet 5",
                    "Claude Opus 5",
                    "Auto mode",
                    "Open-weight models",
                ],
                "perModelTokenBudgets": {
                    "claude sonnet 5": {
                        "estimatedMillionTokens": 200,
                        "basis": "official-multiplier",
                        "confidence": "high",
                    },
                    "claude opus 5": {
                        "estimatedMillionTokens": 118,
                        "basis": "official-multiplier",
                        "confidence": "high",
                    },
                },
                "estimatedTokenBudget": {
                    "description": "10,000 credits/mo (~200M tokens on Sonnet 5)",
                    "estimatedMillionTokens": 200,
                    "assumptions": "10,000 credits ~= $400 equivalent / ~$2/M blended ~= 200M tokens",
                },
                "notes": "Maximum capacity tier added Aug 2026",
            },
        ],
        "gotchas": [
            "Credits reset monthly at billing-cycle start, not rolling 5-hour windows",
            "Credits are consumed fractionally per request; complex spec-driven tasks burn many credits",
            "Not all premium models are available in every country/region",
            "AWS owns Kiro - usage governed under AWS terms",
        ],
        "tosHighlights": [],
        "dataTraining": "Not published on pricing page",
        "ipIndemnity": false,
    },
)

# 8. Kilo AI
write_json(
    "kilo-code.json",
    {
        "id": "kilo-code",
        "name": "Kilo Code",
        "category": "coding-router",
        "url": "https://kilo.ai/pricing",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Individual",
                "monthlyPrice": 0,
                "limits": {
                    "models": "Access to 500+ models via Kilo Gateway or BYOK",
                    "gatewayFee": "5% on all plans (no markup vs list price)",
                },
                "models": ["Kilo Gateway (500+ models)"],
                "estimatedTokenBudget": {
                    "description": "PAYG at provider list rates + 5% gateway fee",
                    "estimatedMillionTokens": 0,
                    "assumptions": "Token cost equals provider list price; no fixed monthly bundle",
                },
                "notes": "Free for individuals; cloud compute billed separately per-hour",
            },
            {
                "name": "Teams",
                "monthlyPrice": 15,
                "limits": {
                    "seats": "$15/user/mo collaboration platform",
                    "inference": "Billed at provider rates; EU inference available",
                    "markup": "Inference passed through at provider rates with no markup; credit top-ups carry a 5% fee",
                    "kiloPass": "Kilo Pass Starter $19 / Pro $49 / Expert $199; up to 50% bonus credits (annual: 50% every month)",
                },
                "models": ["Kilo Gateway (500+ models)"],
                "estimatedTokenBudget": {
                    "description": "Platform fee; ~15M fee-equivalent tokens at open-model rates",
                    "estimatedMillionTokens": 15,
                    "midpointEstimate": 30,
                    "optimisticEstimate": 45,
                    "assumptions": "Platform-fee plan: no token bundle included; inference billed separately at provider rates + 5% gateway fee (BYOK zero fee). Figures are the fee-equivalent value of $15 at ~$1.00/M (conservative) to ~$0.33/M (optimistic open-model gateway rates) for cross-plan comparison only",
                },
                "notes": "Security/governance features included",
            },
            {
                "name": "Enterprise",
                "monthlyPrice": null,
                "limits": {"volume": "Quote-based", "support": "Dedicated"},
                "models": ["Kilo Gateway (500+ models)"],
                "estimatedTokenBudget": {
                    "description": "Custom agree - quote-based",
                    "estimatedMillionTokens": 0,
                    "assumptions": "No fixed bundle; negotiated enterprise agreement covers negotiated volume",
                },
                "notes": "Enterprise support and controls",
            },
        ],
        "gotchas": [
            "Rebranded kilocode.ai -> kilo.ai; pricing restructured to platform fee + inference + cloud compute",
            "Kilo Pass converts dollars 1:1 into paid credits, then adds bonus credits (50% month one; streak bonuses on monthly, 50% every month on annual)",
            "Bonus credits expire monthly; paid credits apply across IDE/CLI/Cloud Agents/Gateway",
            "Cloud agents billed per second (Gas Town $1.20/hr, Code Review $0.33/hr, Cloud Agent $0.60-1.20/hr)",
        ],
        "tosHighlights": [],
        "dataTraining": "No training on your code (official)",
        "ipIndemnity": false,
    },
)

# 9. Lovable
write_json(
    "lovable.json",
    {
        "id": "lovable",
        "name": "Lovable",
        "category": "coding-ide",
        "url": "https://lovable.dev/pricing",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Free",
                "monthlyPrice": 0,
                "limits": {
                    "buildCredits": "5 daily build credits (cap 30/mo)",
                    "grants": "20 credits/mo Cloud grant + 4 credits/mo AI grant",
                },
                "models": ["Lovable Agent"],
                "estimatedTokenBudget": {
                    "description": "30 build credits + monthly grants (~3M tokens/mo)",
                    "estimatedMillionTokens": 3,
                    "assumptions": "~30 usable credits/mo * ~100K tokens per build+agent mix",
                },
                "notes": "Daily credits reset at 00:00 UTC; monthly grants on 1st; no rollover",
            },
            {
                "name": "Pro 100",
                "monthlyPrice": 25,
                "limits": {
                    "buildCredits": "100 credits/mo (annual $21/mo)",
                    "dailyFloor": "5 daily build credits + 20 Cloud + 4 AI grants stack on top",
                    "rollover": "Monthly credits roll over (expire 2 months later on monthly billing)",
                },
                "models": ["Lovable Agent"],
                "estimatedTokenBudget": {
                    "description": "100+ credits/mo (~15M tokens)",
                    "estimatedMillionTokens": 15,
                    "assumptions": "~150K tokens per credit across builds, hosting and AI gateway usage; scales to 10,000 credits ($2,250/mo)",
                },
                "notes": "Unified credit balance covers builds + Cloud hosting + AI gateway on deployed apps",
            },
            {
                "name": "Business",
                "monthlyPrice": 50,
                "limits": {
                    "buildCredits": "100 credits tier at $50/mo (annual $42) - scales with tier",
                    "privacy": "Workspace data excluded from AI model training by default",
                },
                "models": ["Lovable Agent"],
                "estimatedTokenBudget": {
                    "description": "Business minimum tier (~40M tokens/mo at 200+ cr tiers typical)",
                    "estimatedMillionTokens": 40,
                    "assumptions": "Same per-credit token estimate as Pro; minimum $50 tier",
                },
                "notes": "SSO/central admin at higher Business tiers; Enterprise custom",
            },
        ],
        "gotchas": [
            "Credits are a unified balance covering app builds, hosting (Cloud) and AI gateway usage of deployed apps",
            "Free-tier credits do NOT roll over; Pro credits expire 2 months after issue on monthly plans",
            "Daily 5 build credits are a floor, not a bonus: monthly credits also include daily research",
            "Higher credit tiers scale steeply: 200 cr $50, 400 cr $100, 800 cr $200 ... 10,000 cr $2,250",
        ],
        "tosHighlights": [
            "Business and Enterprise exclude workspace data from AI model training by default",
            "Free/Pro can opt out per account",
        ],
        "dataTraining": "Excluded by default on Business+; opt-out available on Free/Pro",
        "ipIndemnity": false,
    },
)

# 10. Kimi Code
write_json(
    "kimi-code.json",
    {
        "id": "kimi-code",
        "name": "Kimi Code",
        "category": "coding-router",
        "url": "https://www.kimi.com/coding-plan/",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Moderato",
                "monthlyPrice": 19,
                "annualPrice": 180,
                "limits": {
                    "quota": "Weekly-refreshed usage quota (~300 requests / 5h windows)",
                    "models": "Kimi K3 incl. K3-256k",
                },
                "models": ["Kimi K3", "K2.7 Code"],
                "estimatedTokenBudget": {
                    "description": "Weekly-refreshed quota (~60M tokens/mo)",
                    "estimatedMillionTokens": 60,
                    "assumptions": "~300 req/window at kimi-k2.7-code rates ($0.19 cache/$0.95 input/$4.00 output; ~95% cache hit ~= $0.37/M blended) ~= 60M tokens/mo",
                },
                "perModelTokenBudgets": _kimi_pool(60, models=["Kimi K3", "K2.7 Code"]),
                "notes": "Tiers named after musical terms; K3 has low/high/max thinking modes",
            },
            {
                "name": "Allegretto",
                "monthlyPrice": 39,
                "annualPrice": 372,
                "limits": {
                    "quota": "Higher weekly limits + higher concurrency",
                    "speed": "K3 HighSpeed (5-6x speed, ~3x credit burn); 1M-context K3",
                },
                "models": ["Kimi K3", "K2.7 Code"],
                "estimatedTokenBudget": {
                    "description": "Higher weekly quota (~150M tokens/mo)",
                    "estimatedMillionTokens": 150,
                    "assumptions": "Research estimate scaled above Moderato; HighSpeed triples burn rate",
                },
                "perModelTokenBudgets": _kimi_pool(150, models=["Kimi K3", "K2.7 Code"]),
                "notes": "Unlocks HighSpeed model and 1M context",
            },
            {
                "name": "Allegro",
                "monthlyPrice": 99,
                "annualPrice": 948,
                "limits": {
                    "quota": "Expansive quota (~600-800 req/5h)",
                    "concurrency": "Higher caps",
                },
                "models": ["Kimi K3", "K2.7 Code"],
                "estimatedTokenBudget": {
                    "description": "Expansive quota (~400M tokens/mo)",
                    "estimatedMillionTokens": 400,
                    "assumptions": "Research estimate; exact credit counts not officially published",
                },
                "perModelTokenBudgets": _kimi_pool(400, models=["Kimi K3", "K2.7 Code"]),
                "notes": "Heavy daily agentic coding",
            },
            {
                "name": "Vivace",
                "monthlyPrice": 199,
                "annualPrice": 1908,
                "limits": {
                    "quota": "Highest weekly quotas (~1,200 req/5h)",
                    "concurrency": "Max caps",
                },
                "models": ["Kimi K3", "K2.7 Code"],
                "estimatedTokenBudget": {
                    "description": "Highest quota (~800M tokens/mo)",
                    "estimatedMillionTokens": 800,
                    "assumptions": "Research estimate; not officially published",
                },
                "perModelTokenBudgets": _kimi_pool(800, models=["Kimi K3", "K2.7 Code"]),
                "notes": "Max tier",
            },
        ],
        "gotchas": [
            "Quotas refresh weekly with ~5-hour rolling request windows (roughly 300-1,200 req/window by tier)",
            "K3 HighSpeed runs 5-6x faster but burns ~3x credits",
            "Exact credit counts per window are not officially published - estimates are research-derived",
            "K2.7 Code is the coding-optimized workhorse; K3 is the general flagship",
        ],
        "tosHighlights": [],
        "dataTraining": "Not published on pricing page",
        "ipIndemnity": false,
    },
)

# 11. Windsurf
write_json(
    "windsurf.json",
    {
        "id": "windsurf",
        "name": "Windsurf (Cognition)",
        "category": "coding-ide",
        "url": "https://windsurf.com/pricing",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Free",
                "monthlyPrice": 0,
                "limits": {
                    "quota": "Light auto-refreshing usage allowance (daily + weekly)",
                    "models": "Limited model availability",
                    "concurrency": "Up to 10 concurrent sessions",
                },
                "models": ["SWE-2", "Kimi K2.5", "GPT 5.2 Mini", "Claude Haiku 4.5"],
                "estimatedTokenBudget": {
                    "description": "Light agent quota (~3.3M tokens/mo)",
                    **task_estimate(13),
                    "assumptions": "Usage allowance refreshes daily+weekly; size not published; research estimate at ~13 agent tasks/mo x the 250K-900K OSINT agent-task band (3.25M floor / 7.15M / 11.7M), low confidence",
                    "estimateMeta": osint_meta(
                        "Windsurf free quota (13 tasks/mo research estimate)",
                        "https://windsurf.com/pricing",
                    ),
                },
                "notes": "Unlimited inline edits and Tab completions",
            },
            {
                "name": "Pro",
                "monthlyPrice": 20,
                "limits": {
                    "quota": "Increased auto-refreshing daily + weekly allowance (size not published)",
                    "overage": "Extra usage purchased at API pricing",
                    "concurrency": "Up to 10 concurrent sessions",
                },
                "models": [
                    "SWE-2",
                    "Claude Sonnet 5",
                    "Claude Haiku 4.5",
                    "GPT-5.2",
                    "Kimi K2.5",
                ],
                "estimatedTokenBudget": {
                    "description": "Pro daily+weekly quota (~75M tokens/mo)",
                    **task_estimate(300),
                    "assumptions": "Research estimate: ~300 agent tasks/mo x the 250K-900K OSINT agent-task band (75M floor / 165M / 270M); official quotas unpublished, low confidence",
                    "estimateMeta": osint_meta(
                        "Windsurf Pro quota (300 tasks/mo research estimate)",
                        "https://windsurf.com/pricing",
                    ),
                },
                "notes": "Frontier OpenAI/Claude/Gemini access + open-source models; Devin Cloud included",
            },
            {
                "name": "Max",
                "monthlyPrice": 200,
                "limits": {
                    "quota": "Significantly higher daily + weekly allowance (size not published)",
                    "overage": "Extra usage at API pricing",
                    "concurrency": "Unlimited concurrent sessions",
                },
                "models": [
                    "SWE-2",
                    "Claude Sonnet 5",
                    "Claude Haiku 4.5",
                    "GPT-5.2",
                    "Kimi K2.5",
                ],
                "estimatedTokenBudget": {
                    "description": "Max daily+weekly quota (~375M tokens/mo)",
                    **scale_estimate(task_estimate(300), 5),
                    "assumptions": "Research estimate: 5x the Pro tier floor (375M floor / 825M / 1,350M); official headroom unpublished, low confidence",
                    "estimateMeta": osint_meta(
                        "Windsurf Max quota (5x Pro presumption x 300-task band)",
                        "https://windsurf.com/pricing",
                    ),
                },
                "notes": "Power tier for daily-driver agent workflows",
            },
            {
                "name": "Teams",
                "monthlyPrice": 80,
                "limits": {
                    "quota": "Pro-level quota per full dev seat",
                    "billing": "$80/mo team base + $40/mo per full user seat",
                    "concurrency": "Unlimited concurrent sessions",
                },
                "models": [
                    "SWE-2",
                    "Claude Sonnet 5",
                    "Claude Haiku 4.5",
                    "GPT-5.2",
                    "Kimi K2.5",
                ],
                "estimatedTokenBudget": {
                    "description": "Pro-level quota per full user seat (~75M tokens/mo/seat)",
                    **task_estimate(300),
                    "assumptions": "Per-seat quota mirrors the Pro tier (75M floor / 165M / 270M); additional seats $40/mo each",
                    "estimateMeta": osint_meta(
                        "Windsurf Teams seat quota (mirrors Pro 300-task band)",
                        "https://windsurf.com/pricing",
                    ),
                },
                "notes": "Includes Devin Desktop, sharing, centralized billing, admin analytics",
            },
        ],
        "gotchas": [
            "After Cognition's acquisition, windsurf.com/pricing serves the Devin-branded plan sheet; there is no separate Windsurf editor pricing",
            "Quotas are undisclosed 'usage allowances' that refresh daily and weekly; overage is consumed at API pricing",
            "SWE-2 is included free in Devin Desktop and CLI only through Oct 10, 2026",
            "Message cost varies by model, task size and complexity - not a fixed token count",
            "Old 'Cascade prompts' / 'Fast prompts' terminology is retired from pricing",
        ],
        "tosHighlights": [
            "Concurrent sessions: up to 10 on Free/Pro, unlimited on Max/Teams",
        ],
        "dataTraining": "Not published on pricing page",
        "ipIndemnity": false,
    },
)

write_json(
    "augment-code.json",
    {
        "id": "augment-code",
        "name": "Augment Code",
        "category": "coding-ide",
        "url": "https://www.augmentcode.com/pricing",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Standard",
                "monthlyPrice": 20,
                "limits": {
                    "billing": "$20/mo flat per team (no per-seat charge), up to 50 seats",
                    "usage": "$20 of usage included/mo (LLM + Context Engine + compute)",
                    "llmFee": "Provider list price + flat 40% service fee on LLM usage",
                    "topUps": "PAYG top-ups valid 12 months",
                },
                "models": ["Cosmos", "API models via provider list"],
                "estimatedTokenBudget": {
                    "description": "$20 usage pool with 40% LLM fee (~7.1M tokens)",
                    "estimatedMillionTokens": 7.1,
                    "assumptions": "$20.00 / (blended $2/M provider rate * 1.4) ~= 7.1M tokens on frontier models",
                    "estimateMeta": {
                        "sourceUrl": "https://www.augmentcode.com/pricing",
                        "sourceQuote": "flat 40% fee on LLM usage; $20 of usage included per month",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "frontier API models at ~$2/M blended",
                    },
                },
                "notes": "Restructured from per-seat message plans to pooled usage",
            },
            {
                "name": "Business",
                "monthlyPrice": 100,
                "limits": {
                    "billing": "$100/mo flat per team, up to 50 seats",
                    "usage": "$100 of usage included/mo",
                },
                "models": ["Cosmos", "API models"],
                "estimatedTokenBudget": {
                    "description": "$100 usage pool (~35.7M tokens)",
                    "estimatedMillionTokens": 35.7,
                    "assumptions": "$100.00 / (blended $2/M * 1.4) ~= 35.7M tokens",
                    "estimateMeta": {
                        "sourceUrl": "https://www.augmentcode.com/pricing",
                        "sourceQuote": "$100 of usage included per month with the flat 40% LLM fee",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "frontier API models at ~$2/M blended",
                    },
                },
                "notes": "Same 40% LLM service fee structure",
            },
            {
                "name": "Enterprise",
                "monthlyPrice": null,
                "limits": {
                    "billing": "Custom usage + top-ups; unlimited seats",
                    "security": "SSO/OIDC/SCIM",
                },
                "models": ["Cosmos", "API models"],
                "estimatedTokenBudget": {
                    "description": "Custom usage contract",
                    "estimatedMillionTokens": 0,
                    "assumptions": "No fixed bundle; negotiated enterprise agreement covers negotiated volume",
                },
                "notes": "Volume-based",
            },
        ],
        "gotchas": [
            "Restructured from seat-based message plans to flat team pricing with dollar usage pools",
            "LLM usage billed at provider list price + 40% service fee; compute at cost (no fee)",
            "Top-up tokens valid 12 months",
        ],
        "tosHighlights": ["No AI training allowed under Commercial Terms"],
        "dataTraining": "No AI training on any plan",
        "ipIndemnity": false,
    },
)

# 13. Replit
write_json(
    "replit.json",
    {
        "id": "replit",
        "name": "Replit",
        "category": "coding-ide",
        "url": "https://replit.com/pricing",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Core",
                "monthlyPrice": 20,
                "annualPrice": 216,
                "limits": {
                    "agentHours": "Up to 30 hours of chat in Free Mode",
                    "projects": "Up to 60 projects on Free Mode",
                    "modelCredits": "$20 toward most powerful models",
                },
                "models": ["Replit Agent", "Frontier model pool"],
                "estimatedTokenBudget": {
                    "description": "$20 model-credit pool + 30 agent-hours (~24M tokens)",
                    "estimatedMillionTokens": 24,
                    "assumptions": "$20.00 / ~$0.83/M blended on mixed frontier models ~= 24M tokens",
                },
                "notes": "Annual billing drops to $18/mo; unlimited workspaces",
            },
            {
                "name": "Pro",
                "monthlyPrice": 100,
                "annualPrice": 1080,
                "limits": {
                    "parallelAgents": "10 parallel agents",
                    "modelCredits": "$100 toward most powerful models",
                    "collaboration": "15 collaborators, 50 viewers",
                },
                "models": ["Multi-agent frontier models"],
                "estimatedTokenBudget": {
                    "description": "$100 model-credit pool (~120M tokens)",
                    "estimatedMillionTokens": 120,
                    "assumptions": "$100.00 / ~$0.83/M blended ~= 120M tokens",
                },
                "notes": "10 parallel agents; DB rollback 28 days",
            },
            {
                "name": "Enterprise",
                "monthlyPrice": null,
                "limits": {
                    "billing": "Custom seats; SSO/SAML, single-tenant, static IPs"
                },
                "models": ["Custom fleet"],
                "estimatedTokenBudget": {
                    "description": "Custom contract",
                    "estimatedMillionTokens": 0,
                    "assumptions": "No fixed bundle; negotiated enterprise agreement covers negotiated volume",
                },
                "notes": "Advanced privacy controls",
            },
        ],
        "gotchas": [
            "$20/$100 'toward most powerful models' is a dollar credit pool, not free tokens",
            "Beyond included Free-Mode hours, effort-based pricing applies (agent-hours billed as usage)",
            "Optional Prepacks: $90/$215/$425/$825/$2,000 per month",
            "Exact checkpoint consumption per tier not officially published",
        ],
        "tosHighlights": [],
        "dataTraining": "Not published on pricing page",
        "ipIndemnity": false,
    },
)

# 14. Amazon Q
write_json(
    "amazon-q.json",
    {
        "id": "amazon-q",
        "name": "Amazon Q Developer",
        "category": "coding-ide",
        "url": "https://aws.amazon.com/q/developer/pricing/",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Free Tier",
                "monthlyPrice": 0,
                "limits": {
                    "agenticRequests": "50 agentic requests/mo (chat + agentic coding)",
                    "transformation": "Java/.NET transformation 1,000 LOC/mo per user",
                },
                "models": ["Latest Claude models via AWS"],
                "estimatedTokenBudget": {
                    "description": "50 agentic requests/mo (~1.1M tokens on the standard request basis)",
                    "estimatedMillionTokens": 1.05,
                    "assumptions": "Official 50 agentic requests/mo x the site-standard 20K-in/1K-out request (21K) = 1.05M tokens. AWS agentic requests may carry more context, so treat this as the floor",
                    "estimateMeta": {
                        "sourceUrl": "https://aws.amazon.com/q/developer/pricing/",
                        "sourceQuote": "Free tier: 50 agentic requests per month",
                        "sourceType": "derived",
                        "confidence": "high",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "standard 20K-in/1K-out agent request",
                    },
                },
                "notes": "Agentic request = any Q&A chat or coding interaction",
            },
            {
                "name": "Pro",
                "monthlyPrice": 19,
                "limits": {
                    "billing": "$19/user/mo, activates on first agentic usage (pro-rata)",
                    "requests": "Higher agentic request limits (not numerically published)",
                    "transformation": "4,000 LOC/mo pooled with $0.003/LOC overage",
                },
                "models": ["Latest Claude models via AWS"],
                "estimatedTokenBudget": {
                    "description": "Higher request pool (~21M floor / ~105M midpoint / ~210M ceiling scenarios)",
                    "estimatedMillionTokens": 21,
                    "midpointEstimate": 105,
                    "optimisticEstimate": 210,
                    "assumptions": "AWS publishes no numeric Pro request cap (only 'higher limits'). Scenario band on the standard 21K request: 1,000 requests/mo = 21M (floor), 5,000 = 105M, 10,000 = 210M. Low confidence - use only as a planning scenario",
                    "estimateMeta": {
                        "sourceUrl": "https://aws.amazon.com/q/developer/pricing/",
                        "sourceQuote": "Pro: higher agentic request limits (not numerically published)",
                        "sourceType": "research",
                        "confidence": "low",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "standard 20K-in/1K-out agent request",
                    },
                },
                "notes": "Identity Center/IAM; IP indemnity included",
            },
        ],
        "gotchas": [
            "Pro request cap is not numerically published - token estimate is research-derived",
            "Subscription activates only on first agentic action or code completion",
            "Transformation overage billed at $0.003/LOC at payer-account level",
            "Data collection: opt-out available on Free; automatically opted out on Pro",
        ],
        "tosHighlights": [],
        "dataTraining": "Opt-out available (Free); automatic opt-out (Pro)",
        "ipIndemnity": true,
    },
)

# 15. Tabnine
write_json(
    "tabnine.json",
    {
        "id": "tabnine",
        "name": "Tabnine",
        "category": "coding-ide",
        "url": "https://www.tabnine.com/pricing/",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Code Assistant",
                "monthlyPrice": 39,
                "limits": {
                    "billing": "$39/user/mo (annual subscription)",
                    "usage": "Unlimited when using your own LLM on-prem/VPC; Tabnine-provided LLM access billed at provider list price + 5% handling fee",
                    "deployment": "SaaS, VPC, on-prem, or air-gapped; zero code retention",
                },
                "models": ["Tabnine Protected"],
                "estimatedTokenBudget": {
                    "description": "Platform fee; ~19.5M fee-equivalent tokens",
                    "estimatedMillionTokens": 19.5,
                    "midpointEstimate": 39,
                    "optimisticEstimate": 78,
                    "assumptions": "Platform-fee plan: no token bundle included; Tabnine-provided LLM access is billed at provider list price + 5% handling fee, BYO LLM endpoint is unlimited. Figures are fee-equivalent at ~$2.00/M (conservative), ~$1.00/M (midpoint) and ~$0.50/M (optimistic) for cross-plan comparison only",
                },
                "notes": "Completions + grounded chat in IDEs; Jira integration; SOC 2/ISO 27001",
            },
            {
                "name": "Agentic Platform",
                "monthlyPrice": 59,
                "limits": {
                    "billing": "$59/user/mo (annual subscription)",
                    "usage": "Same LLM economics as Code Assistant",
                    "included": "Context Engine, Tabnine CLI agents, MCP tool use, headless agents (optional add-on)",
                },
                "models": ["Tabnine Protected"],
                "estimatedTokenBudget": {
                    "description": "Platform fee; ~29.5M fee-equivalent tokens",
                    "estimatedMillionTokens": 29.5,
                    "midpointEstimate": 59,
                    "optimisticEstimate": 118,
                    "assumptions": "Platform-fee plan: no token bundle included; same LLM economics as Code Assistant. Figures are fee-equivalent at ~$2.00/M / ~$1.00/M / ~$0.50/M for cross-plan comparison only",
                },
                "notes": "Adds autonomous agents, Coaching Guidelines, Jira/Confluence/database MCP access",
            },
            {
                "name": "Enterprise (Custom)",
                "monthlyPrice": null,
                "limits": {
                    "volume": "Quote-based; IP indemnification subject to terms",
                    "compliance": "GDPR, SOC 2, ISO 27001",
                },
                "models": ["Tabnine Protected"],
                "estimatedTokenBudget": {
                    "description": "Custom volume contract",
                    "estimatedMillionTokens": 0,
                    "assumptions": "Negotiated enterprise agreement",
                },
                "notes": "Headless agent add-on priced separately at tabnine.com/headless-agent-pricing",
            },
        ],
        "gotchas": [
            "Tabnine was acquired by Tricentis (agentic quality engineering) and consumer self-serve tiers (Starter/Pro $15) are discontinued",
            "Pricing is enterprise-first: annual per-user subscription with quote-based procurement",
            "Using your own LLM endpoint = unlimited usage; Tabnine-provided LLM access adds a 5% handling fee over provider list prices",
            "Reserve-token model means monthly token totals are not fixed",
        ],
        "tosHighlights": [
            "Zero code retention; no training on your code on all plans",
            "License-safe usage with provenance and attribution reporting",
        ],
        "dataTraining": "Training never occurs on customer code",
        "ipIndemnity": true,
    },
)

write_json(
    "aider.json",
    {
        "id": "aider",
        "name": "Aider",
        "category": "coding-ide",
        "url": "https://aider.chat",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Free / BYOK",
                "monthlyPrice": 0,
                "limits": {
                    "toolCost": "100% Free Open Source Software",
                    "rateLimits": "Determined by your chosen API provider",
                    "byok": "Bring Your Own Key",
                },
                "models": [
                    "Claude Sonnet 5",
                    "GPT-6 Astra",
                    "DeepSeek V4.1 Flash",
                    "All OpenRouter models",
                ],
                "estimatedTokenBudget": {
                    "description": "Direct BYOK API billing (0% tool markup)",
                    "estimatedMillionTokens": 20,
                    "assumptions": "Depends entirely on connected API key spend ($20 buys ~10M–130M tokens)",
                },
                "notes": "Open-source CLI pair programmer. Bring your own API key",
            }
        ],
        "gotchas": [
            "No hosted cloud backend — you pay the LLM API provider directly",
            "Large repo git-map indexing consumes significant context on startup",
            "Requires local Python environment and git repo",
        ],
        "tosHighlights": [
            "Aider never sees or stores your code or API keys",
            "TOS and privacy governed solely by your LLM API provider",
        ],
        "dataTraining": "Depends on API provider chosen",
        "ipIndemnity": false,
    },
)

# 17. CommandCode
write_json(
    "commandcode.json",
    {
        "id": "commandcode",
        "name": "CommandCode",
        "category": "coding-router",
        "url": "https://commandcode.ai/pricing",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Go",
                "monthlyPrice": 1,
                "limits": {
                    "credits": "$10/mo compute credits (up to ~$20 with deals)",
                    "requests": "~15K",
                },
                "models": ["GPT-5.6 Luna", "Grok 4.5", "Qwen 3.8 Max", "MiniMax M3"],
                "modelAllowances": {
                    "open": 10.0,
                    "default": 10.0,
                },
                "perModelTokenBudgets": dict(_CMD_GPT_POOL),
                "estimatedTokenBudget": {
                    "description": "$10 compute credits (~15M tokens on open models)",
                    "estimatedMillionTokens": 15,
                    "assumptions": "$10.00 / ~$0.65/M blended open-model rate ~= 15M tokens",
                },
                "notes": "Processing fee applies; open models + select premium",
            },
            {
                "name": "GOAT",
                "monthlyPrice": 10,
                "limits": {
                    "credits": "$70/mo credits (up to ~$100 with deals)",
                    "requests": "~75K",
                },
                "models": [
                    "GPT-5.6 Sol",
                    "GLM-5.2",
                    "Tencent Hy3",
                    "Qwen 3.8 27B",
                    "DeepSeek V4 Flash",
                ],
                "modelAllowances": {
                    "deepseek": 60.0,
                    "economy": 60.0,
                    "standard": 40.0,
                    "frontier": 20.0,
                    "default": 60.0,
                },
                "perModelTokenBudgets": dict(_CMD_GOAT_POOL),
                "estimatedTokenBudget": {
                    "description": "$70 compute credits (~70M tokens)",
                    "estimatedMillionTokens": 70,
                    "assumptions": "$70.00 / ~$1/M blended ~= 70M tokens; per-model dollar allowances",
                },
                "notes": "29+ models",
            },
            {
                "name": "Pro",
                "monthlyPrice": 20,
                "limits": {"credits": "$80/mo credits", "requests": "~100K"},
                "models": [
                    "Claude Opus 4.8",
                    "GPT-5.6 Sol",
                    "Gemini",
                    "GLM-5.2",
                    "MiniMax M3",
                ],
                "modelAllowances": {
                    "deepseek": 80.0,
                    "economy": 80.0,
                    "standard": 60.0,
                    "frontier": 30.0,
                    "default": 80.0,
                },
                "perModelTokenBudgets": dict(_CMD_PRO_POOL),
                "estimatedTokenBudget": {
                    "description": "$80 compute credits (~80M tokens)",
                    "estimatedMillionTokens": 80,
                    "assumptions": "$80.00 / ~$1/M blended ~= 80M tokens; deals increase effective value",
                },
                "notes": "Adds all premium models incl Claude; 1M context",
            },
            {
                "name": "Max 10x",
                "monthlyPrice": 100,
                "limits": {
                    "credits": "$150/mo credits (up to ~$300)",
                    "requests": "~219K",
                },
                "models": ["All 30+ models"],
                "modelAllowances": {
                    "default": 150.0,
                },
                "estimatedTokenBudget": {
                    "description": "$150 compute credits (~150M tokens)",
                    "estimatedMillionTokens": 150,
                    "assumptions": "$150.00 / ~$1/M blended ~= 150M tokens",
                },
                "notes": "Higher rate limits",
            },
            {
                "name": "Max 20x",
                "monthlyPrice": 200,
                "limits": {
                    "credits": "$300/mo credits (up to ~$600)",
                    "requests": "~437K",
                },
                "models": ["All 30+ models"],
                "modelAllowances": {
                    "default": 300.0,
                },
                "estimatedTokenBudget": {
                    "description": "$300 compute credits (~300M tokens)",
                    "estimatedMillionTokens": 300,
                    "assumptions": "$300.00 / ~$1/M blended ~= 300M tokens",
                },
                "notes": "Highest rate limits; every model",
            },
        ],
        "gotchas": [
            "Domain moved from commandcode.dev to commandcode.ai",
            "Every plan adds a small processing fee on top of the sticker price",
            "Credits roll over forever; auto top-up billed at API cost",
            "Free tier retired - now paid; taste-1 learning data stored locally only",
        ],
        "tosHighlights": [
            "No training on your code; premium models US-hosted (EU on demand)"
        ],
        "dataTraining": "No training on your code",
        "ipIndemnity": false,
    },
)

# 18. OpenCode
write_json(
    "opencode.json",
    {
        "id": "opencode",
        "name": "OpenCode",
        "category": "coding-router",
        "url": "https://opencode.ai/zen",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "OpenSource CLI",
                "monthlyPrice": 0,
                "limits": {
                    "usage": "Free open-source agent; BYOK to any provider",
                },
                "models": ["BYOK any provider"],
                "estimatedTokenBudget": {
                    "description": "Token cost = your provider's rates",
                    "estimatedMillionTokens": 0,
                    "assumptions": "No fixed bundle; you pay your API provider directly",
                },
                "notes": "opencode.ai/pricing no longer exists (404)",
            },
            {
                "name": "Zen (PAYG)",
                "monthlyPrice": 20,
                "limits": {
                    "billing": "Pay-as-you-go dollar balance, min $20 top-up (+$1.23 card fee)",
                    "markup": "Zero markup per request",
                    "autoTopUp": "$20 when balance < $5",
                },
                "models": [
                    "GPT-5.6 Luna",
                    "GPT-5.6 Sol",
                    "Claude Fable 5.1",
                    "Claude Opus 5",
                    "GLM-5.3",
                    "DeepSeek V4",
                    "Gemini 3.8 Flash",
                    "Free stealth models",
                ],
                "estimatedTokenBudget": {
                    "description": "Prepaid balance (~10M fee-equivalent tokens)",
                    "estimatedMillionTokens": 10,
                    "midpointEstimate": 20,
                    "optimisticEstimate": 40,
                    "assumptions": "$20 minimum balance at zero markup buys $20 of inference at curated gateway rates; conservative 10M at ~$2.00/M frontier blend, midpoint 20M at ~$1.00/M, optimistic 40M at ~$0.50/M open-model rates; excludes the $1.23 card fee",
                },
                "notes": "US-hosted, zero retention",
            },
            {
                "name": "Go",
                "monthlyPrice": 10,
                "limits": {
                    "usage": "Open-model subscription ($10/mo) for stable global access",
                },
                "models": [
                    "Qwen3.7 Plus",
                    "Kimi K3",
                    "Kimi K2.7",
                    "GPT-5.6 Luna",
                    "MiMo-V2.5",
                ],
                "modelAllowances": {
                    "deepseek": 60.0,
                    "glm": 60.0,
                    "economy": 60.0,
                    "standard": 30.0,
                    "frontier": 15.0,
                    "default": 30.0,
                },
                "estimatedTokenBudget": {
                    "description": "Open-model subscription (~30M tokens/mo est.)",
                    "estimatedMillionTokens": 30,
                    "assumptions": "$10 / ~$0.3/M blended open-model rate ~= 30M tokens; exact cap not published",
                },
                "notes": "New Sept 2026 low-cost subscription tier",
            },
        ],
        "gotchas": [
            "The CLI itself is free/open-source; opencode.ai/pricing is retired (404) - offerings are Zen (PAYG) and Go ($10/mo)",
            "Zen charges $1.23 card processing fee on top-ups; auto top-up at $20 below $5 balance",
            "GPT-5.6 Sol carries 50% discount through Sept 18, 2026",
            "Zen models hosted in US with zero-retention provider policy",
        ],
        "tosHighlights": [],
        "dataTraining": "Zero-retention; no training on Zen",
        "ipIndemnity": false,
    },
)

# 19. OpenRouter
write_json(
    "openrouter.json",
    {
        "id": "openrouter",
        "name": "OpenRouter",
        "category": "coding-router",
        "url": "https://openrouter.ai",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Free",
                "monthlyPrice": 0,
                "limits": {
                    "rateLimit": "20 RPM",
                    "dailyCap": "50-1,000 RPD (50 RPD without payment history)",
                },
                "models": ["Free tier models (:free tag)"],
                "estimatedTokenBudget": {
                    "description": "50-1,000 requests/day on free models (~2M tokens/mo)",
                    "estimatedMillionTokens": 2,
                    "assumptions": "Free models with rate caps",
                },
                "notes": "Free community models with rate limiting",
            },
            {
                "name": "PAYG",
                "monthlyPrice": None,
                "limits": {
                    "platformFee": "5.5% on top-ups",
                    "rateLimit": "Provider-native limits",
                    "concurrency": "Provider-dependent",
                },
                "models": ["Over 400+ models from 30+ providers"],
                "estimatedTokenBudget": {
                    "description": "Wholesale PAYG ($10 buys ~5M–66M tokens depending on model)",
                    "estimatedMillionTokens": 20,
                    "assumptions": "Average blended cost of $1.00/M tokens",
                },
                "notes": "Universal API aggregator with unified billing and automatic failover",
            },
        ],
        "gotchas": [
            "Free tier restricted to 50 requests/day unless account has payment history",
            "5.5% platform fee charged on crypto and card balance reloads",
            "Provider fallback order may route to higher-cost endpoints if not pinned",
        ],
        "tosHighlights": [
            "Model-specific data policies clearly exposed in API response headers",
            "Zero data retention options filterable in catalog",
        ],
        "dataTraining": "No (OpenRouter does not train; providers vary)",
        "ipIndemnity": false,
    },
)

# 20. BytePlus
write_json(
    "byteplus.json",
    {
        "id": "byteplus",
        "name": "BytePlus ModelArk Coding Plan",
        "category": "api-provider",
        "url": "https://www.byteplus.com/en/activity/arkcodingplan",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Lite",
                "monthlyPrice": 10,
                "limits": {
                    "usage": "3x the usage of the Claude Pro plan",
                    "requests": "\u22481,900 requests/5h, 12,000/week, 24,000/month (official docs; older FAQ quoted 1,200/9,000/18,000)",
                    "tools": "Claude Code, Cursor, Cline, Kilo Code, Roo Code, OpenCode",
                },
                "models": [
                    "Dola-Seed-2.0-Pro",
                    "Dola-Seed-2.0-Lite",
                    "GLM-5.3-Flash",
                    "Dola-Seed-2.0-Code",
                    "DeepSeek-V4-Flash",
                    "Kimi K2.5",
                    "GPT-OSS-120b",
                ],
                "estimatedTokenBudget": {
                    "description": "3x Claude Pro usage (~36M tokens/mo, anchored to our Claude Pro estimate)",
                    "estimatedMillionTokens": 36,
                    "assumptions": "BytePlus markets Lite as 3x the Claude Pro quota; anchored to our own Claude Code Pro conservative estimate (12M) = 36M tokens. Official docs publish request quotas (\u22481,900/5h, 12,000/week, 24,000/month) but no token conversion",
                    "estimateMeta": {
                        "sourceUrl": "https://docs.byteplus.com/en/docs/ModelArk/1925114",
                        "sourceQuote": "The Lite plan provides a usable total quota equivalent to 3x that of the Claude Pro plan, while the Pro plan offers 5x the quota of the Lite plan",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "Claude Pro conservative estimate (12M)",
                    },
                },
                "perModelTokenBudgets": _byteplus_pool(36, models=["Dola-Seed-2.0-Pro", "Dola-Seed-2.0-Lite", "GLM-5.3-Flash", "Dola-Seed-2.0-Code", "DeepSeek-V4-Flash", "Kimi K2.5", "GPT-OSS-120b"]),
                "notes": "Flexible model selection or Auto mode",
            },
            {
                "name": "Pro",
                "monthlyPrice": 50,
                "limits": {
                    "usage": "5x Lite usage (also marketed as 3x Claude Max usage)",
                    "requests": "5x Lite quotas (\u22489,500/5h, 60,000/week, 120,000/month)",
                    "bonus": "ArkClaw included during subscription",
                },
                "models": [
                    "Dola-Seed-2.0-Pro",
                    "Dola-Seed-2.0-Lite",
                    "GLM-5.3-Flash",
                    "DeepSeek-V4-Pro",
                    "Kimi K2.5",
                    "GPT-OSS-120b",
                ],
                "estimatedTokenBudget": {
                    "description": "5x Lite (~180M tokens/mo)",
                    "estimatedMillionTokens": 180,
                    "assumptions": "5x the Lite estimate (36M), consistent with the marketed 5x tier multiplier; exact credits unpublished",
                },
                "perModelTokenBudgets": _byteplus_pool(180, models=["Dola-Seed-2.0-Pro", "Dola-Seed-2.0-Lite", "GLM-5.3-Flash", "DeepSeek-V4-Pro", "Kimi K2.5", "GPT-OSS-120b"]),
                "notes": "Model availability varies by country/region",
            },
        ],
        "gotchas": [
            "2026 refresh renamed models from Bytedance-Seed naming to Dola-Seed-2.0 pro/lite",
            "Quota is marketed as a multiplier of Claude Pro/Max plans, not absolute credits",
            "Non-coding use of the plan may be treated as abuse and can lead to subscription deactivation or account suspension",
            "Model availability varies by region",
        ],
        "tosHighlights": [],
        "dataTraining": "No training on Customer Data under BytePlus AI Services terms (except volunteered feedback)",
        "ipIndemnity": false,
    },
)

# 21. Alibaba Cloud
write_json(
    "alibaba-cloud.json",
    {
        "id": "alibaba-cloud",
        "name": "Alibaba Cloud",
        "category": "api-provider",
        "url": "https://www.alibabacloud.com/help/en/model-studio/token-plan-overview",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Personal Lite",
                "monthlyPrice": 6,
                "limits": {
                    "quota": "2,500 credits per 7-day window (official; original price $8/mo)",
                    "window": "7-day timer starts at first call; unused quota expires, service pauses when exhausted",
                    "concurrency": "1-2 concurrent agents",
                    "extraBundle": "$15 = 20,000 credits, requires active subscription (max 5), not subject to the 7-day window",
                    "region": "Singapore region only",
                },
                "models": [
                    "Qwen 3.7 Plus",
                    "Qwen 3.6 Plus",
                    "Kimi K2.5",
                    "GLM-5",
                    "MiniMax M2.5",
                ],
                "estimatedTokenBudget": {
                    "description": "2,500 credits/7d; ~45M conservative (qwen3.6-plus basis, derived)",
                    "estimatedMillionTokens": 45,
                    "midpointEstimate": 90,
                    "optimisticEstimate": 126,
                    "assumptions": "Official worked example (qwen3.6-plus): 8,349 input tokens = 1.67 credits, 40,794 cached = 0.82, 573 output = 0.69 (~200 credits/M input, 20/M cached, 1,204/M output). Standard 20K-in/1K-out request at 75% cache = 2.504 credits. 2,500 credits/7d x 30/7 = 10,714 credits/mo = 89.9M tokens. Conservative = 50% of that (2x deduction for pricier models), optimistic +40%; Alibaba does not publish per-model coefficients",
                    "estimateMeta": {
                        "sourceUrl": "https://docs.modelstudio.console.alibabacloud.com/en/model-studio/token-plan-personal-overview",
                        "sourceQuote": "Credits are deducted using tiered deduction coefficients by model; the deduction ratio is lower on a cache hit and higher on a miss",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "qwen3.6-plus",
                        "cacheAssumption": "75% cache hit rate (plan example ran at ~83% cached)",
                    },
                },
                "perModelTokenBudgets": _alibaba_pool(45, models=["Qwen 3.7 Plus", "Qwen 3.6 Plus", "Kimi K2.5", "GLM-5", "MiniMax M2.5"]),
                "notes": "Entry-level individual plan; credits reset every 7 days from first use",
            },
            {
                "name": "Essential",
                "monthlyPrice": 10,
                "limits": {
                    "quota": "5,625 credits per 7-day window (official; original price $16/mo)",
                    "window": "7-day timer starts at first call; unused quota expires",
                    "concurrency": "2-3 concurrent agents",
                    "extraBundle": "$15 = 20,000 credits, requires active subscription (max 5)",
                    "region": "Singapore region only",
                },
                "models": [
                    "Qwen 3.7 Plus",
                    "Qwen 3.6 Plus",
                    "Kimi K2.5",
                    "GLM-5",
                    "MiniMax M2.5",
                ],
                "estimatedTokenBudget": {
                    "description": "5,625 credits/7d; ~101M conservative (qwen3.6-plus basis, derived)",
                    "estimatedMillionTokens": 101,
                    "midpointEstimate": 202,
                    "optimisticEstimate": 283,
                    "assumptions": "Official worked example (qwen3.6-plus): ~8,387 tokens/credit on the standard 20K-in/1K-out request at 75% cache. 5,625 credits/7d x 30/7 = 24,107 credits/mo = 202.2M tokens; conservative = 50% (2x deduction for pricier models), optimistic +40%",
                    "estimateMeta": {
                        "sourceUrl": "https://docs.modelstudio.console.alibabacloud.com/en/model-studio/token-plan-overview",
                        "sourceQuote": "Personal Edition: Essential 5,625 Credits per 7-day quota (limited-time $10/month)",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "qwen3.6-plus",
                        "cacheAssumption": "75% cache hit rate",
                    },
                },
                "perModelTokenBudgets": _alibaba_pool(101, models=["Qwen 3.7 Plus", "Qwen 3.6 Plus", "Kimi K2.5", "GLM-5", "MiniMax M2.5"]),
                "notes": "Mid-entry individual tier added in the 2026 Token Plan refresh",
            },
            {
                "name": "Standard",
                "monthlyPrice": 18,
                "limits": {
                    "quota": "10,000 credits per 7-day window (official; original price $25/mo)",
                    "window": "7-day timer starts at first call; unused quota expires",
                    "concurrency": "3-4 concurrent agents",
                    "extraBundle": "$15 = 20,000 credits, requires active subscription (max 5)",
                    "region": "Singapore region only",
                },
                "models": [
                    "Qwen 3.7 Plus",
                    "Qwen 3.6 Plus",
                    "Kimi K2.5",
                    "GLM-5",
                    "MiniMax M2.5",
                ],
                "estimatedTokenBudget": {
                    "description": "10,000 credits/7d; ~180M conservative (qwen3.6-plus basis, derived)",
                    "estimatedMillionTokens": 180,
                    "midpointEstimate": 359,
                    "optimisticEstimate": 503,
                    "assumptions": "Official worked example (qwen3.6-plus): ~8,387 tokens/credit on the standard 20K-in/1K-out request at 75% cache. 10,000 credits/7d x 30/7 = 42,857 credits/mo = 359.4M tokens; conservative = 50% (2x deduction for pricier models), optimistic +40%",
                    "estimateMeta": {
                        "sourceUrl": "https://docs.modelstudio.console.alibabacloud.com/en/model-studio/token-plan-overview",
                        "sourceQuote": "Personal Edition: Standard 10,000 Credits per 7-day quota (limited-time $18/month)",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "qwen3.6-plus",
                        "cacheAssumption": "75% cache hit rate",
                    },
                },
                "perModelTokenBudgets": _alibaba_pool(180, models=["Qwen 3.7 Plus", "Qwen 3.6 Plus", "Kimi K2.5", "GLM-5", "MiniMax M2.5"]),
                "notes": "Mainstream plan for active coders; no pay-as-you-go overage (calls block)",
            },
            {
                "name": "Pro",
                "monthlyPrice": 68,
                "limits": {
                    "quota": "40,000 credits per 7-day window (official; original price $80/mo)",
                    "window": "7-day timer starts at first call; unused quota expires",
                    "concurrency": "6-8 concurrent agents",
                    "extraBundle": "$15 = 20,000 credits, requires active subscription (max 5)",
                    "region": "Singapore region only",
                },
                "models": [
                    "Qwen 3.7 Plus",
                    "Qwen 3.6 Plus",
                    "Kimi K2.5",
                    "GLM-5",
                    "MiniMax M2.5",
                ],
                "estimatedTokenBudget": {
                    "description": "40,000 credits/7d; ~719M conservative (qwen3.6-plus basis, derived)",
                    "estimatedMillionTokens": 719,
                    "midpointEstimate": 1438,
                    "optimisticEstimate": 2013,
                    "assumptions": "Official worked example (qwen3.6-plus): ~8,387 tokens/credit on the standard 20K-in/1K-out request at 75% cache. 40,000 credits/7d x 30/7 = 171,429 credits/mo = 1,437.7M tokens; conservative = 50% (2x deduction for pricier models), optimistic +40%",
                    "estimateMeta": {
                        "sourceUrl": "https://docs.modelstudio.console.alibabacloud.com/en/model-studio/token-plan-overview",
                        "sourceQuote": "Personal Edition: Pro 40,000 Credits per 7-day quota (limited-time $68/month)",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "qwen3.6-plus",
                        "cacheAssumption": "75% cache hit rate",
                    },
                },
                "perModelTokenBudgets": _alibaba_pool(719, models=["Qwen 3.7 Plus", "Qwen 3.6 Plus", "Kimi K2.5", "GLM-5", "MiniMax M2.5"]),
                "notes": "Power developer tier with highest concurrency",
            },
            {
                "name": "Team Standard",
                "monthlyPrice": 20,
                "limits": {
                    "quota": "25,000 credits/seat/month (official; original price $30/seat)",
                    "window": "Monthly batch granted at subscription start; no 7-day window; unused expires",
                    "concurrency": "Shared workspace; each seat bound to one member and one API key",
                    "extraPack": "$700 = 625,000 shared credits (soonest-expiring first)",
                },
                "models": ["Qwen 3.7 Plus", "Qwen 3.6 Plus", "Kimi K2.5", "GLM-5"],
                "estimatedTokenBudget": {
                    "description": "25,000 credits/seat/mo; ~105M conservative/seat (derived)",
                    "estimatedMillionTokens": 105,
                    "midpointEstimate": 210,
                    "optimisticEstimate": 294,
                    "assumptions": "Official worked example (qwen3.6-plus): ~8,387 tokens/credit. 25,000 credits/seat/month = 209.7M tokens; conservative = 50% (2x deduction for pricier models), optimistic +40%. Monthly quota, no 7-day recurrence",
                    "estimateMeta": {
                        "sourceUrl": "https://docs.modelstudio.console.alibabacloud.com/en/model-studio/token-plan-overview",
                        "sourceQuote": "Team Edition: Standard seat 25,000 Credits/seat/month",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "qwen3.6-plus",
                        "cacheAssumption": "75% cache hit rate",
                    },
                },
                "perModelTokenBudgets": _alibaba_pool(105, models=["Qwen 3.7 Plus", "Qwen 3.6 Plus", "Kimi K2.5", "GLM-5"]),
                "notes": "Team plan guarantees conversation data is not used for training",
            },
            {
                "name": "Team Pro",
                "monthlyPrice": 75,
                "limits": {
                    "quota": "100,000 credits/seat/month (official; original price $100/seat)",
                    "window": "Monthly batch; unused expires",
                    "concurrency": "Shared workspace; one API key per seat",
                    "extraPack": "$700 = 625,000 shared credits",
                },
                "models": ["Qwen 3.7 Plus", "Qwen 3.6 Plus", "Kimi K2.5", "GLM-5"],
                "estimatedTokenBudget": {
                    "description": "100,000 credits/seat/mo; ~419M conservative/seat (derived)",
                    "estimatedMillionTokens": 419,
                    "midpointEstimate": 839,
                    "optimisticEstimate": 1174,
                    "assumptions": "Official worked example (qwen3.6-plus): ~8,387 tokens/credit. 100,000 credits/seat/month = 838.7M tokens; conservative = 50%, optimistic +40%",
                    "estimateMeta": {
                        "sourceUrl": "https://docs.modelstudio.console.alibabacloud.com/en/model-studio/token-plan-overview",
                        "sourceQuote": "Team Edition: Pro seat 100,000 Credits/seat/month",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "qwen3.6-plus",
                        "cacheAssumption": "75% cache hit rate",
                    },
                },
                "perModelTokenBudgets": _alibaba_pool(419, models=["Qwen 3.7 Plus", "Qwen 3.6 Plus", "Kimi K2.5", "GLM-5"]),
                "notes": "Higher team seat allowance",
            },
            {
                "name": "Team Max",
                "monthlyPrice": 200,
                "limits": {
                    "quota": "250,000 credits/seat/month (official)",
                    "window": "Monthly batch; unused expires",
                    "concurrency": "Shared workspace; one API key per seat",
                    "extraPack": "$700 = 625,000 shared credits",
                },
                "models": ["Qwen 3.7 Plus", "Qwen 3.6 Plus", "Kimi K2.5", "GLM-5"],
                "estimatedTokenBudget": {
                    "description": "250,000 credits/seat/mo; ~1.05B conservative/seat (derived)",
                    "estimatedMillionTokens": 1048,
                    "midpointEstimate": 2097,
                    "optimisticEstimate": 2935,
                    "assumptions": "Official worked example (qwen3.6-plus): ~8,387 tokens/credit. 250,000 credits/seat/month = 2,096.7M tokens; conservative = 50%, optimistic +40%",
                    "estimateMeta": {
                        "sourceUrl": "https://docs.modelstudio.console.alibabacloud.com/en/model-studio/token-plan-overview",
                        "sourceQuote": "Team Edition: Max seat 250,000 Credits/seat/month",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "qwen3.6-plus",
                        "cacheAssumption": "75% cache hit rate",
                    },
                },
                "perModelTokenBudgets": _alibaba_pool(1048, models=["Qwen 3.7 Plus", "Qwen 3.6 Plus", "Kimi K2.5", "GLM-5"]),
                "notes": "Maximum team capacity tier with dedicated capacity options",
            },
        ],
        "gotchas": [
            "Token Plan and Coding Plan are separate products: Coding Plan (request-metered, Pro $50, 6,000 req/5h + 45,000/week + 90,000/month) is being phased out and is no longer available once sold out",
            "Credits are deducted with per-model coefficients that Alibaba does not publish; estimates are derived from the official qwen3.6-plus worked example",
            "Personal tier quotas run on a fixed 7-day window from first use and unused quota expires; calls block when exhausted (no pay-as-you-go)",
            "Personal plans offer no guarantee against data training and use cross-border (Singapore) processing; Team plans commit to no training on conversation data",
            "Team seats are bound to one member and one API key and cannot be shared",
            "Personal Edition is only available in the Singapore region",
        ],
        "tosHighlights": [
            "Team plans: conversation data is not used for model training (official commitment)",
            "Team plans include multi-seat management and usage analytics",
        ],
        "dataTraining": "Personal: governed by the service agreement with cross-border transfer, no no-training commitment; Team: conversation data not used for model training",
        "ipIndemnity": false,
    },
)

# 22. MiniMax
write_json(
    "minimax.json",
    {
        "id": "minimax",
        "name": "MiniMax Token Plan",
        "category": "api-provider",
        "url": "https://platform.minimax.io/docs/guides/pricing-token-plan",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Plus",
                "monthlyPrice": 22,
                "limits": {
                    "quota": "5-hour rolling + weekly windows",
                    "agents": "3-4 concurrent agents",
                },
                "models": ["MiniMax M3", "M2.7"],
                "perModelTokenBudgets": _minimax_pool(20, ["MiniMax M3", "M2.7"]),
                "estimatedTokenBudget": {
                    "description": "5h + weekly windows (~20M tokens/mo est.)",
                    "estimatedMillionTokens": 20,
                    "assumptions": "Research estimate; exact credits per window not officially published",
                },
                "notes": "Personal projects and prototyping",
            },
            {
                "name": "Max",
                "monthlyPrice": 55,
                "limits": {
                    "quota": "5-hour rolling + weekly windows",
                    "agents": "4-5 concurrent agents",
                },
                "models": ["MiniMax M3", "M2.7"],
                "perModelTokenBudgets": _minimax_pool(65, ["MiniMax M3", "M2.7"]),
                "estimatedTokenBudget": {
                    "description": "Higher windows (~65M tokens/mo est.)",
                    "estimatedMillionTokens": 65,
                    "assumptions": "Research estimate scaled ~3x over Plus tier (agents + multimodal); not officially published",
                },
                "notes": "Daily coding with agents and multimodal work",
            },
            {
                "name": "Ultra",
                "monthlyPrice": 132,
                "limits": {
                    "quota": "5-hour rolling + weekly windows, extended sessions",
                    "agents": "6-7 concurrent agents",
                },
                "models": ["MiniMax M3", "M2.7"],
                "perModelTokenBudgets": _minimax_pool(160, ["MiniMax M3", "M2.7"]),
                "estimatedTokenBudget": {
                    "description": "Highest windows (~160M tokens/mo est.)",
                    "estimatedMillionTokens": 160,
                    "assumptions": "Research estimate scaled ~8x over Plus tier tier; not officially published",
                },
                "notes": "Heavy agent workflows and extended sessions",
            },
            {
                "name": "Prepaid Credits",
                "monthlyPrice": null,
                "limits": {
                    "credits": "$5 = 5,000 / $25 = 25,000 / $100 = 100,000 credits (1,000 credits = $1)",
                    "validity": "365 days",
                },
                "models": ["All MiniMax models"],
                "estimatedTokenBudget": {
                    "description": "$1 per 1,000 credits",
                    "estimatedMillionTokens": 0,
                    "assumptions": "Overflow top-up for subscription users",
                },
                "notes": "Prepaid overflow packages",
            },
        ],
        "gotchas": [
            "Sold as 'Token Plan' subscription rather than a separate coding plan",
            "Exact credits inside 5h/weekly windows are not officially published - token estimates are research-derived",
            "MiniMax H3, voice design and rapid voice cloning not included",
            "Prepaid credits: 1,000 credits = $1, valid 365 days",
        ],
        "tosHighlights": [],
        "dataTraining": "Not published on pricing page",
        "ipIndemnity": false,
    },
)

# 23. OpenAI API
write_json(
    "openai-api.json",
    {
        "id": "openai-api",
        "name": "OpenAI API",
        "category": "api-provider",
        "url": "https://platform.openai.com",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "PAYG",
                "monthlyPrice": None,
                "limits": {
                    "spendTiers": "$100 / $500 / $1,000 / $5,000 / $200,000 mo spend caps (official)",
                    "retention": "30-day default retention; ZDR available on request for eligible endpoints",
                    "batchDiscount": "50% off Batch API",
                },
                "models": [
                    "GPT-6 Astra",
                    "GPT-5.6 Sol",
                    "GPT-5.6 Terra",
                    "GPT-5.6 Luna",
                ],
                "estimatedTokenBudget": {
                    "description": "Direct API PAYG ($20 buys ~10M mixed-frontier / ~18M Sol-class cached-agent / ~100M Luna-class)",
                    "estimatedMillionTokens": 10,
                    "midpointEstimate": 18,
                    "optimisticEstimate": 100,
                    "assumptions": "$20 at Sol ($2/M in, $10/M out): 5M on a 3:1 list blend, ~18M on the standard 20K-in/1K-out agent request at 75% cache; Luna ($0.10/$0.60) yields ~100M+ on the same workload; 10M conservative floor for mixed frontier use",
                    "estimateMeta": {
                        "sourceUrl": "https://platform.openai.com/docs/pricing",
                        "sourceQuote": "gpt-5.6-sol $2.00 input / $10.00 output per 1M tokens; gpt-5.6-luna $0.10 / $0.60",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "GPT-5.6 Sol",
                        "cacheAssumption": "75% cache hit rate at 50% discount",
                    },
                },
                "notes": "Batch 50% off. Pay-as-you-go direct API with tiered rate limits",
            }
        ],
        "gotchas": [
            "Long-context pricing doubles on requests exceeding 272K tokens in context window",
            "Rate limits (TPM/RPM) are strictly tiered based on total historical account spend",
            "Reasoning tokens count towards output token billing",
        ],
        "tosHighlights": [
            "API data is not used for training by default; 30-day retention default with ZDR on request for eligible endpoints",
            "Enterprise IP indemnity included for standard outputs",
        ],
        "dataTraining": "No (API data not used for training by default; 30-day default retention, ZDR on request)",
        "ipIndemnity": true,
    },
)

# 24. Anthropic API
write_json(
    "anthropic-api.json",
    {
        "id": "anthropic-api",
        "name": "Anthropic API",
        "category": "api-provider",
        "url": "https://console.anthropic.com",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "PAYG",
                "monthlyPrice": None,
                "limits": {
                    "spendTiers": "Start $500/mo, Build $1,000/mo, Scale $200,000/mo (official 2026 tiers)",
                    "cacheReadDiscount": "90% off cached input",
                    "cacheWritePremium": "25% premium on cache writes",
                    "batchDiscount": "50% off",
                },
                "models": [
                    "Claude Fable 5.1",
                    "Claude Opus 5",
                    "Claude Sonnet 5",
                    "Claude Haiku 4.5",
                ],
                "estimatedTokenBudget": {
                    "description": "Direct API PAYG ($20 buys ~10M conservative / ~18M cached-agent Sonnet 5 tokens)",
                    "estimatedMillionTokens": 10,
                    "midpointEstimate": 18,
                    "optimisticEstimate": 25,
                    "assumptions": "$20 at Sonnet 5 ($2/M in, $10/M out): 5M on a 3:1 input:output list blend; ~18M on the standard 20K-in/1K-out agent request with 75% cache at 90% off; the 10M floor allows mixed Opus-class use and lower cache rates",
                    "estimateMeta": {
                        "sourceUrl": "https://docs.claude.com/en/docs/about-claude/pricing",
                        "sourceQuote": "Claude Sonnet 5 $2 / MTok input, $10 / MTok output; cache reads 0.1x input",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "Claude Sonnet 5",
                        "cacheAssumption": "75% cache hit rate at 90% discount",
                    },
                },
                "notes": "Cache reads 90% off. Batch 50% off.",
            }
        ],
        "gotchas": [
            "Rate limits and spend caps are tiered by cumulative spend (Start $500, Build $1,000, Scale $200,000+/mo); new accounts hit 429s on large codebases",
            "Thinking/reasoning tokens are billed at standard output token rates",
            "Cache write operations cost 25% more than base input tokens",
        ],
        "tosHighlights": [
            "Anthropic does not train models on API inputs or outputs",
            "Commercial IP indemnity provided under commercial terms of service",
        ],
        "dataTraining": "No (Commercial API zero retention)",
        "ipIndemnity": true,
    },
)

# 25. Google AI Studio
write_json(
    "google-ai-studio.json",
    {
        "id": "google-ai-studio",
        "name": "Google AI Studio",
        "category": "api-provider",
        "url": "https://aistudio.google.com",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Free",
                "monthlyPrice": 0,
                "limits": {
                    "RPM": "15 requests/min",
                    "TPM": "1,000,000 tokens/min",
                    "RPD": "1,500 requests/day",
                },
                "models": ["Gemini 3.8 Flash", "Gemini 3.1 Pro"],
                "estimatedTokenBudget": {
                    "description": "1,500 requests/day (~15M tokens/mo)",
                    "estimatedMillionTokens": 15,
                    "assumptions": "1,500 requests/day on free rate limits",
                },
                "notes": "Free tier with generous TPM limits",
            },
            {
                "name": "Tier1",
                "monthlyPrice": None,
                "limits": {
                    "spendCap": "$250/mo spend limit",
                    "RPM": "1,000 requests/min",
                    "TPM": "4,000,000 tokens/min",
                },
                "models": ["Gemini 3.8 Flash", "Gemini 3.1 Pro"],
                "estimatedTokenBudget": {
                    "description": "PAYG up to $250/mo spend cap (~67M conservative / ~130M cached-agent tokens @ $100)",
                    "estimatedMillionTokens": 67,
                    "midpointEstimate": 100,
                    "optimisticEstimate": 130,
                    "assumptions": "Official Gemini 3.8 Flash pricing $0.75/M in, $3.75/M out ($0.75 promotional through 2026-12-31): $100 buys ~67M on a 3:1 list blend and ~130M on the standard 75%-cached agent request; 100M midpoint used for the tier figure. Tier cap is a $250/mo spend limit",
                    "estimateMeta": {
                        "sourceUrl": "https://ai.google.dev/gemini-api/docs/pricing",
                        "sourceQuote": "Gemini 3.8 Flash input $0.75 / output $3.75 per 1M tokens (input price through December 31, 2026)",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "Gemini 3.8 Flash",
                        "cacheAssumption": "75% cache hit rate at 25% of input price",
                    },
                },
                "notes": "Pay-as-you-go billing with $250 credit threshold",
            },
            {
                "name": "Tier2",
                "monthlyPrice": None,
                "limits": {
                    "spendCap": "$2,000/mo spend limit",
                    "RPM": "2,000 requests/min",
                    "TPM": "8,000,000 tokens/min",
                },
                "models": ["Gemini 3.8 Flash", "Gemini 3.1 Pro"],
                "estimatedTokenBudget": {
                    "description": "PAYG up to $2,000/mo limit (~500M tokens)",
                    "estimatedMillionTokens": 500,
                    "assumptions": "High volume developer spend",
                },
                "notes": "Higher throughput tier unlocked after spend verification",
            },
            {
                "name": "Tier3",
                "monthlyPrice": None,
                "limits": {
                    "spendCap": "$20,000-$100,000/mo spend limit",
                    "RPM": "5,000+ requests/min",
                    "TPM": "20,000,000+ tokens/min",
                },
                "models": ["Gemini 3.8 Flash", "Gemini 3.1 Pro"],
                "estimatedTokenBudget": {
                    "description": "Enterprise scale PAYG (~2B tokens)",
                    "estimatedMillionTokens": 2000,
                    "assumptions": "Tier3: dedicated capacity negotiations; well beyond 2,000 RPM PAYG tier ceilings",
                },
                "notes": "Enterprise capacity with custom quota allocations",
            },
        ],
        "gotchas": [
            "Free tier data IS logged and used for model training and human review",
            "Promotional credits expire after 1 year and are non-refundable",
            "Context caching incurs continuous storage fees per hour",
        ],
        "tosHighlights": [
            "Free tier permits Google to review and train on prompts",
            "Paid tiers do not train and offer Google Cloud enterprise compliance",
        ],
        "dataTraining": "Yes on Free tier; No on Paid tiers",
        "ipIndemnity": false,
    },
)

# 26. DeepSeek API
write_json(
    "deepseek-api.json",
    {
        "id": "deepseek-api",
        "name": "DeepSeek API",
        "category": "api-provider",
        "url": "https://api-docs.deepseek.com/quick_start/pricing",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "PAYG (Flash)",
                "monthlyPrice": None,
                "limits": {
                    "concurrency": "2,500 connections (official limit)",
                    "contextWindow": "1M tokens context window, 384K maximum output",
                    "offPeakDiscount": "50% off (off-peak input $0.15/M, output $0.60/M)",
                    "peakHours": "Mon-Fri 01:00-04:00 and 06:00-10:00 UTC",
                },
                "models": ["DeepSeek V4.1 Flash"],
                "estimatedTokenBudget": {
                    "description": "PAYG ($20 buys ~75M Flash tokens off-peak)",
                    "estimatedMillionTokens": 75,
                    "assumptions": "Flash cache-miss $0.30/M input ($0.15 off-peak) + $1.20/M output ($0.60 off-peak), cache-hit $0.003-$0.006/M. At ~$0.26/M blended off-peak, $20 yields ~75M tokens",
                },
                "notes": "Cache-hit tokens ~$0.003-$0.006/M (up to 98% off)",
            },
            {
                "name": "PAYG (V4-Pro)",
                "monthlyPrice": None,
                "limits": {
                    "concurrency": "500 connections (official limit)",
                    "contextWindow": "1M tokens context window, 384K maximum output",
                    "offPeakDiscount": "50% off off-peak vs peak",
                },
                "models": ["DeepSeek V4-Pro"],
                "estimatedTokenBudget": {
                    "description": "PAYG ($20 buys ~8M Pro tokens off-peak)",
                    "estimatedMillionTokens": 8,
                    "midpointEstimate": 20,
                    "optimisticEstimate": 40,
                    "assumptions": "Official V4-Pro CNY rates: \u00a59/M cache-miss input, \u00a527/M output, cache-hit \u00a50.15-0.30/M, off-peak half (\u2248$1.27/$3.80 peak at \u00a57.1/$). $20 / ~$2.44 list blend \u2248 8M tokens; the 75%-cached agent workload costs ~$0.51/M off-peak \u2248 40M tokens",
                    "estimateMeta": {
                        "sourceUrl": "https://api-docs.deepseek.com/quick_start/pricing",
                        "sourceQuote": "V4-Pro peak: \u00a59/M cache-miss input, \u00a527/M output; off-peak prices are half the peak price",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "DeepSeek V4-Pro",
                        "cacheAssumption": "75% cache hit rate at cache-hit pricing",
                    },
                },
                "notes": "Frontier reasoning tier",
            },
        ],
        "gotchas": [
            "Peak hours are Mon-Fri 01:00-04:00 and 06:00-10:00 UTC (Asiapost-hours); other times 50% off",
            "Cache-hit tokens are nearly free but require identical prompt prefixes and are ephemeral",
            "$0.27-1.68/M price brackets quoted in older docs are stale; rely on current api-docs pricing",
        ],
        "tosHighlights": [
            "No training on API traffic",
            "Servers located in PRC and international cloud regions",
        ],
        "dataTraining": "No",
        "ipIndemnity": false,
    },
)

# 27. Groq API
write_json(
    "groq-api.json",
    {
        "id": "groq-api",
        "name": "Groq API",
        "category": "api-provider",
        "url": "https://console.groq.com",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Free",
                "monthlyPrice": 0,
                "limits": {
                    "limits": "Developer-plan base limits (Free is lower): per-model RPM 10-30, RPD 100-1,000, TPM 1.2K-70K, TPD up to ~500K"
                },
                "models": ["GPT-OSS-120B", "Qwen3.8", "Kimi K3"],
                "estimatedTokenBudget": {
                    "description": "Per-model rate caps (~2-10M tokens/mo depending on model)",
                    "estimatedMillionTokens": 5,
                    "assumptions": "TPD ~500K tokens/day ceiling on high-capacity models ~= 15M/mo ceiling; conservative 5M used for typical models",
                },
                "notes": "Free plan for testing on LPUs",
            },
            {
                "name": "PAYG",
                "monthlyPrice": None,
                "limits": {
                    "batchDiscount": "50% batch/caching discount",
                    "throughput": "400-800 tokens/sec on LPU hardware",
                },
                "models": ["GPT-OSS-120B", "Qwen3.8", "Kimi K3", "Compound models"],
                "estimatedTokenBudget": {
                    "description": "Direct PAYG ($20 buys ~40M tokens)",
                    "estimatedMillionTokens": 40,
                    "assumptions": "$20 spent @ ~$0.50/M blended on open-weight serving",
                },
                "notes": "LPUs achieve 400-800 tokens/sec on served models",
            },
        ],
        "gotchas": [
            "Llama chat/vision models are GONE from Groq's catalog (only Llama Prompt-Guard safety models remain); lineup is now GPT-OSS/Qwen/Whisper/Compound",
            "Free-plan limits are per-model, not a single global quota; console tables show Developer-plan base limits unless stated otherwise",
            "Set manual spend caps to prevent runaway loops on ultra-fast inference",
        ],
        "tosHighlights": [
            "Zero data retention by default for paid accounts",
            "No customer data used for model training",
        ],
        "dataTraining": "No",
        "ipIndemnity": false,
    },
)

# 28. Mistral API
write_json(
    "mistral-api.json",
    {
        "id": "mistral-api",
        "name": "Mistral API",
        "category": "api-provider",
        "url": "https://mistral.ai/pricing",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Free (Le Plan Studio)",
                "monthlyPrice": 0,
                "limits": {
                    "credits": "Signup credits + $10/mo included credits",
                },
                "models": ["Mistral Medium 3.5", "Codestral"],
                "estimatedTokenBudget": {
                    "description": "$10/mo credits (~10M tokens on select models)",
                    "estimatedMillionTokens": 10,
                    "assumptions": "$10.00 / ~$1.00/M blended (Small-tier usage) ~= 10M tokens",
                },
                "notes": "Free experiment tier replaced by Studio signup credits",
            },
            {
                "name": "PAYG",
                "monthlyPrice": None,
                "limits": {
                    "batchDiscount": "50% off Batch API",
                    "cacheDiscount": "90% off prefix caching",
                    "hardContextCap": "Enforced context limit (400 rather than truncation)",
                },
                "models": [
                    "Mistral Medium 3.5",
                    "Mistral Small 4",
                    "Mistral Large 3",
                    "Codestral 25.08",
                    "Codestral Embed",
                    "Voxtral",
                ],
                "estimatedTokenBudget": {
                    "description": "Direct PAYG ($20 buys ~20M Codestral tokens)",
                    "estimatedMillionTokens": 20,
                    "assumptions": "$20.00 / ~$1.00/M blended on Codestral",
                },
                "notes": "Magistral models folded into Medium 3.5 by lifecycle policy",
            },
        ],
        "gotchas": [
            "Model lifecycle folded Magistral into Mistral Medium 3.5; Small is now 'Mistral Small 4'",
            "Training is opt-out rather than off by default; verify your workspace privacy settings",
            "Exceeding the context window triggers hard 400 Bad Request rather than truncation",
            "Codestral license restricts certain commercial reuse outside paid API",
        ],
        "tosHighlights": [
            "GDPR compliant and European data residency guarantees",
            "Training opt-out available; zero-retention options on paid plans",
        ],
        "dataTraining": "Opt-out available",
        "ipIndemnity": false,
    },
)
# 29. Together.ai
write_json(
    "together-ai.json",
    {
        "id": "together-ai",
        "name": "Together.ai",
        "category": "api-provider",
        "url": "https://www.together.ai/pricing",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Free",
                "monthlyPrice": 0,
                "limits": {
                    "rateLimits": "Dynamic rate limits - no fixed per-model RPM/TPM published; scales with account history",
                    "creditTrial": "$5 free credits",
                },
                "models": ["Llama 3.3 70B", "DeepSeek V3", "Qwen 2.5 Coder"],
                "estimatedTokenBudget": {
                    "description": "Signup credit (~5M tokens; amount not listed on the official pricing page)",
                    "estimatedMillionTokens": 5,
                    "assumptions": "$5 trial credits on open source models",
                },
                "notes": "Trial credit package for open source model testing",
            },
            {
                "name": "PAYG",
                "monthlyPrice": None,
                "limits": {
                    "tierLimits": "Dynamic limits scale with spend history ($25/$50/$100/$250 milestones historically)",
                    "batchDiscount": "50% off Batch inference",
                },
                "models": ["Llama 3.3 70B", "DeepSeek V3", "Qwen 2.5 Coder 32B"],
                "estimatedTokenBudget": {
                    "description": "PAYG ($20 buys ~30M tokens)",
                    "estimatedMillionTokens": 30,
                    "assumptions": "$20 spent @ $0.65/M blended",
                },
                "notes": "Tiered limits at $25/$50/$100/$250 spend. Batch 50% off.",
            },
        ],
        "gotchas": [
            "Sudden traffic spikes hit 429 rate limits until account tier auto-upgrades",
            "Cold start delays on infrequently accessed open-weights models",
            "Dedicated endpoints incur minimum hourly billing",
        ],
        "tosHighlights": [
            "Zero data retention by default for paid endpoints",
            "SOC2 Type II certified",
        ],
        "dataTraining": "No",
        "ipIndemnity": false,
    },
)

# 30. Fireworks.ai
write_json(
    "fireworks-ai.json",
    {
        "id": "fireworks-ai",
        "name": "Fireworks.ai",
        "category": "api-provider",
        "url": "https://fireworks.ai/pricing",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Free",
                "monthlyPrice": 0,
                "limits": {
                    "trial": "$1 free credits (official)",
                    "freeRpm": "Exact free-tier RPM unpublished; account-wide 6,000 RPM ceiling applies once a card is on file",
                },
                "models": ["Llama 3.3 70B", "DeepSeek V3"],
                "estimatedTokenBudget": {
                    "description": "$1 free trial (~2M tokens)",
                    "estimatedMillionTokens": 2,
                    "assumptions": "$1.00 / ~$0.50/M blended open-weight rate ~= 2M tokens of trial compute",
                },
                "notes": "Trial tier for function-calling evaluation",
            },
            {
                "name": "PAYG",
                "monthlyPrice": None,
                "limits": {
                    "RPM": "6,000 requests/min with valid card",
                    "batchDiscount": "50% off Batch API",
                    "latency": "Sub-100ms TTFT",
                },
                "models": ["Llama 4 Maverick", "DeepSeek V4", "Kimi K3"],
                "estimatedTokenBudget": {
                    "description": "Serverless PAYG ($20 buys ~35M tokens)",
                    "estimatedMillionTokens": 35,
                    "assumptions": "$20 spent @ $0.55/M blended on Llama 70B",
                },
                "notes": "Serverless PAYG. 6000 RPM with card. Batch 50% off.",
            },
        ],
        "gotchas": [
            "503 load shedding errors occur during saturated cluster load events",
            "Card required on file to unlock 6,000 RPM high throughput",
            "Fine-tuning deployment incurs hourly standby charges",
        ],
        "tosHighlights": [
            "No training on customer API inputs",
            "HIPAA and SOC2 compliance available on enterprise plans",
        ],
        "dataTraining": "No",
        "ipIndemnity": false,
    },
)

# 31. Meta Model API
write_json(
    "meta-model-api.json",
    {
        "id": "meta-model-api",
        "name": "Meta Llama API",
        "category": "api-provider",
        "url": "https://dev.meta.ai/docs/pricing-rate-limits",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Standard",
                "monthlyPrice": None,
                "limits": {
                    "RPM": "3,000 requests/min",
                    "TPM": "500,000 tokens/min",
                    "price": "$1.25/M input, $4.25/M output (official)",
                },
                "models": ["Muse Spark 1.3", "Muse Spark 1.2"],
                "perModelTokenBudgets": {
                    "muse spark 1.3": {"estimatedMillionTokens": 10, "basis": "equal-rate", "confidence": "high"},
                    "muse spark 1.2": {"estimatedMillionTokens": 10, "basis": "equal-rate", "confidence": "high"},
                },
                "estimatedTokenBudget": {
                    "description": "Standard PAYG ($20 buys ~10M list-blend / ~14M cached-agent tokens)",
                    "estimatedMillionTokens": 10,
                    "midpointEstimate": 12,
                    "optimisticEstimate": 14,
                    "assumptions": "$20 at official Standard pricing $1.25/M input, $4.25/M output: 10M on a 3:1 list blend, ~14M on the standard 20K-in/1K-out agent request (no cache price published)",
                    "estimateMeta": {
                        "sourceUrl": "https://dev.meta.ai/docs/pricing-rate-limits",
                        "sourceQuote": "Standard: $1.25 per 1M input tokens, $4.25 per 1M output tokens; prompts and completions are not used to train Meta models",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "Muse Spark 1.3",
                    },
                },
                "notes": "Standard $1.25/$4.25/M. Hosted Llama tiers were superseded by Muse Spark models.",
            },
            {
                "name": "Contributor",
                "monthlyPrice": None,
                "limits": {
                    "RPM": "60 requests/min",
                    "TPM": "30,000 tokens/min",
                    "price": "$0.10-$0.20/M contributor pricing (~95% discount via muse-spark-1.2-contributor)",
                },
                "models": ["Muse Spark 1.2 (contributor)"],
                "estimatedTokenBudget": {
                    "description": "Contributor PAYG ($20 buys ~100M conservative / ~200M optimistic tokens)",
                    "estimatedMillionTokens": 100,
                    "midpointEstimate": 133,
                    "optimisticEstimate": 200,
                    "assumptions": "$20 at official Contributor pricing $0.10-$0.20/M in exchange for training rights: 100M at $0.20, 133M at $0.15, 200M at $0.10",
                    "estimateMeta": {
                        "sourceUrl": "https://dev.meta.ai/docs/pricing-rate-limits",
                        "sourceQuote": "Contributor: $0.10-$0.20 per 1M tokens in exchange for permission to use prompts and completions to train Meta models",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "Muse Spark 1.2 (contributor)",
                    },
                },
                "notes": "Contributor pricing applies to the muse-spark-1.2 family; prompts/outputs feed Meta training",
            },
        ],
        "gotchas": [
            "Contributor allows training on your data",
            "Contributor tier throttled to 60 RPM",
        ],
        "tosHighlights": [
            "Contributor tier data is retained permanently for model training",
            "Standard tier guarantees zero data retention and strict confidentiality",
        ],
        "dataTraining": "Yes for Contributor tier; No for Standard tier",
        "ipIndemnity": false,
    },
)

# 32. Ollama Cloud
write_json(
    "ollama-cloud.json",
    {
        "id": "ollama-cloud",
        "name": "Ollama Cloud",
        "category": "api-provider",
        "url": "https://ollama.com",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Free",
                "monthlyPrice": 0,
                "limits": {
                    "cloudModels": "Community hosted models",
                    "concurrency": "1 stream",
                    "localUse": "Unlimited local execution",
                },
                "models": ["Llama 3.2", "Qwen 2.5 Coder 7B"],
                "estimatedTokenBudget": {
                    "description": "Free cloud tier (~1M tokens/mo)",
                    "estimatedMillionTokens": 1,
                    "assumptions": "Free community rate limits",
                },
                "notes": "Free tier for running local and small cloud models",
            },
            {
                "name": "Pro",
                "monthlyPrice": 20,
                "annualPrice": 200,
                "limits": {
                    "credits": "$60 cloud compute credits/mo",
                    "concurrency": "3 concurrent streams",
                    "peakSurcharge": "12:00-18:00 UTC peak rates, Mon-Fri",
                },
                "models": ["DeepSeek V4.1 Flash", "Kimi K2.7", "MiniMax M3", "GLM-5"],
                "estimatedTokenBudget": {
                    "description": "$60 compute credits (~60M tokens/mo)",
                    "estimatedMillionTokens": 60,
                    "assumptions": "$60 monthly cloud credit pool",
                },
                "notes": "Pro: $60 credits/mo, 3 concurrent. 3x compute value.",
            },
            {
                "name": "Max",
                "monthlyPrice": 100,
                "limits": {
                    "credits": "$300 cloud compute credits/mo",
                    "concurrency": "10 concurrent streams",
                    "peakSurcharge": "Standard rates",
                },
                "models": [
                    "All Cloud Hosted Weights",
                    "DeepSeek V4-Pro",
                    "Llama 4 Maverick",
                ],
                "estimatedTokenBudget": {
                    "description": "$300 compute credits (~300M tokens/mo)",
                    "estimatedMillionTokens": 300,
                    "assumptions": "$300 monthly cloud credit pool",
                },
                "notes": "Max: $300, 10 concurrent. Priority routing.",
            },
            {
                "name": "Team",
                "monthlyPrice": 500,
                "limits": {
                    "credits": "$1,000 cloud compute credits/mo",
                    "concurrency": "10 concurrent streams",
                    "privateEndpoints": "Dedicated pods",
                },
                "models": ["All Open Weights & Custom Fine-tunes"],
                "estimatedTokenBudget": {
                    "description": "$1,000 compute credits (~1B tokens/mo)",
                    "estimatedMillionTokens": 1000,
                    "assumptions": "$1,000 monthly credit pool (official Team plan)",
                },
                "notes": "Dedicated private pods for software development teams",
            },
        ],
        "gotchas": [
            "Unused included usage does not roll over",
            "Peak pricing applies 12:00-18:00 UTC Monday-Friday",
            "One account per person: multiple Ollama accounts are not permitted",
        ],
        "tosHighlights": [
            "No training on cloud inference data",
            "Complete open-source local runtime",
        ],
        "dataTraining": "No",
        "ipIndemnity": false,
    },
)

# 33. Z.ai GLM Coding Plan
write_json(
    "z-ai.json",
    {
        "id": "z-ai",
        "name": "Z.ai GLM Coding Plan",
        "category": "api-provider",
        "url": "https://z.ai/subscribe",
        "lastVerified": LAST_VERIFIED,
        "tiers": [
            {
                "name": "Lite",
                "monthlyPrice": 18,
                "annualPrice": 151,
                "limits": {
                    "fiveHourCredits": "2,000 credits",
                    "weeklyCredits": "10,000 credits",
                    "weeklyCeiling": "Up to 97M GLM-5.3 / 584M GLM-5.3-Flash tokens (official V3)",
                    "offPeakDiscount": "50% credit rate during off-peak",
                    "peakHours": "Mon-Fri 14:00-18:00 UTC+8",
                    "toolRestrictions": "Strictly limited to supported coding tools (Claude Code, Cline, OpenCode, Goose)",
                },
                "models": ["GLM-5.3", "GLM-5.3-Flash"],
                "perModelTokenBudgets": {
                    "glm-5.3": {
                        "estimatedMillionTokens": 208,
                        "midpointEstimate": 314,
                        "optimisticEstimate": 420,
                        "basis": "official-table",
                        "confidence": "high",
                    },
                    "glm-5.3-flash": {
                        "estimatedMillionTokens": 632,
                        "midpointEstimate": 948,
                        "optimisticEstimate": 1264,
                        "basis": "official-table",
                        "confidence": "high",
                    },
                },
                "estimatedTokenBudget": {
                    "description": "10K weekly credits; GLM-5.3 48-97M tokens/wk at 95% cache (official)",
                    "estimatedMillionTokens": 208,
                    "midpointEstimate": 314,
                    "optimisticEstimate": 420,
                    "assumptions": "Official Z.ai table (95% cache): 10,000 weekly credits = 48-97M GLM-5.3 tokens/week (146-292M GLM-5.3-Flash standard, up to 584M Flash with 2x campaign bonus). Floor = all-peak (1x credit rate) 48M/wk x 4.33 wk = 208M/mo; ceiling = all off-peak (0.5x) 97M/wk x 4.33 = 420M/mo; midpoint 314M",
                    "estimateMeta": {
                        "sourceUrl": "https://docs.z.ai/devpack/overview",
                        "sourceQuote": "Weekly limit, up to: GLM-5.3 97M Tokens, GLM-5.3-Flash 584M Tokens",
                        "sourceType": "official",
                        "confidence": "high",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "GLM-5.3",
                        "cacheAssumption": "95% cache hit rate",
                    },
                },
                "notes": "Entry tier for individual developers. Up to 97M GLM-5.3 or 584M GLM-5.3-Flash weekly ceiling",
            },
            {
                "name": "Pro",
                "monthlyPrice": 80,
                "annualPrice": 605,
                "limits": {
                    "fiveHourCredits": "12,000 credits",
                    "weeklyCredits": "60,000 credits",
                    "weeklyCeiling": "Up to 582M GLM-5.3 / 3,504M GLM-5.3-Flash tokens (6× Lite)",
                    "offPeakDiscount": "50% credit rate during off-peak",
                    "concurrency": "Dynamic scaling with off-peak boosts",
                    "includedMcps": "Vision, Web Search, Web Reader, Zread",
                },
                "models": ["GLM-5.3", "GLM-5.3-Flash"],
                "perModelTokenBudgets": {
                    "glm-5.3": {
                        "estimatedMillionTokens": 1256,
                        "midpointEstimate": 1888,
                        "optimisticEstimate": 2520,
                        "basis": "official-table",
                        "confidence": "high",
                    },
                    "glm-5.3-flash": {
                        "estimatedMillionTokens": 3797,
                        "midpointEstimate": 5698,
                        "optimisticEstimate": 7600,
                        "basis": "official-table",
                        "confidence": "high",
                    },
                },
                "estimatedTokenBudget": {
                    "description": "60K weekly credits; GLM-5.3 290-582M tokens/wk at 95% cache (official)",
                    "estimatedMillionTokens": 1256,
                    "midpointEstimate": 1888,
                    "optimisticEstimate": 2520,
                    "assumptions": "Official Z.ai table (95% cache): 60,000 weekly credits = 290-580M GLM-5.3 tokens/week (877M-1.76B GLM-5.3-Flash). V3 subscribe ceiling: up to 582M GLM-5.3 / 3,504M GLM-5.3-Flash weekly (including 2x Flash campaign bonus). Floor = all-peak 290M/wk x 4.33 = 1,256M/mo; ceiling = all off-peak 582M/wk x 4.33 = 2,520M/mo; midpoint 1,888M",
                    "estimateMeta": {
                        "sourceUrl": "https://docs.z.ai/devpack/overview",
                        "sourceQuote": "Weekly limit, up to: GLM-5.3 582M Tokens, GLM-5.3-Flash 3504M Tokens (6× Lite usage)",
                        "sourceType": "official",
                        "confidence": "high",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "GLM-5.3",
                        "cacheAssumption": "95% cache hit rate",
                    },
                },
                "notes": "6× Lite usage capacity for full-time engineers and agent loops. Up to 582M GLM-5.3 or 3,504M GLM-5.3-Flash weekly ceiling",
            },
            {
                "name": "Max",
                "monthlyPrice": 168,
                "annualPrice": 1344,
                "limits": {
                    "fiveHourCredits": "28,000 credits",
                    "weeklyCredits": "140,000 credits",
                    "weeklyCeiling": "Up to 1,358M GLM-5.3 / 8,176M GLM-5.3-Flash tokens (14× Lite)",
                    "offPeakDiscount": "50% credit rate during off-peak",
                    "priority": "Priority resource allocation during peak hours",
                    "concurrency": "Highest concurrent task allocation",
                },
                "models": ["GLM-5.3", "GLM-5.3-Flash"],
                "perModelTokenBudgets": {
                    "glm-5.3": {
                        "estimatedMillionTokens": 2927,
                        "midpointEstimate": 4405,
                        "optimisticEstimate": 5884,
                        "basis": "official-table",
                        "confidence": "high",
                    },
                    "glm-5.3-flash": {
                        "estimatedMillionTokens": 8864,
                        "midpointEstimate": 13298,
                        "optimisticEstimate": 17731,
                        "basis": "official-table",
                        "confidence": "high",
                    },
                },
                "estimatedTokenBudget": {
                    "description": "140K weekly credits; GLM-5.3 676M-1.36B tokens/wk at 95% cache (official)",
                    "estimatedMillionTokens": 2927,
                    "midpointEstimate": 4405,
                    "optimisticEstimate": 5884,
                    "assumptions": "Official Z.ai table (95% cache): 140,000 weekly credits = 676M-1,352M GLM-5.3 tokens/week (2.05B-4.1B GLM-5.3-Flash). V3 subscribe ceiling: up to 1,358M GLM-5.3 / 8,176M GLM-5.3-Flash weekly (including 2x Flash campaign bonus). Floor = all-peak 676M/wk x 4.33 = 2,927M/mo; ceiling = all off-peak 1,358M/wk x 4.33 = 5,884M/mo; midpoint 4,405M",
                    "estimateMeta": {
                        "sourceUrl": "https://docs.z.ai/devpack/overview",
                        "sourceQuote": "Weekly limit, up to: GLM-5.3 1358M Tokens, GLM-5.3-Flash 8176M Tokens (14× Lite usage)",
                        "sourceType": "official",
                        "confidence": "high",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "GLM-5.3",
                        "cacheAssumption": "95% cache hit rate",
                    },
                },
                "notes": "14× Lite usage capacity for heavy autonomous agents. Official weekly ceiling: 1,358M GLM-5.3 / 8,176M GLM-5.3-Flash tokens",
            },
            {
                "name": "Team Standard",
                "monthlyPrice": 80,
                "limits": {
                    "fiveHourCredits": "15,000 credits / seat",
                    "weeklyCredits": "66,000 credits / seat",
                    "minSeats": "2 seats minimum",
                    "concurrency": "1-2 concurrent projects per seat",
                    "dataPrivacy": "Excluded from model training by default",
                    "overage": "On-demand overage billed at a 10% discount from model API list price",
                    "billing": "Centralized billing, seat management & VAT invoicing",
                },
                "models": ["GLM-5.3", "GLM-5.3-Flash"],
                "perModelTokenBudgets": {
                    "glm-5.3": {
                        "estimatedMillionTokens": 1381,
                        "midpointEstimate": 2072,
                        "optimisticEstimate": 2763,
                        "basis": "official-table",
                        "confidence": "medium",
                    },
                    "glm-5.3-flash": {
                        "estimatedMillionTokens": 4178,
                        "midpointEstimate": 6268,
                        "optimisticEstimate": 8357,
                        "basis": "official-table",
                        "confidence": "medium",
                    },
                },
                "estimatedTokenBudget": {
                    "description": "66K weekly credits/seat; GLM-5.3 319-638M tokens/wk/seat (derived from official table)",
                    "estimatedMillionTokens": 1381,
                    "midpointEstimate": 2072,
                    "optimisticEstimate": 2763,
                    "assumptions": "Team credits (66,000/week/seat, official) scaled from the official Pro row (60,000 credits = 290-580M GLM-5.3 tokens/week): 319-638M/wk/seat x 4.33 wk = 1,381-2,763M/mo; midpoint 2,072M. Team seat price $80/seat is not published on the team docs page",
                    "estimateMeta": {
                        "sourceUrl": "https://docs.z.ai/devpack/teamplan",
                        "sourceQuote": "Standard Seat: 15,000 credits / 5h, 66,000 credits / week",
                        "sourceType": "derived",
                        "confidence": "medium",
                        "verifiedAt": LAST_VERIFIED,
                        "basisModel": "GLM-5.3",
                        "cacheAssumption": "95% cache hit rate",
                    },
                },
                "notes": "Enterprise team workspace with seat controls and no-training commitment",
            },
        ],
        "gotchas": [
            "Strictly tool-only: direct generic API scraping or unauthorized tools trigger error 1113 or risk control suspension",
            "Dual 5-hour rolling limits and 7-day weekly reset cycles - exhaustion requires waiting for the 5-hour refresh",
            "Peak hours (Mon-Fri 14:00-18:00 UTC+8) consume credits at 2x the off-peak rate",
            "All plans serve GLM-5.3 and GLM-5.3-Flash only; GLM-5.2/GLM-5.1 requests are auto-routed to GLM-5.3 and GLM-4.7 to GLM-5.3-Flash",
            "GLM-5.3-Flash campaign (Sep 3-20, 2026): unlimited usage via ZCode 23:00-09:00 SGT and doubled quota on other agents - temporary bonus on top of the published allowance",
            "Account sharing and multi-user access are prohibited; subscription benefits are exclusive to the subscriber",
            "Subscriptions are non-refundable once purchased; downgrading team seats mid-cycle is not supported",
        ],
        "tosHighlights": [
            "Includes Web Search MCP, Web Reader MCP, Zread MCP, and Vision Understanding with 0 separate tool fees",
            "Drop-in endpoint https://api.z.ai/api/anthropic allows using Claude Code directly with GLM-5.3",
            "Team Plan guarantees code and conversations are excluded from model training by default",
        ],
        "dataTraining": "Team plans: conversation data not used for model training (official). Personal plans: standard subscription terms, no public no-training commitment",
        "ipIndemnity": false,
    },
)

print("All 33 plans generated successfully!")
