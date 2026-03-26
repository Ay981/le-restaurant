export type VerifyResponse = {
  verified: boolean;
  message: string;
  transactionReference: string | null;
  alreadyUsed?: boolean;
  receiverDebug?: {
    extractedReceiver: string | null;
    extractedReceiverDigits: string | null;
    extractedReceiverLast4: string | null;
    configuredReceivers: string[];
    configuredReceiverLast4: string[];
    providedAccountSuffix?: string | null;
    matchedViaSuffix?: boolean;
  };
};
