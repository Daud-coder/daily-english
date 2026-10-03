export interface LessonPhrase {
  id: string;
  english: string;
  russian: string;
  transcription: string;
  tip?: string;
}

export interface CurriculumTopic {
  id: string;
  order: number;
  title: string;
  titleEn: string;
  description: string;
  icon: string;
  phrases: LessonPhrase[];
  starterDialogue: {
    teacherEnglish: string;
    teacherRussian: string;
  };
}

export const CURRICULUM: CurriculumTopic[] = [
  {
    id: "topic-1",
    order: 1,
    title: "Знакомство и о себе",
    titleEn: "Introductions & About You",
    description: "Первые фразы: поздороваться, назвать имя и сказать, как дела.",
    icon: "👋",
    phrases: [
      {
        id: "p1-1",
        english: "Hello! My name is Daud.",
        russian: "Привет! Меня зовут Дауд.",
        transcription: "Хэлло́у! Май нэйм из Да́уд.",
        tip: "Универсальное приветствие и представление."
      },
      {
        id: "p1-2",
        english: "Nice to meet you.",
        russian: "Приятно познакомиться.",
        transcription: "Найс ту миит ю.",
        tip: "Говорится сразу после знакомства."
      },
      {
        id: "p1-3",
        english: "How are you today?",
        russian: "Как ваши дела сегодня?",
        transcription: "Ха́у а ю тудэ́й?",
        tip: "Самый частый вежливый вопрос."
      },
      {
        id: "p1-4",
        english: "I am fine, thank you.",
        russian: "У меня всё хорошо, спасибо.",
        transcription: "Ай эм файн, сэнк ю.",
        tip: "Простой и правильный ответ."
      },
      {
        id: "p1-5",
        english: "I am learning English.",
        russian: "Я учу английский язык.",
        transcription: "Ай эм лё́нин И́нглиш.",
        tip: "Поможет, если собеседник говорит слишком быстро."
      },
    ],
    starterDialogue: {
      teacherEnglish: "Hello! What is your name?",
      teacherRussian: "Привет! Как тебя зовут?"
    }
  },
  {
    id: "topic-2",
    order: 2,
    title: "Цифры и цены",
    titleEn: "Numbers & Prices",
    description: "Как спросить «Сколько это стоит?» и понять сумму.",
    icon: "🔢",
    phrases: [
      {
        id: "p2-1",
        english: "How much is this?",
        russian: "Сколько это стоит?",
        transcription: "Ха́у мач из зис?",
        tip: "Показываем на товар и спрашиваем цену."
      },
      {
        id: "p2-2",
        english: "It is ten dollars.",
        russian: "Это стоит десять долларов.",
        transcription: "Ит из тэн до́ларз.",
        tip: "Простое обозначение цены."
      },
      {
        id: "p2-3",
        english: "Can I pay by card?",
        russian: "Можно оплатить картой?",
        transcription: "Кэн ай пэй бай каад?",
        tip: "Незаменимая фраза на любой кассе."
      },
      {
        id: "p2-4",
        english: "Only cash, please.",
        russian: "Только наличные, пожалуйста.",
        transcription: "О́нли кэш, плииз.",
        tip: "Если терминал не работает."
      },
      {
        id: "p2-5",
        english: "Here is your receipt.",
        russian: "Вот ваш чек.",
        transcription: "Хи́а из ё риси́ит.",
        tip: "Чек на кассе."
      },
    ],
    starterDialogue: {
      teacherEnglish: "Do you pay by card?",
      teacherRussian: "Ты платишь картой?"
    }
  },
  {
    id: "topic-3",
    order: 3,
    title: "Семья",
    titleEn: "Family",
    description: "Рассказать о близких: брат, сестра, родители, дети.",
    icon: "👨‍👩‍👦",
    phrases: [
      {
        id: "p3-1",
        english: "I have a big family.",
        russian: "У меня большая семья.",
        transcription: "Ай хэв э биг фэ́мили.",
        tip: "Базовое описание."
      },
      {
        id: "p3-2",
        english: "This is my brother.",
        russian: "Это мой брат.",
        transcription: "Зис из май бра́зэ.",
        tip: "Представление родственника."
      },
      {
        id: "p3-3",
        english: "I have two children.",
        russian: "У меня двое детей.",
        transcription: "Ай хэв туу чи́лдрэн.",
        tip: "Слово children уже во множественном числе."
      },
      {
        id: "p3-4",
        english: "My parents live here.",
        russian: "Мои родители живут здесь.",
        transcription: "Май пэ́рэнтс лив хи́а.",
        tip: "О родителях."
      },
      {
        id: "p3-5",
        english: "We love each other.",
        russian: "Мы любим друг друга.",
        transcription: "Уи лав иич а́зэ.",
        tip: "Тёплая фраза о семье."
      },
    ],
    starterDialogue: {
      teacherEnglish: "Do you have a brother?",
      teacherRussian: "У тебя есть брат?"
    }
  },
  {
    id: "topic-4",
    order: 4,
    title: "Еда и кафе",
    titleEn: "Food & Cafe",
    description: "Заказать столик, кофе, чай и попросить счёт.",
    icon: "☕",
    phrases: [
      {
        id: "p4-1",
        english: "A table for one, please.",
        russian: "Столик на одного, пожалуйста.",
        transcription: "Э тэйбл фо уа́н, плииз.",
        tip: "При входе в кафе или ресторан."
      },
      {
        id: "p4-2",
        english: "One coffee, please.",
        russian: "Один кофе, пожалуйста.",
        transcription: "Уа́н ко́фи, плииз.",
        tip: "Быстрый заказ."
      },
      {
        id: "p4-3",
        english: "Water with ice, please.",
        russian: "Воду со льдом, пожалуйста.",
        transcription: "Уо́тэ уиз айс, плииз.",
        tip: "Заказ напитков."
      },
      {
        id: "p4-4",
        english: "The check, please.",
        russian: "Счёт, пожалуйста.",
        transcription: "Зэ чек, плииз.",
        tip: "Попросить счёт в конце трапезы."
      },
      {
        id: "p4-5",
        english: "The food is delicious.",
        russian: "Еда очень вкусная.",
        transcription: "Зэ фууд из дэли́шэс.",
        tip: "Вежливый комплимент повару."
      },
    ],
    starterDialogue: {
      teacherEnglish: "Do you like black coffee?",
      teacherRussian: "Ты любишь чёрный кофе?"
    }
  },
  {
    id: "topic-5",
    order: 5,
    title: "Магазин",
    titleEn: "Shopping",
    description: "Найти нужный отдел, размер и пакет для покупок.",
    icon: "🛍️",
    phrases: [
      {
        id: "p5-1",
        english: "Where is the bread?",
        russian: "Где находится хлеб?",
        transcription: "Уэ́ар из зэ брэд?",
        tip: "Конструкция 'Where is...?' подходит для любого товара."
      },
      {
        id: "p5-2",
        english: "I need a bag, please.",
        russian: "Мне нужен пакет, пожалуйста.",
        transcription: "Ай ниид э бэг, плииз.",
        tip: "На кассе супермаркета."
      },
      {
        id: "p5-3",
        english: "Do you have a bigger size?",
        russian: "У вас есть размер побольше?",
        transcription: "Ду ю хэв э би́гэ сайз?",
        tip: "В магазине одежды."
      },
      {
        id: "p5-4",
        english: "I will take this.",
        russian: "Я возьму это.",
        transcription: "Ай уи́л тэйк зис.",
        tip: "Решение о покупке."
      },
      {
        id: "p5-5",
        english: "Can I help you?",
        russian: "Могу я вам помочь?",
        transcription: "Кэн ай хэлп ю?",
        tip: "Что говорит продавец консультант."
      },
    ],
    starterDialogue: {
      teacherEnglish: "Do you need a shopping bag?",
      teacherRussian: "Тебе нужен пакет для покупок?"
    }
  },
  {
    id: "topic-6",
    order: 6,
    title: "Дорога и транспорт",
    titleEn: "Directions & Transport",
    description: "Автобус, метро, такси и как найти дорогу.",
    icon: "🚌",
    phrases: [
      {
        id: "p6-1",
        english: "Where is the bus stop?",
        russian: "Где автобусная остановка?",
        transcription: "Уэ́ар из зэ бас стоп?",
        tip: "Поиск общественного транспорта."
      },
      {
        id: "p6-2",
        english: "Turn left, then right.",
        russian: "Поверните налево, затем направо.",
        transcription: "Тёрн лэфт, зэн райт.",
        tip: "Стандартные указания направления."
      },
      {
        id: "p6-3",
        english: "Is it far from here?",
        russian: "Это далеко отсюда?",
        transcription: "Из ит фаар фром хи́а?",
        tip: "Оценка расстояния."
      },
      {
        id: "p6-4",
        english: "One ticket to downtown, please.",
        russian: "Один билет в центр, пожалуйста.",
        transcription: "Уа́н ти́кет ту да́унтаун, плииз.",
        tip: "Покупка билета в кассе."
      },
      {
        id: "p6-5",
        english: "Stop here, please.",
        russian: "Остановите здесь, пожалуйста.",
        transcription: "Стоп хи́а, плииз.",
        tip: "Для поездки в такси."
      },
    ],
    starterDialogue: {
      teacherEnglish: "Do you take the bus?",
      teacherRussian: "Ты ездишь на автобусе?"
    }
  },
  {
    id: "topic-7",
    order: 7,
    title: "Время и дни",
    titleEn: "Time & Days",
    description: "Который час, дни недели и договоренности о встрече.",
    icon: "⏰",
    phrases: [
      {
        id: "p7-1",
        english: "What time is it now?",
        russian: "Который сейчас час?",
        transcription: "Уот тайм из ит на́у?",
        tip: "Как узнать точное время."
      },
      {
        id: "p7-2",
        english: "It is three o'clock.",
        russian: "Сейчас ровно три часа.",
        transcription: "Ит из срии о'кло́к.",
        tip: "Ответ о ровном часе."
      },
      {
        id: "p7-3",
        english: "See you on Monday.",
        russian: "Увидимся в понедельник.",
        transcription: "Сии ю он ма́ндэй.",
        tip: "Прощание с указанием дня."
      },
      {
        id: "p7-4",
        english: "I am busy today.",
        russian: "Я сегодня занят.",
        transcription: "Ай эм би́зи тудэ́й.",
        tip: "Если нет времени встретиться."
      },
      {
        id: "p7-5",
        english: "Let us meet tomorrow.",
        russian: "Давай встретимся завтра.",
        transcription: "Лэт ас миит тумо́роу.",
        tip: "Предложение перенести на завтра."
      },
    ],
    starterDialogue: {
      teacherEnglish: "Are you free today?",
      teacherRussian: "Ты свободен сегодня?"
    }
  },
  {
    id: "topic-8",
    order: 8,
    title: "Отель",
    titleEn: "Hotel",
    description: "Заселение, ключ от номера, пароль от Wi-Fi и завтрак.",
    icon: "🏨",
    phrases: [
      {
        id: "p8-1",
        english: "I have a room reservation.",
        russian: "У меня забронирован номер.",
        transcription: "Ай хэв э руум рэзэвэ́йшн.",
        tip: "Главная фраза на ресепшн."
      },
      {
        id: "p8-2",
        english: "What is the Wi-Fi password?",
        russian: "Какой пароль от Wi-Fi?",
        transcription: "Уот из зэ уа́й-фа́й па́суёрд?",
        tip: "Самый частый вопрос в любой гостинице."
      },
      {
        id: "p8-3",
        english: "Here is your key.",
        russian: "Вот ваш ключ от номера.",
        transcription: "Хи́а из ё кии.",
        tip: "Ответ администратора."
      },
      {
        id: "p8-4",
        english: "When is breakfast served?",
        russian: "Когда подают завтрак?",
        transcription: "Уэн из брэ́кфэст сёрвд?",
        tip: "Уточнить время утреннего приема пищи."
      },
      {
        id: "p8-5",
        english: "I need clean towels.",
        russian: "Мне нужны чистые полотенца.",
        transcription: "Ай ниид клиин та́уэлз.",
        tip: "Простая просьба горничной."
      },
    ],
    starterDialogue: {
      teacherEnglish: "Do you like hotel breakfast?",
      teacherRussian: "Тебе нравится завтрак в отеле?"
    }
  },
  {
    id: "topic-9",
    order: 9,
    title: "Аэропорт",
    titleEn: "Airport",
    description: "Паспортный контроль, посадочный талон и багаж.",
    icon: "✈️",
    phrases: [
      {
        id: "p9-1",
        english: "Here is my passport.",
        russian: "Вот мой паспорт.",
        transcription: "Хи́а из май па́споот.",
        tip: "На паспортном контроле."
      },
      {
        id: "p9-2",
        english: "Where is gate five?",
        russian: "Где выход на посадку номер пять?",
        transcription: "Уэ́ар из гэйт файв?",
        tip: "Поиск выхода на посадку."
      },
      {
        id: "p9-3",
        english: "This is my luggage.",
        russian: "Это мой багаж.",
        transcription: "Зис из май ла́гидж.",
        tip: "При сдаче или получении чемодана."
      },
      {
        id: "p9-4",
        english: "Have a good flight!",
        russian: "Хорошего полёта!",
        transcription: "Хэв э гууд флайт!",
        tip: "Пожелание от персонала авиакомпании."
      },
      {
        id: "p9-5",
        english: "Is the flight on time?",
        russian: "Рейс вылетает вовремя?",
        transcription: "Из зэ флайт он тайм?",
        tip: "Уточнить задержку рейса."
      },
    ],
    starterDialogue: {
      teacherEnglish: "Do you have your passport?",
      teacherRussian: "У тебя с собой паспорт?"
    }
  },
  {
    id: "topic-10",
    order: 10,
    title: "Здоровье и самочувствие",
    titleEn: "Health & Wellbeing",
    description: "Аптека, боль в голове/животе и вызов помощи.",
    icon: "💊",
    phrases: [
      {
        id: "p10-1",
        english: "I feel sick today.",
        russian: "Я плохо себя чувствую сегодня.",
        transcription: "Ай фиил сик тудэ́й.",
        tip: "Обозначить плохое самочувствие."
      },
      {
        id: "p10-2",
        english: "I have a headache.",
        russian: "У меня болит голова.",
        transcription: "Ай хэв э хэ́дэйк.",
        tip: "Конструкция I have a... для боли."
      },
      {
        id: "p10-3",
        english: "I need some medicine.",
        russian: "Мне нужно лекарство.",
        transcription: "Ай ниид сам мэ́дисин.",
        tip: "В аптеке фармацевту."
      },
      {
        id: "p10-4",
        english: "Please call a doctor.",
        russian: "Пожалуйста, вызовите врача.",
        transcription: "Плииз коол э до́ктэ.",
        tip: "В экстренной ситуации."
      },
      {
        id: "p10-5",
        english: "Take this twice daily.",
        russian: "Принимайте это дважды в день.",
        transcription: "Тэйк зис туа́йс дэ́йли.",
        tip: "Инструкция аптекаря."
      },
    ],
    starterDialogue: {
      teacherEnglish: "Do you have a headache?",
      teacherRussian: "У тебя болит голова?"
    }
  },
  {
    id: "topic-11",
    order: 11,
    title: "Телефонный разговор",
    titleEn: "Phone Conversation",
    description: "«Алло, меня слышно?», перезвонить и попросить подождать.",
    icon: "📞",
    phrases: [
      {
        id: "p11-1",
        english: "Can you hear me well?",
        russian: "Вы хорошо меня слышите?",
        transcription: "Кэн ю хи́а ми уэ́л?",
        tip: "В начале любого звонка."
      },
      {
        id: "p11-2",
        english: "Please hold on a second.",
        russian: "Пожалуйста, подождите секунду.",
        transcription: "Плииз хоулд он э сэ́кэнд.",
        tip: "Если нужно ненадолго отвлечься."
      },
      {
        id: "p11-3",
        english: "I will call you back.",
        russian: "Я перезвоню вам позже.",
        transcription: "Ай уи́л коол ю бэк.",
        tip: "Если сейчас неудобно говорить."
      },
      {
        id: "p11-4",
        english: "Could you speak slower, please?",
        russian: "Не могли бы вы говорить медленнее?",
        transcription: "Куд ю спиик сло́уэ, плииз?",
        tip: "Супер-полезно для новичка!"
      },
      {
        id: "p11-5",
        english: "Thank you for your call.",
        russian: "Спасибо за ваш звонок.",
        transcription: "Сэнк ю фо ё коол.",
        tip: "Вежливое завершение звонка."
      },
    ],
    starterDialogue: {
      teacherEnglish: "Can you hear my voice?",
      teacherRussian: "Ты слышишь мой голос?"
    }
  },
  {
    id: "topic-12",
    order: 12,
    title: "Простые рабочие разговоры",
    titleEn: "Basic Work Conversations",
    description: "Готов к работе, отправить письмо, встретиться и перерыв.",
    icon: "💼",
    phrases: [
      {
        id: "p12-1",
        english: "I am ready to work.",
        russian: "Я готов к работе.",
        transcription: "Ай эм рэ́ди ту уёрк.",
        tip: "В начале рабочего дня."
      },
      {
        id: "p12-2",
        english: "I will send an email.",
        russian: "Я отправлю электронное письмо.",
        transcription: "Ай уи́л сэнд эн и́мэйл.",
        tip: "О переписке по работе."
      },
      {
        id: "p12-3",
        english: "Let us have a meeting.",
        russian: "Давайте проведём встречу.",
        transcription: "Лэт ас хэв э ми́итин.",
        tip: "Предложение рабочего созвона."
      },
      {
        id: "p12-4",
        english: "I need five minutes break.",
        russian: "Мне нужен пятиминутный перерыв.",
        transcription: "Ай ниид файв ми́нитс брэйк.",
        tip: "Короткая пауза."
      },
      {
        id: "p12-5",
        english: "Great job, team!",
        russian: "Отличная работа, команда!",
        transcription: "Грэйт джоб, тиим!",
        tip: "Поддержка коллег."
      },
    ],
    starterDialogue: {
      teacherEnglish: "Are you ready to work?",
      teacherRussian: "Ты готов к работе?"
    }
  }
];
