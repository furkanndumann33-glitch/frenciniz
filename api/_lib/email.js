// Resend Email API — https://resend.com/docs/api-reference/emails/send-email
// Env: RESEND_API_KEY, EMAIL_FROM (default: noreply@frenciniz.com — domain doğrulanmış olmalı)

const ENDPOINT = "https://api.resend.com/emails";

/**
 * E-posta gönderir.
 * @param {object} args
 * @param {string|string[]} args.to
 * @param {string} args.subject
 * @param {string} [args.html]
 * @param {string} [args.text]
 * @param {string} [args.from] - default EMAIL_FROM env
 * @param {string} [args.replyTo]
 * @returns {Promise<{ok:boolean, id?:string, error?:string}>}
 */
export async function sendEmail({ to, subject, html, text, from, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY tanımlı değil" };

  const fromAddr = from || process.env.EMAIL_FROM || "Frenciniz <noreply@frenciniz.com>";
  const toList = Array.isArray(to) ? to : [to];
  if (toList.length === 0 || !toList[0]) return { ok: false, error: "Alıcı yok" };

  const body = {
    from: fromAddr,
    to: toList,
    subject: String(subject || "").slice(0, 200),
  };
  if (html) body.html = html;
  if (text) body.text = text;
  if (replyTo) body.reply_to = replyTo;
  if (!html && !text) body.text = subject;

  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: data?.message || `HTTP ${r.status}` };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err.message || "Ağ hatası" };
  }
}

// Basit HTML şablon — bilgilendirme/işlem mailleri için
export function emailLayout({ heading, lines = [], cta, footer }) {
  const ctaHtml = cta?.url ? `
    <p style="margin:24px 0;"><a href="${cta.url}" style="display:inline-block;background:#ff6000;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;">${cta.label || "Devam et"}</a></p>` : "";
  const linesHtml = lines.map(l => `<p style="margin:0 0 12px;color:#444;line-height:1.6">${l}</p>`).join("");
  const footerHtml = footer || `
    <p style="margin:24px 0 0;color:#888;font-size:12px;line-height:1.6">
      Frenciniz · Dumanlar Ticaret<br/>
      Hızırbey Mah. 1509 Sok. No:24, Isparta Merkez<br/>
      <a href="tel:+905456087008" style="color:#ff6000;text-decoration:none">0545 608 7008</a> · <a href="https://wa.me/908508887881" style="color:#25D366;text-decoration:none">0850 888 7881</a>
    </p>`;
  return `<!doctype html><html lang="tr"><body style="margin:0;padding:24px;background:#f6f6f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #eee">
    <div style="font-size:22px;font-weight:800;color:#ff6000;margin-bottom:18px">FRENCINIZ</div>
    <h1 style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0 0 16px">${heading || ""}</h1>
    ${linesHtml}
    ${ctaHtml}
    ${footerHtml}
  </div>
</body></html>`;
}
