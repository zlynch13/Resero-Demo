from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

transactions: list[dict] = []


class TransactionIn(BaseModel):
    description: str
    amount: float
    type: Literal["income", "expense"]
    category: str
    date: str


@app.get("/transactions")
def get_transactions():
    return transactions


@app.post("/transactions", status_code=201)
def create_transaction(tx: TransactionIn):
    new_tx = {"id": str(uuid.uuid4()), **tx.model_dump()}
    transactions.insert(0, new_tx)
    return new_tx


@app.delete("/transactions/{tx_id}")
def delete_transaction(tx_id: str):
    global transactions
    before = len(transactions)
    transactions = [t for t in transactions if t["id"] != tx_id]
    if len(transactions) == before:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"ok": True}


@app.delete("/transactions")
def clear_transactions():
    global transactions
    transactions = []
    return {"ok": True}
