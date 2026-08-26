'use strict';

const SUPABASE_URL = 'https://ltxrycmreumoqfpcbwnb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wdc4ImKB1f0Q-v4Po9DOwA_xIpPXHkh';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let allOrders = [];
let currentFilter = 'all';

const ORDER_STATUSES = [
    'new',
    'confirmed',
    'packed',
    'shipped',
    'delivered',
    'cancelled',
    'returned'
];

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function money(value) {
    const n = Number(value || 0);

    return Number.isFinite(n)
        ? `₹${n.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })}`
        : '₹0';
}

function dateTime(value) {
    if (!value) return '—';

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
        return escapeHtml(value);
    }

    return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function statusLabel(status) {
    const value = String(status || 'new');

    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function statusClass(status) {
    const value = String(status || 'new').toLowerCase();

    return `s-${value}`;
}

function normalizeStatus(status) {
    return String(status || 'new').toLowerCase();
}

/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

    const container = document.getElementById('orders');

    if (!container) return;

    container.innerHTML = `
        <div class="loading">
            Loading orders...
        </div>
    `;

    try {

        const { data, error } = await supabaseClient
            .from('orders')
            .select(`
                id,
                order_number,
                gateway,
                gateway_order_id,
                gateway_payment_id,
                payment_status,
                order_status,
                currency,
                subtotal,
                discount,
                shipping_fee,
                tax,
                total,
                coupon_code,
                customer_name,
                customer_email,
                customer_phone,
                address_line1,
                address_line2,
                city,
                state,
                postal_code,
                country,
                notes,
                source,
                medium,
                campaign,
                landing_page,
                referrer,
                session_id,
                created_at,
                updated_at,
                invoice_number,
                tracking_number,
                tracking_url,
                payment_method,
                billing_address,
                shipping_address
            `)
            .order('created_at', {
                ascending: false
            });

        if (error) {
            throw error;
        }

        allOrders = Array.isArray(data)
            ? data
            : [];

        updateStats();

        renderOrders();

    } catch (error) {

        console.error('Orders loading error:', error);

        container.innerHTML = `
            <div class="error">
                <strong>Unable to load orders.</strong>
                <br><br>
                ${escapeHtml(error.message || 'Unknown error')}
                <br><br>
                <button class="btn" onclick="loadOrders()">
                    Try Again
                </button>
            </div>
        `;
    }
}

/* =========================================================
   STATS
========================================================= */

function updateStats() {

    const total = allOrders.length;

    const pending = allOrders.filter(order =>
        normalizeStatus(order.order_status) === 'new'
    ).length;

    const processing = allOrders.filter(order =>
        ['confirmed', 'packed'].includes(
            normalizeStatus(order.order_status)
        )
    ).length;

    const delivered = allOrders.filter(order =>
        normalizeStatus(order.order_status) === 'delivered'
    ).length;

    const revenue = allOrders
        .filter(order =>
            String(order.payment_status || '').toLowerCase() === 'paid'
        )
        .reduce(
            (sum, order) => sum + Number(order.total || 0),
            0
        );

    const totalEl = document.getElementById('total');
    const pendingEl = document.getElementById('pending');
    const processingEl = document.getElementById('processing');
    const deliveredEl = document.getElementById('delivered');
    const revenueEl = document.getElementById('revenue');

    if (totalEl) {
        totalEl.textContent = total;
    }

    if (pendingEl) {
        pendingEl.textContent = pending;
    }

    if (processingEl) {
        processingEl.textContent = processing;
    }

    if (deliveredEl) {
        deliveredEl.textContent = delivered;
    }

    if (revenueEl) {
        revenueEl.textContent = money(revenue);
    }
}

/* =========================================================
   FILTER + SEARCH
========================================================= */

function getSearchValue() {

    const input = document.getElementById('search');

    return String(input?.value || '')
        .trim()
        .toLowerCase();
}

