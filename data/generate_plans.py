import json
import os

target_dir = "/home/john/Projects/Token-Max/data/coding-plans"
os.makedirs(target_dir, exist_ok=True)

def write_json(name, data):
    with open(os.path.join(target_dir, name), 'w') as f:
        json.dump(data, f, indent=2)

write_json("_schema.json", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "category", "url", "lastVerified", "tiers", "gotchas", "tosHighlights", "dataTraining", "ipIndemnity"],
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "category": { "type": "string", "enum": ["coding-ide", "coding-router", "api-provider"] },
    "url": { "type": "string" },
    "lastVerified": { "type": "string", "format": "date" },
    "tiers": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "monthlyPrice"],
        "properties": {
          "name": { "type": "string" },
          "monthlyPrice": { "type": ["number", "null"] },
          "annualPrice": { "type": ["number", "null"] },
          "limits": { "type": "object" },
          "models": { "type": "array", "items": { "type": "string" } },
          "estimatedTokenBudget": {
            "type": ["object", "null"],
            "properties": {
              "description": { "type": "string" },
              "estimatedMillionTokens": { "type": "number" },
              "assumptions": { "type": "string" }
            }
          },
          "notes": { "type": "string" }
        }
      }
    },
    "gotchas": { "type": "array", "items": { "type": "string" } },
    "tosHighlights": { "type": "array", "items": { "type": "string" } },
    "dataTraining": { "type": "string" },
    "ipIndemnity": { "type": ["string", "boolean"] }
  }
})

# 1. Cursor
write_json("cursor.json", {
  "id": "cursor",
  "name": "Cursor",
  "category": "coding-ide",
  "url": "https://cursor.sh",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Hobby", "monthlyPrice": 0, "limits": {}, "models": ["grok-4.6", "claude-sonnet-5", "gpt-5.6-sol"], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Pro", "monthlyPrice": 20, "limits": {}, "models": ["grok-4.6", "claude-sonnet-5", "gpt-5.6-sol"], "estimatedTokenBudget": {"description": "Pool estimated", "estimatedMillionTokens": 20, "assumptions": "Third-party pool estimation"}, "notes": "Pro ~$20 third-party pool"},
    {"name": "Pro+", "monthlyPrice": 60, "limits": {}, "models": ["grok-4.6", "claude-sonnet-5", "gpt-5.6-sol"], "estimatedTokenBudget": {"description": "Pool estimated", "estimatedMillionTokens": 70, "assumptions": "Third-party pool estimation"}, "notes": "Pro+ ~$70"},
    {"name": "Ultra", "monthlyPrice": 200, "limits": {}, "models": ["grok-4.6", "claude-sonnet-5", "gpt-5.6-sol"], "estimatedTokenBudget": {"description": "Pool estimated", "estimatedMillionTokens": 400, "assumptions": "Third-party pool estimation"}, "notes": "Ultra ~$400"}
  ],
  "gotchas": ["on-demand billing after pool"],
  "tosHighlights": [],
  "dataTraining": "opt-out in privacy mode",
  "ipIndemnity": False
})

# 2. GitHub Copilot
write_json("github-copilot.json", {
  "id": "github-copilot",
  "name": "GitHub Copilot",
  "category": "coding-ide",
  "url": "https://github.com/features/copilot",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Free", "monthlyPrice": 0, "limits": {"credits": 0}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Pro", "monthlyPrice": 10, "limits": {"credits": 1500}, "models": [], "estimatedTokenBudget": {"description": "Based on credits", "estimatedMillionTokens": 15, "assumptions": "1 credit = $0.01"}, "notes": "1500 credits ($15)"},
    {"name": "Pro+", "monthlyPrice": 39, "limits": {"credits": 7000}, "models": [], "estimatedTokenBudget": {"description": "Based on credits", "estimatedMillionTokens": 70, "assumptions": "1 credit = $0.01"}, "notes": "7000 credits ($70)"},
    {"name": "Max", "monthlyPrice": 100, "limits": {"credits": 20000}, "models": [], "estimatedTokenBudget": {"description": "Based on credits", "estimatedMillionTokens": 200, "assumptions": "1 credit = $0.01"}, "notes": "20000 credits ($200)"}
  ],
  "gotchas": ["data training unless opted out on individual plans"],
  "tosHighlights": [],
  "dataTraining": "opt-out required for individual plans",
  "ipIndemnity": "Business/Enterprise only"
})

