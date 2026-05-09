import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const starterTransactions = [
  {
    id: 1,
    title: "Groceries",
    amount: 68.42,
    type: "Expense",
    category: "Food",
    date: "2026-05-02",
    note: "Weekly grocery run",
  },
  {
    id: 2,
    title: "Part-time paycheck",
    amount: 420,
    type: "Income",
    category: "Work",
    date: "2026-05-03",
    note: "Weekend shift",
  },
  {
    id: 3,
    title: "Gas",
    amount: 34.16,
    type: "Expense",
    category: "Transportation",
    date: "2026-05-04",
    note: "Filled tank",
  },
];

const starterBudgets = {
  Food: 250,
  Transportation: 140,
  Entertainment: 120,
  School: 180,
};

function App() {
  const fileInputRef = useRef(null);
  const [transactions, setTransactions] = useState(() => readStorage("budgetlite-transactions", starterTransactions));
  const [budgets, setBudgets] = useState(() => readStorage("budgetlite-budgets", starterBudgets));
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Expense");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("Food");
  const [budgetAmount, setBudgetAmount] = useState("250");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("Budget saves automatically on this device.");

  useEffect(() => {
    localStorage.setItem("budgetlite-transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("budgetlite-budgets", JSON.stringify(budgets));
  }, [budgets]);

  const categories = useMemo(() => {
    return [...new Set([...Object.keys(budgets), ...transactions.map((item) => item.category)])];
  }, [budgets, transactions]);

  const filteredTransactions = useMemo(() => {
    const search = query.trim().toLowerCase();

    return transactions
      .filter((item) => filter === "All" || item.type === filter || item.category === filter)
      .filter((item) => (
        !search
        || item.title.toLowerCase().includes(search)
        || item.category.toLowerCase().includes(search)
        || item.note.toLowerCase().includes(search)
      ))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [filter, query, transactions]);

  const income = transactions
    .filter((item) => item.type === "Income")
    .reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions
    .filter((item) => item.type === "Expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;
  const savingsRate = income ? Math.round((balance / income) * 100) : 0;
  const topCategory = categories
    .map((name) => ({
      name,
      spent: transactions
        .filter((item) => item.type === "Expense" && item.category === name)
        .reduce((sum, item) => sum + item.amount, 0),
    }))
    .sort((a, b) => b.spent - a.spent)[0];

  function addTransaction(event) {
    event.preventDefault();

    if (!title.trim() || !amount) return;

    setTransactions([
      ...transactions,
      {
        id: Date.now(),
        title: title.trim(),
        amount: Number(amount),
        type,
        category: category.trim() || "General",
        date,
        note: note.trim() || "No note added.",
      },
    ]);

    setTitle("");
    setAmount("");
    setNote("");
    setDate("");
  }

  function saveBudget(event) {
    event.preventDefault();

    if (!budgetCategory.trim() || !budgetAmount) return;

    setBudgets({
      ...budgets,
      [budgetCategory.trim()]: Number(budgetAmount),
    });
    setBudgetAmount("");
    setMessage(`Budget saved for ${budgetCategory.trim()}.`);
  }

  function deleteTransaction(id) {
    setTransactions(transactions.filter((item) => item.id !== id));
  }

  function exportBudget() {
    downloadFile(
      "budgetlite-data.json",
      JSON.stringify({ app: "BudgetLite", exportedAt: new Date().toISOString(), transactions, budgets }, null, 2),
      "application/json"
    );
    setMessage("Budget file exported.");
  }

  function exportCsv() {
    const header = "Title,Amount,Type,Category,Date,Note";
    const rows = transactions.map((item) => (
      [item.title, item.amount, item.type, item.category, item.date, item.note]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    ));

    downloadFile("budgetlite-transactions.csv", [header, ...rows].join("\n"), "text/csv");
    setMessage("Transaction CSV exported.");
  }

  function importBudget(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported.transactions)) throw new Error("Missing transactions.");

        setTransactions(imported.transactions.map(normalizeTransaction));
        setBudgets(imported.budgets || starterBudgets);
        setMessage(`Imported ${imported.transactions.length} transactions from ${file.name}.`);
      } catch {
        setMessage("Import failed. Use a BudgetLite JSON export.");
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  }

  return (
    <main className="app-shell">
      <section className="budget-app">
        <header className="hero">
          <div>
            <p className="eyebrow">Personal finance planner</p>
            <h1>Budget Lite</h1>
            <p>Track income, spending, category budgets, and exportable money records.</p>
          </div>
          <div className="balance-card">
            <span>Current balance</span>
            <strong>{formatMoney(balance)}</strong>
            <p>{savingsRate}% savings rate</p>
          </div>
        </header>

        <section className="stats-grid" aria-label="Budget overview">
          <article>
            <span>{formatMoney(income)}</span>
            <p>Income</p>
          </article>
          <article>
            <span>{formatMoney(expenses)}</span>
            <p>Expenses</p>
          </article>
          <article>
            <span>{transactions.length}</span>
            <p>Entries</p>
          </article>
          <article>
            <span>{topCategory?.name || "None"}</span>
            <p>Top category</p>
          </article>
        </section>

        <div className="layout-grid">
          <aside className="side-panel">
            <section className="panel">
              <p className="eyebrow">Save and import</p>
              <p className="panel-copy">{message}</p>
              <button onClick={exportBudget} type="button">Export budget</button>
              <button onClick={exportCsv} type="button">Export CSV</button>
              <button onClick={() => fileInputRef.current?.click()} type="button">Import file</button>
              <input
                ref={fileInputRef}
                className="file-input"
                type="file"
                accept="application/json,.json"
                onChange={importBudget}
              />
            </section>

            <form className="panel budget-form" onSubmit={saveBudget}>
              <p className="eyebrow">Category budget</p>
              <label>
                Category
                <input value={budgetCategory} onChange={(event) => setBudgetCategory(event.target.value)} />
              </label>
              <label>
                Monthly limit
                <input
                  value={budgetAmount}
                  onChange={(event) => setBudgetAmount(event.target.value)}
                  min="0"
                  type="number"
                />
              </label>
              <button type="submit">Save limit</button>
            </form>
          </aside>

          <section className="workspace">
            <form className="transaction-form" onSubmit={addTransaction}>
              <label className="field-name">
                <span>Name</span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Coffee, rent, paycheck" />
              </label>
              <label className="field-amount">
                <span>Amount</span>
                <input value={amount} onChange={(event) => setAmount(event.target.value)} min="0" type="number" />
              </label>
              <label className="field-type">
                <span>Type</span>
                <select value={type} onChange={(event) => setType(event.target.value)}>
                  <option>Expense</option>
                  <option>Income</option>
                </select>
              </label>
              <label className="field-category">
                <span>Category</span>
                <input value={category} onChange={(event) => setCategory(event.target.value)} />
              </label>
              <label className="field-date">
                <span>Date</span>
                <input value={date} onChange={(event) => setDate(event.target.value)} type="date" />
              </label>
              <label className="field-note">
                <span>Note</span>
                <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional detail" />
              </label>
              <button type="submit">Add entry</button>
            </form>

            <section className="controls">
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transactions or notes" />
              <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option>All</option>
                <option>Income</option>
                <option>Expense</option>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </section>

            <section className="budget-bars">
              {categories.map((item) => {
                const spent = transactions
                  .filter((transaction) => transaction.type === "Expense" && transaction.category === item)
                  .reduce((sum, transaction) => sum + transaction.amount, 0);
                const limit = budgets[item] || 0;
                const percent = limit ? Math.min(Math.round((spent / limit) * 100), 100) : 0;

                return (
                  <article key={item}>
                    <div>
                      <strong>{item}</strong>
                      <span>{formatMoney(spent)} / {limit ? formatMoney(limit) : "No limit"}</span>
                    </div>
                    <div className="bar" aria-label={`${item} budget progress`}>
                      <span style={{ width: `${percent}%` }} />
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="transactions">
              {filteredTransactions.map((item) => (
                <article className="transaction" key={item.id}>
                  <div>
                    <h2>{item.title}</h2>
                    <p>{item.note}</p>
                    <div className="chips">
                      <span>{item.category}</span>
                      <span>{item.date || "No date"}</span>
                      <span>{item.type}</span>
                    </div>
                  </div>
                  <strong className={item.type === "Income" ? "money income" : "money expense"}>
                    {item.type === "Income" ? "+" : "-"}{formatMoney(item.amount)}
                  </strong>
                  <button onClick={() => deleteTransaction(item.id)} type="button">Remove</button>
                </article>
              ))}
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeTransaction(item) {
  return {
    id: item.id || Date.now(),
    title: item.title || item.name || "Untitled entry",
    amount: Number(item.amount) || 0,
    type: item.type === "Income" ? "Income" : "Expense",
    category: item.category || "General",
    date: item.date || "",
    note: item.note || "Imported entry.",
  };
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default App;
