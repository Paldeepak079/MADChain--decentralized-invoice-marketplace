
export enum InvoiceStatus {
  PENDING = 'PENDING',
  MINTED = 'MINTED',
  LISTED = 'LISTED',
  FUNDED = 'FUNDED',
  REPAID = 'REPAID'
}

export enum TransactionType {
  MINT = 'MINT',
  LIST = 'LIST',
  FUND = 'FUND',
  REPAY = 'REPAY'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  status: 'SUCCESS' | 'PENDING';
  userAddress: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issuer: string;
  buyerName: string;
  amount: number;
  currency: string;
  dueDate: string;
  description: string;
  status: InvoiceStatus;
  riskScore: number; // 0-100, 100 is best
  interestRate: number; // APY
  nftTokenId?: string;
  investor?: string;
  riskAnalysis?: string;
  documentName?: string;
}

export interface UserWallet {
  address: string;
  balance: string;
  role: 'ISSUER' | 'INVESTOR' | 'NONE';
}

export interface RiskAnalysisResponse {
  score: number;
  reasoning: string;
  recommendedInterest: number;
}

export type SortOption = 'rate_desc' | 'rate_asc' | 'risk_desc' | 'risk_asc' | 'date_asc';
export type RiskFilter = 'all' | 'high' | 'medium' | 'low';