# 3. Claude Code
write_json("claude-code.json", {
  "id": "claude-code",
  "name": "Claude Code",
  "category": "coding-ide",
  "url": "https://anthropic.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Pro", "monthlyPrice": 20, "limits": {}, "models": ["Fable 5.1", "Opus 5", "Sonnet 5", "Haiku 4.5"], "estimatedTokenBudget": None, "notes": "Shared 5-hour rolling + weekly cap"},
    {"name": "Max5x", "monthlyPrice": 100, "limits": {}, "models": ["Fable 5.1", "Opus 5", "Sonnet 5", "Haiku 4.5"], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Max20x", "monthlyPrice": 200, "limits": {}, "models": ["Fable 5.1", "Opus 5", "Sonnet 5", "Haiku 4.5"], "estimatedTokenBudget": None, "notes": ""}
  ],
  "gotchas": ["shared quota with Claude web app"],
  "tosHighlights": [],
  "dataTraining": "None specified",
  "ipIndemnity": False
})

# 4. OpenAI Codex
write_json("openai-codex.json", {
  "id": "openai-codex",
  "name": "OpenAI Codex",
  "category": "coding-ide",
  "url": "https://openai.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Free", "monthlyPrice": 0, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Go", "monthlyPrice": 8, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Plus", "monthlyPrice": 20, "limits": {"messages": "5-45 msgs/5h"}, "models": ["GPT-6 Astra"], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Pro5x", "monthlyPrice": 100, "limits": {"messages": "25-225 msgs/5h"}, "models": ["GPT-6 Astra"], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Pro20x", "monthlyPrice": 200, "limits": {"messages": "100-900 msgs/5h"}, "models": ["GPT-6 Astra"], "estimatedTokenBudget": None, "notes": ""}
  ],
  "gotchas": ["Work and Codex share same pool"],
  "tosHighlights": [],
  "dataTraining": "Opt-out available",
  "ipIndemnity": False
})

# 5. Google Antigravity
write_json("google-antigravity.json", {
  "id": "google-antigravity",
  "name": "Google Antigravity",
  "category": "coding-ide",
  "url": "https://google.com/ai",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Individual", "monthlyPrice": 0, "limits": {"tasks": 15}, "models": ["Jules"], "estimatedTokenBudget": None, "notes": "15 daily tasks"},
    {"name": "AI Pro", "monthlyPrice": 19.99, "limits": {"tasks": 75}, "models": ["Jules"], "estimatedTokenBudget": None, "notes": "75 daily tasks"},
    {"name": "Ultra5x", "monthlyPrice": 99.99, "limits": {"tasks": 300}, "models": ["Jules"], "estimatedTokenBudget": None, "notes": "300 daily tasks"},
    {"name": "Ultra20x", "monthlyPrice": 199.99, "limits": {"tasks": 1200}, "models": ["Jules"], "estimatedTokenBudget": None, "notes": "5-hour refresh cycles"}
  ],
  "gotchas": ["task-based limits, not token-based"],
  "tosHighlights": [],
  "dataTraining": "Opt-out available",
  "ipIndemnity": False
})

# 6. Meta Muse Code
write_json("meta-muse-code.json", {
  "id": "meta-muse-code",
  "name": "Meta Muse Code",
  "category": "coding-ide",
  "url": "https://meta.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Everyday", "monthlyPrice": 5, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "High", "monthlyPrice": 15, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Power", "monthlyPrice": 50, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""}
  ],
  "gotchas": ["Contributor tier allows training on your code", "Standard 3000 RPM, Contributor 60 RPM"],
  "tosHighlights": [],
  "dataTraining": "Contributor tier trains on your data",
  "ipIndemnity": False
})

