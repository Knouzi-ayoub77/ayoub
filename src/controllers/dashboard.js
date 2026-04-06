import {
  getbeneficiaries,
  finduserbyaccount,
  findbeneficiarieByid,
  updateUserData,
  checkcard,
  charger
} from "../Models/database.js";

const user = JSON.parse(sessionStorage.getItem("currentUser"));

// DOM elements
const greetingName = document.getElementById("greetingName");
const currentDate = document.getElementById("currentDate");
const solde = document.getElementById("availableBalance");
const incomeElement = document.getElementById("monthlyIncome");
const expensesElement = document.getElementById("monthlyExpenses");
const activecards = document.getElementById("activeCards");
const transactionsList = document.getElementById("recentTransactionsList");
const transferBtn = document.getElementById("quickTransfer");
const rechargeBtn = document.getElementById("quickTopup");
const transferSection = document.getElementById("transferPopup");
const rechargeSection = document.getElementById("rechargePopup");
const closeTransferBtn = document.getElementById("closeTransferBtn");
const cancelTransferBtn = document.getElementById("cancelTransferBtn");
const beneficiarySelect = document.getElementById("beneficiary");
const sourceCard = document.getElementById("sourceCard");
const submitTransferBtn = document.getElementById("submitTransferBtn");
const closeRechargeBtn = document.getElementById("closeRechargeBtn");
const cancelRechargeBtn = document.getElementById("cancelRechargeBtn");
const submitRechargeBtn = document.getElementById("submitRechargeBtn");
const rechargeSourceCard = document.getElementById("sourceCard-recharge");

// Guard
if (!user) {
  alert("User not authenticated");
  window.location.href = "/index.html";
}

// Events
transferBtn.addEventListener("click", handleTransfersection);
rechargeBtn.addEventListener("click", handleRechargesection);
closeTransferBtn.addEventListener("click", closeTransfer);
cancelTransferBtn.addEventListener("click", closeTransfer);
submitTransferBtn.addEventListener("click", handleTransfer);
closeRechargeBtn.addEventListener("click", closeRechargesection);
cancelRechargeBtn.addEventListener("click", closeRechargesection);
submitRechargeBtn.addEventListener("click", handleRecharge);

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
    greetingName.textContent = dashboardData.userName;
    currentDate.textContent = dashboardData.currentDate;
    solde.textContent = dashboardData.availableBalance;
    incomeElement.textContent = dashboardData.monthlyIncome;
    expensesElement.textContent = dashboardData.monthlyExpenses;
    activecards.textContent = dashboardData.activeCards;
  }
  
  // Display transactions
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

// Transfer popup
function closeTransfer() {
  transferSection.classList.remove("active");
  document.body.classList.remove("popup-open");
}

function handleTransfersection() {
  transferSection.classList.add("active");
  document.body.classList.add("popup-open");
}

function handleRechargesection() {
  rechargeSection.classList.add("active");
  document.body.classList.add("popup-open");
}

function closeRechargesection() {
  rechargeSection.classList.remove("active");
  document.body.classList.remove("popup-open");
}

// Beneficiaries
const beneficiaries = getbeneficiaries(user.id);

function renderBeneficiaries() {
  beneficiaries.forEach((beneficiary) => {
    const option = document.createElement("option");
    option.value = beneficiary.id;
    option.textContent = beneficiary.name;
    beneficiarySelect.appendChild(option);
  });
}
renderBeneficiaries();

function renderCards() {
  user.wallet.cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = card.type + "****" + card.numcards;
    sourceCard.appendChild(option);
    rechargeSourceCard.appendChild(option.cloneNode(true));
  });
}
renderCards();

// ============= VERSIONS ASYNC/AWAIT DES FONCTIONS =============

async function checkUser(numcompte) {
  console.log("Checking beneficiary account:", numcompte);
  const destinataire = await new Promise((resolve, reject) => {
    setTimeout(() => {
      const destinataire = finduserbyaccount(numcompte);
      if (destinataire) {
        resolve(destinataire);
      } else {
        reject("beneficiary not found");
      }
    }, 2000);
  });
  return destinataire;
}

async function checkSolde(expediteur, amount) {
  console.log("Checking balance for amount:", amount);
  const result = await new Promise((resolve, reject) => {
    setTimeout(() => {
      if (expediteur.wallet.balance >= amount) {
        resolve("Sufficient balance");
      } else {
        reject("Insufficient balance");
      }
    }, 3000);
  });
  return result;
}

async function updateSolde(expediteur, destinataire, amount) {
  console.log("Updating balance...");
  const result = await new Promise((resolve) => {
    setTimeout(() => {
      expediteur.wallet.balance -= amount;
      destinataire.wallet.balance += amount;
      resolve("update balance done");
    }, 200);
  });
  return result;
}

