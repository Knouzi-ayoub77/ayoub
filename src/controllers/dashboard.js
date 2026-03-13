import finduserbymail from "../Models/database.js";
// Recuperer Dom
const username = JSON.parse(sessionStorage.getItem("Currentuser"));
const greetings = document.getElementById("greetingName");
const soldedispo = document.getElementById("availableBalance");
const Revenue = document.getElementById("monthlyIncome");
const Depenses = document.getElementById("monthlyExpenses");
const Trasnfer = document.getElementById("quickTransfer");
const transfSection = document.getElementById("transfer-section");
// Afficher le nom de l'utilisateur
greetings.textContent = username.name;

// Afficher le solde disponible
console.log(username.wallet.balance);
soldedispo.textContent = username.wallet.balance + " " + username.wallet.currency;


// filtrez les transactions de type "debit" et "credit"

const Dtrasnactions =username.wallet.transactions.filter((t) => t.type === "debit");
const Ctransactions =username.wallet.transactions.filter((t) => t.type === "credit");

// calculer le total des revenus et des depenses
const totalRevenue = Ctransactions.reduce((total, t) => total + t.amount, 0);
const totalDepenses = Dtrasnactions.reduce((total, t) => total + t.amount, 0);

// Mettre a jour le contenue des elements HTML pour afficher les revenus et les depenses    
Revenue.textContent = totalRevenue + " " + username.wallet.currency;
Depenses.textContent = totalDepenses + " " + username.wallet.currency;

// Test ds calcules faites : 

console.log("Total Revenue: " + totalRevenue);
console.log("Total Depenses: " + totalDepenses);

// Afficher les dépenses mensuelles
// const totalDepenses = Dtrasnactions.reduce((total, t) => total + t.amount, 0);
// Depenses.textContent = totalDepenses + " " + username.wallet.currency;
console.log(username.name);

Trasnfer.addEventListener("click", Handlertransfer);

function Handlertransfer() {

    transfSection.classList.remove("hidden");

}