# 7. Kiro
write_json("kiro.json", {
  "id": "kiro",
  "name": "Kiro",
  "category": "coding-ide",
  "url": "https://aws.amazon.com/kiro",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Free", "monthlyPrice": 0, "limits": {"credits": 50}, "models": [], "estimatedTokenBudget": None, "notes": "50 credits"},
    {"name": "Pro", "monthlyPrice": 20, "limits": {"credits": 1000}, "models": [], "estimatedTokenBudget": None, "notes": "1000 credits"},
    {"name": "Pro+", "monthlyPrice": 40, "limits": {"credits": 2000}, "models": [], "estimatedTokenBudget": None, "notes": "2000 credits"},
    {"name": "ProMax", "monthlyPrice": 100, "limits": {"credits": 5000}, "models": [], "estimatedTokenBudget": None, "notes": "5000 credits"},
    {"name": "Power", "monthlyPrice": 200, "limits": {"credits": 10000}, "models": [], "estimatedTokenBudget": None, "notes": "10000 credits"}
  ],
  "gotchas": ["Credits don't roll over", "Add-on $0.04/credit", "Model multipliers vary"],
  "tosHighlights": [],
  "dataTraining": "No",
  "ipIndemnity": False
})

# 8. Kilo AI
write_json("kilo-code.json", {
  "id": "kilo-code",
  "name": "Kilo AI",
  "category": "coding-router",
  "url": "https://kilo.ai",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Starter", "monthlyPrice": 19, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Kilo Pass"},
    {"name": "Pro", "monthlyPrice": 49, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Kilo Pass"},
    {"name": "Expert", "monthlyPrice": 199, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Kilo Pass"},
    {"name": "Teams", "monthlyPrice": 15, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "$15/user/mo"}
  ],
  "gotchas": ["bonus credits expire monthly", "5% processing fee"],
  "tosHighlights": [],
  "dataTraining": "No",
  "ipIndemnity": False
})

# 9. Lovable
write_json("lovable.json", {
  "id": "lovable",
  "name": "Lovable",
  "category": "coding-ide",
  "url": "https://lovable.dev",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Free", "monthlyPrice": 0, "limits": {"build_credits": 5}, "models": [], "estimatedTokenBudget": None, "notes": "Daily 5 build credits"},
    {"name": "Pro", "monthlyPrice": 25, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Top-up $0.30/cr"},
    {"name": "Business", "monthlyPrice": 50, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Top-up $0.60/cr"}
  ],
  "gotchas": ["perpetual license for training on Free/Pro", "Credits expire 2 months"],
  "tosHighlights": [],
  "dataTraining": "Perpetual license on Free/Pro",
  "ipIndemnity": False
})

# 10. Kimi Code
write_json("kimi-code.json", {
  "id": "kimi-code",
  "name": "Kimi Code",
  "category": "coding-ide",
  "url": "https://moonshot.cn",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Plus", "monthlyPrice": 19, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "¥79"},
    {"name": "Pro", "monthlyPrice": 39, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "¥159"},
    {"name": "Max", "monthlyPrice": 199, "limits": {}, "models": ["K3 2.8T"], "estimatedTokenBudget": None, "notes": "¥559"}
  ],
  "gotchas": ["shared quota with consumer chat", "User-Agent tampering = suspension"],
  "tosHighlights": [],
  "dataTraining": "Yes",
  "ipIndemnity": False
})

# 11. Windsurf
write_json("windsurf.json", {
  "id": "windsurf",
  "name": "Windsurf",
  "category": "coding-ide",
  "url": "https://windsurf.dev",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Free", "monthlyPrice": 0, "limits": {}, "models": ["SWE-1.5", "Claude Sonnet 4.6", "GPT-5.4"], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Pro", "monthlyPrice": 20, "limits": {}, "models": ["SWE-1.5", "Claude Sonnet 4.6", "GPT-5.4"], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Max", "monthlyPrice": 200, "limits": {}, "models": ["SWE-1.5", "Claude Sonnet 4.6", "GPT-5.4"], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Teams", "monthlyPrice": 40, "limits": {}, "models": ["SWE-1.5", "Claude Sonnet 4.6", "GPT-5.4"], "estimatedTokenBudget": None, "notes": "$40/user"}
  ],
  "gotchas": ["legacy Codeium credits retired"],
  "tosHighlights": [],
  "dataTraining": "No",
  "ipIndemnity": False
})

# 12. Augment Code
write_json("augment-code.json", {
  "id": "augment-code",
  "name": "Augment Code",
  "category": "coding-ide",
  "url": "https://augment.co",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Business", "monthlyPrice": 100, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Effort/credit metered"},
    {"name": "Enterprise", "monthlyPrice": None, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Custom"}
  ],
  "gotchas": ["no permanent free tier", "Auto-top-up $15 blocks"],
  "tosHighlights": [],
  "dataTraining": "No",
  "ipIndemnity": True
})

