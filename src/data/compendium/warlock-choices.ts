// D&D 5e Warlock Choices Compendium
// Sources: Player's Handbook (PHB), Xanathar's Guide to Everything (XGE), Tasha's Cauldron of Everything (TCE), dnd.su

export type PactBoonType = 'blade' | 'tome' | 'chain' | 'talisman';

export interface InvocationDefinition {
  id: string;
  name: string;
  nameEn: string;
  levelReq: number;
  prerequisiteDescription?: string;
  pactReq?: PactBoonType;
  cantripReq?: string;
  description: string;
}

export interface PactBoonDefinition {
  id: PactBoonType;
  name: string;
  nameEn: string;
  description: string;
  features: string[];
  specialOptions?: string[];
}

export type GenieKindId = 'dao' | 'djinni' | 'efreeti' | 'marid';

export interface GenieKindDefinition {
  id: GenieKindId;
  name: string;
  element: string;
  damageType: string;
  vesselType: string;
  spells: Record<number, string[]>;
}

/**
 * All official Eldritch Invocations from PHB, XGE, TCE according to dnd.su
 */
export const WARLOCK_INVOCATIONS: InvocationDefinition[] = [
  // ── Level 2 / No level requirement ──────────────────────────────
  {
    id: 'agonizing-blast',
    name: 'Мучительный взрыв',
    nameEn: 'Agonizing Blast',
    levelReq: 2,
    prerequisiteDescription: 'заговор мистический заряд',
    cantripReq: 'Мистический заряд',
    description: 'Когда вы накладываете мистический заряд, добавьте модификатор Харизмы к урону, причиняемому им при попадании.'
  },
  {
    id: 'armor-of-shadows',
    name: 'Броня теней',
    nameEn: 'Armor of Shadows',
    levelReq: 2,
    description: 'Вы можете по желанию накладывать на себя доспехи мага, не тратя ячейки заклинаний и материальные компоненты.'
  },
  {
    id: 'beast-speech',
    name: 'Звериная речь',
    nameEn: 'Beast Speech',
    levelReq: 2,
    description: 'Вы можете по желанию накладывать разговор с животными, не тратя ячейки заклинаний.'
  },
  {
    id: 'beguiling-influence',
    name: 'Пленительный шепот',
    nameEn: 'Beguiling Influence',
    levelReq: 2,
    description: 'Вы получаете владение навыками Обман и Убеждение.'
  },
  {
    id: 'devils-sight',
    name: 'Дьявольский взгляд',
    nameEn: "Devil's Sight",
    levelReq: 2,
    description: 'Вы можете нормально видеть в немагической и магической тьме на расстоянии до 120 футов.'
  },
  {
    id: 'eldritch-sight',
    name: 'Мистический взор',
    nameEn: 'Eldritch Sight',
    levelReq: 2,
    description: 'Вы можете по желанию накладывать обнаружение магии, не тратя ячейки заклинаний.'
  },
  {
    id: 'eldritch-spear',
    name: 'Копьё мистики',
    nameEn: 'Eldritch Spear',
    levelReq: 2,
    prerequisiteDescription: 'заговор мистический заряд',
    cantripReq: 'Мистический заряд',
    description: 'Когда вы накладываете мистический заряд, его дистанция составляет 300 футов.'
  },
  {
    id: 'eyes-of-the-rune-keeper',
    name: 'Глаза хранителя рун',
    nameEn: 'Eyes of the Rune Keeper',
    levelReq: 2,
    description: 'Вы можете читать любые письмена.'
  },
  {
    id: 'fiendish-vigor',
    name: 'Дьявольская бодрость',
    nameEn: 'Fiendish Vigor',
    levelReq: 2,
    description: 'Вы можете по желанию накладывать на себя фальшивую жизнь как заклинание 1-го уровня, не тратя ячейки заклинаний и материальные компоненты.'
  },
  {
    id: 'gaze-of-two-minds',
    name: 'Взор двух умов',
    nameEn: 'Gaze of Two Minds',
    levelReq: 2,
    description: 'Вы можете действием коснуться согласного гуманоида и до конца своего следующего хода воспринимать мир его чувствами. Пока вы используете его чувства, вы ослеплены и оглушены для своего собственного окружения.'
  },
  {
    id: 'grasp-of-hadar',
    name: 'Притягивающий взрыв',
    nameEn: 'Grasp of Hadar',
    levelReq: 2,
    prerequisiteDescription: 'заговор мистический заряд',
    cantripReq: 'Мистический заряд',
    description: 'Один раз в свой ход, когда вы попадаете по существу мистическим зарядом, вы можете притянуть это существо по прямой линии на 10 футов ближе к себе.'
  },
  {
    id: 'lance-of-lethargy',
    name: 'Леденящий хват',
    nameEn: 'Lance of Lethargy',
    levelReq: 2,
    prerequisiteDescription: 'заговор мистический заряд',
    cantripReq: 'Мистический заряд',
    description: 'Один раз в свой ход, когда вы попадаете по существу мистическим зарядом, вы можете уменьшить его скорость на 10 футов до конца своего следующего хода.'
  },
  {
    id: 'mask-of-many-faces',
    name: 'Маска многих обличий',
    nameEn: 'Mask of Many Faces',
    levelReq: 2,
    description: 'Вы можете по желанию накладывать маскировку, не тратя ячейки заклинаний.'
  },
  {
    id: 'misty-visions',
    name: 'Туманные видения',
    nameEn: 'Misty Visions',
    levelReq: 2,
    description: 'Вы можете по желанию накладывать бесшумный образ, не тратя ячейки заклинаний и материальные компоненты.'
  },
  {
    id: 'repelling-blast',
    name: 'Отталкивающий взрыв',
    nameEn: 'Repelling Blast',
    levelReq: 2,
    prerequisiteDescription: 'заговор мистический заряд',
    cantripReq: 'Мистический заряд',
    description: 'Когда вы попадаете по существу мистическим зарядом, вы можете оттолкнуть его по прямой линии от себя на расстояние до 10 футов.'
  },
  {
    id: 'thief-of-five-fates',
    name: 'Вор пяти судеб',
    nameEn: 'Thief of Five Fates',
    levelReq: 2,
    description: 'Вы можете один раз наложить порчу, используя ячейку заклинаний колдуна. Вы не можете сделать это повторно, пока не завершите продолжительный отдых.'
  },

  // ── Level 3+ / Pact Boons ─────────────────────────────────────────
  {
    id: 'book-of-ancient-secrets',
    name: 'Книга древних секретов',
    nameEn: 'Book of Ancient Secrets',
    levelReq: 3,
    prerequisiteDescription: 'договор гримуара',
    pactReq: 'tome',
    description: 'Вы можете записывать магические ритуалы в свою Книгу Теней. Выберите два заклинания 1-го уровня со знаком «ритуал» из списка заклинаний любых классов. Вы можете исполнять эти заклинания как ритуалы.'
  },
  {
    id: 'voice-of-the-chain-master',
    name: 'Голос цепного мастера',
    nameEn: 'Voice of the Chain Master',
    levelReq: 3,
    prerequisiteDescription: 'договор цепи',
    pactReq: 'chain',
    description: 'Вы можете телепатически общаться со своим фамильяром и воспринимать мир его чувствами, пока находитесь на одном плане существования. Кроме того, вы можете говорить через фамильяра своим голосом.'
  },
  {
    id: 'improved-pact-weapon',
    name: 'Улучшенное оружие договора',
    nameEn: 'Improved Pact Weapon',
    levelReq: 3,
    prerequisiteDescription: 'договор клинка',
    pactReq: 'blade',
    description: 'Вы можете использовать любое созданное оружие договора в качестве заклинательной фокусировки колдуна. Это оружие получает бонус +1 к броскам атаки и урона, и вы можете призывать короткий лук, длинный лук, легкий или тяжелый арбалет.'
  },
  {
    id: 'rebuke-of-the-talisman',
    name: 'Защита талисмана',
    nameEn: 'Rebuke of the Talisman',
    levelReq: 3,
    prerequisiteDescription: 'договор талисмана',
    pactReq: 'talisman',
    description: 'Когда существо в пределах 30 футов от носителя талисмана попадает по нему атакой, вы можете реакцией нанести этому существу урон психической энергией, равный модификатору Харизмы, и оттолкнуть его на расстояние до 10 футов.'
  },
  {
    id: 'investment-of-the-chain-master',
    name: 'Инвестиция цепного мастера',
    nameEn: 'Investment of the Chain Master',
    levelReq: 3,
    prerequisiteDescription: 'договор цепи',
    pactReq: 'chain',
    description: 'При накладывании заклинания поиск фамильяра вы наделяете призванное существо особыми свойствами: скорость полета или плавания 40 футов, бонусным действием приказ совершить атаку, спасброски используют вашу СЛ заклинаний.'
  },

  // ── Level 5+ ──────────────────────────────────────────────────────
  {
    id: 'thirsting-blade',
    name: 'Жаждущий клинок',
    nameEn: 'Thirsting Blade',
    levelReq: 5,
    prerequisiteDescription: 'договор клинка, 5 уровень',
    pactReq: 'blade',
    description: 'Вы можете атаковать оружием договора дважды вместо одного раза, когда совершаете действие Атака в свой ход.'
  },
  {
    id: 'cloak-of-flies',
    name: 'Плащ мух',
    nameEn: 'Cloak of Flies',
    levelReq: 5,
    prerequisiteDescription: '5 уровень',
    description: 'Бонусным действием вы можете окружить себя роем жужжащих мух в радиусе 5 футов. Рой дает преимущество на проверки Запугивания, но помеху на другие проверки Харизмы, а существа, начинающие свой ход в рое, получают урон ядом, равный модификатору Харизмы.'
  },
  {
    id: 'maddening-hex',
    name: 'Неведомый зов',
    nameEn: 'Maddening Hex',
    levelReq: 5,
    prerequisiteDescription: '5 уровень, заклинание сглаз или проклятие колдуна',
    description: 'Бонусным действием вы причиняете психический урон существу под действием вашего сглаза или другой особенности колдуна. Цель и любые существа по вашему выбору в пределах 5 футов получают психический урон, равный модификатору Харизмы.'
  },
  {
    id: 'relentless-hex',
    name: 'Длань возмездия',
    nameEn: 'Relentless Hex',
    levelReq: 5,
    prerequisiteDescription: '5 уровень, заклинание сглаз или проклятие колдуна',
    description: 'Бонусным действием вы можете телепортироваться на расстояние до 30 футов в свободное пространство в пределах 5 футов от цели вашего сглаза или проклятия колдуна.'
  },
  {
    id: 'sign-of-ill-omen',
    name: 'Знак дурного знамения',
    nameEn: 'Sign of Ill Omen',
    levelReq: 5,
    prerequisiteDescription: '5 уровень',
    description: 'Вы можете один раз наложить проклятие, используя ячейку заклинаний колдуна. Вы не можете сделать это повторно до окончания продолжительного отдыха.'
  },
  {
    id: 'tomb-of-levistus',
    name: 'Гробница Левистуса',
    nameEn: 'Tomb of Levistus',
    levelReq: 5,
    prerequisiteDescription: '5 уровень',
    description: 'Реакцией при получении урона вы заключаете себя в ледяную глыбу, получая 10 временных хитов за каждый уровень колдуна. Они принимают как можно больше урона. Вы становитесь недееспособным до конца следующего хода.'
  },
  {
    id: 'undying-servitude',
    name: 'Узы нежити',
    nameEn: 'Undying Servitude',
    levelReq: 5,
    prerequisiteDescription: '5 уровень',
    description: 'Вы можете накладывать оживление мертвецов без траты ячейки заклинаний один раз за продолжительный отдых.'
  },
  {
    id: 'aspect-of-the-moon',
    name: 'Аспект луны',
    nameEn: 'Aspect of the Moon',
    levelReq: 5,
    prerequisiteDescription: 'договор гримуара, 5 уровень',
    pactReq: 'tome',
    description: 'Вам больше не требуется сон, и вас невозможно усыпить магией. Чтобы получить преимущества продолжительного отдыха, вы можете провести 8 часов за легкой деятельностью.'
  },
  {
    id: 'gift-of-the-ever-living-ones',
    name: 'Дар вечно живых',
    nameEn: 'Gift of the Ever-Living Ones',
    levelReq: 5,
    prerequisiteDescription: 'договор цепи, 5 уровень',
    pactReq: 'chain',
    description: 'Когда вы восстанавливаете хиты, находясь в пределах 100 футов от своего фамильяра, бросать кости не нужно: вы восстанавливаете максимальное количество хитов от каждого броска.'
  },
  {
    id: 'one-with-shadows',
    name: 'Око сокрытого',
    nameEn: 'One with Shadows',
    levelReq: 5,
    prerequisiteDescription: '5 уровень',
    description: 'Находясь в области тусклого света или тьмы, вы можете действием стать невидимым, пока не переместитесь или не совершите действие или реакцию.'
  },
  {
    id: 'mire-the-mind',
    name: 'Мутный разум',
    nameEn: 'Mire the Mind',
    levelReq: 5,
    prerequisiteDescription: '5 уровень',
    description: 'Вы можете один раз наложить замедление, используя ячейку заклинаний колдуна. Вы не можете сделать это повторно до окончания продолжительного отдыха.'
  },
  {
    id: 'eldritch-smite',
    name: 'Мистическая кара',
    nameEn: 'Eldritch Smite',
    levelReq: 5,
    prerequisiteDescription: 'договор клинка, 5 уровень',
    pactReq: 'blade',
    description: 'Один раз за ход при попадании оружием договора вы можете потратить ячейку заклинания колдуна, чтобы нанести дополнительно 1d8 урона силовым полем плюс 1d8 за каждый уровень ячейки, и сбить цель с ног (если размер Огромный или меньше).'
  },
  {
    id: 'gift-of-the-depths',
    name: 'Дар глубин',
    nameEn: 'Gift of the Depths',
    levelReq: 5,
    prerequisiteDescription: '5 уровень',
    description: 'Вы можете дышать под водой и получаете скорость плавания, равную вашей скорости перемещения. Вы также можете один раз наложить подводное дыхание без траты ячеек заклинаний за продолжительный отдых.'
  },
  {
    id: 'far-scribe',
    name: 'Дальний писец',
    nameEn: 'Far Scribe',
    levelReq: 5,
    prerequisiteDescription: 'договор гримуара, 5 уровень',
    pactReq: 'tome',
    description: 'Новая страница появляется в вашей Книге Теней. Согласные существа могут записать свое имя на ней. Вы можете накладывать заклинание послание, целясь в существо из списка, без траты ячеек заклинаний.'
  },

  // ── Level 7+ ──────────────────────────────────────────────────────
  {
    id: 'bewitching-whispers',
    name: 'Пронзительный взгляд',
    nameEn: 'Bewitching Whispers',
    levelReq: 7,
    prerequisiteDescription: '7 уровень',
    description: 'Вы можете один раз наложить принуждение, используя ячейку заклинаний колдуна. Вы не можете сделать это повторно до окончания продолжительного отдыха.'
  },
  {
    id: 'ghostly-gaze',
    name: 'Призрачный скиталец',
    nameEn: 'Ghostly Gaze',
    levelReq: 7,
    prerequisiteDescription: '7 уровень',
    description: 'Действием вы получаете способность видеть сквозь твердые предметы на расстояние до 30 футов на 1 минуту с концентрацией. Вы получаете темное зрение на это расстояние.'
  },
  {
    id: 'sculptor-of-flesh',
    name: 'Скульптор плоти',
    nameEn: 'Sculptor of Flesh',
    levelReq: 7,
    prerequisiteDescription: '7 уровень',
    description: 'Вы можете один раз наложить превращение, используя ячейку заклинаний колдуна. Вы не можете сделать это повторно до окончания продолжительного отдыха.'
  },
  {
    id: 'tricksters-escape',
    name: 'Побег обманщика',
    nameEn: "Trickster's Escape",
    levelReq: 7,
    prerequisiteDescription: '7 уровень',
    description: 'Вы можете один раз наложить на себя свободу перемещения без траты ячеек заклинаний. Вы восстанавливаете способность после продолжительного отдыха.'
  },
  {
    id: 'protection-of-the-talisman',
    name: 'Оберег талисмана',
    nameEn: 'Protection of the Talisman',
    levelReq: 7,
    prerequisiteDescription: 'договор талисмана, 7 уровень',
    pactReq: 'talisman',
    description: 'Когда носитель талисмана проваливает спасбросок, он может добавить d4 к результату, потенциально превращая провал в успех.'
  },
  {
    id: 'dreadful-word',
    name: 'Грозное слово',
    nameEn: 'Dreadful Word',
    levelReq: 7,
    prerequisiteDescription: '7 уровень',
    description: 'Вы можете один раз наложить смятение, используя ячейку заклинаний колдуна. Вы не можете сделать это повторно до окончания продолжительного отдыха.'
  },

  // ── Level 9+ ──────────────────────────────────────────────────────
  {
    id: 'ascendant-step',
    name: 'Восхождение превосходства',
    nameEn: 'Ascendant Step',
    levelReq: 9,
    prerequisiteDescription: '9 уровень',
    description: 'Вы можете по желанию накладывать на себя левитацию, не тратя ячейки заклинаний и материальные компоненты.'
  },
  {
    id: 'minions-of-chaos',
    name: 'Призыватель потустороннего',
    nameEn: 'Minions of Chaos',
    levelReq: 9,
    prerequisiteDescription: '9 уровень',
    description: 'Вы можете один раз наложить призыв элементаля, используя ячейку заклинаний колдуна. Вы не можете сделать это повторно до окончания продолжительного отдыха.'
  },
  {
    id: 'otherworldly-leap',
    name: 'Другой облик',
    nameEn: 'Otherworldly Leap',
    levelReq: 9,
    prerequisiteDescription: '9 уровень',
    description: 'Вы можете по желанию накладывать на себя прыжок, не тратя ячейки заклинаний и материальные компоненты.'
  },
  {
    id: 'whispers-of-the-grave',
    name: 'Шепот из могилы',
    nameEn: 'Whispers of the Grave',
    levelReq: 9,
    prerequisiteDescription: '9 уровень',
    description: 'Вы можете по желанию накладывать разговор с мертвыми, не тратя ячейки заклинаний.'
  },
  {
    id: 'gift-of-the-protectors',
    name: 'Дар защитников',
    nameEn: 'Gift of the Protectors',
    levelReq: 9,
    prerequisiteDescription: 'договор гримуара, 9 уровень',
    pactReq: 'tome',
    description: 'Новая страница появляется в вашей Книге Теней. До уровня колдуна согласных существ могут написать свои имена на ней. Если у существа из списка хиты опускаются до 0, его хиты вместо этого становятся равны 1.'
  },

  // ── Level 12+ ─────────────────────────────────────────────────────
  {
    id: 'lifedrinker',
    name: 'Кровопийца',
    nameEn: 'Lifedrinker',
    levelReq: 12,
    prerequisiteDescription: 'договор клинка, 12 уровень',
    pactReq: 'blade',
    description: 'Когда вы попадаете по существу своим оружием договора, существо получает дополнительный некротический урон, равный вашему модификатору Харизмы (минимум 1).'
  },
  {
    id: 'bond-of-the-talisman',
    name: 'Связь с талисманом',
    nameEn: 'Bond of the Talisman',
    levelReq: 12,
    prerequisiteDescription: 'договор талисмана, 12 уровень',
    pactReq: 'talisman',
    description: 'Пока кто-то другой носит ваш талисман, вы можете действием телепортироваться в свободное пространство в пределах 5 футов от носителя, или носитель может телепортироваться к вам, если оба согласны.'
  },

  // ── Level 15+ ─────────────────────────────────────────────────────
  {
    id: 'chains-of-carceri',
    name: 'Цепи Карцери',
    nameEn: 'Chains of Carceri',
    levelReq: 15,
    prerequisiteDescription: 'договор цепи, 15 уровень',
    pactReq: 'chain',
    description: 'Вы можете по желанию накладывать удержание чудовища без траты ячеек заклинаний, если целью является исчадие, небожитель или элементаль.'
  },
  {
    id: 'master-of-myriad-forms',
    name: 'Повелитель форм',
    nameEn: 'Master of Myriad Forms',
    levelReq: 15,
    prerequisiteDescription: '15 уровень',
    description: 'Вы можете по желанию накладывать изменение обличья, не тратя ячейки заклинаний.'
  },
  {
    id: 'shroud-of-shadow',
    name: 'Саван тени',
    nameEn: 'Shroud of Shadow',
    levelReq: 15,
    prerequisiteDescription: '15 уровень',
    description: 'Вы можете по желанию накладывать невидимость, не тратя ячейки заклинаний.'
  },
  {
    id: 'visions-of-distant-realms',
    name: 'Видения далеких миров',
    nameEn: 'Visions of Distant Realms',
    levelReq: 15,
    prerequisiteDescription: '15 уровень',
    description: 'Вы можете по желанию накладывать магический глаз, не тратя ячейки заклинаний.'
  },
  {
    id: 'witch-sight',
    name: 'Ведьмин взор',
    nameEn: 'Witch Sight',
    levelReq: 15,
    prerequisiteDescription: '15 уровень',
    description: 'Вы можете видеть истинный облик любого оборотня или существа, скрытого иллюзией или трансмутацией, если оно находится в пределах 30 футов от вас и в пределах линии обзора.'
  }
];

