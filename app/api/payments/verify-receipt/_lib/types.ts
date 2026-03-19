export type VerifyResponse = {
  verified: boolean;
  message: string;
  transactionReference: string | null;
  alreadyUsed?: boolean;
};
