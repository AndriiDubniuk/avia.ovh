export interface MonobankCreateInvoiceInput {
  amountMinor: number;
  ccy: number;
  reference: string;
  redirectUrl: string;
  merchantPaymInfo: {
    destination: string;
    comment: string;
  };
  saveCardData: {
    saveCard: boolean;
  };
}

export interface MonobankCreateInvoiceResult {
  providerInvoiceId: string;
  checkoutUrl: string;
  expiresAt: Date;
  providerPayloadJson: Record<string, unknown>;
}
