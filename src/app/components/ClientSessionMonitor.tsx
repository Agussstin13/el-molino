import { useEffect, useRef, useState } from "react";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import { ClientLoginModal } from "./ClientLoginModal";

const EXPIRATION_WARNING_MS = 5 * 60 * 1000;

function getTokenExpiration(token: string): number | null {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;

    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded));

    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function ClientSessionMonitor() {
  const { clientUser, isClientAuthenticated, logoutClient } = useAuth();
  const { showAlert } = useAlert();
  const [isRenewalOpen, setIsRenewalOpen] = useState(false);
  const warnedTokenRef = useRef<string | null>(null);
  const expiredTokenRef = useRef<string | null>(null);
  const sessionEmailRef = useRef<string>("");

  const token =
    (clientUser?.token as string | undefined) ||
    localStorage.getItem("userToken") ||
    undefined;

  if (clientUser?.email) sessionEmailRef.current = clientUser.email;

  useEffect(() => {
    if (!isClientAuthenticated || !token) {
      setIsRenewalOpen(false);
      return;
    }

    const expiresAt = getTokenExpiration(token);
    if (!expiresAt) return;

    let warningTimer: number | undefined;
    let expirationTimer: number | undefined;

    const expireSession = () => {
      if (expiredTokenRef.current === token) return;

      expiredTokenRef.current = token;
      logoutClient();
      showAlert({
        type: "confirm",
        title: "Tu sesión venció",
        message:
          "Cerramos tu sesión para proteger tu cuenta. Tu carrito sigue guardado; iniciá sesión nuevamente para continuar.",
        confirmText: "Iniciar sesión",
        cancelText: "Ahora no",
        onConfirm: () => setIsRenewalOpen(true),
      });
    };

    const warnAboutExpiration = () => {
      if (warnedTokenRef.current === token) return;

      warnedTokenRef.current = token;
      showAlert({
        type: "confirm",
        title: "Tu sesión está por vencer",
        message:
          "Vence en menos de 5 minutos. Renovala ahora para evitar interrupciones mientras armás tu pedido.",
        confirmText: "Renovar sesión",
        cancelText: "Más tarde",
        onConfirm: () => setIsRenewalOpen(true),
      });
    };

    const checkExpiration = () => {
      const remaining = expiresAt - Date.now();

      if (remaining <= 0) {
        expireSession();
      } else if (remaining <= EXPIRATION_WARNING_MS) {
        warnAboutExpiration();
      }
    };

    const remaining = expiresAt - Date.now();
    checkExpiration();

    if (remaining > 0) {
      warningTimer = window.setTimeout(
        warnAboutExpiration,
        Math.max(0, remaining - EXPIRATION_WARNING_MS),
      );
      expirationTimer = window.setTimeout(expireSession, remaining);
    }

    const checkWhenActive = () => {
      if (document.visibilityState === "visible") checkExpiration();
    };

    window.addEventListener("focus", checkExpiration);
    document.addEventListener("visibilitychange", checkWhenActive);

    return () => {
      window.clearTimeout(warningTimer);
      window.clearTimeout(expirationTimer);
      window.removeEventListener("focus", checkExpiration);
      document.removeEventListener("visibilitychange", checkWhenActive);
    };
  }, [isClientAuthenticated, token]);

  return (
    <ClientLoginModal
      isOpen={isRenewalOpen}
      isSessionRenewal
      renewalEmail={sessionEmailRef.current}
      onClose={() => setIsRenewalOpen(false)}
    />
  );
}
