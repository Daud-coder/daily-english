export interface RoleplayMissionStep {
  id: string;
  taskRu: string;
  exampleEn: string;
  completed: boolean;
}

export interface RoleplayScenario {
  id: string;
  titleRu: string;
  roleTeacher: string;
  roleStudent: string;
  level: "A0" | "A1" | "A1+";
  category: "cafe" | "market" | "travel" | "hotel" | "city" | "work";
  icon: string;
  description: string;
  initialTeacherMessage: {
    en: string;
    ru: string;
  };
  steps: RoleplayMissionStep[];
  usefulPhrases: Array<{ en: string; ru: string }>;
  promptRoleInstruction: string;
}

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: "meat-market",
    titleRu: "Мясной рынок и поставщик",
    roleTeacher: "Поставщик свежего мяса (John)",
    roleStudent: "Покупатель / Владелец мясной лавки",
    level: "A0",
    category: "market",
    icon: "🥩",
    description: "Договоритесь о покупке свежей говядины и свинины, узнайте цену за килограмм и качество.",
    initialTeacherMessage: {
      en: "Hello! We have fresh beef and pork today. What do you need?",
      ru: "Здравствуйте! У нас сегодня свежая говядина и свинина. Что вам нужно?"
    },
    steps: [
      { id: "s1", taskRu: "Поздоровайтесь и скажите, какое мясо нужно (beef / pork)", exampleEn: "Hello! I need fresh beef, please.", completed: false },
      { id: "s2", taskRu: "Спросите цену за килограмм", exampleEn: "How much is one kilo?", completed: false },
      { id: "s3", taskRu: "Скажите вес и согласитесь на покупку", exampleEn: "Good, give me ten kilos, please.", completed: false }
    ],
    usefulPhrases: [
      { en: "Fresh beef", ru: "Свежая говядина" },
      { en: "How much is one kilo?", ru: "Сколько стоит один килограмм?" },
      { en: "The quality is very good.", ru: "Качество очень хорошее." }
    ],
    promptRoleInstruction: "Ты играешь роль дружелюбного поставщика мяса Джона на рынке. Отвечай просто (3-6 слов), используй тему мяса (beef, pork, fresh, kilo, price, good quality). Не выходи из роли!"
  },
  {
    id: "cafe-order",
    titleRu: "Утренний кофе и круассан",
    roleTeacher: "Официант в кафе (Sarah)",
    roleStudent: "Гость кафе",
    level: "A0",
    category: "cafe",
    icon: "☕",
    description: "Закажите утренний кофе с молоком и десерт, попросите счёт.",
    initialTeacherMessage: {
      en: "Good morning! Can I take your order?",
      ru: "Доброе утро! Могу я принять ваш заказ?"
    },
    steps: [
      { id: "c1", taskRu: "Закажите один кофе с молоком", exampleEn: "One coffee with milk, please.", completed: false },
      { id: "c2", taskRu: "Добавьте круассан", exampleEn: "And one croissant, please.", completed: false },
      { id: "c3", taskRu: "Попросите счёт", exampleEn: "The check, please.", completed: false }
    ],
    usefulPhrases: [
      { en: "Coffee with milk, please.", ru: "Кофе с молоком, пожалуйста." },
      { en: "Here you are.", ru: "Вот, держите / Пожалуйста." },
      { en: "The check, please.", ru: "Счёт, пожалуйста." }
    ],
    promptRoleInstruction: "Ты играешь роль приветливого бариста в кафе. Твои реплики очень короткие (3-5 слов). Принимай заказ, спрашивай про сахар или размер."
  },
  {
    id: "airport-passport",
    titleRu: "Паспортный контроль",
    roleTeacher: "Офицер пограничного контроля",
    roleStudent: "Пассажир",
    level: "A1",
    category: "travel",
    icon: "✈️",
    description: "Ответьте на 3 стандартных вопроса офицера на границе: паспорт, цель поездки и срок.",
    initialTeacherMessage: {
      en: "Passport and ticket, please. What is the purpose of your visit?",
      ru: "Паспорт и билет, пожалуйста. Какова цель вашего визита?"
    },
    steps: [
      { id: "a1", taskRu: "Дайте паспорт и скажите цель поездки (туризм или работа)", exampleEn: "Here you are. Tourism.", completed: false },
      { id: "a2", taskRu: "Скажите, на сколько дней приехали", exampleEn: "I stay for one week.", completed: false },
      { id: "a3", taskRu: "Скажите, где будете жить (в отеле)", exampleEn: "At the city hotel.", completed: false }
    ],
    usefulPhrases: [
      { en: "Purpose of visit", ru: "Цель визита" },
      { en: "For one week", ru: "На одну неделю" },
      { en: "Have a nice stay!", ru: "Приятного пребывания!" }
    ],
    promptRoleInstruction: "Ты вежливый пограничный офицер. Задавай по одному простому вопросу (passport, how long, where hotel). Отвечай коротко и вежливо."
  },
  {
    id: "hotel-checkin",
    titleRu: "Заселение в отель",
    roleTeacher: "Администратор на ресепшн",
    roleStudent: "Гость отеля",
    level: "A0",
    category: "hotel",
    icon: "🏨",
    description: "Скажите, что у вас бронь на имя Дауд, получите ключ и узнайте пароль от Wi-Fi.",
    initialTeacherMessage: {
      en: "Welcome to Grand Hotel! Do you have a reservation?",
      ru: "Добро пожаловать в Гранд Отель! У вас есть бронирование?"
    },
    steps: [
      { id: "h1", taskRu: "Скажите своё имя и подтвердите бронь", exampleEn: "Yes, reservation for Daud.", completed: false },
      { id: "h2", taskRu: "Спросите номер комнаты и этаж", exampleEn: "Which room is it?", completed: false },
      { id: "h3", taskRu: "Спросите пароль от Wi-Fi", exampleEn: "What is the Wi-Fi password?", completed: false }
    ],
    usefulPhrases: [
      { en: "Reservation for Daud", ru: "Бронь на имя Дауд" },
      { en: "Here is your key.", ru: "Вот ваш ключ." },
      { en: "Breakfast is at eight.", ru: "Завтрак в восемь." }
    ],
    promptRoleInstruction: "Ты администратор отеля. Выдавай ключ от комнаты 304, отвечай про Wi-Fi и завтрак очень простыми словами."
  },
  {
    id: "taxi-ride",
    titleRu: "Поездка на такси",
    roleTeacher: "Водитель такси",
    roleStudent: "Пассажир",
    level: "A0",
    category: "city",
    icon: "🚕",
    description: "Назовите адрес, уточните стоимость и попросите остановиться здесь.",
    initialTeacherMessage: {
      en: "Hello! Where do you want to go?",
      ru: "Здравствуйте! Куда вы хотите поехать?"
    },
    steps: [
      { id: "t1", taskRu: "Назовите адрес (центр города или аэропорт)", exampleEn: "To the airport, please.", completed: false },
      { id: "t2", taskRu: "Спросите цену поездки", exampleEn: "How much is it?", completed: false },
      { id: "t3", taskRu: "Попросите остановить здесь и поблагодарите", exampleEn: "Stop here, please. Thank you!", completed: false }
    ],
    usefulPhrases: [
      { en: "To the center, please.", ru: "В центр, пожалуйста." },
      { en: "Stop here, please.", ru: "Остановите здесь, пожалуйста." },
      { en: "Keep the change.", ru: "Сдачи не надо." }
    ],
    promptRoleInstruction: "Ты водитель такси. Говори просто: куда едем, двадцать долларов, приехали."
  }
];
