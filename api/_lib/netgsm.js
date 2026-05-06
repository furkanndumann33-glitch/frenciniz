// NetGSM REST v2 SMS API
// https://api.netgsm.com.tr/sms/rest/v2/send
// Auth: HTTP Basic with username:password (NETGSM_USERCODE / NETGSM_PASSWORD)
// msgheader: NetGSM panel'inden onaylı gönderici adı (NETGSM_MSGHEADER)
// IYS: ticari mesajlar için "iysfilter" kullanılır; bilgilendirme/işlem mesajları için boş bırakılır.

const ENDPOINT = "https://api.netgsm.com.tr/sms/rest/v2/send";

const RESPONSE_CODES = {
  "00": "Başarılı",
  "01": "Görev mesaj başlığı bulunamadı",
  "02": "Görev mesaj başlığı onaylı değil",
  "20": "Mesaj metnindeki problem",
  "30": "Geçersiz kullanıcı adı / şifre veya kullanıcı API erişimine kapalı",
  "40": "Mesaj başlığı (msgheader) sisteme tanımlı değil",
  "50": "Aboneliğiniz İYS kapsamında ticari aboneliğe uygun değil",
  "60": "Hesap aktifleştirilmemiş",
  "70": "Hatalı parametre, eksik bilgi gönderdiniz",
  "80": "Gönderim sınır aşımı",
  "85": "Mükerrer gönderim sınır aşımı (1 dk içinde aynı no'ya aynı mesaj)",
  "100": "Sistem hatası",
};

export function normalizePhone(raw) {
  if (!raw) return "";
  let s = String(raw).replace(/\D/g, "");
  // 90XXXXXXXXXX → XXXXXXXXXX
  if (s.startsWith("90") && s.length === 12) s = s.slice(2);
  // 0XXXXXXXXXX → XXXXXXXXXX
  if (s.startsWith("0") && s.length === 11) s = s.slice(1);
  // 5XXXXXXXXX bekleniyor (10 hane), aksi halde geçersiz
  if (s.length !== 10 || !s.startsWith("5")) return "";
  return s;
}

function basicAuth() {
  const u = process.env.NETGSM_USERCODE || "";
  const p = process.env.NETGSM_PASSWORD || "";
  if (!u || !p) return null;
  return "Basic " + Buffer.from(`${u}:${p}`).toString("base64");
}

/**
 * Tek SMS gönderir.
 * @param {string} phone - 5XX..., 05XX..., +905XX... — normalize edilir
 * @param {string} message - Mesaj metni (TR encoding ile karakter limiti 155, GSM ile 160)
 * @param {object} [opts]
 * @param {string} [opts.msgheader] - Gönderici adı (default: NETGSM_MSGHEADER)
 * @param {string} [opts.encoding] - "TR" (default) veya "TR-EN" / "GSM"
 * @param {string} [opts.iysfilter] - İYS filtre kodu (ticari için): "" (boş = bilgilendirme/işlem)
 * @returns {Promise<{ok:boolean, code:string, description:string, jobid?:string, raw?:string}>}
 */
export async function sendSms(phone, message, opts = {}) {
  const auth = basicAuth();
  if (!auth) return { ok: false, code: "NO_CREDS", description: "NETGSM_USERCODE/NETGSM_PASSWORD env değişkenleri tanımlı değil" };

  const msgheader = opts.msgheader || process.env.NETGSM_MSGHEADER || "";
  if (!msgheader) return { ok: false, code: "NO_HEADER", description: "msgheader (gönderici adı) tanımlı değil" };

  const no = normalizePhone(phone);
  if (!no) return { ok: false, code: "BAD_PHONE", description: `Geçersiz telefon: ${phone}` };

  const body = {
    msgheader,
    encoding: opts.encoding || "TR",
    iysfilter: opts.iysfilter ?? "",
    messages: [{ msg: String(message), no }],
  };
  if (opts.partnercode) body.partnercode = opts.partnercode;

  let raw = "";
  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": auth,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });
    raw = await r.text();
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch {}
    const code = String(parsed?.code ?? raw.trim().split(/\s+/)[0] ?? "");
    const description = parsed?.description || RESPONSE_CODES[code] || `Bilinmeyen yanıt: ${raw.slice(0, 200)}`;
    return {
      ok: code === "00",
      code,
      description,
      jobid: parsed?.jobid,
      raw: raw.slice(0, 500),
    };
  } catch (err) {
    return { ok: false, code: "NET_ERROR", description: err.message || "Ağ hatası", raw };
  }
}

export const NETGSM_RESPONSE_CODES = RESPONSE_CODES;