/**
 * Warlock Pact Boons (Договоры колдуна: Клинок, Гримуар, Цепь, Талисман)
 */
export const WARLOCK_PACT_BOONS: Record<PactBoonType, PactBoonDefinition> = {
  blade: {
    id: 'blade',
    name: 'Договор клинка',
    nameEn: 'Pact of the Blade',
    description: 'Вы можете действием создать полуматериальное оружие в своей пустой руке. Вы можете выбирать форму этого оружия ближнего боя каждый раз при создании. Вы владеете им, пока держите его.',
    features: [
      'Призыв магического оружия ближнего боя любым действием',
      'Оружие считается магическим для преодоления сопротивлений',
      'Возможность связать существующее магическое оружие в качестве ритуала'
    ]
  },
  tome: {
    id: 'tome',
    name: 'Договор гримуара',
    nameEn: 'Pact of the Tome',
    description: 'Ваш покровитель дарует вам гримуар под названием «Книга Теней». Выберите три заговора из списка заклинаний любых классов. Пока книга при вас, вы можете творить эти заговоры по желанию.',
    features: [
      'Получение Книги Теней',
      '3 дополнительных заговора из любого класса на выбор',
      'Заговоры считаются заклинаниями колдуна для вас'
    ]
  },
  chain: {
    id: 'chain',
    name: 'Договор цепи',
    nameEn: 'Pact of the Chain',
    description: 'Вы выучиваете заклинание «Поиск фамильяра» и можете сотворять его как ритуал. Это заклинание не идет в счет числа известных вам заклинаний. При призыве фамильяра вы можете выбрать особую форму.',
    features: [
      'Сотворение заклинания «Поиск фамильяра» как ритуала',
      'Расширенный список фамильяров: Имп, Квазит, Псевдодракон, Спрайт',
      'Возможность пожертвовать своей атакой, чтобы атаковал фамильяр'
    ],
    specialOptions: ['Имп', 'Квазит', 'Псевдодракон', 'Спрайт']
  },
  talisman: {
    id: 'talisman',
    name: 'Договор талисмана',
    nameEn: 'Pact of the Talisman',
    description: 'Ваш покровитель дарует вам амулет или талисман. Носитель этого талисмана может добавить d4 к проверке характеристики при провале.',
    features: [
      'Получение особого амулета или талисмана',
      'Добавление 1d4 к проверке характеристики при провале',
      'Талисман может носить как сам колдун, так и его союзник'
    ]
  }
};

