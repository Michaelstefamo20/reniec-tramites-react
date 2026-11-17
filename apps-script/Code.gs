const SECRET_PROPERTY = 'RENIEC_MAIL_SHARED_SECRET';

/** Run once from the editor to trigger Google's send-mail authorization prompt. */
function authorizeMailSending() {
  const remaining = MailApp.getRemainingDailyQuota();
  if (remaining < 1) throw new Error('No quedan destinatarios disponibles hoy en la cuota de Gmail.');
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Prueba de autorización de Trámites+', 'Autorización del remitente completada. Puedes ignorar este mensaje.');
  Logger.log('Mail send authorization completed.');
}

/** Set once: replace the placeholder with the exact APPS_SCRIPT_MAIL_SECRET stored on Vercel. */
function configureMailSecret() {
  const secret = 'REPLACE_WITH_THE_SAME_RANDOM_SECRET';
  if (secret === 'REPLACE_WITH_THE_SAME_RANDOM_SECRET' || secret.length < 32) {
    throw new Error('Replace the placeholder with a random value of at least 32 characters, then run again.');
  }
  PropertiesService.getScriptProperties().setProperty(SECRET_PROPERTY, secret);
}

function doPost(e) {
  try {
    const savedSecret = PropertiesService.getScriptProperties().getProperty(SECRET_PROPERTY);
    const data = JSON.parse(e && e.postData && e.postData.contents || '{}');
    if (!savedSecret || !data.secret || !constantTimeEquals(String(data.secret), savedSecret)) {
      return output({ ok: false, code: 'unauthorized' });
    }

    const recipient = String(data.to || '').trim();
    const subject = String(data.subject || '').trim().slice(0, 180);
    const textBody = String(data.text || '').slice(0, 15000);
    const htmlBody = String(data.html || '').slice(0, 15000);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(recipient) || !subject || (!textBody && !htmlBody)) {
      return output({ ok: false, code: 'invalid_request' });
    }
    if (MailApp.getRemainingDailyQuota() < 1) return output({ ok: false, code: 'daily_quota_exhausted' });

    MailApp.sendEmail({
      to: recipient,
      subject,
      body: textBody || 'Abre el mensaje en un cliente compatible con HTML.',
      htmlBody: htmlBody || undefined,
      name: 'Trámites RENIEC',
    });
    return output({ ok: true });
  } catch (error) {
    console.error('Activation email sending failed:', error && error.name ? error.name : 'unknown');
    return output({ ok: false, code: 'send_failed' });
  }
}

function constantTimeEquals(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}

function output(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
