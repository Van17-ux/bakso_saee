const orders = JSON.parse(localStorage.getItem("orders") || "[]");

const container = document.getElementById("orders");

let totalSales = 0;

orders.forEach(order => {
  totalSales += order.total;

  const div = document.createElement("div");
  div.innerHTML = `
    <hr/>
    <p><strong>${order.orderId}</strong></p>
    <p>Table: ${order.table}</p>
    <pre>${order.summary}</pre>
    <p>Total: Rp. ${order.total}</p>
  `;
  container.appendChild(div);
});

const totalDiv = document.createElement("h2");
totalDiv.innerText = "Total Sales: Rp. " + totalSales;
container.appendChild(totalDiv);

function clearOrders(){
  localStorage.removeItem("orders");
  location.reload();
}
