// WEEKLY//UNI — handlers/message.js — the bot brain (owner-only personal bot)
//
// Commands:
//   /start /setup    → welcome + registers the Mini App menu button + command menu
//   /days  کلاس‌ها   → upcoming class days as «تاریخ - نام روز» (4-week window)
//   /today امروز     → today's classes
//   /tomorrow فردا   → tomorrow's classes
//   /exams امتحان‌ها → upcoming exams & presentations
//   /help  راهنما    → command list
//
// All outgoing texts use parse_mode: 'HTML' (see lib/bot-text.js).

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

const HTML = { parse_mode: 'HTML' };

/** Telegram command menu + bot profile — idempotent, safe to call on /start */
async function refreshBotChrome() {
  const commands = [
    { command: 'days', description: '📅 روزهای کلاس' },
    { command: 'today', description: '📆 کلاس‌های امروز' },
    { command: 'tomorrow', description: '➡️ کلاس‌های فردا' },
    { command: 'exams', description: '📝 امتحان‌ها و ارائه‌ها' },
    { command: 'help', description: 'ℹ️ راهنما' },
  ];
  try {
    await api.setMyCommands({ commands });
  } catch (e) {
    console.warn('setMyCommands failed', e?.description ?? e);
  }
  try {
    await api.setMyShortDescription({
      short_description: 'برنامهٔ هفتگی دانشگاه — کلاس‌ها، امتحان‌ها و یادداشت‌ها 🎓',
    });
    await api.setMyDescription({
      description:
        'ربات شخصی برنامهٔ دانشگاه 🎒\n\n📅 روزهای کلاس به شکل «تاریخ - نام روز»\n📆 کلاس‌های امروز و فردا\n📝 امتحان‌ها با شمارش معکوس\n🎓 مینی‌اپ کامل با گرید هفتگی و یادداشت‌ها',
    });
  } catch (e) {
    console.warn('setMyDescription failed', e?.description ?? e);
  }
}

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

  // /start + /setup — welcome and (re)register the Mini App menu button + menus
  if (/^\/(start|setup)(@\w+)?$/.test(t)) {
    try {
      await api.setChatMenuButton({
        menu_button: { type: 'web_app', text: 'برنامه هفتگی', web_app: { url: APP_URL } },
      });
    } catch (e) {
      console.warn('setChatMenuButton failed', e?.description ?? e);
    }
    await refreshBotChrome();
    await api.sendMessage({
      chat_id: chatId,
      text: startMessage(message.from?.first_name),
      ...HTML,
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
    await api.sendMessage({ chat_id: chatId, text: helpMessage(), ...HTML });
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
      ...HTML,
      reply_markup: daysKeyboard(0),
    });
    return;
  }

  // /today
  if (/^\/today(@\w+)?$/.test(t) || text === 'امروز') {
    const classes = await allClasses();
    await api.sendMessage({ chat_id: chatId, text: todayMessage(classes), ...HTML });
    return;
  }

  // /tomorrow
  if (/^\/tomorrow(@\w+)?$/.test(t) || text === 'فردا') {
    const classes = await allClasses();
    await api.sendMessage({ chat_id: chatId, text: tomorrowMessage(classes), ...HTML });
    return;
  }

  // /exams
  if (/^\/(exams|exam)(@\w+)?$/.test(t) || text === 'امتحان‌ها' || text === 'امتحانها') {
    const [classes, exams] = await Promise.all([allClasses(), allExams()]);
    await api.sendMessage({
      chat_id: chatId,
      text: examsMessage(exams, classes),
      ...HTML,
      reply_markup: { inline_keyboard: [[{ text: '🎓 مینی‌اپ', url: APP_URL }]] },
    });
    return;
  }

  // Anything else — short pointer to the commands
  await api.sendMessage({
    chat_id: chatId,
    text: '🤔 این دستور رو متوجه نشدم!\n\nدکمهٔ منو (☰) رو بزن یا از این‌ها استفاده کن:\n📅 /days — روزهای کلاس\n📆 /today — امروز\n📝 /exams — امتحان‌ها\nℹ️ /help — راهنما',
    ...HTML,
  });
}
