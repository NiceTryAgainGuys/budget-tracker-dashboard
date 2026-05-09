import { useState } from "react";
import "./App.css";

function App() {
  const [expenses, setExpenses] = useState([
    { id: 1, name: "Food", amount: 18 },
    { id: 2, name: "Gas", amount: 35 },
  ]);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  function addExpense(e) {
    e.preventDefault();

    if (!name.trim() || !amount) return;

    setExpenses([
      ...expenses,
      {
        id: Date.now(),
        name: name.trim(),
        amount: Number(amount),
      },
    ]);

    setName("");
    setAmount("");
  }

  function deleteExpense(id) {
    setExpenses(expenses.filter(expense => expense.id !== id));
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <main className="app">
      <section className="card">
        <h1>BudgetLite</h1>
        <p className="subtitle">Track quick expenses and spending totals.</p>

        <div className="total-box">
          <p>Total Spent</p>
          <h2>${total.toFixed(2)}</h2>
        </div>

        <form onSubmit={addExpense} className="form">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Expense name"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            type="number"
            min="0"
          />
          <button>Add</button>
        </form>

        <div className="expense-list">
          {expenses.map(expense => (
            <div key={expense.id} className="expense">
              <div>
                <h3>{expense.name}</h3>
                <p>${expense.amount.toFixed(2)}</p>
              </div>
              <button onClick={() => deleteExpense(expense.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;