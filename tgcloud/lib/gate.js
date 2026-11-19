// WEEKLY//UNI — endpoint guard: the mini app is private to the bot owner.

import { EndpointError } from 'sdk';
import { OWNER_ID } from './uni.js';

/** Throws unless the verified Mini App caller is the bot owner. */
export function requireOwner(ctx) {
  const user = ctx?.initData?.user;
  if (!user || user.id !== OWNER_ID) {
    throw new EndpointError('این مینی‌اپ فقط برای مالک ربات است.', { code: 'NOT_OWNER' });
  }
  return user;
}