# 13. Replit
write_json("replit.json", {
  "id": "replit",
  "name": "Replit",
  "category": "coding-ide",
  "url": "https://replit.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Core", "monthlyPrice": 20, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Effort-based checkpoint system"},
    {"name": "Pro", "monthlyPrice": 100, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Effort-based checkpoint system"}
  ],
  "gotchas": ["unpredictable costs", "free daily chat caps"],
  "tosHighlights": [],
  "dataTraining": "Yes",
  "ipIndemnity": False
})

# 14. Amazon Q
write_json("amazon-q.json", {
  "id": "amazon-q",
  "name": "Amazon Q Developer",
  "category": "coding-ide",
  "url": "https://aws.amazon.com/q",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Free", "monthlyPrice": 0, "limits": {"lines": 1000, "requests": 50}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Pro", "monthlyPrice": 19, "limits": {"lines": 4000, "requests": 1000, "agent": 30}, "models": [], "estimatedTokenBudget": None, "notes": "$19/user"}
  ],
  "gotchas": ["Overages: $0.003/line"],
  "tosHighlights": [],
  "dataTraining": "Opt-out available",
  "ipIndemnity": True
})

# 15. Tabnine
write_json("tabnine.json", {
  "id": "tabnine",
  "name": "Tabnine",
  "category": "coding-ide",
  "url": "https://tabnine.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Starter", "monthlyPrice": 0, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Pro", "monthlyPrice": 15, "limits": {"chat": 500}, "models": [], "estimatedTokenBudget": None, "notes": "unlimited completions"},
    {"name": "Enterprise", "monthlyPrice": 39, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "$39/user"}
  ],
  "gotchas": ["very limited free tier", "ZDR focus"],
  "tosHighlights": [],
  "dataTraining": "ZDR",
  "ipIndemnity": True
})

# 16. Aider
write_json("aider.json", {
  "id": "aider",
  "name": "Aider",
  "category": "coding-ide",
  "url": "https://aider.chat",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Free", "monthlyPrice": 0, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "BYOK only"}
  ],
  "gotchas": ["No limits beyond API provider limits"],
  "tosHighlights": [],
  "dataTraining": "Depends on API provider",
  "ipIndemnity": False
})

# 17. CommandCode
write_json("commandcode.json", {
  "id": "commandcode",
  "name": "CommandCode",
  "category": "coding-router",
  "url": "https://commandcode.dev",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Go", "monthlyPrice": 1, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Dollar-value credits: $10"},
    {"name": "GOAT", "monthlyPrice": 10, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Dollar-value credits: $70"},
    {"name": "Pro", "monthlyPrice": 20, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Dollar-value credits: $80"},
    {"name": "Max10x", "monthlyPrice": 100, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Dollar-value credits: $150"},
    {"name": "Max20x", "monthlyPrice": 200, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Dollar-value credits: $300"}
  ],
  "gotchas": ["5-hour rolling windows", "Extra credits never expire"],
  "tosHighlights": [],
  "dataTraining": "No",
  "ipIndemnity": False
})

# 18. OpenCode
write_json("opencode.json", {
  "id": "opencode",
  "name": "OpenCode",
  "category": "coding-router",
  "url": "https://opencode.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Go", "monthlyPrice": 10, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Per-model monthly dollar limits"},
    {"name": "Zen", "monthlyPrice": None, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "PAYG"}
  ],
  "gotchas": ["ZDR varies by model"],
  "tosHighlights": [],
  "dataTraining": "Varies by model",
  "ipIndemnity": False
})

# 19. OpenRouter
write_json("openrouter.json", {
  "id": "openrouter",
  "name": "OpenRouter",
  "category": "coding-router",
  "url": "https://openrouter.ai",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "PAYG", "monthlyPrice": None, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "5.5% platform fee"}
  ],
  "gotchas": ["free tier limited to 50 RPD without credit purchase history"],
  "tosHighlights": [],
  "dataTraining": "No",
  "ipIndemnity": False
})

