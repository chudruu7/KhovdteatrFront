// src/api/sendConfirmationEmail.js

export async function sendConfirmationEmail(params) {
  try {
    const res = await fetch('/api/bookings/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    // 404 эсвэл HTML хариу ирвэл JSON parse хийхгүй
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        success: false,
        message: `Backend route олдсонгүй (${res.status}). bookingRoutes.js-д route нэмсэн эсэхийг шалгана уу.`,
      };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[sendConfirmationEmail] Алдаа:', err.message);
    return { success: false, message: err.message };
  }
}

export const sendBookingConfirmation = async (params) => {
  // ← ЭНЭ МӨРИЙГ НЭМНЭ:
  console.log('[Email DEBUG] USER:', process.env.GMAIL_USER, '| PASS длина:', process.env.GMAIL_APP_PASS?.length);
};