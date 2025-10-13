export interface CaptchaSession {
  id: string;
  clientId: string;
  puzzleX: number;
  puzzleY: number;
  imageIndex: number;
  sessionFingerprint: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
  verified: boolean;
  verificationToken: string;
}