function filteredOrders() {

    const search = getSearchValue();

    return allOrders.filter(order => {

        const status = normalizeStatus(order.order_status);

        if (
            currentFilter !== 'all' &&
            status !== currentFilter
        ) {
            return false;
        }

        if (!search) {
            return true;
        }

        const searchable = [
            order.order_number,
            order.customer_name,
            order.customer_email,
            order.customer_phone,
            order.payment_status,
            order.order_status,
            order.city,
            order.state,
            order.postal_code,
            order.tracking_number,
            order.invoice_number
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return searchable.includes(search);
    });
}

function renderOrders() {

    const container = document.getElementById('orders');

    if (!container) return;

    const orders = filteredOrders();

    if (!orders.length) {

        container.innerHTML = `
            <div class="empty">
                <strong>No orders found.</strong>
                <br><br>
                Try changing the search or filter.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="wrap">

            <table>

                <thead>

                    <tr>
                        <th>ORDER</th>
                        <th>CUSTOMER</th>
                        <th>DATE</th>
                        <th>PAYMENT</th>
                        <th>STATUS</th>
                        <th>TOTAL</th>
                        <th>ACTION</th>
                    </tr>

                </thead>

                <tbody>

                    ${orders.map(renderOrderRow).join('')}

                </tbody>

            </table>

        </div>
    `;
}

function renderOrderRow(order) {

    const status = normalizeStatus(order.order_status);

    const payment = String(
        order.payment_status || 'pending'
    ).toLowerCase();

    return `
        <tr>

            <td>
                <strong>
                    ${escapeHtml(
                        order.order_number || 'Order'
                    )}
                </strong>

                <div class="small">
                    ${escapeHtml(order.id || '')}
                </div>
            </td>

            <td>

                <strong>
                    ${escapeHtml(
                        order.customer_name || 'Guest Customer'
                    )}
                </strong>

                <div class="small">
                    ${escapeHtml(
                        order.customer_phone || ''
                    )}
                </div>

                <div class="small">
                    ${escapeHtml(
                        order.customer_email || ''
                    )}
                </div>

            </td>

            <td>
                ${dateTime(order.created_at)}
            </td>

            <td>

                <span class="status ${
                    payment === 'paid'
                        ? 's-delivered'
                        : payment === 'failed'
                            ? 's-cancelled'
                            : 's-pending'
                }">

                    ${escapeHtml(payment)}

                </span>

                ${
                    order.payment_method
                        ? `<div class="small">${escapeHtml(order.payment_method)}</div>`
                        : ''
                }

            </td>

            <td>

                <span class="status ${statusClass(status)}">

                    ${escapeHtml(
                        statusLabel(status)
                    )}

                </span>

            </td>

            <td>
                <strong>
                    ${money(order.total)}
                </strong>
            </td>

            <td>

                <button
                    class="btn"
                    type="button"
                    onclick="openOrder('${escapeHtml(order.id)}')"
                >
                    View
                </button>

            </td>

        </tr>
    `;
}

/* =========================================================
   ORDER DETAILS
========================================================= */

async function openOrder(orderId) {

    const order = allOrders.find(
        item => String(item.id) === String(orderId)
    );

    if (!order) {
        alert('Order not found.');
        return;
    }

    const modal = document.getElementById('modal');
    const title = document.getElementById('title');
    const body = document.getElementById('body');

    if (!modal || !title || !body) return;

    title.textContent =
        order.order_number || 'Order Details';

    body.innerHTML = `
        <div class="notice">
            Order created ${dateTime(order.created_at)}
        </div>

        <div class="actions">

            <button
                class="invoice"
                onclick="printInvoice('${escapeHtml(order.id)}')"
            >
                Invoice
            </button>

            <button
                class="pdf"
                onclick="printInvoice('${escapeHtml(order.id)}')"
            >
                Print / Save PDF
            </button>

            ${
                order.customer_phone
                    ? `
                    <button
                        class="wa"
                        onclick="openWhatsApp('${escapeHtml(order.id)}')"
                    >
                        WhatsApp Customer
                    </button>
                    `
                    : ''
            }

        </div>

        <div class="grid">

            <div class="info">

                <h3>CUSTOMER</h3>

                <p>
                    <strong>
                        ${escapeHtml(
                            order.customer_name || 'Guest Customer'
                        )}
                    </strong>
                    <br>
                    ${escapeHtml(
                        order.customer_email || 'No email'
                    )}
                    <br>
                    ${escapeHtml(
                        order.customer_phone || 'No phone'
                    )}
                </p>

            </div>

            <div class="info">

                <h3>ORDER TOTAL</h3>

                <p>

                    Subtotal:
                    ${money(order.subtotal)}
                    <br>

                    Discount:
                    ${money(order.discount)}
                    <br>

                    Shipping:
                    ${money(order.shipping_fee)}
                    <br>

                    Tax:
                    ${money(order.tax)}
                    <br><br>

                    <strong>
                        Total:
                        ${money(order.total)}
                    </strong>

                </p>

            </div>

            <div class="info">

                <h3>PAYMENT</h3>

                <p>

                    Status:
                    <strong>
                        ${escapeHtml(
                            order.payment_status || 'pending'
                        )}
                    </strong>

                    <br>

                    Method:
                    ${escapeHtml(
                        order.payment_method || '—'
                    )}

                    <br>

                    Gateway:
                    ${escapeHtml(
                        order.gateway || '—'
                    )}

                    ${
                        order.gateway_payment_id
                            ? `
                                <br>
                                Payment ID:
                                ${escapeHtml(
                                    order.gateway_payment_id
                                )}
                              `
                            : ''
                    }

                </p>

            </div>

            <div class="info">

                <h3>SHIPPING ADDRESS</h3>

                <p>

                    ${escapeHtml(
                        order.customer_name || ''
                    )}
                    <br>

                    ${escapeHtml(
                        order.address_line1 || ''
                    )}

                    ${
                        order.address_line2
                            ? `<br>${escapeHtml(order.address_line2)}`
                            : ''
                    }

                    <br>

                    ${escapeHtml(
                        order.city || ''
                    )}
                    ${order.city && order.state ? ', ' : ''}
                    ${escapeHtml(
                        order.state || ''
                    )}

                    ${
                        order.postal_code
                            ? `<br>${escapeHtml(order.postal_code)}`
                            : ''
                    }

                    ${
                        order.country
                            ? `<br>${escapeHtml(order.country)}`
                            : ''
                    }

                </p>

            </div>

        </div>

        <div style="margin-top:20px">

            <h3>
                Order Status
            </h3>

            <select
                id="statusSelect"
            >

                ${ORDER_STATUSES.map(status => `
                    <option
                        value="${status}"
                        ${
                            status === normalizeStatus(
                                order.order_status
                            )
                                ? 'selected'
                                : ''
                        }
                    >
                        ${escapeHtml(
                            statusLabel(status)
                        )}
                    </option>
                `).join('')}

            </select>

            <button
                class="update"
                id="updateStatusButton"
                onclick="updateOrderStatus('${escapeHtml(order.id)}')"
            >
                Update Order Status
            </button>

        </div>

        <div style="margin-top:25px">

            <h3>
                Tracking
            </h3>

            <div class="tracking">

                <input
                    id="trackingNumber"
                    placeholder="Tracking number"
                    value="${escapeHtml(
                        order.tracking_number || ''
                    )}"
                >

                <input
                    id="trackingUrl"
                    placeholder="Tracking URL"
                    value="${escapeHtml(
                        order.tracking_url || ''
                    )}"
                >

            </div>

            <button
                class="update"
                onclick="updateTracking('${escapeHtml(order.id)}')"
            >
                Save Tracking
            </button>

        </div>

        ${
            order.invoice_number
                ? `
                    <div style="margin-top:20px">
                        <strong>Invoice:</strong>
                        ${escapeHtml(order.invoice_number)}
                    </div>
                  `
                : ''
        }

        ${
            order.coupon_code
                ? `
                    <div style="margin-top:10px">
                        <strong>Coupon:</strong>
                        ${escapeHtml(order.coupon_code)}
                    </div>
                  `
                : ''
        }

        ${
            order.notes
                ? `
                    <div class="info" style="margin-top:20px">
                        <h3>ORDER NOTES</h3>
                        <p>${escapeHtml(order.notes)}</p>
                    </div>
                  `
                : ''
        }

    `;

    modal.classList.add('open');
}

function closeModal() {

    const modal = document.getElementById('modal');

    if (modal) {
        modal.classList.remove('open');
    }
}

/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

async function updateOrderStatus(orderId) {

    const select = document.getElementById('statusSelect');
    const button = document.getElementById(
        'updateStatusButton'
    );

    if (!select) return;

    const newStatus = select.value;

    const order = allOrders.find(
        item => String(item.id) === String(orderId)
    );

    if (!order) {
        alert('Order not found.');
        return;
    }

    const oldStatus = normalizeStatus(
        order.order_status
    );

    if (oldStatus === newStatus) {
        alert('Order status is already ' + statusLabel(newStatus));
        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = 'Updating...';
    }

    try {

        const { error } = await supabaseClient
            .from('orders')
            .update({
                order_status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (error) {
            throw error;
        }

        /*
         * Keep order history when possible.
         */
        try {

            await supabaseClient
                .from('order_status_history')
                .insert({
                    order_id: orderId,
                    old_status: oldStatus,
                    new_status: newStatus,
                    note: 'Updated from admin Orders page'
                });

        } catch (historyError) {

            console.warn(
                'Order history could not be saved:',
                historyError
            );

        }

        order.order_status = newStatus;
        order.updated_at = new Date().toISOString();

        updateStats();
        renderOrders();

        alert(
            `Order updated to ${statusLabel(newStatus)}.`
        );

        closeModal();

    } catch (error) {

        console.error(error);

        alert(
            'Could not update order:\n\n' +
            (error.message || 'Unknown error')
        );

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent = 'Update Order Status';
        }

    }
}

/* =========================================================
   TRACKING
========================================================= */

async function updateTracking(orderId) {

    const numberInput =
        document.getElementById('trackingNumber');

    const urlInput =
        document.getElementById('trackingUrl');

    const trackingNumber =
        String(numberInput?.value || '').trim();

    const trackingUrl =
        String(urlInput?.value || '').trim();

    try {

        const { error } = await supabaseClient
            .from('orders')
            .update({
                tracking_number:
                    trackingNumber || null,

                tracking_url:
                    trackingUrl || null,

                updated_at:
                    new Date().toISOString()
            })
            .eq('id', orderId);

        if (error) {
            throw error;
        }

        const order = allOrders.find(
            item => String(item.id) === String(orderId)
        );

        if (order) {

            order.tracking_number =
                trackingNumber || null;

            order.tracking_url =
                trackingUrl || null;

            order.updated_at =
                new Date().toISOString();
        }

        alert('Tracking details saved.');

        renderOrders();

    } catch (error) {

        console.error(error);

        alert(
            'Could not save tracking details:\n\n' +
            (error.message || 'Unknown error')
        );
    }
}

/* =========================================================
   WHATSAPP
========================================================= */

function openWhatsApp(orderId) {

    const order = allOrders.find(
        item => String(item.id) === String(orderId)
    );

    if (!order || !order.customer_phone) {
        alert('Customer phone number is not available.');
        return;
    }

    let phone = String(order.customer_phone)
        .replace(/\D/g, '');

    if (
        phone.length === 10 &&
        phone.startsWith('0') === false
    ) {
        phone = '91' + phone;
    }

    const message =
        `Hi ${order.customer_name || 'there'},\n\n` +
        `This is Trends by AK regarding your order ` +
        `${order.order_number || ''}.\n\n` +
        `Order status: ${statusLabel(
            order.order_status
        )}\n` +
        `Order total: ${money(order.total)}\n\n` +
        `Thank you for shopping with Trends by AK.`;

    const url =
        `https://wa.me/${phone}?text=` +
        encodeURIComponent(message);

    window.open(
        url,
        '_blank',
        'noopener'
    );
}

/* =========================================================
   PRINT INVOICE
========================================================= */

function printInvoice(orderId) {

    const order = allOrders.find(
        item => String(item.id) === String(orderId)
    );

    if (!order) {
        alert('Order not found.');
        return;
    }

    const invoiceWindow =
        window.open(
            '',
            '_blank',
            'width=900,height=700'
        );

    if (!invoiceWindow) {
        alert('Please allow pop-ups for the invoice.');
        return;
    }

    const address = [
        order.address_line1,
        order.address_line2,
        order.city,
        order.state,
        order.postal_code,
        order.country
    ]
        .filter(Boolean)
        .map(escapeHtml)
        .join('<br>');

    invoiceWindow.document.write(`
        <!doctype html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>
                Invoice ${escapeHtml(
                    order.order_number || ''
                )}
            </title>

            <style>

                body{
                    font-family:Arial,sans-serif;
                    margin:40px;
                    color:#222;
                }

                .top{
                    display:flex;
                    justify-content:space-between;
                    border-bottom:2px solid #222;
                    padding-bottom:20px;
                    margin-bottom:25px;
                }

                h1{
                    margin:0;
                }

                .muted{
                    color:#777;
                }

                .grid{
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:30px;
                    margin-bottom:30px;
                }

                .box{
                    border:1px solid #ddd;
                    padding:18px;
                }

                table{
                    width:100%;
                    border-collapse:collapse;
                    margin-top:20px;
                }

                th,
                td{
                    border-bottom:1px solid #ddd;
                    padding:12px;
                    text-align:left;
                }

                .right{
                    text-align:right;
                }

                .total{
                    font-size:20px;
                    font-weight:bold;
                }

                @media print{
                    body{
                        margin:20px;
                    }

                    button{
                        display:none;
                    }
                }

            </style>

        </head>

        <body>

            <div class="top">

                <div>

                    <h1>
                        TRENDS BY AK
                    </h1>

                    <div class="muted">
                        Sustainable Luxury · Affordable
                    </div>

                </div>

                <div>
                    <strong>
                        INVOICE
                    </strong>

                    <br>

                    ${escapeHtml(
                        order.invoice_number ||
                        order.order_number ||
                        ''
                    )}

                    <br>

                    <span class="muted">
                        ${dateTime(order.created_at)}
                    </span>
                </div>

            </div>

            <div class="grid">

                <div class="box">

                    <strong>
                        BILL TO
                    </strong>

                    <p>
                        ${escapeHtml(
                            order.customer_name ||
                            'Customer'
                        )}

                        <br>

                        ${escapeHtml(
                            order.customer_email || ''
                        )}

                        <br>

                        ${escapeHtml(
                            order.customer_phone || ''
                        )}
                    </p>

                </div>

                <div class="box">

                    <strong>
                        SHIPPING ADDRESS
                    </strong>

                    <p>
                        ${address || '—'}
                    </p>

                </div>

            </div>

            <table>

                <tr>
                    <th>Description</th>
                    <th class="right">Amount</th>
                </tr>

                <tr>
                    <td>Order subtotal</td>
                    <td class="right">
                        ${money(order.subtotal)}
                    </td>
                </tr>

                <tr>
                    <td>Discount</td>
                    <td class="right">
                        -${money(order.discount)}
                    </td>
                </tr>

                <tr>
                    <td>Shipping</td>
                    <td class="right">
                        ${money(order.shipping_fee)}
                    </td>
                </tr>

                <tr>
                    <td>Tax</td>
                    <td class="right">
                        ${money(order.tax)}
                    </td>
                </tr>

                <tr>
                    <td class="total">
                        TOTAL
                    </td>

                    <td class="right total">
                        ${money(order.total)}
                    </td>
                </tr>

            </table>

            <p style="margin-top:40px">

                Payment status:
                <strong>
                    ${escapeHtml(
                        order.payment_status || 'pending'
                    )}
                </strong>

            </p>

            <p class="muted">

                Thank you for shopping with Trends by AK.

            </p>

            <button
                onclick="window.print()"
                style="
                    padding:10px 18px;
                    cursor:pointer;
                "
            >
                Print / Save PDF
            </button>

        </body>

        </html>
    `);

    invoiceWindow.document.close();
}

/* =========================================================
   SEARCH EVENTS
========================================================= */

function setupSearch() {

    const input =
        document.getElementById('search');

    if (!input) return;

    input.addEventListener(
        'input',
        renderOrders
    );
}

/* =========================================================
   FILTER EVENTS
========================================================= */

function setupFilters() {

    document
        .querySelectorAll('.filter')
        .forEach(button => {

            button.addEventListener(
                'click',
                () => {

                    document
                        .querySelectorAll('.filter')
                        .forEach(item =>
                            item.classList.remove('active')
                        );

                    button.classList.add('active');

                    currentFilter =
                        button.dataset.status ||
                        'all';

                    renderOrders();
                }
            );

        });
}

/*
 * The existing HTML has a "Processing" button.
 * We map it to confirmed + packed in the display,
 * but because filtering needs one exact database status,
 * clicking Processing shows both statuses.
 */

document.addEventListener(
    'click',
    event => {

        const button =
            event.target.closest(
                '.filter[data-status="processing"]'
            );

        if (!button) return;

        event.preventDefault();

        document
            .querySelectorAll('.filter')
            .forEach(item =>
                item.classList.remove('active')
            );

        button.classList.add('active');

        currentFilter = 'processing';

        const search = getSearchValue();

        const results = allOrders.filter(order => {

            const status =
                normalizeStatus(order.order_status);

            const matchesStatus =
                ['confirmed', 'packed'].includes(status);

            if (!matchesStatus) {
                return false;
            }

            if (!search) {
                return true;
            }

            const searchable = [
                order.order_number,
                order.customer_name,
                order.customer_email,
                order.customer_phone,
                order.payment_status,
                order.order_status,
                order.city,
                order.state,
                order.postal_code,
                order.tracking_number,
                order.invoice_number
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchable.includes(search);
        });

        const container =
            document.getElementById('orders');

        if (!container) return;

        if (!results.length) {

            container.innerHTML = `
                <div class="empty">
                    <strong>
                        No processing orders found.
                    </strong>
                </div>
            `;

            return;
        }

        container.innerHTML = `
            <div class="wrap">

                <table>

                    <thead>

                        <tr>
                            <th>ORDER</th>
                            <th>CUSTOMER</th>
                            <th>DATE</th>
                            <th>PAYMENT</th>
                            <th>STATUS</th>
                            <th>TOTAL</th>
                            <th>ACTION</th>
                        </tr>

                    </thead>

                    <tbody>

                        ${results
                            .map(renderOrderRow)
                            .join('')}

                    </tbody>

                </table>

            </div>
        `;
    }
);

/* =========================================================
   MODAL EVENTS
========================================================= */

document.addEventListener(
    'click',
    event => {

        const modal =
            document.getElementById('modal');

        if (
            modal &&
            event.target === modal
        ) {
            closeModal();
        }

    }
);

document.addEventListener(
    'keydown',
    event => {

        if (event.key === 'Escape') {
            closeModal();
        }

    }
);

/* =========================================================
   START
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        setupSearch();
        setupFilters();
        loadOrders();

        /*
         * Refresh orders every 30 seconds
         * so new customer orders appear automatically.
         */

        setInterval(
            loadOrders,
            30000
        );

    }
);

window.loadOrders = loadOrders;
window.openOrder = openOrder;
window.closeModal = closeModal;
window.updateOrderStatus = updateOrderStatus;
window.updateTracking = updateTracking;
window.openWhatsApp = openWhatsApp;
window.printInvoice = printInvoice;