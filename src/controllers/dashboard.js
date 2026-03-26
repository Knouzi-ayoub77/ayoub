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
submitTransferBtn.addEventListener("click", handleTransfer)
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
    rechargeSourceCard.appendChild(option);
  });
}

renderCards();


function checkUser(numcompte) {
  return new Promise((resolve, reject) => {
    console.log("Checking beneficiary account:", numcompte);
    setTimeout(() => {
      const destinataire = finduserbyaccount(numcompte);
      if (destinataire) {
        resolve(destinataire);
      } else {
        reject("beneficiary not found");
      }
    }, 2000);
  });
}

function checkSolde(expediteur, amount) {
  return new Promise((resolve, reject) => {
    console.log("Checking balance for amount:", amount);
    setTimeout(() => {
      if (expediteur.wallet.balance >= amount) {
        resolve("Sufficient balance");
      } else {
        reject("Insufficient balance");
      }
    }, 3000);
  });
}

function updateSolde(expediteur, destinataire, amount) {
  return new Promise((resolve) => {
    console.log("Updating balance...");
    setTimeout(() => {
      expediteur.wallet.balance -= amount;
      destinataire.wallet.balance += amount;
      resolve("update balance done");
    }, 200);
  });
}

function addtransactions(expediteur, destinataire, amount) {
  return new Promise((resolve) => {
    console.log("Adding transactions...");
    setTimeout(() => {
      // create credit transaction
      const credit = {
        id: Date.now(),
        type: "credit",
        amount: amount,
        date: new Date().toLocaleString(),
        from: expediteur.name,
      };
      //create debit transaction
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
}

// **************************************transfer***************************************************//

function transfer(expediteur, numcompte, amount) {
  checkUser(numcompte) //p0
    .then((destinataire) => {//p1
      return checkSolde(expediteur, amount)//p2
        .then(() =>//p3
          destinataire
        );
    })
    .then((destinataire) => {

      return updateSolde(expediteur, destinataire, amount).then(
        () => (destinataire)
      );
    })
    .then((destinataire) => {
      return addtransactions(expediteur, destinataire, amount).then(
        () => {
          alert(`Transfert de ${amount} réussi!`);
          renderDashboard();
          closeTransfer();
        }
      );

    })
    .catch((error) => {
      console.log(error);
      alert(error);
    });
}


function checkCardValidty(cardNumber) {

  return new Promise((resolve, reject) => {
    console.log("Checking card validity for card number:", cardNumber);
    setTimeout(() => {
      const isValid = checkcard(cardNumber, user.id);
      if (isValid) {
        resolve("Card is valid");
      } else {
        reject("Card is invalid or expired");
      }
    }, 2000);
  });

}

function chargerCard(cardNumber,amount) {
  return new Promise((resolve, reject) => {

    const cards = user.wallet.cards;

    const card = cards.find((c) => c.numcards === cardNumber);


    card.balance -= amount;
    // const user = database.users.find((u) => u.id === userId)
    user.wallet.balance += amount;





    setTimeout(() => {





      const done=updateUserData(user);

      if (done) {
        resolve("Card charged successfully");
      } else {
        reject("Failed to charge the card");
      }
    }, 2000);
  });

}

function handleRecharge(e) {
  e.preventDefault();

  const cardNumber = rechargeSourceCard.value;
  console.log("amoutnnt:", document.getElementById("amountrecharge"));
  const amount = Number(document.getElementById("amountrecharge").value);

  if (amount < 10 || amount > 5000) {
    alert("Please enter a valid amount");
    return;
  }

  checkCardValidty(cardNumber).
    then(() => chargerCard(cardNumber, amount)).
    then(() => renderDashboard()).
    then(() => closeRechargesection()).
    catch((error) => {
      console.log(error);
      alert(error);
    });


  console.log("Recharge amount:", amount);
  console.log("Selected card:", cardNumber);
}


function handleTransfer(e) {
  e.preventDefault();
  const beneficiaryId = document.getElementById("beneficiary").value;
  const beneficiaryAccount = findbeneficiarieByid(user.id, beneficiaryId).account;
  const sourceCard = document.getElementById("sourceCard").value;

  const amount = Number(document.getElementById("amount").value);

  transfer(user, beneficiaryAccount, amount);

}

/*
    function func1(number,callback){
        console.log("start function");
       if(number%2===0){
        console.log("start callback");
        callback(number);
        console.log("end callback");
       }else{
        
       }
       console.log("end function");
    }

    function produit(number){
        console.log("the result is : ", (number*number));
    }

    func1(4,produit);
    */