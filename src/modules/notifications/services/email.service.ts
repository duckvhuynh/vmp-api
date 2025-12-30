import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly config: SmtpConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      host: this.configService.get<string>('smtp.host') || 'mail.visitmauritiusparadise.com',
      port: this.configService.get<number>('smtp.port') || 465,
      secure: this.configService.get<boolean>('smtp.secure') !== false, // default to true for port 465
      user: this.configService.get<string>('smtp.user') || '',
      pass: this.configService.get<string>('smtp.pass') || '',
      from: this.configService.get<string>('smtp.from') || 'no-reply@visitmauritiusparadise.com',
      fromName: this.configService.get<string>('smtp.fromName') || 'Visit Mauritius Paradise',
    };
  }

  async onModuleInit() {
    await this.initializeTransporter();
  }

  /**
   * Initialize the SMTP transporter
   */
  private async initializeTransporter(): Promise<void> {
    if (!this.config.user || !this.config.pass) {
      this.logger.warn('SMTP credentials not configured. Email notifications will be disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
        // Connection pool settings
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        // Timeout settings
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
      });

      // Verify connection
      await this.transporter.verify();
      this.logger.log(`SMTP transporter initialized successfully (${this.config.host}:${this.config.port})`);
    } catch (error: any) {
      this.logger.error(`Failed to initialize SMTP transporter: ${error.message}`);
      this.transporter = null;
    }
  }

  /**
   * Check if email service is configured and ready
   */
  isConfigured(): boolean {
    return this.transporter !== null;
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email service not configured. Skipping email send.');
      return false;
    }

    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    try {
      const result = await this.transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.from}>`,
        to: recipients,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
        replyTo: options.replyTo,
      });

      this.logger.log(`Email sent successfully to ${recipients}. MessageId: ${result.messageId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${recipients}: ${error.message}`);
      return false;
    }
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

