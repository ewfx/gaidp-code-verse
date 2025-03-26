from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid
import pandas as pd

from utils.pdf_parser import extract_text_from_pdf
from utils.llm_engine import extract_rules_with_llm, check_transaction_with_rules

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/check")
async def check_rules_and_transactions(
    rules: UploadFile = File(...),
    transactions: UploadFile = File(...)
):
    # Save uploaded files
    print("📥 Received files:", rules.filename, transactions.filename)
    rule_path = f"{UPLOAD_DIR}/{uuid.uuid4()}_{rules.filename}"
    txn_path = f"{UPLOAD_DIR}/{uuid.uuid4()}_{transactions.filename}"

    with open(rule_path, "wb") as f:
        shutil.copyfileobj(rules.file, f)
    with open(txn_path, "wb") as f:
        shutil.copyfileobj(transactions.file, f)

    # Step 1: Extract text from rule PDF
    rule_text = extract_text_from_pdf(rule_path)

    # Step 2: Parse rules using local LLM
    structured_rules = extract_rules_with_llm(rule_text)
    structured_rules = [
    {
        "id": 1,
        "transaction_type": "auto",
        "description": "Auto loans over 20000 not allowed",
        "condition": "amount > 20000"
    }
]
    print("STRUCTURED RULES:", structured_rules)



    # Step 3: Parse transaction CSV
    df = pd.read_csv(txn_path)

    # Step 4: Check each transaction against the rules
    results = []
    for index, row in df.iterrows():
        errors = check_transaction_with_rules(row.to_dict(), structured_rules)
        if errors:
            results.append({
                "row": index + 1,
                "errors": errors
            })

    return {"violations": results}
