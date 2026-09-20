import type { Order } from '../types';

export const ADMIN_NOTIFICATION_EMAIL = 'mahihandwoven059@gmail.com';

/**
 * Format order items for email display
 */
export const formatOrderItemsList = (items: Order['items']): string => {
  return items
    .map(item => `• ${item.quantity}x ${item.name} ($${(item.purchasePrice * item.quantity).toFixed(2)})`)
    .join('\n');
};

/**
 * Format address into a readable single-line string
 */
export const formatOrderAddress = (addr: Order['shippingAddress']): string => {
  return `${addr.addressLine}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
};

// Track recently sent order IDs to prevent duplicate dispatches
const sentOrderIds = new Set<string>();

/**
 * Generates a pre-filled mailto URI as an instant zero-latency email fallback.
 */
export const generateMailtoReceipt = (order: Order, currency: string = 'USD'): string => {
  const currencySymbol = currency === 'USD' ? '$' : `${currency} `;
  const items = formatOrderItemsList(order.items);
  const address = formatOrderAddress(order.shippingAddress);

  const subject = encodeURIComponent(`Order Confirmation #${order.orderId} - Mahi Handwoven`);
  const body = encodeURIComponent(
    `Dear ${order.customerName},\n\n` +
    `Thank you for shopping with Mahi Handwoven!\n\n` +
    `Order Reference: #${order.orderId}\n` +
    `Date: ${new Date(order.createdAt).toLocaleString()}\n\n` +
    `ITEMS ORDERED:\n${items}\n\n` +
    `Subtotal: ${currencySymbol}${order.subtotal.toFixed(2)}\n` +
    `Shipping: ${order.shipping === 0 ? 'Free' : `${currencySymbol}${order.shipping.toFixed(2)}`}\n` +
    `Tax: ${currencySymbol}${order.tax.toFixed(2)}\n` +
    `TOTAL AMOUNT: ${currencySymbol}${order.total.toFixed(2)}\n\n` +
    `PAYMENT METHOD: Cash on Delivery (COD)\n\n` +
    `DELIVERY ADDRESS:\n${address}\n\n` +
    `If you have questions, contact us at ${ADMIN_NOTIFICATION_EMAIL}.\n\n` +
    `Mahi Handwoven Artisans`
  );

  return `mailto:${order.customerEmail}?subject=${subject}&body=${body}`;
};

/**
 * Sends order notification emails:
 * 1. To the admin (mahihandwoven059@gmail.com) with complete order details.
 * 2. To the receiver (customer) via CC and native FormSubmit auto-response,
 *    without asking the customer to activate any forms.
 */
export const sendOrderNotifications = async (order: Order, currency: string = 'USD'): Promise<{ success: boolean; message?: string }> => {
  if (!order || !order.orderId) return { success: false, message: 'Invalid order' };
  if (sentOrderIds.has(order.orderId)) {
    return { success: true, message: 'Already sent' };
  }
  sentOrderIds.add(order.orderId);
  setTimeout(() => sentOrderIds.delete(order.orderId), 60000);

  const itemsSummary = formatOrderItemsList(order.items);
  const formattedAddress = formatOrderAddress(order.shippingAddress);
  const currencySymbol = currency === 'USD' ? '$' : `${currency} `;

  // Personalized customer autoresponse body
  const customerAutoresponse = 
`Dear ${order.customerName},

Thank you for your order with Mahi Handwoven! Your order #${order.orderId} has been successfully received and our artisans are preparing it.

ORDER SUMMARY:
${itemsSummary}

Subtotal: ${currencySymbol}${order.subtotal.toFixed(2)}
Shipping: ${order.shipping === 0 ? 'Free' : `${currencySymbol}${order.shipping.toFixed(2)}`}
Tax: ${currencySymbol}${order.tax.toFixed(2)}
Total Amount (Cash on Delivery): ${currencySymbol}${order.total.toFixed(2)}

DELIVERY ADDRESS:
${formattedAddress}

Contact: ${order.customerPhone} | ${order.customerEmail}

Thank you for supporting ethical, sustainable handcrafted art! If you have any questions, simply reply directly to this email or reach us at ${ADMIN_NOTIFICATION_EMAIL}.

Warm regards,
Mahi Handwoven Team`;

  // Authoritative payload sent to store admin with customer CC and autoresponse
  const submissionPayload = {
    email: order.customerEmail,
    _replyto: order.customerEmail,
    _cc: order.customerEmail,
    _autoresponse: customerAutoresponse,
    _subject: `[New Order Confirmed #${order.orderId}] Mahi Handwoven`,
    _template: 'table',
    _captcha: 'false',
    'Order Reference': `#${order.orderId}`,
    'Customer Name': order.customerName,
    'Customer Email': order.customerEmail,
    'Customer Phone': order.customerPhone,
    'Delivery Address': formattedAddress,
    'Payment Method': 'Cash on Delivery (COD)',
    'Items Ordered': itemsSummary,
    'Subtotal': `${currencySymbol}${order.subtotal.toFixed(2)}`,
    'Shipping Fee': `${currencySymbol}${order.shipping.toFixed(2)}`,
    'Tax': `${currencySymbol}${order.tax.toFixed(2)}`,
    'Total Amount': `${currencySymbol}${order.total.toFixed(2)}`,
    'Order Date': new Date(order.createdAt).toLocaleString(),
    'Order Status': 'Pending - Processing'
  };

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${ADMIN_NOTIFICATION_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(submissionPayload)
    });

    const data = await response.json().catch(() => null);
    console.log('[Order Notifications] FormSubmit response:', data);

    if (data && data.success === 'true') {
      return { success: true };
    } else {
      return { 
        success: false, 
        message: data?.message || 'Email delivery queued. Awaiting endpoint activation or delivery.' 
      };
    }
  } catch (err: any) {
    console.warn('[Order Notifications] Network error during dispatch:', err);
    return { success: false, message: err?.message || 'Network error' };
  }
};
