import subprocess
import json
import chardet
import re

# 1. Use ollama to generate structured rules from raw rule text
def extract_rules_with_llm(rule_text: str) -> list:
    prompt = f"""
You are an AI assistant extracting rules from a regulatory document.
Return a JSON list of rules. Each rule should have:
- id (number)
- transaction_type (e.g., mortgage, auto, etc. or "any")
- description (human-readable)
- condition (logical check in plain English)

RULE TEXT:
{rule_text}
"""

    output = subprocess.run(
        ["ollama", "run", "mistral", prompt], capture_output=True
    )

    detected = chardet.detect(output.stdout)
    try:
        decoded_stdout = output.stdout.decode(detected['encoding'])
        print("LLM RAW OUTPUT:\n", decoded_stdout)

        # Try extracting first JSON-like block using regex
        json_matches = re.findall(r'(\[.*?\])', decoded_stdout, re.DOTALL)
        if json_matches:
            rules = json.loads(json_matches[0])
            return rules

        # Fallback: try the last line
        rules_json = decoded_stdout.strip().split("\n")[-1]
        rules = json.loads(rules_json)
        return rules

    except Exception as e:
        print("Failed to parse rules from LLM:", e)
        return []

# 2. Match a transaction against the rule set
def check_transaction_with_rules(transaction: dict, rules: list) -> list:
    violations = []
    for rule in rules:
        txn_type = transaction.get("transaction_type", "any").lower()
        if rule["transaction_type"].lower() != "any" and rule["transaction_type"].lower() != txn_type:
            continue

        check_prompt = f"""
Given the following transaction:
{json.dumps(transaction, indent=2)}

and the rule:
{json.dumps(rule, indent=2)}

Does this transaction violate the rule? Answer YES or NO and provide a reason and a remediation.
Return this in JSON:
{{"violation": true/false, "reason": "...", "remediation": "..."}}
"""
        try:
            response = subprocess.run(
                ["ollama", "run", "mistral", check_prompt], capture_output=True, text=True, encoding="utf-8"
            )
            print("LLM RAW OUTPUT:", response.stdout)
            last_line = response.stdout.strip().split("\n")[-1]
            result = json.loads(last_line)
            if result.get("violation"):
                violations.append({
                    "rule": rule["description"],
                    "reason": result.get("reason"),
                    "remediation": result.get("remediation")
                })
        except Exception as e:
            print("Error parsing LLM output for transaction:", e)
            continue

    return violations
