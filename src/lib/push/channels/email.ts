/**
 * JUBOT 통합 푸시 시스템 — 이메일 채널 어댑터
 * 
 * nodemailer 기반 SMTP 이메일 발송
 * 
 * 환경변수:
 *   SMTP_HOST     — SMTP 서버 주소 (e.g., smtp.gmail.com)
 *   SMTP_PORT     — SMTP 포트 (기본 587)
 *   SMTP_USER     — SMTP 로그인 ID
 *   SMTP_PASS     — SMTP 비밀번호 (App Password 권장)
 *   SMTP_FROM     — 발신자 표시명 (e.g., "JUBOT <noreply@jubot.app>")
 */

import type { ChannelAdapter } from '../types';

interface EmailSendParams {
  recipient: string;
  title: string;
  body: string;
  linkUrl: string;
}

export const emailChannel: ChannelAdapter = {
  async send(params: EmailSendParams) {
    const { recipient, title, body, linkUrl } = params;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || `JUBOT <${smtpUser}>`;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('[Push Email] SMTP 환경변수가 설정되지 않았습니다.');
      return { success: false, error: 'SMTP 설정 미완료' };
    }

    try {
      // Dynamic import to avoid build issues if nodemailer is not installed
      const nodemailer = await import('nodemailer');

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const htmlContent = buildEmailTemplate({ title, body, linkUrl });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to: recipient,
        subject: `[JUBOT] ${title}`,
        html: htmlContent,
        text: `${title}\n\n${body}\n\n리포트 보기: ${linkUrl}`,
      });

      console.log(`[Push Email] 발송 성공: ${recipient}, messageId: ${info.messageId}`);
      return { success: true };
    } catch (error: any) {
      console.error(`[Push Email] 발송 실패: ${recipient}`, error.message);
      return { success: false, error: error.message };
    }
  },
};

/**
 * 이메일 HTML 템플릿 생성
 */
function buildEmailTemplate(params: { title: string; body: string; linkUrl: string }): string {
  const { title, body, linkUrl } = params;

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #121212; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #1E1E1E; border-radius: 16px; overflow: hidden; margin-top: 40px; margin-bottom: 40px;">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #F7D047 0%, #F59E0B 100%);">
        <div style="font-size: 28px; font-weight: 900; color: #000; letter-spacing: -0.5px;">
          🤖 JUBOT
        </div>
        <div style="font-size: 13px; color: rgba(0,0,0,0.6); margin-top: 4px; font-weight: 600;">
          AI 투자 전문가
        </div>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 32px;">
        <h1 style="font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; line-height: 1.4;">
          ${title}
        </h1>
        <p style="font-size: 15px; color: #a0a0a0; line-height: 1.7; margin: 0 0 28px 0;">
          ${body}
        </p>

        <!-- CTA Button -->
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="border-radius: 12px; background: linear-gradient(135deg, #F7D047 0%, #F59E0B 100%);">
              <a href="${linkUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #000000; text-decoration: none; font-size: 16px; font-weight: 800; letter-spacing: -0.3px;">
                📊 리포트 보기
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; border-top: 1px solid #333; text-align: center;">
        <p style="font-size: 12px; color: #666; margin: 0; line-height: 1.6;">
          이 메일은 JUBOT 알림 설정에 의해 발송되었습니다.<br/>
          알림 수신을 원치 않으시면 JUBOT 계정 설정에서 변경해주세요.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
