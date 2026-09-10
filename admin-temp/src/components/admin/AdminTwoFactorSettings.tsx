"use client";

import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertTriangle,
  Copy,
  Download,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  disableAdmin2fa,
  enableAdmin2fa,
  fetchAdmin2faStatus,
  getAdmin2faError,
  startAdmin2faSetup,
  type Admin2faSetup,
  type Admin2faStatus,
} from "@/lib/admin2faApi";

type Props = {
  canWrite: boolean;
};

type SetupPhase = "idle" | "scan" | "backup";

function downloadBackupCodes(codes: string[], email?: string) {
  const lines = [
    "JobPool Admin — two-factor backup codes",
    email ? `Account: ${email}` : "",
    "Store these securely. Each code works once.",
    "",
    ...codes,
    "",
    `Generated: ${new Date().toISOString()}`,
  ].filter(Boolean);
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jobpool-admin-2fa-backup-codes-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}`);
  }
}

export function AdminTwoFactorSettings({ canWrite }: Props) {
  const [status, setStatus] = useState<Admin2faStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<Admin2faSetup | null>(null);
  const [setupPhase, setSetupPhase] = useState<SetupPhase>("idle");
  const [confirmCode, setConfirmCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [setupAccountLabel, setSetupAccountLabel] = useState("");
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const s = await fetchAdmin2faStatus();
      setStatus(s);
    } catch (err) {
      toast.error(getAdmin2faError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const onStartSetup = async () => {
    if (!canWrite) return;
    setBusy(true);
    try {
      const data = await startAdmin2faSetup();
      if (!data.otpauth_url || !data.secret) {
        throw new Error("Setup response missing QR data");
      }
      setSetup(data);
      setSetupAccountLabel(data.account);
      setSetupPhase("scan");
      setConfirmCode("");
      setBackupCodes([]);
    } catch (err) {
      toast.error(getAdmin2faError(err));
    } finally {
      setBusy(false);
    }
  };

  const onEnable = async () => {
    const code = confirmCode.trim();
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter the 6-digit code from your authenticator app");
      return;
    }
    setBusy(true);
    try {
      const codes = await enableAdmin2fa(code);
      setBackupCodes(codes);
      setSetupPhase("backup");
      setSetup(null);
      setConfirmCode("");
      await loadStatus();
      toast.success("Two-factor authentication enabled");
    } catch (err) {
      toast.error(getAdmin2faError(err));
    } finally {
      setBusy(false);
    }
  };

  const onDisable = async () => {
    if (!disablePassword.trim() || !disableCode.trim()) {
      toast.error("Password and authenticator or backup code are required");
      return;
    }
    setBusy(true);
    try {
      await disableAdmin2fa(disablePassword, disableCode);
      setDisableOpen(false);
      setDisablePassword("");
      setDisableCode("");
      setSetupPhase("idle");
      setBackupCodes([]);
      await loadStatus();
      toast.success("Two-factor authentication disabled");
    } catch (err) {
      toast.error(getAdmin2faError(err));
    } finally {
      setBusy(false);
    }
  };

  const finishBackupStep = () => {
    setSetupPhase("idle");
    setBackupCodes([]);
  };

  if (loading && !status) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading 2FA status…
      </div>
    );
  }

  const enabled = status?.totp_enabled ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-medium flex items-center gap-2">
            {enabled ? (
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            ) : (
              <Shield className="h-4 w-4 text-muted-foreground" />
            )}
            Two-factor authentication (TOTP)
          </h3>
          <p className="text-sm text-muted-foreground">
            Use Google Authenticator, Authy, or another TOTP app for admin login.
          </p>
        </div>
        {enabled ? (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200">
            Enabled
          </Badge>
        ) : (
          <Badge variant="outline">Not enabled</Badge>
        )}
      </div>

      {status ? (
        <p className="text-sm text-muted-foreground">
          Backup codes remaining:{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {status.backup_codes_remaining}
          </span>
        </p>
      ) : null}

      {!enabled && setupPhase === "idle" ? (
        <Button type="button" onClick={() => void onStartSetup()} disabled={!canWrite || busy}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
          Set up authenticator app
        </Button>
      ) : null}

      {setupPhase === "scan" && setup ? (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
          <p className="text-sm font-medium">1. Scan this QR code</p>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-border">
              <QRCodeSVG value={setup.otpauth_url} size={180} level="M" includeMargin />
            </div>
            <div className="space-y-3 min-w-0 flex-1">
              {setup.account ? (
                <p className="text-sm text-muted-foreground">
                  Account: <span className="font-medium text-foreground">{setup.account}</span>
                </p>
              ) : null}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Manual entry secret</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <code className="text-xs bg-background px-2 py-1 rounded border break-all">
                    {setup.secret}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void copyText(setup.secret, "Secret")}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="2fa-enable-code">2. Enter 6-digit code from the app</Label>
            <Input
              id="2fa-enable-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={busy || !canWrite}
              className="max-w-xs font-mono tracking-widest"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void onEnable()} disabled={busy || !canWrite}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm &amp; enable
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setSetupPhase("idle");
                setSetup(null);
                setConfirmCode("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {setupPhase === "backup" && backupCodes.length > 0 ? (
        <Alert className="border-amber-200 bg-amber-50/80">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
          <AlertTitle className="text-amber-950">Save your backup codes now</AlertTitle>
          <AlertDescription className="space-y-4 text-amber-950/90">
            <p>
              These one-time codes let you sign in if you lose your phone.{" "}
              <strong>They will not be shown again.</strong>
            </p>
            <ul className="grid gap-1 sm:grid-cols-2 font-mono text-sm bg-white/70 rounded-lg p-3 border border-amber-200/80">
              {backupCodes.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void copyText(backupCodes.join("\n"), "Backup codes")}
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy all
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => downloadBackupCodes(backupCodes, setupAccountLabel)}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download
              </Button>
              <Button type="button" size="sm" onClick={finishBackupStep}>
                I saved these codes
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {enabled ? (
        <div className="pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setDisableOpen(true)}
            disabled={!canWrite || busy}
          >
            <ShieldOff className="h-4 w-4 mr-2" />
            Disable two-factor authentication
          </Button>
        </div>
      ) : null}

      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable two-factor authentication</DialogTitle>
            <DialogDescription>
              Enter your password and a current 6-digit authenticator code or 8-character backup code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="2fa-disable-password">Password</Label>
              <Input
                id="2fa-disable-password"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="2fa-disable-code">Authenticator or backup code</Label>
              <Input
                id="2fa-disable-code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\s/g, "").slice(0, 8))}
                placeholder="123456 or ABCD1234"
                disabled={busy}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDisableOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void onDisable()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
