import type { DndSpell } from './types';

/**
 * D&D 5e Cantrips (Level 0) (Total: 46)
 */
export const CANTRIPS: DndSpell[] = [
  {
    "id": "13-acid-splash",
    "name": "Брызги кислоты",
    "nameEn": "Acid Splash",
    "level": 0,
    "school": "Вызов",
    "schoolEn": "Conjuration",
    "castingTime": "1 действие",
    "range": "60 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Изобретатель",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы кидаете кислотный шарик. Выберите одно существо, которое вы видите в пределах дистанции, или два существа, которых вы видите в пределах дистанции, находящихся в пределах 5 футов друг от друга. Цель должна преуспеть в спасброске Ловкости, иначе получит 1к6 урона кислотой.\n\nУрон этого заклинания увеличивается на 1к6, когда вы достигаете 5-го уровня (2к6), 11-го уровня (3к6) и 17-го уровня (4к6).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/13-acid-splash/"
  },
  {
    "id": "374-control-flames",
    "name": "Власть над огнём",
    "nameEn": "Control Flames",
    "level": 0,
    "school": "Преобразование",
    "schoolEn": "Transmutation",
    "castingTime": "1 действие",
    "range": "60 футов",
    "components": {
      "v": false,
      "s": true,
      "m": "",
      "raw": "С"
    },
    "duration": "Мгновенная или 1 час",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Друид",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "XGE",
        "name": "Xanathar's Guide to Everything"
      },
      {
        "code": "POA",
        "name": "Princes of the Apocalypse"
      }
    ],
    "sourceBook": "Xanathar's Guide to Everything",
    "description": "Вы выбираете немагическое пламя, которое вы можете видеть в пределах дистанции и которое помещается в куб с длиной ребра 5 футов. Вы можете управлять им одним из нижеперечисленных способов:\n\nВы можете мгновенно распространить огонь на 5 футов в одном направлении, если там присутствует дерево или другое топливо. Вы можете мгновенно потушить огонь в кубе. Вы можете увеличить или уменьшить вдвое область яркого и тусклого света, излучаемого пламенем, а также поменять его цвет. Эффект действует 1 час. Вы можете сотворить в огне изображение, которое будет отдалённо напоминать существо, предмет или место, и двигаться согласно вашим указаниям. Эффект действует 1 час.\n\nЕсли вы накладываете это заклинание несколько раз, то вы не можете поддерживать более 3 длительных эффектов одновременно. Вы можете действием отменить один из действующих эффектов.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/374-control-flames/"
  },
  {
    "id": "26-mage-hand",
    "name": "Волшебная рука",
    "nameEn": "Mage Hand",
    "level": 0,
    "school": "Вызов",
    "schoolEn": "Conjuration",
    "castingTime": "1 действие",
    "range": "30 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "1 минута",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Бард",
      "Волшебник",
      "Изобретатель",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [
      {
        "name": "мистический ловкач",
        "class": "Плут",
        "raw": "мистический ловкач (плут)"
      },
      {
        "name": "хранитель роя",
        "class": "Следопыт",
        "raw": "хранитель роя (следопыт)"
      }
    ],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "В точке, выбранной вами в пределах дистанции, появляется призрачная парящая рука. Рука существует, пока заклинание активно или пока вы не отпустите её действием. Рука исчезает, если окажется более чем в 30 футах от вас или если вы повторно наложите это заклинание.\n\nВы можете действием контролировать руку. С её помощью вы можете манипулировать предметами, открывать незапертые двери и контейнеры, убирать предметы в открытые контейнеры и доставать их оттуда или выливать содержимое флаконов. При каждом использовании руки вы можете переместить её на 30 футов.\n\nРука не может совершать атаки, активировать магические предметы и переносить более 10 фунтов (4,5 кг).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/26-mage-hand/"
  },
  {
    "id": "378-magic-stone",
    "name": "Волшебный камень",
    "nameEn": "Magic Stone",
    "level": 0,
    "school": "Преобразование",
    "schoolEn": "Transmutation",
    "castingTime": "1 бонусное действие",
    "range": "Касание",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "1 минута",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Друид",
      "Изобретатель",
      "Колдун"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "XGE",
        "name": "Xanathar's Guide to Everything"
      },
      {
        "code": "POA",
        "name": "Princes of the Apocalypse"
      }
    ],
    "sourceBook": "Xanathar's Guide to Everything",
    "description": "Вы касаетесь от 1 до 3 камней и наделяете их магической силой. Вы или кто-либо ещё можете совершить дальнобойную атаку заклинанием, кинув один из этих камней или запустив его при помощи пращи. Дальность броска рукой составляет 60 футов. Если кто-либо другой атакует этим камнем, он использует для броска атаки ваш модификатор базовой характеристики вместо своего. При попадании цель получает дробящий урон в размере 1к6 + ваш модификатор базовой характеристики. Вне зависимости от того, попал камень или нет, это заклинание перестаёт на него действовать.\n\nЕсли вы накладываете это заклинание ещё раз, его эффект преждевременно заканчивается на тех камнях, что были зачарованы прежде.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/378-magic-stone/"
  },
  {
    "id": "461-sword-burst",
    "name": "Вспышка мечей",
    "nameEn": "Sword Burst",
    "level": 0,
    "school": "Вызов",
    "schoolEn": "Conjuration",
    "castingTime": "1 действие",
    "range": "На себя (5-футовый радиус)",
    "components": {
      "v": true,
      "s": false,
      "m": "",
      "raw": "В"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Изобретатель",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "SCAG",
        "name": "Sword Coast Adventurer's Guide"
      },
      {
        "code": "TCE",
        "name": "Tasha's Cauldron of Everything"
      }
    ],
    "sourceBook": "Sword Coast Adventurer's Guide",
    "description": "Вы на мгновение создаёте круг из вращающихся вокруг вас призрачных лезвий. Все остальные существа в пределах 5 футов от вас должны преуспеть в спасброске Ловкости, иначе получат 1к6 урона силовым полем.\n\nУрон этого заклинания увеличивается на 1к6, когда вы достигаете 5-го уровня (2к6), 11-го уровня (3к6) и 17-го уровня (4к6).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/461-sword-burst/"
  },
  {
    "id": "458-booming-blade",
    "name": "Громовой клинок",
    "nameEn": "Booming Blade",
    "level": 0,
    "school": "Воплощение",
    "schoolEn": "Evocation",
    "castingTime": "1 действие",
    "range": "На себя (5-футовый радиус)",
    "components": {
      "v": false,
      "s": true,
      "m": "рукопашное оружие стоимостью не менее 1 см",
      "raw": "С, М (рукопашное оружие стоимостью не менее 1 см)",
      "costly": true
    },
    "duration": "1 раунд",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Изобретатель",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "SCAG",
        "name": "Sword Coast Adventurer's Guide"
      },
      {
        "code": "TCE",
        "name": "Tasha's Cauldron of Everything"
      }
    ],
    "sourceBook": "Sword Coast Adventurer's Guide",
    "description": "Вы взмахиваете оружием, выбранным в качестве материального компонента, и совершаете им рукопашную атаку оружием против одного существа в пределах 5 футов от вас. При попадании цель подвергается обычному эффекту от атаки этим оружием и покрывается бушующей энергией до начала вашего следующего хода. Если цель добровольно перемещается на 5 футов или более до окончания действия заклинания, она получает 1к8 урона звуком, и действие заклинания заканчивается.\n\nУрон этого заклинания увеличивается, когда вы достигаете определённых уровней. На 5-м уровне рукопашная атака наносит дополнительно 1к8 урона звуком при попадании, а урон, получаемый при перемещении, увеличивается до 2к8. Оба броска урона снова увеличиваются на 1к8 на 11-м уровне (2к8 и 3к8) и на 17-м уровне (3к8 и 4к8).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/458-booming-blade/"
  },
  {
    "id": "71-friends",
    "name": "Дружба",
    "nameEn": "Friends",
    "level": 0,
    "school": "Очарование",
    "schoolEn": "Enchantment",
    "castingTime": "1 действие",
    "range": "На себя",
    "components": {
      "v": false,
      "s": true,
      "m": "небольшое количество грима, наносимое на лицо при накладывании этого заклинания",
      "raw": "С, М (небольшое количество грима, наносимое на лицо при накладывании этого заклинания)"
    },
    "duration": "Концентрация, вплоть до 1 минуты",
    "concentration": true,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Бард",
      "Волшебник",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Пока заклинание активно, вы совершаете с преимуществом все проверки Харизмы, направленные на одно выбранное вами существо, не враждебное по отношению к вам. Когда заклинание оканчивается, существо понимает, что вы влияли на её отношение с помощью магии, и становится враждебным по отношению к вам. Существо, склонное к насилию, может напасть на вас. Другие могут требовать другого возмездия (решает Мастер), в зависимости от отношений, сложившихся между вами.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/71-friends/"
  },
  {
    "id": "73-shillelagh",
    "name": "Дубинка",
    "nameEn": "Shillelagh",
    "level": 0,
    "school": "Преобразование",
    "schoolEn": "Transmutation",
    "castingTime": "1 бонусное действие",
    "range": "Касание",
    "components": {
      "v": true,
      "s": true,
      "m": "омела, лист клевера и дубинка или боевой посох",
      "raw": "В, С, М (омела, лист клевера и дубинка или боевой посох)"
    },
    "duration": "1 минута",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Друид"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Дерево дубинки или боевого посоха, который вы держите, наполняется силой природы. Пока заклинание активно, вы можете использовать свою базовую заклинательную характеристику вместо Силы для бросков рукопашной атаки и урона при использовании этого оружия, и кость урона становится равной к8. Если оружие не было магическим, оно становится им. Заклинание оканчивается, если вы наложите его ещё раз или выпустите оружие из рук.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/73-shillelagh/"
  },
  {
    "id": "101-blade-ward",
    "name": "Защита от оружия",
    "nameEn": "Blade Ward",
    "level": 0,
    "school": "Ограждение",
    "schoolEn": "Abjuration",
    "castingTime": "1 действие",
    "range": "На себя",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "1 раунд",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Бард",
      "Волшебник",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы протягиваете руку и рисуете в воздухе ограждающий знак. Вы получаете до конца своего следующего хода сопротивление дробящему, колющему и рубящему урону, причиненному атаками оружием.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/101-blade-ward/"
  },
  {
    "id": "112-vicious-mockery",
    "name": "Злая насмешка",
    "nameEn": "Vicious Mockery",
    "level": 0,
    "school": "Очарование",
    "schoolEn": "Enchantment",
    "castingTime": "1 действие",
    "range": "60 футов",
    "components": {
      "v": true,
      "s": false,
      "m": "",
      "raw": "В"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Бард"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы испускаете на существо, видимое в пределах дистанции, поток оскорблений вперемешку с тонкой магией. Если цель слышит вас (при этом она не обязана вас понимать), она должна преуспеть в спасброске Мудрости, иначе получит урон психической энергией 1к4, и следующий бросок атаки до конца своего следующего хода совершит с помехой.\n\nУрон этого заклинания увеличивается на 1к4, когда вы достигаете 5-го уровня (2к4), 11-го уровня (3к4) и 17-го уровня (4к4).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/112-vicious-mockery/"
  },
  {
    "id": "123-druidcraft",
    "name": "Искусство друидов",
    "nameEn": "Druidcraft",
    "level": 0,
    "school": "Преобразование",
    "schoolEn": "Transmutation",
    "castingTime": "1 действие",
    "range": "30 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Друид"
    ],
    "optionalClasses": [],
    "subclasses": [
      {
        "name": "мистический лучник",
        "class": "Воин",
        "raw": "мистический лучник (воин)"
      },
      {
        "name": "путь великана",
        "class": "Варвар",
        "raw": "путь великана (варвар)"
      }
    ],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Пошептавшись с духами природы, вы создаёте один из следующих эффектов в пределах дистанции:\n\nВы создаёте крохотный безвредный ощутимый эффект, предсказывающий погоду в текущем месте в течение следующих 24 часов. Это может быть золотистый шарик, означающий ясную погоду, облачко, означающее дождь, снежинка, и так далее. Эффект длится 1 раунд. Вы мгновенно заставляете цветок распуститься, семечко прорасти, или почку раскрыться. Вы создаёте мгновенный безвредный ощутимый эффект, такой как падающие листья, порыв ветра, звук маленького животного, или слабый запах скунса. Эффект должен находиться в кубе с длиной ребра 5 футов. Вы мгновенно зажигаете или тушите свечу, факел или небольшой костёр.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/123-druidcraft/"
  },
  {
    "id": "2441-sapping-sting",
    "name": "Иссушающий укол",
    "nameEn": "Sapping Sting",
    "level": 0,
    "school": "Некромантия",
    "schoolEn": "Necromancy",
    "castingTime": "1 действие",
    "range": "30 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [],
    "optionalClasses": [],
    "subclasses": [
      {
        "name": "магия хронургии",
        "class": "Волшебник",
        "raw": "магия хронургии (волшебник)"
      },
      {
        "name": "магия гравитургии",
        "class": "Волшебник",
        "raw": "магия гравитургии (волшебник)"
      }
    ],
    "sources": [
      {
        "code": "EGW",
        "name": "Explorer's Guide to Wildemount"
      }
    ],
    "sourceBook": "Explorer's Guide to Wildemount",
    "description": "Вы вытягиваете жизненные силы одного видимого существа в пределах дистанции. Цель должна преуспеть в спасброске Телосложения, иначе получит 1к4 урона некротической энергией и упадёт ничком.\n\nУрон этого заклинания увеличивается на 1к4, когда вы достигаете 5-го уровня (2к4), 11-го уровня (3к4) и 17-го уровня (4к4).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/2441-sapping-sting/"
  },
  {
    "id": "459-green-flame-blade",
    "name": "Клинок зелёного пламени",
    "nameEn": "Green-flame Blade",
    "level": 0,
    "school": "Воплощение",
    "schoolEn": "Evocation",
    "castingTime": "1 действие",
    "range": "На себя (5-футовый радиус)",
    "components": {
      "v": false,
      "s": true,
      "m": "рукопашное оружие стоимостью не менее 1 см",
      "raw": "С, М (рукопашное оружие стоимостью не менее 1 см)",
      "costly": true
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Изобретатель",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "SCAG",
        "name": "Sword Coast Adventurer's Guide"
      },
      {
        "code": "TCE",
        "name": "Tasha's Cauldron of Everything"
      }
    ],
    "sourceBook": "Sword Coast Adventurer's Guide",
    "description": "Вы взмахиваете оружием, выбранным в качестве материального компонента, и совершаете им рукопашную атаку оружием против одного существа в пределах 5 футов от вас. При попадании цель подвергается обычному эффекту атаки этим оружием, и вы можете заставить зелёный огонь перекинуться от цели к другому существу по вашему выбору, которое вы можете видеть в пределах 5 футов от цели. Второе существо получает урон огнём, равный вашему модификатору базовой характеристики.\n\nУрон этого заклинания увеличивается, когда вы достигаете определенных уровней. На 5-м уровне рукопашная атака наносит дополнительно 1к8 урона огнём, а урон, получаемый вторым существом, увеличивается до 1к8 + ваш модификатор базовой характеристики. Оба этих урона увеличиваются на 1к8 на 11-м уровне (2к8 и 2к8) и 17-м уровне (3к8 и 3к8).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/459-green-flame-blade/"
  },
  {
    "id": "741-encode-thoughts",
    "name": "Кодировка мыслей",
    "nameEn": "Encode Thoughts",
    "level": 0,
    "school": "Очарование",
    "schoolEn": "Enchantment",
    "castingTime": "1 действие",
    "range": "На себя",
    "components": {
      "v": false,
      "s": true,
      "m": "",
      "raw": "С"
    },
    "duration": "Вплоть до 8 часов",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "GGR",
        "name": "Guildmasters' guide to Ravnica"
      }
    ],
    "sourceBook": "Guildmasters' guide to Ravnica",
    "description": "Прикладывая палец к своей голове, вы извлекаете воспоминание, идею или сообщение из своего разума и трансформируете её в осязаемую ленту светящейся энергии — ленту мысли. Она существует в течение всей длительности заклинания или пока вы не наложите это заклинание снова. Лента мысли появляется в свободном пространстве в пределах 5 футов от вас как Крошечный невесомый полутвёрдый предмет, который можно держать и нести как ленту. В остальном она неподвижна.\n\nЕсли вы накладываете это заклинание, пока концентрируетесь на заклинании или умении, позволяющем читать мысли других существ или манипулировать ими (например, обнаружение мыслей [detect thoughts] или изменение памяти [modify memory]), вы можете трансформировать в ленту мысли читаемые вами мысли или воспоминания.\n\nЕсли вы накладываете это заклинание, пока держите ленту мысли, вы мгновенно получаете ту информацию, что содержит лента (накладывание заклинания обнаружение мыслей [detect thoughts] на ленту имеет тот же эффект).\n\nЭто заклинание доступно только Оперативникам Димиров, имеющим умение «Использование заклинаний» или «Магия договора» — Господин Финик",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/741-encode-thoughts/"
  },
  {
    "id": "460-lightning-lure",
    "name": "Лассо молнии",
    "nameEn": "Lightning Lure",
    "level": 0,
    "school": "Воплощение",
    "schoolEn": "Evocation",
    "castingTime": "1 действие",
    "range": "На себя (15-футовый радиус)",
    "components": {
      "v": true,
      "s": false,
      "m": "",
      "raw": "В"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Изобретатель",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "SCAG",
        "name": "Sword Coast Adventurer's Guide"
      },
      {
        "code": "TCE",
        "name": "Tasha's Cauldron of Everything"
      }
    ],
    "sourceBook": "Sword Coast Adventurer's Guide",
    "description": "Вы создаёте хлыст из молний, поражающий одно существо по вашему выбору, которое вы можете видеть в пределах 15 футов от вас. Цель должна преуспеть в спасброске Силы, иначе будет притянута на 10 футов по прямой к вам, после чего получит 1к8 урона электричеством, если окажется в пределах 5 футов от вас.\n\nУрон этого заклинания увеличивается на 1к8, когда вы достигаете 5-го уровня (2к8), 11-го уровня (3к8) и 17-го уровня (4к8).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/460-lightning-lure/"
  },
  {
    "id": "140-chill-touch",
    "name": "Леденящее прикосновение",
    "nameEn": "Chill Touch",
    "level": 0,
    "school": "Некромантия",
    "schoolEn": "Necromancy",
    "castingTime": "1 действие",
    "range": "120 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "1 раунд",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [
      {
        "name": "круг спор",
        "class": "Друид",
        "raw": "круг спор (друид)"
      }
    ],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы создаете призрачную руку скелета в пространстве существа, находящегося в пределах дистанции. Совершите дальнобойную атаку заклинанием по существу, чтобы окутать его могильным холодом. При попадании цель получает 1к8 урона некротической энергией и не может восстанавливать хиты до начала вашего следующего хода. Все это время рука держится за цель.\n\nЕсли вы попадаете по Нежити, то она также совершает по вам броски атаки с помехой до конца вашего следующего хода.\n\nУрон этого заклинания увеличивается на 1к8, когда вы достигаете 5-го уровня (2к8), 11-го уровня (3к8) и 17-го уровня (4к8).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/140-chill-touch/"
  },
  {
    "id": "389-mold-earth",
    "name": "Лепка земли",
    "nameEn": "Mold Earth",
    "level": 0,
    "school": "Преобразование",
    "schoolEn": "Transmutation",
    "castingTime": "1 действие",
    "range": "30 футов",
    "components": {
      "v": false,
      "s": true,
      "m": "",
      "raw": "С"
    },
    "duration": "Мгновенная или 1 час",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Друид",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "XGE",
        "name": "Xanathar's Guide to Everything"
      },
      {
        "code": "POA",
        "name": "Princes of the Apocalypse"
      }
    ],
    "sourceBook": "Xanathar's Guide to Everything",
    "description": "Выберите область земли или камня, видимую в пределах дистанции и помещающуюся в куб с длиной ребра 5 футов. Вы можете управлять ей одним из нижеперечисленных способов:\n\nЕсли вы нацелились на область рыхлой земли, вы можете мгновенно извлечь её и переместить на расстояние до 5 футов по земле. Это перемещение не обладает достаточной силой, чтобы причинить урон. Вы можете создавать узоры или цвета на поверхности земли или камня, для передачи слов, изображений или форм. Эффект действует 1 час. Если выбранная область находится на поверхности земли, вы можете сделать её труднопроходимой. В качестве альтернативы вы можете сделать труднопроходимую местность нормальной. Эффект действует 1 час.\n\nЕсли вы накладываете это заклинание несколько раз, вы не можете поддерживать более 2 длительных эффектов одновременно. Вы можете действием отменить один из действующих эффектов.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/389-mold-earth/"
  },
  {
    "id": "149-ray-of-frost",
    "name": "Луч холода",
    "nameEn": "Ray of Frost",
    "level": 0,
    "school": "Воплощение",
    "schoolEn": "Evocation",
    "castingTime": "1 действие",
    "range": "60 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Изобретатель",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Холодный сине-белый луч устремляется к существу, находящемуся в пределах дистанции. Совершите по цели дальнобойную атаку заклинанием. При попадании она получает урон холодом 1к8, а скорость до начала вашего следующего хода уменьшается на 10 футов.\n\nУрон от заклинания увеличивается на 1к8, когда вы достигаете 5-го уровня (2к8), 11-го уровня (3к8) и 17-го уровня (4к8).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/149-ray-of-frost/"
  },
  {
    "id": "154-minor-illusion",
    "name": "Малая иллюзия",
    "nameEn": "Minor Illusion",
    "level": 0,
    "school": "Иллюзия",
    "schoolEn": "Illusion",
    "castingTime": "1 действие",
    "range": "30 футов",
    "components": {
      "v": false,
      "s": true,
      "m": "кусок овечьей шерсти",
      "raw": "С, М (кусок овечьей шерсти)"
    },
    "duration": "1 минута",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Бард",
      "Волшебник",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [
      {
        "name": "путь тени",
        "class": "Монах",
        "raw": "путь тени (монах)"
      }
    ],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы создаёте звук или образ предмета в пределах дистанции, существующий, пока активно заклинание. Иллюзия также оканчивается, если вы отпустите её действием или используете это заклинание ещё раз.\n\nЕсли вы создаёте звук, его громкость может быть как шепотом, так и криком. Это может быть ваш голос, чей-то другой голос, львиный рык, бой барабанов или любой другой звук по вашему выбору. Звук звучит всю длительность заклинания, или вы можете создавать отдельные звуки в разное время, пока заклинание активно.\n\nЕсли вы создаёте образ предмета — например, стул, отпечаток в грязи, или небольшой сундук — он должен помещаться в куб с длиной ребра 5 футов. Образ не может издавать звуки, свет, запах или прочие сенсорные эффекты. Физическое взаимодействие с образом даёт понять, что это иллюзия, потому что сквозь него все проходит.\n\nЕсли существо действием исследует звук или образ, оно может понять, что это иллюзия, совершив успешную проверку Интеллекта (Расследование) против Сл ваших заклинаний. Если существо распознает иллюзию, она для него становится нечёткой.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/154-minor-illusion/"
  },
  {
    "id": "165-true-strike",
    "name": "Меткий удар",
    "nameEn": "True Strike",
    "level": 0,
    "school": "Прорицание",
    "schoolEn": "Divination",
    "castingTime": "1 действие",
    "range": "30 футов",
    "components": {
      "v": false,
      "s": true,
      "m": "",
      "raw": "С"
    },
    "duration": "Концентрация, вплоть до 1 раунда",
    "concentration": true,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Бард",
      "Волшебник",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы вытягиваете руку и указываете пальцем на цель, находящуюся в пределах дистанции. Ваша магия даёт краткое понимание защиты цели. В своем следующем ходу вы совершаете с преимуществом первый бросок атаки по цели, при условии, что заклинание к тому моменту не окончится.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/165-true-strike/"
  },
  {
    "id": "168-eldritch-blast",
    "name": "Мистический заряд",
    "nameEn": "Eldritch Blast",
    "level": 0,
    "school": "Воплощение",
    "schoolEn": "Evocation",
    "castingTime": "1 действие",
    "range": "120 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Колдун"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "К существу, находящемуся в пределах дистанции, устремляется луч потрескивающей энергии. Совершите дальнобойную атаку заклинанием по цели. При попадании цель получает урон силовым полем 1к10.\n\nЗаклинание создаёт ещё один луч, когда вы достигаете больших уровней: два луча на 5-м уровне, три луча на 11-м уровне и четыре луча на 17-м уровне.\n\nВы можете направить лучи в одну цель или в разные. Для каждого луча совершите свой бросок атаки.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/168-eldritch-blast/"
  },
  {
    "id": "456-infestation",
    "name": "Нашествие",
    "nameEn": "Infestation",
    "level": 0,
    "school": "Вызов",
    "schoolEn": "Conjuration",
    "castingTime": "1 действие",
    "range": "30 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "живая блоха",
      "raw": "В, С, М (живая блоха)"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Друид",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "XGE",
        "name": "Xanathar's Guide to Everything"
      }
    ],
    "sourceBook": "Xanathar's Guide to Everything",
    "description": "Вы вызываете клещей, блох и других паразитов, которые мгновенно обволакивают одно существо, которое вы можете видеть в пределах дистанции. Цель должна преуспеть в спасброске Телосложения, иначе получит 1к6 урона ядом и переместится на 5 футов в случайном направлении, если она может двигаться и её скорость составляет не менее 5 футов. Бросьте к4 для определения направления: 1, север; 2, юг; 3, восток; или 4, запад. Это перемещение не провоцирует атаки и, если выпавшее направление заблокировано, цель не перемещается.\n\nУрон заклинания увеличивается на 1к6, когда вы достигаете 5-го уровня (2к6), 11-го уровня (3к6) и 17-го уровня (4к6).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/456-infestation/"
  },
  {
    "id": "396-frostbite",
    "name": "Обморожение",
    "nameEn": "Frostbite",
    "level": 0,
    "school": "Воплощение",
    "schoolEn": "Evocation",
    "castingTime": "1 действие",
    "range": "60 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Друид",
      "Изобретатель",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "XGE",
        "name": "Xanathar's Guide to Everything"
      },
      {
        "code": "POA",
        "name": "Princes of the Apocalypse"
      }
    ],
    "sourceBook": "Xanathar's Guide to Everything",
    "description": "Сильный холод окружает одно существо, которое вы можете видеть в пределах дистанции. Цель должна совершить спасбросок Телосложения. При провале цель получает 1к6 урона холодом и совершает с помехой следующий бросок атаки оружием до конца своего следующего хода.\n\nУрон этого заклинания увеличивается на 1к6, когда вы достигаете 5-го уровня (2к6), 11-го уровня (3к6) и 17-го уровня (4к6).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/396-frostbite/"
  },
  {
    "id": "204-fire-bolt",
    "name": "Огненный снаряд",
    "nameEn": "Fire Bolt",
    "level": 0,
    "school": "Воплощение",
    "schoolEn": "Evocation",
    "castingTime": "1 действие",
    "range": "120 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Изобретатель",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы кидаете сгусток огня в существо или предмет в пределах дистанции. Совершите по цели дальнобойную атаку заклинанием. При попадании цель получает урон огнём 1к10. Горючие предметы, по которым попало это заклинание, воспламеняются, если их никто не несет и не носит.\n\nУрон этого заклинания увеличивается на 1к10, когда вы достигаете 5-го уровня (2к10), 11-го уровня (3к10), 17-го уровня (4к10).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/204-fire-bolt/"
  },
  {
    "id": "454-primal-savagery",
    "name": "Первобытная дикость",
    "nameEn": "Primal Savagery",
    "level": 0,
    "school": "Преобразование",
    "schoolEn": "Transmutation",
    "castingTime": "1 действие",
    "range": "На себя",
    "components": {
      "v": false,
      "s": true,
      "m": "",
      "raw": "С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Друид"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "XGE",
        "name": "Xanathar's Guide to Everything"
      }
    ],
    "sourceBook": "Xanathar's Guide to Everything",
    "description": "Вы направляете первобытную магию, затачивающую ваши зубы или ногти, и готовитесь к агрессивной атаке. Совершите рукопашную атаку заклинанием против одного существа в пределах 5 футов от вас. При попадании цель получает 1к10 урона кислотой. После того, как вы совершите атаку, ваши зубы или ногти вернутся в нормальное состояние.\n\nУрон заклинания увеличивается на 1к10, когда вы достигаете 5-го уровня (2к10), 11-го уровня (3к10) и 17-го уровня (4к10).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/454-primal-savagery/"
  },
  {
    "id": "234-dancing-lights",
    "name": "Пляшущие огоньки",
    "nameEn": "Dancing Lights",
    "level": 0,
    "school": "Воплощение",
    "schoolEn": "Evocation",
    "castingTime": "1 действие",
    "range": "120 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "кусочек фосфора, гнилушка или светлячок",
      "raw": "В, С, М (кусочек фосфора, гнилушка или светлячок)"
    },
    "duration": "Концентрация, вплоть до 1 минуты",
    "concentration": true,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Бард",
      "Волшебник",
      "Изобретатель",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы создаете до четырёх огоньков размером с факел в пределах дистанции, делая их похожими на факелы, фонари или светящиеся сферы, парящие в воздухе. Вы можете также объединить четыре огонька в одну светящуюся человекоподобную фигуру Среднего размера. Какую бы форму вы ни выбрали, каждый огонёк излучает тусклый свет в радиусе 10 футов.\n\nВы можете бонусным действием в свой ход переместить огоньки на 60 футов в новое место в пределах дистанции. Каждый огонёк должен находиться в пределах 20 футов от другого огонька, созданного этим заклинанием, и огонёк тухнет, если оказывается за пределами дистанции заклинания.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/234-dancing-lights/"
  },
  {
    "id": "457-toll-the-dead",
    "name": "Погребальный звон",
    "nameEn": "Toll the Dead",
    "level": 0,
    "school": "Некромантия",
    "schoolEn": "Necromancy",
    "castingTime": "1 действие",
    "range": "60 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Жрец",
      "Колдун"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "XGE",
        "name": "Xanathar's Guide to Everything"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Xanathar's Guide to Everything",
    "description": "Вы указываете на одно существо, которое можете видеть в пределах дистанции, и воздух вокруг него на мгновение наполняется скорбным звучанием колокола. Цель должна преуспеть в спасброске Мудрости, иначе получит 1к8 урона некротической энергией. Если хиты цели были не полные, то вместо 1к8 она получает 1к12 урона некротической энергией.\n\nУрон заклинания увеличивается на одну кость, когда вы достигаете 5-го уровня (2к8 или 2к12), 11-го уровня (3к8 или 3к12) и 17-го уровня (4к8 или 4к12).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/457-toll-the-dead/"
  },
  {
    "id": "258-mending",
    "name": "Починка",
    "nameEn": "Mending",
    "level": 0,
    "school": "Преобразование",
    "schoolEn": "Transmutation",
    "castingTime": "1 минута",
    "range": "Касание",
    "components": {
      "v": true,
      "s": true,
      "m": "два магнетита",
      "raw": "В, С, М (два магнетита)"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Бард",
      "Волшебник",
      "Друид",
      "Жрец",
      "Изобретатель",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Это заклинание чинит одно повреждение или разрыв на предмете, которого касаетесь, например, разорванное звено цепи, две половинки сломанного ключа, порванный плащ или протекающий бурдюк. Если повреждение или разрыв не больше 1 фута в любом измерении, вы чините его, не оставляя следов.\n\nЭто заклинание может физически починить магический предмет или Конструкта, но не может восстановить магию в таких предметах.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/258-mending/"
  },
  {
    "id": "407-thunderclap",
    "name": "Раскат грома",
    "nameEn": "Thunderclap",
    "level": 0,
    "school": "Воплощение",
    "schoolEn": "Evocation",
    "castingTime": "1 действие",
    "range": "5 футов",
    "components": {
      "v": false,
      "s": true,
      "m": "",
      "raw": "С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Бард",
      "Волшебник",
      "Друид",
      "Изобретатель",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "XGE",
        "name": "Xanathar's Guide to Everything"
      },
      {
        "code": "POA",
        "name": "Princes of the Apocalypse"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Xanathar's Guide to Everything",
    "description": "Вы вызываете оглушительный раскат грома, который слышен на расстоянии до 100 футов. Все существа кроме вас в пределах дистанции должны совершить спасбросок Телосложения. При провале существо получает 1к6 урона звуком.\n\nУрон заклинания увеличивается на 1к6, когда вы достигаете 5-го уровня (2к6), 11-го уровня (3к6) и 17-го уровня (4к6).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/407-thunderclap/"
  },
  {
    "id": "3050-mind-sliver",
    "name": "Расщепление разума",
    "nameEn": "Mind Sliver",
    "level": 0,
    "school": "Очарование",
    "schoolEn": "Enchantment",
    "castingTime": "1 действие",
    "range": "60 футов",
    "components": {
      "v": true,
      "s": false,
      "m": "",
      "raw": "В"
    },
    "duration": "1 раунд",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [
      {
        "name": "аберрантный разум",
        "class": "Чародей",
        "raw": "аберрантный разум (чародей)"
      }
    ],
    "sources": [
      {
        "code": "TCE",
        "name": "Tasha's Cauldron of Everything"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Tasha's Cauldron of Everything",
    "description": "Вы отправляете дезориентирующий луч психической энергии в разум одного существа, которое видите в пределах дистанции. Цель должна преуспеть в спасброске Интеллекта, иначе получит 1к6 урона психической энергией и вычтет 1к4 из следующего спасброска, совершаемого ею до конца вашего следующего хода.\n\nУрон этого заклинания увеличивается на 1к6, когда вы достигаете следующих уровней: 5-го уровня (2к6), 11-го уровня (3к6) и 17-го уровня (4к6).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/3050-mind-sliver/"
  },
  {
    "id": "307-light",
    "name": "Свет",
    "nameEn": "Light",
    "level": 0,
    "school": "Воплощение",
    "schoolEn": "Evocation",
    "castingTime": "1 действие",
    "range": "Касание",
    "components": {
      "v": true,
      "s": false,
      "m": "светлячок или фосфоресцирующий мох",
      "raw": "В, М (светлячок или фосфоресцирующий мох)"
    },
    "duration": "1 час",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Бард",
      "Волшебник",
      "Жрец",
      "Изобретатель",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [
      {
        "name": "домен света",
        "class": "Жрец",
        "raw": "домен света (жрец)"
      },
      {
        "name": "небожитель",
        "class": "Колдун",
        "raw": "небожитель (колдун)"
      }
    ],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы касаетесь одного предмета, длина которого ни по одному из измерений не превышает 10 футов. Пока заклинание активно, предмет испускает яркий свет в радиусе 20 футов и тусклый свет в пределах ещё 20 футов. Свет может быть любого выбранного вами цвета. Полное покрытие предмета чем-то непрозрачным блокирует свет. Заклинание оканчивается, если вы наложите его ещё раз или окончите действием.\n\nЕсли вы нацелились на предмет, несомый или носимый враждебным существом, это существо должно преуспеть в спасброске Ловкости, чтобы увернуться от заклинания.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/307-light/"
  },
  {
    "id": "311-sacred-flame",
    "name": "Священное пламя",
    "nameEn": "Sacred Flame",
    "level": 0,
    "school": "Воплощение",
    "schoolEn": "Evocation",
    "castingTime": "1 действие",
    "range": "60 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Жрец"
    ],
    "optionalClasses": [],
    "subclasses": [
      {
        "name": "небожитель",
        "class": "Колдун",
        "raw": "небожитель (колдун)"
      },
      {
        "name": "лунное чародейство",
        "class": "Чародей",
        "raw": "лунное чародейство (чародей)"
      }
    ],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "На существо, которое вы видите в пределах дистанции, нисходит сияние, похожее на огонь. Цель должна преуспеть в спасброске Ловкости, иначе получит 1к8 урона излучением. Для этого спасброска цель не получает преимуществ от укрытия.\n\nУрон этого заклинания увеличивается на 1к8, когда вы достигаете 5-го уровня (2к8), 11-го уровня (3к8) и 17-го уровня (4к8).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/311-sacred-flame/"
  },
  {
    "id": "455-word-of-radiance",
    "name": "Слово сияния",
    "nameEn": "Word of Radiance",
    "level": 0,
    "school": "Воплощение",
    "schoolEn": "Evocation",
    "castingTime": "1 действие",
    "range": "5 футов",
    "components": {
      "v": true,
      "s": false,
      "m": "священный символ",
      "raw": "В, М (священный символ)"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Жрец"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "XGE",
        "name": "Xanathar's Guide to Everything"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Xanathar's Guide to Everything",
    "description": "Вы произносите божественное слово и исторгаете из себя обжигающее сияние. Каждое существо по вашему выбору, которое вы можете видеть в пределах дистанции, должно преуспеть в спасброске Телосложения, иначе получит 1к6 урона излучением.\n\nУрон заклинания увеличивается на 1к6, когда вы достигаете 5-го уровня (2к6), 11-го уровня (3к6), и 17-го уровня (4к6).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/455-word-of-radiance/"
  },
  {
    "id": "331-message",
    "name": "Сообщение",
    "nameEn": "Message",
    "level": 0,
    "school": "Преобразование",
    "schoolEn": "Transmutation",
    "castingTime": "1 действие",
    "range": "120 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "кусочек медной проволоки",
      "raw": "В, С, М (кусочек медной проволоки)"
    },
    "duration": "1 раунд",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Бард",
      "Волшебник",
      "Изобретатель",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы указываете пальцем в направлении существа, находящегося в пределах дистанции, и шепчете послание. Цель (и только цель) слышит его, и может ответить шепотом, который услышите только вы.\n\nВы можете использовать это заклинание сквозь твердые препятствия, если вы знакомы с целью и знаете, что она находится за барьером. Магическая тишина, 1 фут камня, 1 дюйм обычного металла, тонкий лист свинца или 3 фута дерева блокируют заклинание. Заклинание не обязано идти по прямой линии, и может огибать углы и проходить через отверстия.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/331-message/"
  },
  {
    "id": "332-resistance",
    "name": "Сопротивление",
    "nameEn": "Resistance",
    "level": 0,
    "school": "Ограждение",
    "schoolEn": "Abjuration",
    "castingTime": "1 действие",
    "range": "Касание",
    "components": {
      "v": true,
      "s": true,
      "m": "крошечный плащ",
      "raw": "В, С, М (крошечный плащ)"
    },
    "duration": "Концентрация, вплоть до 1 минуты",
    "concentration": true,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Друид",
      "Жрец",
      "Изобретатель"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы касаетесь одного согласного существа. Пока заклинание активно, цель может один раз бросить к4 и добавить выпавшее число к одному спасброску на свой выбор. Кость можно кидать до или после спасброска. После этого заклинание оканчивается.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/332-resistance/"
  },
  {
    "id": "410-create-bonfire",
    "name": "Сотворение костра",
    "nameEn": "Create Bonfire",
    "level": 0,
    "school": "Вызов",
    "schoolEn": "Conjuration",
    "castingTime": "1 действие",
    "range": "60 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Концентрация, вплоть до 1 минуты",
    "concentration": true,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Друид",
      "Изобретатель",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "XGE",
        "name": "Xanathar's Guide to Everything"
      },
      {
        "code": "POA",
        "name": "Princes of the Apocalypse"
      }
    ],
    "sourceBook": "Xanathar's Guide to Everything",
    "description": "Вы создаёте огонь на поверхности земли в точке, которую можете видеть в пределах дистанции. Пока заклинание действует, огонь занимает область в кубе с длиной ребра 5 футов. Все существа, оказавшиеся в этом пространстве в момент накладывания заклинания, должны преуспеть в спасброске Ловкости, иначе получат 1к8 урона огнём. Существо также должно совершать спасбросок, когда впервые за ход перемещается в область действия заклинания или заканчивает свой ход в ней. Пламя поджигает все никем не носимые и не переносимые горючие предметы.\n\nУрон заклинания увеличивается на 1к8, когда вы достигаете 5-го уровня (2к8), 11-го уровня (3к8) и 17-го уровня (4к8).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/410-create-bonfire/"
  },
  {
    "id": "336-produce-flame",
    "name": "Сотворение пламени",
    "nameEn": "Produce Flame",
    "level": 0,
    "school": "Вызов",
    "schoolEn": "Conjuration",
    "castingTime": "1 действие",
    "range": "На себя",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "10 минут",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Друид"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "В вашей ладони появляется мерцающее пламя. Оно остаётся там, пока заклинание активно, и не вредит ни вам, ни вашему снаряжению. Огонь испускает яркий свет в радиусе 10 футов и тусклый свет в пределах ещё 10 футов. Заклинание оканчивается, если вы оканчиваете его действием или накладываете ещё раз.\n\nВы можете атаковать этим пламенем, но это тоже оканчивает заклинание. Когда вы накладываете это заклинание, или другим действием в одном из последующих ходов вы можете метнуть пламя в существо, находящееся в пределах 30 футов от вас. Совершите дальнобойную атаку заклинанием. При попадании цель получает 1к8 урона огнём.\n\nУрон этого заклинания увеличивается на 1к8, когда вы достигаете 5-го уровня (2к8), 11-го уровня (3к8) и 17-го уровня (4к8).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/336-produce-flame/"
  },
  {
    "id": "348-thorn-whip",
    "name": "Терновый кнут",
    "nameEn": "Thorn Whip",
    "level": 0,
    "school": "Преобразование",
    "schoolEn": "Transmutation",
    "castingTime": "1 действие",
    "range": "30 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "стебель растения с шипами",
      "raw": "В, С, М (стебель растения с шипами)"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Друид",
      "Изобретатель"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы создаёте длинный, похожий на лозу кнут, покрытый шипами, бьющий по вашей команде существо, находящееся в пределах дистанции. Совершите рукопашную атаку заклинанием по цели. Если атака попадает, существо получает колющий урон 1к6, и, если размер существа не больше Большого, вы подтягиваете существо на расстояние до 10 футов к себе.\n\nУрон этого заклинания увеличивается на 1к6, когда вы достигаете 5 уровня (2к6), 11 уровня (3к6) и 17 уровня (4к6).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/348-thorn-whip/"
  },
  {
    "id": "105-guidance",
    "name": "Указание",
    "nameEn": "Guidance",
    "level": 0,
    "school": "Прорицание",
    "schoolEn": "Divination",
    "castingTime": "1 действие",
    "range": "Касание",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Концентрация, вплоть до 1 минуты",
    "concentration": true,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Друид",
      "Жрец",
      "Изобретатель"
    ],
    "optionalClasses": [],
    "subclasses": [
      {
        "name": "коллегия духов",
        "class": "Бард",
        "raw": "коллегия духов (бард)"
      },
      {
        "name": "круг звёзд",
        "class": "Друид",
        "raw": "круг звёзд (друид)"
      }
    ],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы касаетесь одного согласного существа. Один раз, пока заклинание активно, цель может бросить 1к4 и добавить выпавшее число к одной проверке характеристики на свой выбор. Эту кость можно бросить до или после совершения проверки. После этого заклинание оканчивается.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/105-guidance/"
  },
  {
    "id": "94-spare-the-dying",
    "name": "Уход за умирающим",
    "nameEn": "Spare the Dying",
    "level": 0,
    "school": "Некромантия",
    "schoolEn": "Necromancy",
    "castingTime": "1 действие",
    "range": "Касание",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Жрец",
      "Изобретатель"
    ],
    "optionalClasses": [],
    "subclasses": [
      {
        "name": "домен упокоения",
        "class": "Жрец",
        "raw": "домен упокоения (жрец)"
      },
      {
        "name": "бессмертный",
        "class": "Колдун",
        "raw": "бессмертный (колдун)"
      }
    ],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы касаетесь живого существа, у которого 0 хитов. Оно становится стабилизированным. Это заклинание не оказывает никакого эффекта на Нежить и Конструктов.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/94-spare-the-dying/"
  },
  {
    "id": "91-prestidigitation",
    "name": "Фокусы",
    "nameEn": "Prestidigitation",
    "level": 0,
    "school": "Преобразование",
    "schoolEn": "Transmutation",
    "castingTime": "1 действие",
    "range": "10 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Вплоть до 1 часа",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Бард",
      "Волшебник",
      "Изобретатель",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [
      {
        "name": "мистический лучник",
        "class": "Воин",
        "raw": "мистический лучник (воин)"
      }
    ],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Это заклинание — небольшой магический трюк, на котором практикуются начинающие заклинатели. Вы создаете один из следующих магических эффектов в пределах дистанции:\n\nВы создаете мгновенный безвредный сенсорный эффект, такой как сноп искр, порыв ветра, тихую мелодию, или необычный запах. Вы мгновенно зажигаете или тушите свечу, факел или небольшой костер. Вы мгновенно чистите или мараете предмет, размерами не превышающий 1 кубического фута. Вы остужаете, нагреваете или придаете вкус 1 кубическому футу неживой материи на 1 час. Вы создаёте на поверхности или предмете цвет, метку или символ, существующую 1 час. Вы создаёте немагическую безделушку или иллюзорное изображение, помещающееся в вашу ладонь, и существующее до конца вашего следующего хода.\n\nЕсли вы накладываете это заклинание несколько раз, вы можете иметь не более трёх немгновенных эффектов одновременно. Вы можете действием окончить один из этих эффектов.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/91-prestidigitation/"
  },
  {
    "id": "414-shape-water",
    "name": "Формование воды",
    "nameEn": "Shape Water",
    "level": 0,
    "school": "Преобразование",
    "schoolEn": "Transmutation",
    "castingTime": "1 действие",
    "range": "30 футов",
    "components": {
      "v": false,
      "s": true,
      "m": "",
      "raw": "С"
    },
    "duration": "Мгновенная или 1 час",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Друид",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "XGE",
        "name": "Xanathar's Guide to Everything"
      },
      {
        "code": "POA",
        "name": "Princes of the Apocalypse"
      }
    ],
    "sourceBook": "Xanathar's Guide to Everything",
    "description": "Выберите область воды, которую вы видите в пределах дистанции, и которая помещается в куб с длиной ребра 5 футов. Вы можете управлять ей одним из нижеперечисленных способов:\n\nВы мгновенно перемещаете или иным образом изменяете течение воды до 5 футов в любом направлении. Этого воздействия недостаточно, чтобы причинить урон. Вы можете заставить воду принимать простые формы и двигаться согласно вашим указаниям. Этот эффект действует 1 час. Вы можете изменить цвет или прозрачность воды. Вся область воды должна быть одного цвета и прозрачности. Эффект действует 1 час. Вы замораживаете воду, если в ней нет никаких существ. Вода размораживается через 1 час.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/414-shape-water/"
  },
  {
    "id": "80-thaumaturgy",
    "name": "Чудотворство",
    "nameEn": "Thaumaturgy",
    "level": 0,
    "school": "Преобразование",
    "schoolEn": "Transmutation",
    "castingTime": "1 действие",
    "range": "30 футов",
    "components": {
      "v": true,
      "s": false,
      "m": "",
      "raw": "В"
    },
    "duration": "Вплоть до 1 минуты",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Жрец"
    ],
    "optionalClasses": [],
    "subclasses": [
      {
        "name": "наездник на дрейке",
        "class": "Следопыт",
        "raw": "наездник на дрейке (следопыт)"
      },
      {
        "name": "путь великана",
        "class": "Варвар",
        "raw": "путь великана (варвар)"
      }
    ],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы создаёте небольшое чудо, знак сверхъестественной силы. Вы создаёте один из следующих магических эффектов в пределах дистанции:\n\nВаш голос в течение 1 минуты звучит в три раза громче. Вы заставляете пламя в течение 1 минуты мерцать, светить ярче или тусклее, или изменять цвет. Вы вызываете безвредную дрожь в полу в течение 1 минуты. Вы создаёте мгновенный звук, исходящий из выбранной вами точки в пределах дистанции, такой как раскат грома, крик ворона или зловещий шёпот. Вы мгновенно заставляете незапертое окно или дверь распахнуться или захлопнуться. Вы на 1 минуту изменяете внешний вид своих глаз.\n\nЕсли вы накладываете это заклинание несколько раз, у вас может быть до трёх активных эффектов с длительностью в 1 минуту, и вы можете оканчивать такие эффекты действием.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/80-thaumaturgy/"
  },
  {
    "id": "415-gust",
    "name": "Шквал",
    "nameEn": "Gust",
    "level": 0,
    "school": "Преобразование",
    "schoolEn": "Transmutation",
    "castingTime": "1 действие",
    "range": "30 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Друид",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "XGE",
        "name": "Xanathar's Guide to Everything"
      },
      {
        "code": "POA",
        "name": "Princes of the Apocalypse"
      }
    ],
    "sourceBook": "Xanathar's Guide to Everything",
    "description": "Вы контролируете окружающий воздух и можете создать один из нижеперечисленных эффектов в точке, которую видите в пределах дистанции:\n\nОдно существо с размером не больше Среднего должно преуспеть в спасброске Силы, иначе его оттолкнёт на 5 футов от вас. Вы создаёте небольшой порыв ветра, способный переместить предмет, который никто не несёт и не носит, и который весит не более 5 фунтов. Объект толкается на расстояние до 10 футов от вас. Этого толчка недостаточно, чтобы причинить урон. Вы создаёте безвредный эффект с использованием воздуха, например заставляете листву шелестеть, ветром захлопнуть ставни или вашу одежду колыхаться на ветру.",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/415-gust/"
  },
  {
    "id": "66-shocking-grasp",
    "name": "Электрошок",
    "nameEn": "Shocking Grasp",
    "level": 0,
    "school": "Воплощение",
    "schoolEn": "Evocation",
    "castingTime": "1 действие",
    "range": "Касание",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Изобретатель",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Молния спрыгивает с вашей руки и ударяет существо, которого вы пытались коснуться. Совершите по цели рукопашную атаку заклинанием. Вы совершаете бросок атаки с преимуществом, если цель носит доспех из металла. При попадании цель получает 1к8 урона электричеством и до начала своего следующего хода не может совершать реакции.\n\nУрон заклинания увеличивается на 1к8, когда вы достигаете 5-го уровня (2к8), 11-го уровня (3к8) и 17-го уровня (4к8).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/66-shocking-grasp/"
  },
  {
    "id": "63-poison-spray",
    "name": "Ядовитые брызги",
    "nameEn": "Poison Spray",
    "level": 0,
    "school": "Вызов",
    "schoolEn": "Conjuration",
    "castingTime": "1 действие",
    "range": "10 футов",
    "components": {
      "v": true,
      "s": true,
      "m": "",
      "raw": "В, С"
    },
    "duration": "Мгновенная",
    "concentration": false,
    "ritual": false,
    "damage": "",
    "damageType": "",
    "save": "",
    "classes": [
      "Волшебник",
      "Друид",
      "Изобретатель",
      "Колдун",
      "Чародей"
    ],
    "optionalClasses": [],
    "subclasses": [],
    "sources": [
      {
        "code": "PH14",
        "name": "Player's Handbook"
      },
      {
        "code": "PH24",
        "name": "Player's Handbook 2024"
      }
    ],
    "sourceBook": "Player's Handbook",
    "description": "Вы простираете руку к существу, видимому в пределах дистанции, и выпускаете из ладони клубы токсичного газа. Это существо должно преуспеть в спасброске Телосложения, иначе оно получит урон ядом 1к12.\n\nУрон этого заклинания увеличивается на 1к12, когда вы достигаете 5-го уровня (2к12), 11-го уровня (3к12) и 17-го уровня (4к12).",
    "higherLevels": "",
    "dndsuUrl": "https://dnd.su/spells/63-poison-spray/"
  }
];