/**
 * The Genie Warlock Patron Kinds (Dao, Djinni, Efreeti, Marid)
 */
export const GENIE_KINDS: Record<GenieKindId, GenieKindDefinition> = {
  dao: {
    id: 'dao',
    name: 'Дао (Земля)',
    element: 'Земля',
    damageType: 'дробящий',
    vesselType: 'Сосуд из резного камня, глины или статуэтка',
    spells: {
      1: ['Убежище'],
      2: ['Шипы'],
      3: ['Слияние с камнем'],
      4: ['Каменная кожа'],
      5: ['Стена камня']
    }
  },
  djinni: {
    id: 'djinni',
    name: 'Джинн (Воздух)',
    element: 'Воздух',
    damageType: 'звук',
    vesselType: 'Изящная латунная лампа, стеклянная бутыль или резной рог',
    spells: {
      1: ['Громовая волна'],
      2: ['Порыв ветра'],
      3: ['Стена ветра'],
      4: ['Высшая невидимость'],
      5: ['Кажущаяся видимость']
    }
  },
  efreeti: {
    id: 'efreeti',
    name: 'Ифрит (Огонь)',
    element: 'Огонь',
    damageType: 'огонь',
    vesselType: 'Кувшин из латуни или меди с гравировкой пламени, лампа из черного железа',
    spells: {
      1: ['Горящие руки'],
      2: ['Палящий луч'],
      3: ['Огненный шар'],
      4: ['Огненный щит'],
      5: ['Огненный столб']
    }
  },
  marid: {
    id: 'marid',
    name: 'Марид (Вода)',
    element: 'Вода',
    damageType: 'холод',
    vesselType: 'Перламутровая раковина, синий стеклянный кувшин или резной коралл',
    spells: {
      1: ['Туманное облако'],
      2: ['Размытый силуэт'],
      3: ['Метель'],
      4: ['Власть над водами'],
      5: ['Конус холода']
    }
  }
};

