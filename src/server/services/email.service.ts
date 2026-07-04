export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailService {
  send(message: EmailMessage): Promise<{ id: string }>;
}

export const emailService: EmailService = {
  async send(message) {
    // Dev fallback — log and pretend to succeed until RESEND_API_KEY is set.
    console.warn("[email] EmailService not configured. Would send:", { to: message.to, subject: message.subject });
    return { id: "dev-" + Date.now().toString(36) };
  },
};