async function addtransactions(expediteur, destinataire, amount) {
  console.log("Adding transactions...");
  const result = await new Promise((resolve) => {
    setTimeout(() => {
      // create credit transaction
      const credit = {
        id: Date.now(),
        type: "credit",
        amount: amount,
        date: new Date().toLocaleString(),
        from: expediteur.name,
      };
      // create debit transaction
      const debit = {
        id: Date.now(),
        type: "debit",
        amount: amount,
        date: new Date().toLocaleString(),
        to: destinataire.name,
      };
      expediteur.wallet.transactions.push(debit);
      destinataire.wallet.transactions.push(credit);

      updateUserData(expediteur);
      updateUserData(destinataire);
      sessionStorage.setItem("currentUser", JSON.stringify(expediteur));

      resolve("transaction added successfully");
    }, 3000);
  });
  return result;
}

async function checkCardValidity(cardNumber) {
  console.log("Checking card validity for card number:", cardNumber);
  const result = await new Promise((resolve, reject) => {
    setTimeout(() => {
      const isValid = checkcard(cardNumber, user.id);
      if (isValid) {
        resolve("Card is valid");
      } else {
        reject("Card is invalid or expired");
      }
    }, 2000);
  });
  return result;
}

async function chargerCard(cardNumber, amount) {
  console.log("Charging card...");
  const cards = user.wallet.cards;
  const card = cards.find((c) => c.numcards === cardNumber);
  card.balance -= amount;
  user.wallet.balance += amount;
  
  const result = await new Promise((resolve, reject) => {
    setTimeout(() => {
      const done = updateUserData(user);
      if (done) {
        resolve("Card charged successfully");
      } else {
        reject("Failed to charge the card");
      }
    }, 2000);
  });
  return result;
}

// ============= VERSION ASYNC/AWAIT DU TRANSFERT =============

async function transfer(expediteur, numcompte, amount) {
  console.log("DÉBUT DU TRANSFERT...");
  try {
    const destinataire = await checkUser(numcompte);
    console.log("Étape 1: Destinataire trouvé -", destinataire.name);
    
    await checkSolde(expediteur, amount);
    console.log("Étape 2: Solde suffisant");
    
    await updateSolde(expediteur, destinataire, amount);
    console.log("Étape 3: Soldes mis à jour");
    
    await addtransactions(expediteur, destinataire, amount);
    console.log("Étape 4: Transactions ajoutées");
    
    console.log(`Transfert de ${amount} MAD réussi!`);
    renderDashboard();
    sessionStorage.setItem("currentUser", JSON.stringify(expediteur));
    alert(`Transfert de ${amount} MAD effectué avec succès !`);
    closeTransfer();
  } catch (erreur) {
    console.error("Échec du transfert :", erreur);
    alert(`Erreur : ${erreur}`);
  }
}

// ============= VERSION ASYNC/AWAIT DE LA RECHARGE =============

async function recharge(amount, cardNumber) {
  console.log("DÉBUT DE LA RECHARGE...");
  try {
    await checkCardValidity(cardNumber);
    console.log("Étape 1: Carte valide -", cardNumber);
    
    await chargerCard(cardNumber, amount);
    console.log("Étape 2: Carte chargée avec succès");
    
    console.log(`Recharge de ${amount} MAD réussie!`);
    renderDashboard();
    sessionStorage.setItem("currentUser", JSON.stringify(user));
    alert(`Recharge de ${amount} MAD effectuée avec succès !`);
    closeRechargesection();
  } catch (erreur) {
    console.error("Échec de la recharge :", erreur);
    alert(`Erreur : ${erreur}`);
  }
}

// ============= GESTIONNAIRES D'ÉVÉNEMENTS MIS À JOUR =============

function handleTransfer(e) {
  e.preventDefault();
  const beneficiaryId = document.getElementById("beneficiary").value;
  const beneficiaryAccount = findbeneficiarieByid(user.id, beneficiaryId).account;
  const amount = Number(document.getElementById("amount").value);
  
  if (amount <= 0) {
    alert("Veuillez entrer un montant valide");
    return;
  }
  
  transfer(user, beneficiaryAccount, amount);
}

function handleRecharge(e) {
  e.preventDefault();
  const cardNumber = rechargeSourceCard.value;
  const amount = Number(document.getElementById("amountrecharge").value);
  
  if (amount < 10 || amount > 5000) {
    alert("Veuillez entrer un montant valide (entre 10 et 5000 MAD)");
    return;
  }
  
  recharge(amount, cardNumber);
}