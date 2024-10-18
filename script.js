document.getElementById('expenseForm').addEventListener('submit', addExpense);
document.getElementById('filterBtn').addEventListener('click', filterExpenses);

const baseURL = '.     ';
const apiKey = 'patGZytPe1xPC3pSn.4ee6bd012046cfa6e42f01c7a32e60e83995121af86f20239597795f68a736ca';

function addExpense(e) {
    e.preventDefault();

    const item = document.getElementById('item').value.trim();
    const amount = parseFloat(document.getElementById('amount').value.trim());
    const categorySelect = document.getElementById('category');
    const selectedCategories = Array.from(categorySelect.selectedOptions).map(option => option.value);
    const category = selectedCategories[0] || '';
    const date = document.getElementById('date').value.trim();

    if (!item || isNaN(amount) || amount <= 0 || !category || !date) {
        alert('Please fill in all fields correctly.');
        return;
    }

    fetch(baseURL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields: {
                Item: item,
                Amount: amount,
                Category: category,
                Date: date
            }
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                console.error('Error response from Airtable:', err);
                throw new Error('Failed to add expense to Airtable');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Expense added to Airtable:', data);
        loadExpenses();
    })
    .catch(error => {
        console.error('Error adding to Airtable:', error);
        alert(`Error: ${error.message}`);
    });


    fetch('https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjUwNTY0MDYzMTA0MzY1MjZiNTUzYzUxMzUi_pc', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            item: item,
            amount: amount,
            category: category,
            date: date
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Expense sent to Pabbly Webhook:', data);
    })
    .catch(error => console.error('Error sending to Pabbly Webhook:', error));
}


function loadExpenses(filterCategory = 'All') {
    fetch(baseURL, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (!data || !data.records) {
            console.error('Unexpected data format:', data);
            return;
        }


        const expensesList = document.getElementById('expensesList');
        expensesList.innerHTML = '';


        const expenses = data.records.map(record => {
            const fields = record.fields;
            return {
                id: record.id,
                item: fields.Item || 'No item',
                amount: fields.Amount || 0,
                category: fields.Category || 'No category',
                date: fields.Date || 'No date'
            };
        });


        const filteredExpenses = expenses.filter(expense => 
            expense.category !== 'No category' && 
            expense.amount > 0 && 
            expense.date !== 'No date'
        ).filter(expense => 
            filterCategory === 'All' || expense.category === filterCategory
        );


        filteredExpenses.forEach(expense => {
            const expenseDiv = document.createElement('div');
            expenseDiv.innerHTML = `<strong>${expense.item}</strong>: Rs.${expense.amount} (${expense.category}) - ${expense.date} <button onclick="deleteExpense('${expense.id}')">Delete</button>`;
            expensesList.appendChild(expenseDiv);
        });

        
        const totalExpense = filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
        document.getElementById('totalExpense').textContent = `Rs.${totalExpense.toFixed(2)}`;

        const categoryTotals = filteredExpenses.reduce((totals, expense) => {
            const category = expense.category;
            if (!totals[category]) {
                totals[category] = 0;
            }
            totals[category] += expense.amount;
            return totals;
        }, {});

        const categoryTotalsDiv = document.getElementById('categoryTotals');
        categoryTotalsDiv.innerHTML = '';
        Object.keys(categoryTotals).forEach(category => {
            const total = categoryTotals[category];
            const categoryDiv = document.createElement('div');
            categoryDiv.textContent = `${category}: Rs.${total.toFixed(2)}`;
            categoryTotalsDiv.appendChild(categoryDiv);
        });
    })
    .catch(error => {
        console.error('Error loading expenses:', error);
        document.getElementById('expensesList').innerHTML = 'Failed to load expenses.';
    });
}


function filterExpenses() {
    const category = document.getElementById('filterCategory').value;
    loadExpenses(category);
}

function deleteExpense(recordId) {
    fetch(`${baseURL}/${recordId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Expense deleted:', data);
        loadExpenses();
    })
    .catch(error => console.error('Error deleting expense:', error));
}

loadExpenses();
