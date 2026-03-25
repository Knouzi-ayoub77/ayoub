import { getbeneficiaries, finduserbyaccount, findbeneficiarieByid } from "/src/Models/database.js";

const user = JSON.parse(sessionStorage.getItem("currentUser"));

// DOM elements
const greetingName    = document.getElementById("greetingName");        
const currentDate     = document.getElementById("currentDate");
const solde           = document.getElementById("availableBalance");
const incomeElement   = document.getElementById("monthlyIncome");
const expensesElement = document.getElementById("monthlyExpenses");
const activecards     = document.getElementById("activeCards");
const transactionsList  = document.getElementById("recentTransactionsList");
const transferBtn       = document.getElementById("quickTransfer");
const transferSection   = document.getElementById("transfer-section");   
const closeTransferBtn  = document.getElementById("closeTransferBtn");
const cancelTransferBtn = document.getElementById("cancelTransferBtn");
const beneficiarySelect = document.getElementById("beneficiary");
const sourceCard        = document.getElementById("sourceCard");
const submitTransferBtn = document.getElementById("submitTransferBtn");

if (!user) {
  alert("User not authenticated");
  window.location.href = "/index.html";
}

// Events
transferBtn.addEventListener("click", handleTransfersection);
closeTransferBtn.addEventListener("click", closeTransfer);
cancelTransferBtn.addEventListener("click", closeTransfer);
submitTransferBtn.addEventListener("click", handleTransfer);

// Retrieve dashboard data
const getDashboardData = () => {
  const monthlyIncome = user.wallet.transactions
    .filter(t => t.type === "credit")
    .reduce((total, t) => total + t.amount, 0);

  const monthlyExpenses = user.wallet.transactions
    .filter(t => t.type === "debit")
    .reduce((total, t) => total + t.amount, 0);

  return {
    userName: user.name,
    currentDate: new Date().toLocaleDateString("fr-FR"),
    availableBalance: `${user.wallet.balance} ${user.wallet.currency}`,
    activeCards: user.wallet.cards.length,
    monthlyIncome: `${monthlyIncome} MAD`,
    monthlyExpenses: `${monthlyExpenses} MAD`,
  };
};

function renderDashboard() {
  const dashboardData = getDashboardData();
  if (dashboardData) {
    greetingName.textContent    = dashboardData.userName;
    currentDate.textContent     = dashboardData.currentDate;
    solde.textContent           = dashboardData.availableBalance;
    incomeElement.textContent   = dashboardData.monthlyIncome;
    expensesElement.textContent = dashboardData.monthlyExpenses;
    activecards.textContent     = dashboardData.activeCards;
  }

  // Affichage des transactions
  transactionsList.innerHTML = "";
  user.wallet.transactions.forEach(transaction => {
    const transactionItem = document.createElement("div");
    transactionItem.className = "transaction-item";
    transactionItem.innerHTML = `
      <div>${transaction.date}</div>
      <div>${transaction.amount} MAD</div>
      <div>${transaction.type}</div>
    `;
    transactionsList.appendChild(transactionItem);
  });
}

renderDashboard();

// Transfer section
function closeTransfer() {
  transferSection.classList.add("hidden");       
  transferSection.classList.remove("active");
  document.body.classList.remove("popup-open");
}

function handleTransfersection() {
  transferSection.classList.remove("hidden");    
  transferSection.classList.add("active");
  document.body.classList.add("popup-open");
}

// Bénéficiaires
const beneficiaries = getbeneficiaries(user.id);

function renderBeneficiaries() {
  beneficiarySelect.innerHTML = `<option value="" disabled selected>Choisir un bénéficiaire</option>`;
  beneficiaries.forEach((beneficiary) => {
    const option = document.createElement("option");
    option.value = beneficiary.id;
    option.textContent = beneficiary.name;
    beneficiarySelect.appendChild(option);
  });
}
renderBeneficiaries();

function renderCards() {
  sourceCard.innerHTML = `<option value="" disabled selected>Sélectionner une carte</option>`;
  user.wallet.cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = card.type + " ****" + card.numcards;
    sourceCard.appendChild(option);
  });
}
renderCards();

// ################################### Transfer ###################################

function checkUser(numcompte) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const beneficiary = finduserbyaccount(numcompte);
      if (beneficiary) {
        resolve(beneficiary);
      } else {
        reject("Bénéficiaire introuvable");
      }
    }, 2000);
  });
}

function checkSolde(expediteur, amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (expediteur.wallet.balance > amount) {
        resolve("Solde suffisant");
      } else {
        reject("Solde insuffisant");
      }
    }, 3000);
  });
}

function updateSolde(expediteur, destinataire, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      expediteur.wallet.balance -= amount;
      destinataire.wallet.balance += amount;
      resolve("Solde mis à jour");
    }, 2000);
  });
}

function addtransactions(expediteur, destinataire, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const credit = {
        id: Date.now(),
        type: "credit",
        amount: amount,
        date: new Date().toLocaleString(),   
        from: expediteur.name
      };

      const debit = {
        id: Date.now() + 1,
        type: "debit",
        amount: amount,
        date: new Date().toLocaleString(),   
        to: destinataire.name
      };

      expediteur.wallet.transactions.push(debit);
      destinataire.wallet.transactions.push(credit);

      renderDashboard();                     
      resolve("Transaction enregistrée avec succès");
    }, 3000);
  });
}

function transfer(expediteur, numcompte, amount) {
  checkUser(numcompte)
    .then(destinataire => {
    
      console.log("Étape 1 : Destinataire trouvé —", destinataire.name);
      return checkSolde(expediteur, amount)
        .then(() => destinataire);
    })
    .then(destinataire => {
      console.log("Étape 2 : Solde OK");
      return updateSolde(expediteur, destinataire, amount)
        .then(() => destinataire);
    })
    .then(destinataire => {
      console.log("Étape 3 : Solde mis à jour");
      return addtransactions(expediteur, destinataire, amount);
    })
    .then(() => {
      console.log("Transfert réussi !");
      alert("Transfert effectué avec succès !");
      closeTransfer();
    })
    .catch(error => {
      console.error("Erreur :", error);
      alert(`Erreur : ${error}`);
    });
}

function handleTransfer(e) {
  e.preventDefault();

  const beneficiaryId = beneficiarySelect.value;
  const amount = Number(document.getElementById("amount").value);

  if (!beneficiaryId) {
    alert("Veuillez choisir un bénéficiaire.");
    return;
  }
  if (!amount || amount <= 0) {
    alert("Veuillez entrer un montant valide.");
    return;
  }

  const ben = findbeneficiarieByid(user.id, beneficiaryId);
  if (!ben) {
    alert("Bénéficiaire introuvable.");
    return;
  }

  transfer(user, ben.account, amount);
}