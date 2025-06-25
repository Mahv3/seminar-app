"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Smartphone } from "lucide-react";

interface MFASetupProps {
  onComplete?: () => void;
}

export function MFASetup({ onComplete }: MFASetupProps) {
  const [step, setStep] = useState<'enroll' | 'verify'>('enroll');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnrollMFA = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode
      });

      if (error) throw error;

      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'enroll') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Set Up Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Smartphone className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Authenticator App Required</p>
              <p className="text-sm text-muted-foreground">
                Install Google Authenticator, Authy, or another TOTP app
              </p>
            </div>
          </div>
          
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          
          <Button 
            onClick={handleEnrollMFA} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Setting up...' : 'Set Up MFA'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify Your Authenticator</CardTitle>
        <CardDescription>
          Scan the QR code with your authenticator app and enter the 6-digit code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrCode && (
          <div className="flex justify-center">
            <img 
              src={qrCode} 
              alt="MFA QR Code" 
              className="border rounded-lg"
            />
          </div>
        )}
        
        {secret && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Manual entry key:</p>
            <p className="text-xs font-mono break-all">{secret}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="verification-code">Verification Code</Label>
          <Input
            id="verification-code"
            type="text"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
            className="text-center text-lg tracking-widest"
          />
        </div>
        
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        
        <Button 
          onClick={handleVerifyMFA} 
          disabled={isLoading || verificationCode.length !== 6}
          className="w-full"
        >
          {isLoading ? 'Verifying...' : 'Verify and Enable MFA'}
        </Button>
      </CardContent>
    </Card>
  );
}