# 20. BytePlus
write_json("byteplus.json", {
  "id": "byteplus",
  "name": "BytePlus ModelArk",
  "category": "api-provider",
  "url": "https://byteplus.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Lite", "monthlyPrice": 10, "limits": {"requests": 24000}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Pro", "monthlyPrice": 50, "limits": {"requests": 120000}, "models": [], "estimatedTokenBudget": None, "notes": ""}
  ],
  "gotchas": ["STRICTLY tool-only, direct API use = ban", "No overage fallback"],
  "tosHighlights": [],
  "dataTraining": "Yes",
  "ipIndemnity": False
})

# 21. Alibaba Cloud
write_json("alibaba-cloud.json", {
  "id": "alibaba-cloud",
  "name": "Alibaba Cloud",
  "category": "api-provider",
  "url": "https://alibabacloud.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Personal Lite", "monthlyPrice": 6, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Standard", "monthlyPrice": 18, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Pro", "monthlyPrice": 68, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Team Standard", "monthlyPrice": 20, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "/seat"},
    {"name": "Team Pro", "monthlyPrice": 75, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Team Max", "monthlyPrice": 200, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""}
  ],
  "gotchas": ["no training guarantee on personal plans"],
  "tosHighlights": [],
  "dataTraining": "No guarantee on personal plans",
  "ipIndemnity": False
})

# 22. MiniMax
write_json("minimax.json", {
  "id": "minimax",
  "name": "MiniMax",
  "category": "api-provider",
  "url": "https://minimax.ai",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Plus", "monthlyPrice": 22, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Max", "monthlyPrice": 55, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Ultra", "monthlyPrice": 132, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""}
  ],
  "gotchas": ["Agent limits: 3-7 depending on tier", "Credits valid 365 days"],
  "tosHighlights": [],
  "dataTraining": "Yes",
  "ipIndemnity": False
})

# 23. OpenAI API
write_json("openai-api.json", {
  "id": "openai-api",
  "name": "OpenAI API",
  "category": "api-provider",
  "url": "https://platform.openai.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "PAYG", "monthlyPrice": None, "limits": {}, "models": ["GPT-6 Astra", "Sol", "Terra", "Luna"], "estimatedTokenBudget": None, "notes": "Batch 50% off"}
  ],
  "gotchas": ["long-context pricing doubles above 272K tokens"],
  "tosHighlights": [],
  "dataTraining": "Opt-out available",
  "ipIndemnity": True
})

# 24. Anthropic API
write_json("anthropic-api.json", {
  "id": "anthropic-api",
  "name": "Anthropic API",
  "category": "api-provider",
  "url": "https://console.anthropic.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "PAYG", "monthlyPrice": None, "limits": {}, "models": ["Fable 5.1", "Opus 5", "Sonnet 5", "Haiku 4.5"], "estimatedTokenBudget": None, "notes": "Cache reads 90% off. Batch 50% off."}
  ],
  "gotchas": ["Tiered rate limits based on spend"],
  "tosHighlights": [],
  "dataTraining": "No",
  "ipIndemnity": True
})

# 25. Google AI Studio
write_json("google-ai-studio.json", {
  "id": "google-ai-studio",
  "name": "Google AI Studio",
  "category": "api-provider",
  "url": "https://aistudio.google.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Free", "monthlyPrice": 0, "limits": {"RPM": 15, "TPM": 1000000}, "models": ["Gemini 3.8 Flash"], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Tier1", "monthlyPrice": None, "limits": {"spendCap": 250}, "models": ["Gemini 3.8 Flash"], "estimatedTokenBudget": None, "notes": "Based on spend"},
    {"name": "Tier2", "monthlyPrice": None, "limits": {"spendCap": 2000}, "models": ["Gemini 3.8 Flash"], "estimatedTokenBudget": None, "notes": "Based on spend"},
    {"name": "Tier3", "monthlyPrice": None, "limits": {"spendCap": 100000}, "models": ["Gemini 3.8 Flash"], "estimatedTokenBudget": None, "notes": "Based on spend"}
  ],
  "gotchas": ["credits expire 1 year", "non-refundable"],
  "tosHighlights": [],
  "dataTraining": "Yes on free tier",
  "ipIndemnity": False
})

