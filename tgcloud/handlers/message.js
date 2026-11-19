// WEEKLY//UNI — handlers/message.js — the bot brain (owner-only personal bot)
//
// Commands:
//   /start /setup    → welcome + registers the Mini App as the chat menu button
//   /days  کلاس‌ها   → upcoming class days as «تاریخ - نام روز» (4-week window)
//   /today امروز     → today's classes
//   /tomorrow فردا   → tomorrow's classes
//   /exams امتحان‌ها → upcoming exams & presentations
//   /help  راهنما    → command list

import { api } from 'sdk';
import { OWNER_ID, APP_URL, allClasses, allExams } from '../lib/uni.js';
import {
  startMessage,
  helpMessage,
  notOwnerMessage,
  daysMessage,
  todayMessage,
  tomorrowMessage,
  examsMessage,
  daysKeyboard,
} from '../lib/bot-text.js';

export default async function (message) {
  const chatId = message.chat?.id;
  const fromId = message.from?.id;
  const text = (message.text ?? '').trim();
  if (!chatId) return;

  // Personal bot: everything else is politely declined.
  if (fromId !== OWNER_ID) {
    await api.sendMessage({ chat_id: chatId, text: notOwnerMessage() });
    return;
  }

  const t = text.toLowerCase();

  // /start + /setup — welcome and (re)register the Mini App menu button
  if (/^\/(start|setup)(@\w+)?$/.test(t)) {
    try {
      await api.setChatMenuButton({
        menu_button: { type: 'web_app', text: 'برنامه هفتگی', web_app: { url: APP_URL } },
      });
    } catch (e) {
      console.warn('setChatMenuButton failed', e?.description ?? e);
    }
    await api.sendMessage({
      chat_id: chatId,
      text: startMessage(),
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎓 باز کردن برنامه هفتگی', web_app: { url: APP_URL } }],
          [
            { text: '📅 روزهای کلاس', callback_data: 'days:0' },
            { text: '📝 امتحان‌ها', callback_data: 'exams:0' },
          ],
        ],
      },
    });
    return;
  }

  // /help
  if (/^\/help(@\w+)?$/.test(t) || text === 'راهنما' || text === 'کمک') {
    await api.sendMessage({ chat_id: chatId, text: helpMessage() });
    return;
  }

  // /days — the requested «تاریخ - نام روز» list
  if (
    /^\/(days|classes|schedule)(@\w+)?$/.test(t) ||
    text === 'روزهای کلاس' ||
    text === 'کلاس‌ها' ||
    text === 'برنامه'
  ) {
    const classes = await allClasses();
    await api.sendMessage({
      chat_id: chatId,
      text: daysMessage(classes, 0, 4),
      reply_markup: daysKeyboard(0),
    });
    return;
  }

  // /today
  if (/^\/today(@\w+)?$/.test(t) || text === 'امروز') {
    const classes = await allClasses();
    await api.sendMessage({ chat_id: chatId, text: todayMessage(classes) });
    return;
  }

  // /tomorrow
  if (/^\/tomorrow(@\w+)?$/.test(t) || text === 'فردا') {
    const classes = await allClasses();
    await api.sendMessage({ chat_id: chatId, text: tomorrowMessage(classes) });
    return;
  }

  // /exams
  if (/^\/(exams|exam)(@\w+)?$/.test(t) || text === 'امتحان‌ها' || text === 'امتحانها') {
    const [classes, exams] = await Promise.all([allClasses(), allExams()]);
    await api.sendMessage({
      chat_id: chatId,
      text: examsMessage(exams, classes),
      reply_markup: { inline_keyboard: [[{ text: '🎓 مینی‌اپ', url: APP_URL }]] },
    });
    return;
  }

  // Anything else — short pointer to the commands
  await api.sendMessage({
    chat_id: chatId,
    text: 'دستورش رو متوجه نشدم 🤔\n/days برای روزهای کلاس، /today برای امروز، /help برای راهنما.',
  });
}
