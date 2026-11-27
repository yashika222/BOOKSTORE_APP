'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, message } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout, setSessionExpiresAt } from '@/store/authSlice';
import { setCartItems } from '@/store/cartSlice';
import { setWishlistItems } from '@/store/wishlistSlice';
import { authService, clearSessionHint } from '@/lib/api';
import {
  broadcastAuthTabEvent,
  subscribeToAuthTabEvents,
  type AuthTabEvent,
} from '@/lib/api/authEvents';

function formatCountdown(remainingSeconds: number): string {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function AuthSessionManager() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, sessionExpiresAt } = useAppSelector((state) => state.auth);
  const [now, setNow] = useState(Date.now());
  const [modalOpen, setModalOpen] = useState(false);
  const [extending, setExtending] = useState(false);
  const endingSession = useRef(false);

  const clearClientSession = useCallback(
    (reason: 'logout' | 'expired', notifyUser: boolean) => {
      dispatch(setCartItems([]));
      dispatch(setWishlistItems([]));
      dispatch(logout());
      clearSessionHint();
      try {
        if (user?.id) {
          localStorage.removeItem(`bookstore_cart_v2_${user.id}`);
          localStorage.removeItem(`bookstore_wishlist_v2_${user.id}`);
        }
      } catch {
        // Local state is already cleared; storage cleanup is best-effort.
      }
      setModalOpen(false);
      if (notifyUser) {
        message.info(
          reason === 'expired'
            ? 'Your session expired. Please sign in again.'
            : 'You were signed out in another tab.'
        );
      }
      router.replace(reason === 'expired' ? '/login?reason=session-expired' : '/login?reason=logout');
    },
    [dispatch, router, user?.id]
  );

  const endSession = useCallback(
    async (reason: 'logout' | 'expired', announce: boolean) => {
      if (endingSession.current) return;
      endingSession.current = true;
      try {
        await authService.logout();
      } catch {
        // The client must still clear local state if the network is unavailable.
      }
      clearClientSession(reason, false);
      if (announce) broadcastAuthTabEvent({ type: reason });
      if (reason === 'expired') {
        message.info('Your session expired. Please sign in again.');
      }
    },
    [clearClientSession]
  );

  useEffect(() => {
    const unsubscribe = subscribeToAuthTabEvents((event: AuthTabEvent) => {
      if (event.type === 'session-extended') {
        dispatch(setSessionExpiresAt(event.expiresAt));
        return;
      }
      if (event.type === 'expired') {
        clearClientSession('expired', true);
        return;
      }
      clearClientSession('logout', true);
    });

    const onExpiredResponse = () => {
      clearClientSession('expired', true);
      broadcastAuthTabEvent({ type: 'expired' });
    };
    window.addEventListener('bookstore:session-expired', onExpiredResponse);
    return () => {
      unsubscribe();
      window.removeEventListener('bookstore:session-expired', onExpiredResponse);
    };
  }, [clearClientSession, dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) {
      setModalOpen(false);
      return;
    }
    const updateTime = () => setNow(Date.now());
    updateTime();
    const timer = window.setInterval(updateTime, 1000);
    window.addEventListener('focus', updateTime);
    document.addEventListener('visibilitychange', updateTime);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', updateTime);
      document.removeEventListener('visibilitychange', updateTime);
    };
  }, [isAuthenticated, sessionExpiresAt]);

  const remainingSeconds = sessionExpiresAt
    ? Math.max(0, Math.ceil((new Date(sessionExpiresAt).getTime() - now) / 1000))
    : 0;

  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) return;
    if (remainingSeconds <= 0) {
      void endSession('expired', true);
      return;
    }
    if (remainingSeconds <= 120) setModalOpen(true);
  }, [endSession, isAuthenticated, remainingSeconds, sessionExpiresAt]);

  const continueSession = async () => {
    setExtending(true);
    try {
      const result = await authService.extendSession();
      if (!result.success || !result.sessionExpiresAt) {
        await endSession('expired', true);
        return;
      }
      dispatch(setSessionExpiresAt(result.sessionExpiresAt));
      broadcastAuthTabEvent({
        type: 'session-extended',
        expiresAt: result.sessionExpiresAt,
      });
      setModalOpen(false);
    } catch {
      await endSession('expired', true);
    } finally {
      setExtending(false);
    }
  };

  return (
    <Modal
      title="Your session is about to expire"
      open={modalOpen && isAuthenticated}
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={[
        <Button
          key="signout"
          onClick={() => void endSession('logout', true)}
          disabled={extending}
        >
          Sign Out
        </Button>,
        <Button
          key="continue"
          type="primary"
          loading={extending}
          onClick={() => void continueSession()}
        >
          Continue Session
        </Button>,
      ]}
    >
      <p>Your BookStore session expires in {formatCountdown(remainingSeconds)}.</p>
    </Modal>
  );
}
