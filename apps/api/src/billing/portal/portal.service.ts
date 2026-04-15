import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { createHash, randomBytes } from 'crypto';
import { In, IsNull, MoreThan, Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import {
  PortalAccessToken,
  PortalAccessTokenType,
} from './entities/portal-access-token.entity';

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

@Injectable()
export class PortalService {
  constructor(
    @InjectRepository(PortalAccessToken)
    private readonly tokensRepository: Repository<PortalAccessToken>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
  ) {}

  async requestLink(rawEmail: string) {
    const email = this.normalizeEmail(rawEmail);
    const now = new Date();
    const magicToken = this.generateToken();
    const magicTokenHash = this.hashToken(magicToken);

    const ttlMinutes = Number(
      this.configService.get<string>('BILLING_PORTAL_MAGIC_TTL_MINUTES') ?? 15,
    );

    await this.tokensRepository.save(
      this.tokensRepository.create({
        email,
        tokenHash: magicTokenHash,
        tokenType: PortalAccessTokenType.MagicLink,
        expiresAt: addMinutes(now, Number.isFinite(ttlMinutes) ? ttlMinutes : 15),
        usedAt: null,
      }),
    );

    const billingPublicUrl =
      this.configService.get<string>('BILLING_PUBLIC_URL') ??
      'http://localhost:3002';
    const magicLink = `${billingPublicUrl}/portal/verify?token=${magicToken}`;

    // Minimal delivery placeholder for now: can be replaced with real email provider later.
    console.info(`[portal-magic-link] to=${email} link=${magicLink}`);

    return {
      ok: true,
      message: 'If this email is registered, a magic link has been sent.',
    };
  }

  async verifyMagicLink(token: string, response: Response) {
    const rawToken = token?.trim();
    if (!rawToken) {
      throw new BadRequestException('Token is required.');
    }

    const tokenHash = this.hashToken(rawToken);
    const now = new Date();

    const magicToken = await this.tokensRepository.findOne({
      where: {
        tokenHash,
        tokenType: PortalAccessTokenType.MagicLink,
        usedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
    });

    if (!magicToken) {
      throw new UnauthorizedException('Magic link is invalid or expired.');
    }

    await this.tokensRepository.update({ id: magicToken.id }, { usedAt: now });

    const sessionToken = this.generateToken();
    const sessionTokenHash = this.hashToken(sessionToken);
    const sessionTtlHours = Number(
      this.configService.get<string>('BILLING_PORTAL_SESSION_TTL_HOURS') ?? 24,
    );

    await this.tokensRepository.save(
      this.tokensRepository.create({
        email: magicToken.email,
        tokenHash: sessionTokenHash,
        tokenType: PortalAccessTokenType.Session,
        expiresAt: addHours(now, Number.isFinite(sessionTtlHours) ? sessionTtlHours : 24),
        usedAt: null,
      }),
    );

    const cookieName =
      this.configService.get<string>('BILLING_PORTAL_COOKIE_NAME') ??
      'billing_portal_session';
    const appEnv = (this.configService.get<string>('APP_ENV') ?? 'local')
      .trim()
      .toLowerCase();
    const isLocalLike = appEnv === 'local' || appEnv === 'development';

    response.cookie(cookieName, sessionToken, {
      httpOnly: true,
      secure: !isLocalLike,
      sameSite: 'lax',
      maxAge: (Number.isFinite(sessionTtlHours) ? sessionTtlHours : 24) * 60 * 60 * 1000,
      path: '/',
    });

    return { ok: true };
  }

  async listSubscriptions(request: Request) {
    const email = await this.getAuthorizedEmail(request);

    const clients = await this.clientsRepository.find({ where: { email } });
    if (clients.length === 0) {
      return { items: [] as unknown[] };
    }

    const clientIds = clients.map((client) => client.id);
    const subscriptions = await this.subscriptionsRepository.find({
      where: { clientId: In(clientIds) },
      order: { createdAt: 'DESC' },
    });

    return {
      items: subscriptions.map((subscription) => ({
        subscription_id: subscription.id,
        status: subscription.status,
        amount_minor: subscription.amountMinor,
        currency: subscription.currency,
        interval: subscription.interval,
        next_charge_at: subscription.nextChargeAt?.toISOString() ?? null,
        cancelled_at: subscription.cancelledAt?.toISOString() ?? null,
        created_at: subscription.createdAt.toISOString(),
      })),
    };
  }

  async getSubscription(request: Request, subscriptionId: string) {
    await this.assertSubscriptionOwnership(request, subscriptionId);
    return this.subscriptionsService.getSubscription(subscriptionId);
  }

  async cancelSubscription(request: Request, subscriptionId: string) {
    await this.assertSubscriptionOwnership(request, subscriptionId);
    return this.subscriptionsService.cancelSubscription(subscriptionId);
  }

  private async assertSubscriptionOwnership(
    request: Request,
    subscriptionId: string,
  ) {
    const email = await this.getAuthorizedEmail(request);
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new UnauthorizedException('Subscription access denied.');
    }

    const client = await this.clientsRepository.findOne({
      where: { id: subscription.clientId },
    });

    if (!client || this.normalizeEmail(client.email) !== email) {
      throw new UnauthorizedException('Subscription access denied.');
    }
  }

  private async getAuthorizedEmail(request: Request) {
    const cookieName =
      this.configService.get<string>('BILLING_PORTAL_COOKIE_NAME') ??
      'billing_portal_session';
    const rawCookies = request.headers.cookie ?? '';
    const sessionToken = this.readCookie(rawCookies, cookieName);

    if (!sessionToken) {
      throw new UnauthorizedException('Portal session is missing.');
    }

    const sessionTokenHash = this.hashToken(sessionToken);
    const tokenRecord = await this.tokensRepository.findOne({
      where: {
        tokenHash: sessionTokenHash,
        tokenType: PortalAccessTokenType.Session,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Portal session is invalid or expired.');
    }

    return tokenRecord.email;
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private generateToken() {
    return randomBytes(32).toString('base64url');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private readCookie(rawCookies: string, name: string) {
    const chunks = rawCookies.split(';');

    for (const chunk of chunks) {
      const trimmed = chunk.trim();
      if (!trimmed) {
        continue;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (key === name) {
        return decodeURIComponent(value);
      }
    }

    return null;
  }
}
