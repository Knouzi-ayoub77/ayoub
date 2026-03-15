import finduserbymail from "../Models/database.js";

const username = JSON.parse(sessionStorage.getItem("Currentuser"));

const greetings = document.getElementById("greetingName");
const soldedispo = document.getElementById("availableBalance");
const Revenue = document.getElementById("monthlyIncome");
const Depenses = document.getElementById("monthlyExpenses");
const activeCards = document.getElementById("activeCards");

const Trasnfer = document.getElementById("quickTransfer");
const quickTopup = document.getElementById("quickTopup");
const quickRequest = document.getElementById("quickRequest");

const transfSection = document.getElementById("transfer-section");
const closeTransferBtn = document.getElementById("closeTransferBtn");
const cancelTransferBtn = document.getElementById("cancelTransferBtn");

const transferForm = document.getElementById("transferForm");

const recentTransactionsList = document.getElementById("recentTransactionsList");
const cardsGrid = document.getElementById("cardsGrid");

const beneficiary = document.getElementById("beneficiary");
const sourceCard = document.getElementById("sourceCard");

const currentDate = document.getElementById("currentDate");

const today = new Date();
currentDate.textContent = today.toLocaleDateString();

greetings.textContent = username.name;

function updateDashboard() {
  soldedispo.textContent =
    username.wallet.balance + " " + username.wallet.currency;

  const debits = username.wallet.transactions.filter(
    (t) => t.type === "debit"
  );

  const credits = username.wallet.transactions.filter(
    (t) => t.type === "credit"
  );

  const totalRevenue = credits.reduce((t, x) => t + x.amount, 0);
  const totalDepenses = debits.reduce((t, x) => t + x.amount, 0);

  Revenue.textContent = totalRevenue + " " + username.wallet.currency;
  Depenses.textContent = totalDepenses + " " + username.wallet.currency;

  activeCards.textContent = username.wallet.cards.length;
}

updateDashboard();

function loadTransactions() {
  recentTransactionsList.innerHTML = "";

  username.wallet.transactions
    .slice()
    .reverse()
    .forEach((t) => {
      const div = document.createElement("div");

      div.className = "transaction-item";

      div.innerHTML = `
        <div>
          <strong>${t.type}</strong>
          <p>${t.date}</p>
        </div>

        <div>
          ${t.amount} ${username.wallet.currency}
        </div>
      `;

      recentTransactionsList.appendChild(div);
    });
}

loadTransactions();

function loadCards() {
  cardsGrid.innerHTML = "";

  username.wallet.cards.forEach((card) => {
    const div = document.createElement("div");

    div.className = "card-item";

    div.innerHTML = `
      <div class="card-preview ${card.type}">
        <div class="card-chip"></div>
        <div class="card-number">**** **** **** ${card.numcards.slice(-4)}</div>
        <div class="card-holder">${username.name}</div>
        <div class="card-expiry">${card.expiry}</div>
        <div class="card-type">${card.type}</div>
      </div>
    `;

    cardsGrid.appendChild(div);
  });
}

loadCards();

function loadBeneficiaries() {
  username.wallet.transactions.forEach((t) => {
    if (t.type === "credit") {
      const option = document.createElement("option");

      option.value = t.from;
      option.textContent = t.from;

      beneficiary.appendChild(option);
    }
  });
}

loadBeneficiaries();

function loadSourceCards() {
  username.wallet.cards.forEach((card) => {
    const option = document.createElement("option");

    option.value = card.numcards;
    option.textContent = card.type + " **** " + card.numcards.slice(-4);

    sourceCard.appendChild(option);
  });
}

loadSourceCards();

Trasnfer.addEventListener("click", () => {
  transfSection.classList.remove("hidden");
});

function closeTransfer() {
  transfSection.classList.add("hidden");
  transferForm.reset();
}

closeTransferBtn.addEventListener("click", closeTransfer);
cancelTransferBtn.addEventListener("click", closeTransfer);

transferForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const ben = beneficiary.value;
  const card = sourceCard.value;
  const amount = parseFloat(document.getElementById("amount").value);

  if (amount > username.wallet.balance) {
    alert("Solde insuffisant");
    return;
  }

  username.wallet.balance -= amount;

  username.wallet.transactions.push({
    id: Date.now(),
    type: "debit",
    amount: amount,
    date: new Date().toLocaleDateString(),
    from: card,
    to: ben
  });

  updateDashboard();
  loadTransactions();

  closeTransfer();
});

quickTopup.addEventListener("click", () => {
  const amount = prompt("Montant à recharger");

  if (!amount) return;

  username.wallet.balance += parseFloat(amount);

  username.wallet.transactions.push({
    id: Date.now(),
    type: "credit",
    amount: parseFloat(amount),
    date: new Date().toLocaleDateString(),
    from: "Recharge",
    to: username.name
  });

  updateDashboard();
  loadTransactions();
});

quickRequest.addEventListener("click", () => {
  const person = prompt("Demander à qui ?");
  const amount = prompt("Montant ?");

  if (!person || !amount) return;

  username.wallet.balance += parseFloat(amount);

  username.wallet.transactions.push({
    id: Date.now(),
    type: "credit",
    amount: parseFloat(amount),
    date: new Date().toLocaleDateString(),
    from: person,
    to: username.name
  });

  updateDashboard();
  loadTransactions();
});