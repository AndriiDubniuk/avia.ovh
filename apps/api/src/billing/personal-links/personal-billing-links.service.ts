import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { findPublicBillingPlan } from '../billing.catalog';
import { BillingService } from '../billing.service';
import { PersonalLinkCheckoutDto } from './dto/personal-link-checkout.dto';
import { PersonalBillingLink } from './entities/personal-billing-link.entity';
import { CreatePersonalBillingLinkDto } from './dto/create-personal-billing-link.dto';

function addHours(from: Date, hours: number) {
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

@Injectable()
export class PersonalBillingLinksService {
  constructor(
    @InjectRepository(PersonalBillingLink)
    private readonly linksRepository: Repository<PersonalBillingLink>,
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
  ) {}

  async createLink(input: CreatePersonalBillingLinkDto) {
    const plan = findPublicBillingPlan(input.planCode.trim());
    if (!plan) {
      throw new NotFoundException('Billing plan not found for personal link.');
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);
    const now = new Date();
    const ttlHours =
      input.expiresInHours ??
      Number(
        this.configService.get<string>('BILLING_PERSONAL_LINK_TTL_HOURS') ??
          72,
      );
    const expiresAt = addHours(now, Number.isFinite(ttlHours) ? ttlHours : 72);

    const saved = await this.linksRepository.save(
      this.linksRepository.create({
        tokenHash,
        planCode: plan.code,
        customerName: input.customerName?.trim() || null,
        customerEmail: input.customerEmail?.trim().toLowerCase() || null,
        companyName: input.companyName?.trim() || null,
        timezone: input.timezone?.trim() || null,
        expiresAt,
        revokedAt: null,
      }),
    );

    const baseUrl =
      this.configService.get<string>('BILLING_PERSONAL_LINK_BASE_URL') ??
      `${this.configService.get<string>('BILLING_PUBLIC_URL') ?? 'http://localhost:3002'}/pay`;

    return {
      link_id: saved.id,
      personal_url: `${baseUrl}/${token}`,
      expires_at: saved.expiresAt?.toISOString() ?? null,
      plan: {
        code: plan.code,
        name: plan.name,
        amount_minor: plan.amount_minor,
        currency: plan.currency,
        interval: plan.interval,
        price_label: plan.priceLabel,
      },
      customer: {
        name: saved.customerName ?? null,
        email: saved.customerEmail ?? null,
      },
    };
  }

  async getOfferByToken(token: string) {
    const link = await this.findValidLinkByToken(token);
    const plan = findPublicBillingPlan(link.planCode);
    if (!plan) {
      throw new NotFoundException('Billing plan not found.');
    }

    return {
      link_state: 'active',
      expires_at: link.expiresAt?.toISOString() ?? null,
      offer: {
        plan_code: plan.code,
        plan_name: plan.name,
        amount_minor: plan.amount_minor,
        currency: plan.currency,
        interval: plan.interval,
        price_label: plan.priceLabel,
        note: plan.note,
      },
      customer: {
        name: link.customerName ?? null,
        email: link.customerEmail ?? null,
        company_name: link.companyName,
      },
    };
  }

  async createCheckoutByToken(token: string, input: PersonalLinkCheckoutDto) {
    const link = await this.findValidLinkByToken(token);
    const customerName = input.customerName?.trim();
    const customerEmail = input.customerEmail?.trim().toLowerCase();

    if (!customerName || customerName.length < 2) {
      throw new BadRequestException('customerName must be at least 2 characters.');
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      throw new BadRequestException('customerEmail must be a valid email.');
    }

    return this.billingService.createCheckout({
      planCode: link.planCode,
      customerName,
      customerEmail,
      companyName: link.companyName ?? undefined,
      timezone: link.timezone ?? undefined,
    });
  }

  private async findValidLinkByToken(token: string) {
    const normalized = token?.trim();
    if (!normalized) {
      throw new BadRequestException('Token is required.');
    }

    const tokenHash = this.hashToken(normalized);
    const now = new Date();
    const link = await this.linksRepository.findOne({
      where: {
        tokenHash,
        revokedAt: IsNull(),
      },
    });

    if (!link) {
      throw new NotFoundException('Personal billing link not found.');
    }

    if (link.expiresAt && link.expiresAt <= now) {
      throw new NotFoundException('Personal billing link expired.');
    }

    return link;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