# 26. DeepSeek API
write_json("deepseek-api.json", {
  "id": "deepseek-api",
  "name": "DeepSeek API",
  "category": "api-provider",
  "url": "https://platform.deepseek.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "PAYG", "monthlyPrice": None, "limits": {"concurrency": {"Flash": 2500, "Pro": 500}}, "models": ["Flash", "V4-Pro"], "estimatedTokenBudget": None, "notes": "time-of-day pricing. Cache hits 98% off."}
  ],
  "gotchas": ["time-of-day pricing differences"],
  "tosHighlights": [],
  "dataTraining": "No",
  "ipIndemnity": False
})

# 27. Groq API
write_json("groq-api.json", {
  "id": "groq-api",
  "name": "Groq API",
  "category": "api-provider",
  "url": "https://console.groq.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Free", "monthlyPrice": 0, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "PAYG", "monthlyPrice": None, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "50% cached/batch discount"}
  ],
  "gotchas": ["must set spend caps manually"],
  "tosHighlights": [],
  "dataTraining": "No",
  "ipIndemnity": False
})

# 28. Mistral API
write_json("mistral-api.json", {
  "id": "mistral-api",
  "name": "Mistral API",
  "category": "api-provider",
  "url": "https://console.mistral.ai",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "PAYG", "monthlyPrice": None, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "50% batch discount. 90% cache discount."}
  ],
  "gotchas": ["exceeding context = 400 error"],
  "tosHighlights": [],
  "dataTraining": "No",
  "ipIndemnity": False
})

# 29. Together.ai
write_json("together-ai.json", {
  "id": "together-ai",
  "name": "Together.ai",
  "category": "api-provider",
  "url": "https://together.ai",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Free", "monthlyPrice": 0, "limits": {"RPM": 60, "TPM": 60000}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "PAYG", "monthlyPrice": None, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": "Tiered limits at $25/$50/$100/$250 spend. Batch 50% off."}
  ],
  "gotchas": ["sudden traffic spikes hit 429s"],
  "tosHighlights": [],
  "dataTraining": "No",
  "ipIndemnity": False
})

# 30. Fireworks.ai
write_json("fireworks-ai.json", {
  "id": "fireworks-ai",
  "name": "Fireworks.ai",
  "category": "api-provider",
  "url": "https://fireworks.ai",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Free", "monthlyPrice": 0, "limits": {"RPM": 10}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "PAYG", "monthlyPrice": None, "limits": {"RPM": 6000}, "models": [], "estimatedTokenBudget": None, "notes": "Batch 50% off."}
  ],
  "gotchas": ["503 load shedding on saturated fleet"],
  "tosHighlights": [],
  "dataTraining": "No",
  "ipIndemnity": False
})

# 31. Meta Model API
write_json("meta-model-api.json", {
  "id": "meta-model-api",
  "name": "Meta Model API",
  "category": "api-provider",
  "url": "https://meta.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Standard", "monthlyPrice": None, "limits": {"RPM": 3000}, "models": [], "estimatedTokenBudget": None, "notes": "$1.25/$4.25/M"},
    {"name": "Contributor", "monthlyPrice": None, "limits": {"RPM": 60}, "models": [], "estimatedTokenBudget": None, "notes": "$0.10/$0.20/M"}
  ],
  "gotchas": ["Contributor allows training on your data"],
  "tosHighlights": [],
  "dataTraining": "Yes for Contributor tier",
  "ipIndemnity": False
})

# 32. Ollama Cloud
write_json("ollama-cloud.json", {
  "id": "ollama-cloud",
  "name": "Ollama Cloud",
  "category": "api-provider",
  "url": "https://ollama.com",
  "lastVerified": "2026-09-18",
  "tiers": [
    {"name": "Free", "monthlyPrice": 0, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""},
    {"name": "Pro", "monthlyPrice": 20, "limits": {"concurrent": 3}, "models": [], "estimatedTokenBudget": None, "notes": "$60 credits/mo"},
    {"name": "Max", "monthlyPrice": 100, "limits": {"concurrent": 10}, "models": [], "estimatedTokenBudget": None, "notes": "$300 credits/mo"},
    {"name": "Team", "monthlyPrice": 500, "limits": {}, "models": [], "estimatedTokenBudget": None, "notes": ""}
  ],
  "gotchas": ["credits don't roll over", "peak pricing 12-18 UTC"],
  "tosHighlights": [],
  "dataTraining": "No",
  "ipIndemnity": False
})
