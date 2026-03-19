/**
 * HTML email templates for marketing campaigns.
 * All templates use inline CSS for email client compatibility.
 */

interface TemplateData {
  restaurantName: string;
  restaurantLogo?: string;
  customerName?: string;
  discountCode?: string;
  unsubscribeUrl?: string;
}

function baseWrapper(content: string, data: TemplateData): string {
  const logo = data.restaurantLogo
    ? `<img src="${data.restaurantLogo}" alt="${data.restaurantName}" style="width:80px;height:80px;border-radius:50%;margin-bottom:16px;" />`
    : "";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#171717;border-radius:12px;overflow:hidden;">
<tr><td style="padding:32px;text-align:center;">
${logo}
<div style="color:#f59e0b;font-size:20px;font-weight:700;margin-bottom:8px;">${data.restaurantName}</div>
</td></tr>
<tr><td style="padding:0 32px 32px;">${content}</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #262626;text-align:center;">
<p style="color:#525252;font-size:11px;margin:0;">
${data.unsubscribeUrl ? `<a href="${data.unsubscribeUrl}" style="color:#525252;">Unsubscribe</a> · ` : ""}
Powered by ChefIApp
</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

export function welcomeTemplate(data: TemplateData): string {
  const discount = data.discountCode
    ? `<div style="background:#1c1917;border:1px dashed #f59e0b;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
<div style="color:#a3a3a3;font-size:12px;">Your welcome discount</div>
<div style="color:#f59e0b;font-size:28px;font-weight:700;letter-spacing:2px;">${data.discountCode}</div>
</div>`
    : "";
  return baseWrapper(
    `<h1 style="color:#fafafa;font-size:24px;margin:0 0 12px;">Welcome${data.customerName ? `, ${data.customerName}` : ""}! 🎉</h1>
<p style="color:#d4d4d4;font-size:14px;line-height:1.6;">Thank you for visiting <strong>${data.restaurantName}</strong>. We're excited to have you as part of our family.</p>
${discount}
<p style="color:#d4d4d4;font-size:14px;">We look forward to seeing you again soon!</p>`,
    data
  );
}

export function winBackTemplate(
  data: TemplateData & { lastVisitDays: number }
): string {
  const discount = data.discountCode
    ? `<div style="background:#1c1917;border:1px dashed #f59e0b;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
<div style="color:#a3a3a3;font-size:12px;">Come back and enjoy</div>
<div style="color:#f59e0b;font-size:28px;font-weight:700;letter-spacing:2px;">${data.discountCode}</div>
</div>`
    : "";
  return baseWrapper(
    `<h1 style="color:#fafafa;font-size:24px;margin:0 0 12px;">We miss you! 💛</h1>
<p style="color:#d4d4d4;font-size:14px;line-height:1.6;">It's been ${data.lastVisitDays} days since your last visit to <strong>${data.restaurantName}</strong>. We've been working on new dishes we think you'll love.</p>
${discount}
<p style="color:#d4d4d4;font-size:14px;">Hope to see you soon!</p>`,
    data
  );
}

export function birthdayTemplate(data: TemplateData): string {
  const discount = data.discountCode
    ? `<div style="background:#1c1917;border:1px dashed #f59e0b;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
<div style="color:#a3a3a3;font-size:12px;">Your birthday gift</div>
<div style="color:#f59e0b;font-size:28px;font-weight:700;letter-spacing:2px;">${data.discountCode}</div>
</div>`
    : "";
  return baseWrapper(
    `<h1 style="color:#fafafa;font-size:24px;margin:0 0 12px;">Happy Birthday${data.customerName ? `, ${data.customerName}` : ""}! 🎂</h1>
<p style="color:#d4d4d4;font-size:14px;line-height:1.6;">Everyone at <strong>${data.restaurantName}</strong> wishes you a wonderful birthday! We have a special treat for you.</p>
${discount}
<p style="color:#d4d4d4;font-size:14px;">Celebrate with us — you deserve it!</p>`,
    data
  );
}

export function promotionTemplate(
  data: TemplateData & { promoText: string }
): string {
  return baseWrapper(
    `<h1 style="color:#fafafa;font-size:24px;margin:0 0 12px;">Special Offer 🔥</h1>
<p style="color:#d4d4d4;font-size:14px;line-height:1.6;">${data.promoText}</p>
${
  data.discountCode
    ? `<div style="background:#1c1917;border:1px dashed #f59e0b;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
<div style="color:#a3a3a3;font-size:12px;">Use code</div>
<div style="color:#f59e0b;font-size:28px;font-weight:700;letter-spacing:2px;">${data.discountCode}</div>
</div>`
    : ""
}`,
    data
  );
}

export function feedbackTemplate(
  data: TemplateData & { orderDate: string }
): string {
  return baseWrapper(
    `<h1 style="color:#fafafa;font-size:24px;margin:0 0 12px;">How was your visit? ⭐</h1>
<p style="color:#d4d4d4;font-size:14px;line-height:1.6;">Thank you for dining at <strong>${data.restaurantName}</strong> on ${data.orderDate}. We'd love to hear about your experience.</p>
<div style="text-align:center;margin:24px 0;">
<span style="font-size:32px;cursor:pointer;">⭐⭐⭐⭐⭐</span>
</div>
<p style="color:#a3a3a3;font-size:12px;text-align:center;">Your feedback helps us improve!</p>`,
    data
  );
}
