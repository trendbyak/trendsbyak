/* =====================================================
   TRENDS BY AK
   ORDERS MANAGEMENT
===================================================== */

const SUPABASE_URL =
    "https://ltxrycmreumoqfpcbwnb.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_wdc4ImKB1f0Q-v4Po9DOwA_xIpPXHkh";

const client =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   STATE
===================================================== */

let orders = [];
let filter = "all";
let currentOrder = null;
let currentItems = [];


/* =====================================================
   HELPERS
===================================================== */

function esc(value) {

    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function money(value) {

    return "₹" +
        Number(value || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );
}


function norm(value) {

    return String(value || "")
        .trim()
        .toLowerCase();
}


function dateText(value) {

    if (!value) return "—";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function statusClass(status) {

    const value = norm(status);

    const allowed = [
        "pending",
        "confirmed",
        "processing",
        "packed",
        "shipped",
        "delivered",
        "cancelled"
    ];

    return "status s-" +
        (
            allowed.includes(value)
                ? value
                : "default"
        );
}


function getName(order) {

    return (
        order.customer_name ||
        order.name ||
        "Guest"
    );
}


function getEmail(order) {

    return (
        order.customer_email ||
        order.email ||
        ""
    );
}


function getPhone(order) {

    return (
        order.customer_phone ||
        order.phone ||
        ""
    );
}


/* =====================================================
   ADDRESS
===================================================== */

function getAddress(order) {

    let address =
        order.shipping_address ||
        order.billing_address;

    if (typeof address === "string") {

        try {

            address = JSON.parse(address);

        } catch (error) {

            return esc(address);

        }
    }

    if (
        address &&
        typeof address === "object"
    ) {

        const parts = [
            address.name,
            address.address_line1,
            address.address_line2,
            address.city,
            address.state,
            address.postal_code,
            address.zip,
            address.country
        ].filter(Boolean);

        if (parts.length) {
            return esc(parts.join(", "));
        }
    }

    const parts = [
        order.address_line1,
        order.address_line2,
        order.city,
        order.state,
        order.postal_code,
        order.country
    ].filter(Boolean);

    return parts.length
        ? esc(parts.join(", "))
        : "—";
}


/* =====================================================
   STATUS OPTION
===================================================== */

function option(value, current) {

    return (
        "<option value=\"" +
        esc(value) +
        "\" " +
        (
            norm(current) === value
                ? "selected"
                : ""
        ) +
        ">" +
        esc(
            value.charAt(0).toUpperCase() +
            value.slice(1)
        ) +
        "</option>"
    );
}


/* =====================================================
   AUTH
===================================================== */

async function start() {

    const result =
        await client.auth.getSession();

    if (!result.data.session) {

        window.location.href =
            "login.html";

        return;
    }

    await loadOrders();
}


/* =====================================================
   LOAD ORDERS
===================================================== */

async function loadOrders() {

    const box =
        document.getElementById("orders");

    box.innerHTML =
        '<div class="loading">Loading orders...</div>';

    const result =
        await client
            .from("orders")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (result.error) {

        box.innerHTML =
            '<div class="error">' +
            '<strong>Could not load orders.</strong>' +
            '<br><br>' +
            esc(result.error.message) +
            '</div>';

        return;
    }

    orders = result.data || [];

    updateStats();

    render();
}


/* =====================================================
   STATS
===================================================== */

function updateStats() {

    document.getElementById("total").textContent =
        orders.length;

    document.getElementById("pending").textContent =
        orders.filter(
            order =>
                norm(order.order_status) === "pending"
        ).length;

    document.getElementById("processing").textContent =
        orders.filter(
            order =>
                norm(order.order_status) === "processing"
        ).length;

    document.getElementById("delivered").textContent =
        orders.filter(
            order =>
                norm(order.order_status) === "delivered"
        ).length;

    const paidRevenue =
        orders
            .filter(
                order =>
                    [
                        "paid",
                        "captured",
                        "success",
                        "successful"
                    ].includes(
                        norm(order.payment_status)
                    )
            )
            .reduce(
                (total, order) =>
                    total +
                    Number(order.total || 0),
                0
            );

    document.getElementById("revenue").textContent =
        money(paidRevenue);
}


/* =====================================================
   RENDER
===================================================== */

function render() {

    const search =
        document
            .getElementById("search")
            .value
            .toLowerCase()
            .trim();

    const filtered =
        orders.filter(order => {

            const status =
                norm(
                    order.order_status ||
                    "pending"
                );

            if (
                filter !== "all" &&
                status !== filter
            ) {
                return false;
            }

            if (!search) {
                return true;
            }

            const searchable = [

                order.order_number,

                getName(order),

                getEmail(order),

                getPhone(order),

                order.gateway_order_id,

                order.gateway_payment_id,

                order.invoice_number,

                order.tracking_number

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchable.includes(search);
        });


    if (!filtered.length) {

        document.getElementById("orders").innerHTML =
            '<div class="empty">No orders found.</div>';

        return;
    }


    let html =

        '<div class="wrap">' +

        '<table>' +

        '<thead>' +

        '<tr>' +

        '<th>Order</th>' +
        '<th>Customer</th>' +
        '<th>Date</th>' +
        '<th>Amount</th>' +
        '<th>Payment</th>' +
        '<th>Status</th>' +
        '<th>Action</th>' +

        '</tr>' +

        '</thead>' +

        '<tbody>';


    filtered.forEach(order => {

        const status =
            norm(
                order.order_status ||
                "pending"
            );

        const payment =
            order.payment_status ||
            "pending";


        html +=

            '<tr>' +

            '<td>' +

            '<strong>' +
            esc(
                order.order_number ||
                order.id
            ) +
            '</strong>' +

            (
                order.invoice_number
                    ?
                    '<br><small>Invoice: ' +
                    esc(order.invoice_number) +
                    '</small>'
                    :
                    ''
            ) +

            '</td>' +


            '<td>' +

            '<strong>' +
            esc(getName(order)) +
            '</strong>' +

            (
                getEmail(order)
                    ?
                    '<br><small>' +
                    esc(getEmail(order)) +
                    '</small>'
                    :
                    ''
            ) +

            (
                getPhone(order)
                    ?
                    '<br><small>' +
                    esc(getPhone(order)) +
                    '</small>'
                    :
                    ''
            ) +

            '</td>' +


            '<td>' +
            dateText(order.created_at) +
            '</td>' +


            '<td>' +
            '<strong>' +
            money(order.total) +
            '</strong>' +
            '</td>' +


            '<td>' +
            esc(payment) +
            '</td>' +


            '<td>' +

            '<span class="' +
            statusClass(status) +
            '">' +

            esc(status) +

            '</span>' +

            '</td>' +


            '<td>' +

            '<button ' +
            'class="btn" ' +
            'onclick="viewOrder(\'' +
            esc(String(order.id)) +
            '\')">' +

            'View' +

            '</button>' +

            '</td>' +

            '</tr>';
    });


    html +=
        '</tbody>' +
        '</table>' +
        '</div>';

    document.getElementById("orders").innerHTML =
        html;
}


/* =====================================================
   VIEW ORDER
===================================================== */

async function viewOrder(id) {

    const order =
        orders.find(
            item =>
                String(item.id) === String(id)
        );

    if (!order) {

        alert("Order not found.");

        return;
    }

    currentOrder = order;

    document.getElementById("title").textContent =
        "Order " +
        (
            order.order_number ||
            order.id
        );

    document.getElementById("modal")
        .classList.add("open");

    document.getElementById("body").innerHTML =
        '<div class="loading">' +
        'Loading order details...' +
        '</div>';


    const result =
        await client
            .from("order_items")
            .select("*")
            .eq(
                "order_id",
                order.id
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (result.error) {

        document.getElementById("body").innerHTML =
            '<div class="error">' +
            esc(result.error.message) +
            '</div>';

        return;
    }

    currentItems = result.data || [];

    renderOrderDetails(
        order,
        currentItems
    );
}


/* =====================================================
   ORDER DETAILS
===================================================== */

function renderOrderDetails(order, items) {

    let rows = "";

    items.forEach(item => {

        rows +=

            '<tr>' +

            '<td>' +
            esc(
                item.product_name ||
                "Product"
            ) +
            '</td>' +

            '<td>' +
            Number(item.quantity || 0) +
            '</td>' +

            '<td>' +
            money(item.unit_price) +
            '</td>' +

            '<td>' +
            money(item.line_total) +
            '</td>' +

            '</tr>';
    });


    if (!rows) {

        rows =
            '<tr>' +
            '<td colspan="4">No order items found.</td>' +
            '</tr>';
    }


    document.getElementById("body").innerHTML =

        '<div class="actions">' +

        '<button class="invoice" onclick="printInvoice()">' +
        '🧾 Print Invoice' +
        '</button>' +

        '<button class="pdf" onclick="printInvoice()">' +
        '📄 Save as PDF' +
        '</button>' +

        '<button class="wa" onclick="whatsappCustomer()">' +
        '📱 WhatsApp' +
        '</button>' +

        '</div>' +


        '<div class="grid">' +

        '<div class="info">' +
        '<h3>Customer</h3>' +
        '<p>' +
        esc(getName(order)) +
        '</p>' +
        '</div>' +

        '<div class="info">' +
        '<h3>Phone</h3>' +
        '<p>' +
        esc(getPhone(order) || "—") +
        '</p>' +
        '</div>' +

        '<div class="info">' +
        '<h3>Email</h3>' +
        '<p>' +
        esc(getEmail(order) || "—") +
        '</p>' +
        '</div>' +

        '<div class="info">' +
        '<h3>Address</h3>' +
        '<p>' +
        getAddress(order) +
        '</p>' +
        '</div>' +

        '</div>' +


        '<h3 style="margin-top:24px">' +
        'Products' +
        '</h3>' +

        '<div class="wrap">' +

        '<table>' +

        '<thead>' +

        '<tr>' +

        '<th>Product</th>' +
        '<th>Qty</th>' +
        '<th>Unit Price</th>' +
        '<th>Total</th>' +

        '</tr>' +

        '</thead>' +

        '<tbody>' +

        rows +

        '</tbody>' +

        '</table>' +

        '</div>' +


        '<h3 style="margin-top:24px">' +
        'Order Summary' +
        '</h3>' +

        '<div class="info">' +

        '<p>Subtotal: <b>' +
        money(order.subtotal) +
        '</b></p>' +

        '<p>Discount: <b>- ' +
        money(order.discount) +
        '</b></p>' +

        '<p>Shipping: <b>' +
        money(order.shipping_fee) +
        '</b></p>' +

        '<p>Tax: <b>' +
        money(order.tax) +
        '</b></p>' +

        '<p style="font-size:17px">' +
        'Total: <b>' +
        money(order.total) +
        '</b></p>' +

        '</div>' +


        '<h3 style="margin-top:24px">' +
        'Payment' +
        '</h3>' +

        '<div class="grid">' +

        '<div class="info">' +
        '<h3>Payment Status</h3>' +
        '<p>' +
        esc(order.payment_status || "—") +
        '</p>' +
        '</div>' +

        '<div class="info">' +
        '<h3>Payment Method</h3>' +
        '<p>' +
        esc(order.payment_method || "—") +
        '</p>' +
        '</div>' +

        '<div class="info">' +
        '<h3>Gateway</h3>' +
        '<p>' +
        esc(order.gateway || "—") +
        '</p>' +
        '</div>' +

        '<div class="info">' +
        '<h3>Payment ID</h3>' +
        '<p>' +
        esc(
            order.gateway_payment_id ||
            order.payment_id ||
            "—"
        ) +
        '</p>' +
        '</div>' +

        '</div>' +


        '<h3 style="margin-top:24px">' +
        'Fulfilment' +
        '</h3>' +

        '<label><b>Order Status</b></label>' +

        '<select id="statusSelect">' +

        option("pending", order.order_status) +
        option("confirmed", order.order_status) +
        option("processing", order.order_status) +
        option("packed", order.order_status) +
        option("shipped", order.order_status) +
        option("delivered", order.order_status) +
        option("cancelled", order.order_status) +

        '</select>' +

        '<div class="tracking">' +

        '<input ' +
        'id="trackingNumber" ' +
        'placeholder="Tracking number" ' +
        'value="' +
        esc(order.tracking_number || "") +
        '">' +

        '<input ' +
        'id="trackingUrl" ' +
        'placeholder="Tracking URL" ' +
        'value="' +
        esc(order.tracking_url || "") +
        '">' +

        '</div>' +

        '<button class="update" onclick="saveOrderChanges()">' +
        'Save Order Changes' +
        '</button>';
}


/* =====================================================
   SAVE ORDER
===================================================== */

async function saveOrderChanges() {

    if (!currentOrder) return;

    const status =
        document.getElementById("statusSelect").value;

    const trackingNumber =
        document.getElementById("trackingNumber")
            .value
            .trim();

    const trackingUrl =
        document.getElementById("trackingUrl")
            .value
            .trim();

    const button =
        document.querySelector(".update");

    button.disabled = true;
    button.textContent = "Saving...";


    const result =
        await client
            .from("orders")
            .update({

                order_status: status,

                tracking_number:
                    trackingNumber || null,

                tracking_url:
                    trackingUrl || null,

                updated_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                currentOrder.id
            );


    button.disabled = false;
    button.textContent = "Save Order Changes";


    if (result.error) {

        alert(
            "Could not update order:\n\n" +
            result.error.message
        );

        return;
    }


    currentOrder.order_status = status;

    currentOrder.tracking_number =
        trackingNumber || null;

    currentOrder.tracking_url =
        trackingUrl || null;


    const index =
        orders.findIndex(
            order =>
                String(order.id) ===
                String(currentOrder.id)
        );

    if (index >= 0) {
        orders[index] = currentOrder;
    }


    updateStats();
    render();


    renderOrderDetails(
        currentOrder,
        currentItems
    );


    const notice =
        document.createElement("div");

    notice.className = "notice";

    notice.textContent =
        "Order updated successfully.";

    document.getElementById("body")
        .prepend(notice);
}


/* =====================================================
   WHATSAPP
===================================================== */

function whatsappCustomer() {

    if (!currentOrder) return;

    let phone =
        getPhone(currentOrder)
            .replace(/\D/g, "");

    if (!phone) {

        alert(
            "No customer phone number is saved on this order."
        );

        return;
    }

    if (phone.length === 10) {
        phone = "91" + phone;
    }


    const message =
        "Hi " +
        getName(currentOrder) +
        ", your Trends by AK order " +
        (
            currentOrder.order_number ||
            ""
        ) +
        " is currently " +
        (
            currentOrder.order_status ||
            "pending"
        ) +
        ". Order total: " +
        money(currentOrder.total) +
        ". Thank you for shopping with us!";


    window.open(
        "https://wa.me/" +
        phone +
        "?text=" +
        encodeURIComponent(message),
        "_blank"
    );
}


/* =====================================================
   PRINT / PDF
===================================================== */

function printInvoice() {

    if (!currentOrder) return;

    const order = currentOrder;

    let itemRows = "";

    currentItems.forEach(item => {

        itemRows +=

            "<tr>" +

            "<td>" +
            esc(
                item.product_name ||
                "Product"
            ) +
            "</td>" +

            "<td>" +
            Number(item.quantity || 0) +
            "</td>" +

            "<td>" +
            money(item.unit_price) +
            "</td>" +

            "<td>" +
            money(item.line_total) +
            "</td>" +

            "</tr>";
    });


    const invoice =

        "<!doctype html>" +

        "<html>" +

        "<head>" +

        "<meta charset=\"UTF-8\">" +

        "<title>Invoice " +
        esc(order.order_number || "") +
        "</title>" +

        "<style>" +

        "body{" +
        "font-family:Arial,sans-serif;" +
        "padding:35px;" +
        "color:#292929" +
        "}" +

        "h1{margin-bottom:4px}" +

        ".muted{color:#777}" +

        ".top{" +
        "display:flex;" +
        "justify-content:space-between;" +
        "border-bottom:2px solid #292929;" +
        "padding-bottom:20px" +
        "}" +

        "table{" +
        "width:100%;" +
        "border-collapse:collapse;" +
        "margin-top:25px" +
        "}" +

        "th,td{" +
        "padding:10px;" +
        "border-bottom:1px solid #ddd;" +
        "text-align:left" +
        "}" +

        ".right{text-align:right}" +

        ".box{" +
        "background:#f7f4ef;" +
        "padding:15px;" +
        "margin-top:20px" +
        "}" +

        "@media print{" +
        "body{padding:0}" +
        "}" +

        "</style>" +

        "</head>" +

        "<body>" +

        "<div class=\"top\">" +

        "<div>" +

        "<h1>TRENDS BY AK</h1>" +

        "<div class=\"muted\">" +
        "Sustainable Luxury but affordable" +
        "</div>" +

        "</div>" +

        "<div>" +

        "<b>INVOICE</b><br>" +

        esc(
            order.invoice_number ||
            order.order_number ||
            ""
        ) +

        "<br>" +

        dateText(order.created_at) +

        "</div>" +

        "</div>" +

        "<h3>Bill To</h3>" +

        "<p>" +

        "<b>" +
        esc(getName(order)) +
        "</b><br>" +

        esc(getEmail(order)) +
        "<br>" +

        esc(getPhone(order)) +
        "<br>" +

        getAddress(order) +

        "</p>" +

        "<table>" +

        "<thead>" +

        "<tr>" +

        "<th>Product</th>" +
        "<th>Qty</th>" +
        "<th>Unit Price</th>" +
        "<th>Total</th>" +

        "</tr>" +

        "</thead>" +

        "<tbody>" +

        itemRows +

        "</tbody>" +

        "</table>" +

        "<div class=\"box\">" +

        "<p>Subtotal: <b>" +
        money(order.subtotal) +
        "</b></p>" +

        "<p>Discount: <b>- " +
        money(order.discount) +
        "</b></p>" +

        "<p>Shipping: <b>" +
        money(order.shipping_fee) +
        "</b></p>" +

        "<p>Tax: <b>" +
        money(order.tax) +
        "</b></p>" +

        "<h2 class=\"right\">" +
        "Total: " +
        money(order.total) +
        "</h2>" +

        "</div>" +

        "<p class=\"muted\">" +

        "Payment: " +
        esc(order.payment_status || "—") +

        " | Method: " +
        esc(order.payment_method || "—") +

        "</p>" +

        "<p>Thank you for shopping with Trends by AK.</p>" +

        "<script>" +

        "window.onload=function(){window.print()}" +

        "<\/script>" +

        "</body>" +

        "</html>";


    const win =
        window.open("", "_blank");


    if (!win) {

        alert(
            "Please allow pop-ups to print the invoice."
        );

        return;
    }


    win.document.open();

    win.document.write(invoice);

    win.document.close();
}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeModal() {

    document
        .getElementById("modal")
        .classList.remove("open");

    currentOrder = null;
    currentItems = [];
}


/* =====================================================
   SEARCH
===================================================== */

document
    .getElementById("search")
    .addEventListener(
        "input",
        render
    );


/* =====================================================
   FILTERS
===================================================== */

document
    .querySelectorAll(".filter")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".filter")
                    .forEach(item =>
                        item.classList.remove("active")
                    );

                button.classList.add("active");

                filter =
                    button.dataset.status;

                render();
            }
        );
    });


/* =====================================================
   MODAL CLICK
===================================================== */

document
    .getElementById("modal")
    .addEventListener(
        "click",
        event => {

            if (
                event.target.id === "modal"
            ) {
                closeModal();
            }
        }
    );


/* =====================================================
   ESCAPE
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {
            closeModal();
        }

    }
);


/* =====================================================
   START
===================================================== */

start();