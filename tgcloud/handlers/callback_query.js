// WEEKLY//UNI — handlers/callback_query.js — inline buttons for the days list

import { api } from 'sdk';
import { OWNER_ID, APP_URL, allClasses, allExams } from '../lib/uni.js';
import { daysMessage, examsMessage, daysKeyboard } from '../lib/bot-text.js';

const MAX_WEEKS = 16;
const HTML = { parse_mode: 'HTML' };

export default async function (cq) {
  if (cq.from?.id !== OWNER_ID) {
    await api.answerCallbackQuery({ callback_query_id: cq.id, text: '🔒 این ربات شخصیه 🤖', show_alert: true });
    return;
  }

  const data = cq.data ?? '';
  const msg = cq.message;
  const chatId = msg?.chat?.id;
  const messageId = msg?.message_id;

  // Expired queries reject with 400 — never let that block the actual action
  try {
    await api.answerCallbackQuery({ callback_query_id: cq.id });
  } catch (e) {
    console.warn('answerCallbackQuery skipped', e?.description ?? e);
  }

  if (!chatId || !messageId) return;

  // days:<weeksAhead> — page the 4-week window forward/backward
  if (/^days:-?\d+$/.test(data)) {
    const weeksAhead = Math.min(Math.max(Number(data.split(':')[1]) || 0, 0), MAX_WEEKS);
    const classes = await allClasses();
    await api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: daysMessage(classes, weeksAhead, 4),
      ...HTML,
      reply_markup: daysKeyboard(weeksAhead),
    });
    return;
  }

  // exams:<n> — refresh exams list
  if (/^exams:\d+$/.test(data)) {
    const [classes, exams] = await Promise.all([allClasses(), allExams()]);
    await api.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: examsMessage(exams, classes),
      ...HTML,
      reply_markup: { inline_keyboard: [[{ text: '🎓 مینی‌اپ', url: APP_URL }]] },
    });
    return;
  }
}