/**
 * Spells eligible for Warlock Mystic Arcanum (Таинственный арканум) 6th-9th level
 */
export const WARLOCK_MYSTIC_ARCANUM_SPELLS: Record<number, string[]> = {
  6: [
    'Круг смерти',
    'Создание нежити',
    'Окаменение',
    'Врата в астрал',
    'Плоть в камень',
    'Истинное зрение',
    'Мысленный хлыст',
    'Магический сосуд',
    'Призыв исчадия'
  ],
  7: [
    'Эфирность',
    'Перст смерти',
    'Силовая клетка',
    'Сдвиг по фазе',
    'Корона безумия',
    'Дрим'
  ],
  8: [
    'Подчинение чудовища',
    'Слабоумие',
    'Демиплан',
    'Слово силы: оглушение'
  ],
  9: [
    'Слово силы: смерть',
    'Истинное превращение',
    'Астральная проекция',
    'Предвидение',
    'Врата'
  ]
};

/**
 * Checks if a specific Eldritch Invocation is available for a Warlock
 * given their class level, pact boon, and known cantrips.
 */
export function isInvocationAvailable(
  inv: InvocationDefinition,
  level: number,
  pactBoon?: string,
  knownCantrips: string[] = []
): boolean {
  if (level < (inv.levelReq || 0)) {
    return false;
  }
  if (inv.pactReq && pactBoon !== inv.pactReq) {
    return false;
  }
  if (inv.cantripReq && !knownCantrips.includes(inv.cantripReq)) {
    return false;
  }
  return true;
}
