'use client';

import { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Food & Dining',
  'Housing & Rent',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Other',
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function FinanceApp() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('income');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(todayISO);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/transactions`)
      .then((r) => r.json())
      .then(setTransactions)
      .catch(() => {});
  }, []);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: description.trim(), amount: parsed, type, category, date }),
    });

    if (res.ok) {
      const newTx: Transaction = await res.json();
      setTransactions((prev) => [newTx, ...prev]);
      setDescription('');
      setAmount('');
      setDate(todayISO());
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1 className="header-title">FinanceTracker</h1>
          <p className="header-sub">Personal Finance Dashboard</p>
        </div>
      </header>

      <main className="container">
        <section className="summary-grid" aria-label="Financial summary">
          <div className="card card-balance" data-testid="balance-card">
            <p className="card-label">Net Balance</p>
            <p className="card-amount" data-testid="balance-amount">
              {formatCurrency(balance)}
            </p>
          </div>
          <div className="card" data-testid="income-card">
            <p className="card-label">Total Income</p>
            <p className="card-amount income-text" data-testid="income-amount">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="card" data-testid="expense-card">
            <p className="card-label">Total Expenses</p>
            <p className="card-amount expense-text" data-testid="expense-amount">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </section>

        <div className="main-grid">
          <section className="card">
            <h2 className="section-title">Add Transaction</h2>
            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <p className="error-msg" role="alert" data-testid="form-error">
                  {error}
                </p>
              )}

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <input
                  id="description"
                  type="text"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly Salary"
                  data-testid="description-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount" className="form-label">
                  Amount ($)
                </label>
                <input
                  id="amount"
                  type="number"
                  className="form-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  data-testid="amount-input"
                />
              </div>

              <div className="form-group">
                <span className="form-label">Type</span>
                <div className="type-toggle">
                  <button
                    type="button"
                    className={`type-btn${type === 'income' ? ' type-btn-active-income' : ''}`}
                    onClick={() => setType('income')}
                    data-testid="type-income"
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    className={`type-btn${type === 'expense' ? ' type-btn-active-expense' : ''}`}
                    onClick={() => setType('expense')}
                    data-testid="type-expense"
                  >
                    Expense
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="category" className="form-label">
                  Category
                </label>
                <select
                  id="category"
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  data-testid="category-select"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="date" className="form-label">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  data-testid="date-input"
                />
              </div>

              <button type="submit" className="btn-primary" data-testid="submit-button">
                Add Transaction
              </button>
            </form>
          </section>

          <section className="card">
            <h2 className="section-title">
              Transactions
              <span className="count-badge">{transactions.length}</span>
            </h2>

            {transactions.length === 0 ? (
              <p className="empty-state" data-testid="empty-state">
                No transactions yet. Add one to get started.
              </p>
            ) : (
              <ul className="transaction-list" data-testid="transaction-list">
                {transactions.map((tx) => (
                  <li key={tx.id} className="transaction-item" data-testid="transaction-item">
                    <div className="transaction-dot" data-type={tx.type} />
                    <div className="transaction-info">
                      <p className="transaction-description">{tx.description}</p>
                      <p className="transaction-meta">
                        {tx.category} · {formatDate(tx.date)}
                      </p>
                    </div>
                    <p
                      className={`transaction-amount ${tx.type === 'income' ? 'income-text' : 'expense-text'}`}
                    >
                      {tx.type === 'income' ? '+' : '−'}
                      {formatCurrency(tx.amount)}
                    </p>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(tx.id)}
                      aria-label={`Delete ${tx.description}`}
                      data-testid="delete-button"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
