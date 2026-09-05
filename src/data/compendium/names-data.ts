// D&D 5e Fantasy Name Generator Compendium
// Inspired by Long Story Short & D&D 5e authentic naming traditions.
// Provides roots, stems, translations, etymologies, and generator functions for 8 races.

export interface NameStem {
  root: string;
  meaning: string;
}

export interface SurnameData {
  surname: string;
  meaning: string;
}

export interface CultureLineageConfig {
  id: string;
  name: string;
  description: string;
  prefixes: NameStem[];
  maleSuffixes: NameStem[];
  femaleSuffixes: NameStem[];
  surnames: SurnameData[];
  virtueNames?: { name: string; meaning: string; gender: 'male' | 'female' | 'unisex' }[];
}

export interface FantasyRaceConfig {
  id: string;
  name: string;
  cultures: CultureLineageConfig[];
}

export interface FantasyNameResult {
  name: string;
  meaning: string;
  culture: string;
}

export const FANTASY_NAMES_DATABASE: FantasyRaceConfig[] = [
  // ── 1. Люди (Humans) ──
  {
    id: 'human',
    name: 'Человек',
    cultures: [
      {
        id: 'valley',
        name: 'Долина',
        description: 'Пасторальные равнины и речные долины. Славянско-европейские корни, светлые и природные мотивы.',
        prefixes: [
          { root: 'Яро', meaning: 'яркий, яростный свет' },
          { root: 'Радо', meaning: 'радостный, несущий счастье' },
          { root: 'Миро', meaning: 'мирный, ладный' },
          { root: 'Свято', meaning: 'священный, благословенный' },
          { root: 'Бори', meaning: 'борющийся за правду' },
          { root: 'Влад', meaning: 'владеющий землёй' },
          { root: 'Все', meaning: 'всеобъемлющий, великий' },
          { root: 'Добро', meaning: 'добросердечный, щедрый' },
          { root: 'Любо', meaning: 'любимый народом' },
          { root: 'Остро', meaning: 'зоркий, проницательный' },
          { root: 'Тихо', meaning: 'спокойный, рассудительный' },
          { root: 'Брани', meaning: 'защитник в брани' },
        ],
        maleSuffixes: [
          { root: 'мир', meaning: 'хранитель мира' },
          { root: 'слав', meaning: 'увенчанный славой' },
          { root: 'бор', meaning: 'стойкий борец' },
          { root: 'дан', meaning: 'дар богов' },
          { root: 'мил', meaning: 'милый сердцу' },
          { root: 'полк', meaning: 'предводитель дружины' },
          { root: 'мысл', meaning: 'глубокомысленный' },
        ],
        femaleSuffixes: [
          { root: 'мира', meaning: 'несущая покой' },
          { root: 'слава', meaning: 'вечная слава' },
          { root: 'мила', meaning: 'милая людям' },
          { root: 'лада', meaning: 'созидательница согласия' },
          { root: 'дана', meaning: 'дарованная небесами' },
          { root: 'яра', meaning: 'ярко сияющая' },
          { root: 'нега', meaning: 'нежная защитница' },
        ],
        surnames: [
          { surname: 'Дубравин', meaning: 'страж вековой дубравы' },
          { surname: 'Тиховод', meaning: 'живущий у спокойных вод' },
          { surname: 'Медовар', meaning: 'мастер янтарного мёда' },
          { surname: 'Ясенев', meaning: 'стойкий как ясень' },
          { surname: 'Коваль', meaning: 'потомственный кузнец' },
          { surname: 'Житницкий', meaning: 'хранитель золотого хлеба' },
          { surname: 'Ветров', meaning: 'вольный как вольный ветер' },
          { surname: 'Озёрный', meaning: 'рождённый у чистых вод' },
          { surname: 'Светлов', meaning: 'несущий ясный свет' },
        ],
      },
      {
        id: 'high',
        name: 'Нагорье',
        description: 'Суровые горные кланы, скалистые твердыни и кельтско-горные напевы.',
        prefixes: [
          { root: 'Бран', meaning: 'благородный ворон, страж вершин' },
          { root: 'Кен', meaning: 'рожденный от пламени скал' },
          { root: 'Гор', meaning: 'непоколебимая скала' },
          { root: 'Тор', meaning: 'громовой раскат' },
          { root: 'Ал', meaning: 'высокий, благородной крови' },
          { root: 'Дун', meaning: 'неприступная крепость' },
          { root: 'Мор', meaning: 'великий, необъятный' },
          { root: 'Финн', meaning: 'чистый, светлый луч' },
          { root: 'Ронан', meaning: 'верный скалам' },
          { root: 'Кормак', meaning: 'сын ворона' },
        ],
        maleSuffixes: [
          { root: 'гал', meaning: 'храбрый воин' },
          { root: 'вар', meaning: 'зоркий страж перевала' },
          { root: 'дон', meaning: 'владыка высот' },
          { root: 'рик', meaning: 'суровый вождь' },
          { root: 'мак', meaning: 'сын горных ветров' },
          { root: 'лох', meaning: 'дитя горных озёр' },
        ],
        femaleSuffixes: [
          { root: 'вен', meaning: 'белоснежная дева скал' },
          { root: 'гвен', meaning: 'благословенная утренним светом' },
          { root: 'ра', meaning: 'стремительная как горный ветер' },
          { root: 'дей', meaning: 'сияющий луч рассвета' },
          { root: 'нис', meaning: 'стойкая защитница' },
          { root: 'эна', meaning: 'пламенная духом' },
        ],
        surnames: [
          { surname: 'Мак-Грегор', meaning: 'сыны бдительного стража' },
          { surname: 'Скалолом', meaning: 'сокрушитель горных преград' },
          { surname: 'Мак-Финн', meaning: 'сыны светлого клана' },
          { surname: 'Буревестник', meaning: 'опережающий горную грозу' },
          { surname: 'Острозубец', meaning: 'владеющий верным клинком' },
          { surname: 'Мак-Дун', meaning: 'защитники каменной твердыни' },
          { surname: 'Камнегрив', meaning: 'гордый горец' },
        ],
      },
      {
        id: 'north',
        name: 'Фьорд / Север',
        description: 'Скандинавско-скальдические имена суровых мореходов, ледяных фьордов и рун.',
        prefixes: [
          { root: 'Рагн', meaning: 'судьба и воля богов' },
          { root: 'Сиг', meaning: 'триумф и победа' },
          { root: 'Бьёрн', meaning: 'могучий бурый медведь' },
          { root: 'Тор', meaning: 'молот громовержца' },
          { root: 'Ульф', meaning: 'свирепый волк метели' },
          { root: 'Инг', meaning: 'плодородный защитник' },
          { root: 'Эй', meaning: 'вечный как море' },
          { root: 'Хьял', meaning: 'сияющий шлем' },
          { root: 'Свен', meaning: 'юный и отважный' },
          { root: 'Лейф', meaning: 'наследник древней доблести' },
        ],
        maleSuffixes: [
          { root: 'вальд', meaning: 'могущественный владыка' },
          { root: 'мунд', meaning: 'рука защиты' },
          { root: 'стейн', meaning: 'нерушимый как скала' },
          { root: 'мар', meaning: 'прославленный скальдами' },
          { root: 'вард', meaning: 'хранитель морских рубежей' },
          { root: 'рик', meaning: 'властелин, конунг' },
        ],
        femaleSuffixes: [
          { root: 'хильд', meaning: 'неустрашимая дева битвы' },
          { root: 'рун', meaning: 'хранительница тайных рун' },
          { root: 'герд', meaning: 'неприступная ограда' },
          { root: 'дис', meaning: 'судьбоносная валькирия' },
          { root: 'фрид', meaning: 'мирная и прекрасная' },
          { root: 'вора', meaning: 'мудрая провидица' },
        ],
        surnames: [
          { surname: 'Железный Бок', meaning: 'непробиваемый в сече' },
          { surname: 'Змееглазый', meaning: 'обладающий пронзительным взором' },
          { surname: 'Бурерождённый', meaning: 'явившийся в штормовую ночь' },
          { surname: 'Секироруб', meaning: 'рассекающий щиты врагов' },
          { surname: 'Волчий Клык', meaning: 'не знающий пощады к врагам' },
          { surname: 'Синезубый', meaning: 'морской бродяга дальних волн' },
        ],
      },
    ],
  },

  // ── 2. Эльфы (Elves) ──
  {
    id: 'elf',
    name: 'Эльф',
    cultures: [
      {
        id: 'wood',
        name: 'Лесной эльф (Wood)',
        description: 'Древние кроны деревьев, быстрый лук, шепот листвы и единение с духами леса.',
        prefixes: [
          { root: 'Таур', meaning: 'древняя лесная чаща' },
          { root: 'Силв', meaning: 'шелестящая листва' },
          { root: 'Аэр', meaning: 'вольный лесной ветер' },
          { root: 'Каэл', meaning: 'быстроногий следопыт' },
          { root: 'Фэй', meaning: 'сокровенный дух природы' },
          { root: 'Ньял', meaning: 'зелёный росток' },
          { root: 'Белег', meaning: 'могучий лук' },
          { root: 'Луин', meaning: 'чистый лесной родник' },
          { root: 'Фин', meaning: 'гибкая лоза' },
        ],
        maleSuffixes: [
          { root: 'дир', meaning: 'зоркий охотник' },
          { root: 'вин', meaning: 'верный друг деревьев' },
          { root: 'лас', meaning: 'вечнозелёный лист' },
          { root: 'рон', meaning: 'древесный часовой' },
          { root: 'тор', meaning: 'защитник чащи' },
          { root: 'дан', meaning: 'быстрый следопыт' },
        ],
        femaleSuffixes: [
          { root: 'вен', meaning: 'дева ветвей' },
          { root: 'иэль', meaning: 'дочь лесных просторов' },
          { root: 'ра', meaning: 'песнь весеннего ручья' },
          { root: 'лисс', meaning: 'шепот трав под луной' },
          { root: 'ниэль', meaning: 'слеза утренней росы' },
        ],
        surnames: [
          { surname: 'Шепот Дубравы', meaning: 'слышащий голоса вековых стволов' },
          { surname: 'Быстрый Лист', meaning: 'скользящий сквозь кроны' },
          { surname: 'Зелёная Стрела', meaning: 'разящий без звука и промаха' },
          { surname: 'Ночной Ветрокрыл', meaning: 'свободный как сова в ночи' },
          { surname: 'Корнеплёт', meaning: 'неразрывно связанный с почвой' },
          { surname: 'Росяной Луч', meaning: 'сияющий на рассвете' },
        ],
      },
      {
        id: 'high',
        name: 'Высший эльф (Sun/Moon High)',
        description: 'Солнечные и Лунные благородные дома, звёздные свитки, кристальные башни и древняя магия.',
        prefixes: [
          { root: 'Аэлан', meaning: 'сияние чистого света' },
          { root: 'Келе', meaning: 'благородное серебро' },
          { root: 'Вал', meaning: 'величие древних магов' },
          { root: 'Элен', meaning: 'звёздная высь' },
          { root: 'Кори', meaning: 'золотой солнечный луч' },
          { root: 'Тел', meaning: 'высокородный венец' },
          { root: 'Мел', meaning: 'хранитель сокровенных тайн' },
          { root: 'Квен', meaning: 'мудрое изречение' },
          { root: 'Илл', meaning: 'чистая эфирная лазурь' },
        ],
        maleSuffixes: [
          { root: 'дор', meaning: 'дар созвездий' },
          { root: 'рион', meaning: 'обладатель звёздного венца' },
          { root: 'тис', meaning: 'великий чародей' },
          { root: 'мар', meaning: 'вечное пламя разума' },
          { root: 'нир', meaning: 'созидатель гармонии' },
          { root: 'эль', meaning: 'небесный вестник' },
        ],
        femaleSuffixes: [
          { root: 'иэль', meaning: 'дочь звёздного неба' },
          { root: 'лин', meaning: 'песнь хрустального света' },
          { root: 'астра', meaning: 'ослепительная вспышка светила' },
          { root: 'риэль', meaning: 'увенчанная сиянием' },
          { root: 'мия', meaning: 'небесная гармония сфер' },
        ],
        surnames: [
          { surname: 'Звёздный Венец', meaning: 'наследники древних архимагов' },
          { surname: 'Лунное Сияние', meaning: 'хранители серебряного зеркала' },
          { surname: 'Солнечное Копьё', meaning: 'несущие свет во тьму' },
          { surname: 'Хрустальный Клинок', meaning: 'чистый разум и безупречная форма' },
          { surname: 'Арканный Шёпот', meaning: 'знатоки плетения магических узоров' },
          { surname: 'Алмазная Заря', meaning: 'чистейшая кровь первородных' },
        ],
      },
      {
        id: 'dark',
        name: 'Тёмный эльф / Дроу (Dark)',
        description: 'Подземные своды Подземья, смертоносные яды, паучий шелк и холодное лезвие во тьме.',
        prefixes: [
          { root: 'Дриз', meaning: 'острый и стремительный клинок' },
          { root: 'Зак', meaning: 'неслышный шаг в темноте' },
          { root: 'Вьер', meaning: 'прочный паучий шёлк' },
          { root: 'Наль', meaning: 'тень бездонного провала' },
          { root: 'Кир', meaning: 'холодная закалённая сталь' },
          { root: 'Мал', meaning: 'коварство полуночи' },
          { root: 'Илл', meaning: 'безлунный мрак пещер' },
          { root: 'Фэрун', meaning: 'тайный яд подземных грибов' },
        ],
        maleSuffixes: [
          { root: 'нафейн', meaning: 'верный слуга дома' },
          { root: 'рим', meaning: 'смертоносный кинжал' },
          { root: 'мир', meaning: 'повелитель подземных сводов' },
          { root: 'ор', meaning: 'охотник глубоких глубин' },
          { root: 'дир', meaning: 'хладнокровный лазутчик' },
        ],
        femaleSuffixes: [
          { root: 'ира', meaning: 'верховная жрица паутины' },
          { root: 'вис', meaning: 'ткачиха чужих судеб' },
          { root: 'зрет', meaning: 'жалящая в самое сердце' },
          { root: 'ра', meaning: 'властная матрона дома' },
          { root: 'нель', meaning: 'ночная мстительница' },
        ],
        surnames: [
          { surname: "До'Урден", meaning: 'ходящие по кромке бездны' },
          { surname: 'Бэнр', meaning: 'первый благородный дом паучьей владычицы' },
          { surname: 'Фэ-Тир', meaning: 'дом ядовитого скорпиона' },
          { surname: 'Облодра', meaning: 'мастера ментального раскола' },
          { surname: "Аркен'дель", meaning: 'стражи подземного лабиринта' },
          { surname: 'Тенепряд', meaning: 'плетущие заговоры в темноте' },
        ],
      },
    ],
  },

  // ── 3. Дварфы (Dwarves) ──
  {
    id: 'dwarf',
    name: 'Дварф',
    cultures: [
      {
        id: 'hill',
        name: 'Холмовой дварф (Hill)',
        description: 'Тёплые очаги, золотистый эль, медные рудники, стойкость духа и радушие крепкого дома.',
        prefixes: [
          { root: 'Балин', meaning: 'верный друг очага' },
          { root: 'Дан', meaning: 'несокрушимый земляной вал' },
          { root: 'Корин', meaning: 'звонкая медная жила' },
          { root: 'Гло', meaning: 'золотой блеск монеты' },
          { root: 'Бру', meaning: 'хмельной кружечный эль' },
          { root: 'Фар', meaning: 'крепкая дубовая бочка' },
          { root: 'Орин', meaning: 'мудрый советчик старейшин' },
          { root: 'Тра', meaning: 'терпеливый труженик' },
        ],
        maleSuffixes: [
          { root: 'гар', meaning: 'страж родового очага' },
          { root: 'рик', meaning: 'кузнец наковальни' },
          { root: 'дин', meaning: 'защитник границ клана' },
          { root: 'бор', meaning: 'стойкий сын холмов' },
          { root: 'мир', meaning: 'ценитель доброй беседы' },
        ],
        femaleSuffixes: [
          { root: 'дис', meaning: 'мудрая хозяйка очага' },
          { root: 'на', meaning: 'чистейшая рудная жила' },
          { root: 'ра', meaning: 'несущая достаток и тепло' },
          { root: 'хильд', meaning: 'доблестная защитница семьи' },
          { root: 'лин', meaning: 'сладкозвучная звонкая медь' },
        ],
        surnames: [
          { surname: 'Медовар', meaning: 'создатели лучшего пенного напитка' },
          { surname: 'Меднощит', meaning: 'чьи щиты не знают ржавчины' },
          { surname: 'Златодрев', meaning: 'укоренённые в изобилии холмов' },
          { surname: 'Холмобой', meaning: 'отбросившие врагов от холмов' },
          { surname: 'Румянощек', meaning: 'славные своим гостеприимством' },
          { surname: 'Крепкохмель', meaning: 'мастера крепких настоев' },
        ],
      },
      {
        id: 'mountain',
        name: 'Горный дварф (Mountain)',
        description: 'Глубинный гранит, адамантиновая сталь, удары рунных молотов и неприступные горные цитадели.',
        prefixes: [
          { root: 'Кхаз', meaning: 'толща гранитного монолита' },
          { root: 'Грим', meaning: 'непоколебимый как утёс' },
          { root: 'Тор', meaning: 'тяжёлый рунный молот' },
          { root: 'Барак', meaning: 'неистовый боевой топор' },
          { root: 'Дор', meaning: 'стальной кулак подземелий' },
          { root: 'Рун', meaning: 'священный знак предков' },
          { root: 'Морг', meaning: 'глубокий подземный разлом' },
          { root: 'Вульф', meaning: 'охотник на пещерных чудовищ' },
        ],
        maleSuffixes: [
          { root: 'дур', meaning: 'нерушимый страж цитадели' },
          { root: 'гор', meaning: 'сокрушитель камня и шлемов' },
          { root: 'грим', meaning: 'железнобокий воин' },
          { root: 'даг', meaning: 'рубящее остриё' },
          { root: 'рек', meaning: 'хранитель древних кладов' },
        ],
        femaleSuffixes: [
          { root: 'грима', meaning: 'нерушимая как хребет' },
          { root: 'руна', meaning: 'читающая письмена титанов' },
          { root: 'варда', meaning: 'стражница алмазных сокровищниц' },
          { root: 'даг', meaning: 'разящая калёной сталью' },
          { root: 'эльда', meaning: 'мудрая мать горного чертога' },
        ],
        surnames: [
          { surname: 'Железностоп', meaning: 'не отступающие ни на пядь' },
          { surname: 'Камнеруб', meaning: 'высекающие крепости из камня' },
          { surname: 'Гранитолом', meaning: 'пробивающие ходы сквозь недра' },
          { surname: 'Молотобоец', meaning: 'кующие легендарное оружие' },
          { surname: 'Драконобой', meaning: 'повергшие древнего чешуйчатого змея' },
          { surname: 'Адамантин', meaning: 'несокрушимый род рудознатцев' },
        ],
      },
    ],
  },

  // ── 4. Гномы (Gnomes) ──
  {
    id: 'gnome',
    name: 'Гном',
    cultures: [
      {
        id: 'tinker',
        name: 'Скальный изобретатель (Rock / Tinker)',
        description: 'Изобретатели, часовщики, алхимики, огранщики самоцветов и мастера озорных иллюзий.',
        prefixes: [
          { root: 'Бим', meaning: 'шустрый и проворный' },
          { root: 'Тик', meaning: 'мастер тикающих шестерёнок' },
          { root: 'Фин', meaning: 'блеск огранённого самоцвета' },
          { root: 'Ник', meaning: 'находчивый и остроумный' },
          { root: 'Зин', meaning: 'яркая искра в реторте' },
          { root: 'Фод', meaning: 'любознательный естествоиспытатель' },
          { root: 'Дим', meaning: 'тончайший резец гравировщика' },
          { root: 'Вош', meaning: 'неутомимый паровой поршень' },
          { root: 'Клик', meaning: 'точный щелчок часового механизма' },
        ],
        maleSuffixes: [
          { root: 'вик', meaning: 'гениальный изобретатель' },
          { root: 'би', meaning: 'мастер малых механизмов' },
          { root: 'покет', meaning: 'обладатель ста карманов' },
          { root: 'болт', meaning: 'быстрый как пружинный болтик' },
          { root: 'ринк', meaning: 'звонкий колокольчик вдохновения' },
          { root: 'надель', meaning: 'ювелир тончайшей работы' },
        ],
        femaleSuffixes: [
          { root: 'лина', meaning: 'яркая вспышка озарения' },
          { root: 'ни', meaning: 'шепчущая самоцветам тайны' },
          { root: 'вика', meaning: 'чаровница сложных приборов' },
          { root: 'ми', meaning: 'весёлый искрящийся ручеёк' },
          { root: 'белла', meaning: 'изящная как часовой механизм' },
        ],
        surnames: [
          { surname: 'Искрокрут', meaning: 'изобретатель вращающейся динамо-машины' },
          { surname: 'Часодел', meaning: 'знающий тайну вечного хронометра' },
          { surname: 'Алмазник', meaning: 'гранящий камни с идеальной симметрией' },
          { surname: 'Медношестерён', meaning: 'оживляющий металл сложными шестернями' },
          { surname: 'Пружиноскок', meaning: 'автор прыгучих сапог-пружин' },
          { surname: 'Колбовар', meaning: 'создатель светящихся эликсиров' },
          { surname: 'Паровик', meaning: 'укротитель горячего давления пара' },
        ],
      },
    ],
  },

  // ── 5. Полурослики (Halflings) ──
  {
    id: 'halfling',
    name: 'Полурослик',
    cultures: [
      {
        id: 'lightfoot',
        name: 'Легконогий / Уютный (Lightfoot)',
        description: 'Уютные норы под холмами, горячий чай с пирогами, верная дружба и поразительная скрытая удача.',
        prefixes: [
          { root: 'Мило', meaning: 'милый и добрый сосед' },
          { root: 'Алдо', meaning: 'мудрый старый друг' },
          { root: 'Кор', meaning: 'теплый домашний очаг' },
          { root: 'Пер', meaning: 'сладкая спелая груша' },
          { root: 'Боб', meaning: 'крепкий лесной орешек' },
          { root: 'Сэм', meaning: 'верный спутник во всяком походе' },
          { root: 'Розо', meaning: 'пышно цветущий палисадник' },
          { root: 'Мери', meaning: 'неунывающий весельчак' },
          { root: 'Дин', meaning: 'уютная низина у холма' },
          { root: 'Бан', meaning: 'ароматная булочка с корицей' },
        ],
        maleSuffixes: [
          { root: 'до', meaning: 'отважный путешественник к столу' },
          { root: 'вин', meaning: 'добродушный и щедрый хозяин' },
          { root: 'рин', meaning: 'счастливчик, находящий сокровища' },
          { root: 'би', meaning: 'хранитель семейного уюта' },
          { root: 'тон', meaning: 'житель тихой деревушки' },
        ],
        femaleSuffixes: [
          { root: 'линн', meaning: 'нежная улыбка рассвета' },
          { root: 'белла', meaning: 'румяная как спелое яблоко' },
          { root: 'майя', meaning: 'свежая как утренняя роса' },
          { root: 'роза', meaning: 'благоухающая чайная роза' },
          { root: 'кет', meaning: 'ловкая хозяюшка кладовых' },
        ],
        surnames: [
          { surname: 'Подхолмов', meaning: 'чей дом вырыт в самом зеленом холме' },
          { surname: 'Чайнолист', meaning: 'знаток лучших сортов вечернего чая' },
          { surname: 'Добролап', meaning: 'шагающий мягко и совершенно неслышно' },
          { surname: 'Зеленорукав', meaning: 'выращивающий рекордные тыквы' },
          { surname: 'Пирогов', meaning: 'мастер яблочных и черничных пирогов' },
          { surname: 'Быстроход', meaning: 'первым успевающий к праздничному столу' },
          { surname: 'Счастливчик', meaning: 'обходящий стороной любые беды' },
        ],
      },
    ],
  },

  // ── 6. Орки (Orcs) ──
  {
    id: 'orc',
    name: 'Орк',
    cultures: [
      {
        id: 'warband',
        name: 'Орда / Степной клан',
        description: 'Грохот боевых барабанов, сокрушительные клыки, ярость берсерка и слава прародителя Груумша.',
        prefixes: [
          { root: 'Гром', meaning: 'раскат сокрушающего грома' },
          { root: 'Гар', meaning: 'острый кабаний клык' },
          { root: 'Дрек', meaning: 'дробитель вражеских костей' },
          { root: 'Мор', meaning: 'яростная ночная засада' },
          { root: 'Круш', meaning: 'тяжелая стальная булава' },
          { root: 'Шаг', meaning: 'неумолимый шаг берсерка' },
          { root: 'Тар', meaning: 'боевой клич орды' },
          { root: 'Ур', meaning: 'первобытная ярость степей' },
          { root: 'Наз', meaning: 'разрывающий сталь коготь' },
          { root: 'Вол', meaning: 'неукротимый дикий тур' },
        ],
        maleSuffixes: [
          { root: 'гор', meaning: 'сокрушитель чудовищ' },
          { root: 'маш', meaning: 'разбивающий вражеские черепа' },
          { root: 'торок', meaning: 'несокрушимый железный клык' },
          { root: 'дак', meaning: 'первым врубающийся в сечу' },
          { root: 'гаш', meaning: 'огненный шквал сечи' },
          { root: 'баг', meaning: 'не знающий страха и боли' },
        ],
        femaleSuffixes: [
          { root: 'ра', meaning: 'неукротимая волчица стаи' },
          { root: 'гра', meaning: 'неистовая воительница клана' },
          { root: 'маг', meaning: 'хранительница шаманских костей' },
          { root: 'ша', meaning: 'боевой вопль, сеющий панику' },
          { root: 'ди', meaning: 'разящая без тени сомнения' },
        ],
        surnames: [
          { surname: 'Кровавый Топор', meaning: 'чей топор никогда не остывает' },
          { surname: 'Черепокол', meaning: 'раскалывающий шлемы с одного взмаха' },
          { surname: 'Железный Клык', meaning: 'выдерживающий лобовой удар копья' },
          { surname: 'Громогласный', meaning: 'чей рев обращает полки в паническое бегство' },
          { surname: 'Несущий Бурю', meaning: 'сметающий сомнения и препятствия' },
          { surname: 'Око Бездны', meaning: 'не смыкающий глаз в ночном дозоре' },
        ],
      },
    ],
  },

  // ── 7. Драконорождённые (Dragonborn) ──
  {
    id: 'dragonborn',
    name: 'Драконорождённый',
    cultures: [
      {
        id: 'clan',
        name: 'Драконий клан / Чешуя чести',
        description: 'Древнее наследие истинных драконов, первородное дыхание стихий, строгий кодекс чести и гордость клана.',
        prefixes: [
          { root: 'Архан', meaning: 'дыхание первородного пламени' },
          { root: 'Балаш', meaning: 'блеск императорской золотой чешуи' },
          { root: 'Мед', meaning: 'раскатистый громовой рык титана' },
          { root: 'Дхар', meaning: 'алмазно-твердый коготь дракона' },
          { root: 'Клеш', meaning: 'пепельный вихрь выжженных равнин' },
          { root: 'Тор', meaning: 'наследник величия предков-драконов' },
          { root: 'Патр', meaning: 'несокрушимый хребет скалы' },
          { root: 'Раш', meaning: 'ослепляющая дуга молнии' },
          { root: 'Вер', meaning: 'изумрудное едкое дыхание' },
          { root: 'Гор', meaning: 'пылающее сердце вулкана' },
        ],
        maleSuffixes: [
          { root: 'азар', meaning: 'несущий древние крылья возмездия' },
          { root: 'раш', meaning: 'разящий дыханием первостихий' },
          { root: 'кор', meaning: 'вечный защитник чести рода' },
          { root: 'икс', meaning: 'повелитель огненного шторма' },
          { root: 'мир', meaning: 'гордый вождь драконьей стаи' },
          { root: 'дан', meaning: 'клинок, закалённый в магме' },
        ],
        femaleSuffixes: [
          { root: 'хис', meaning: 'священное мистическое пламя' },
          { root: 'рис', meaning: 'всевидящее янтарное око драконицы' },
          { root: 'дриса', meaning: 'буря сверкающей чешуи' },
          { root: 'ра', meaning: 'гордая хранительница драконьей крови' },
          { root: 'найя', meaning: 'лазурное сияние ледяного дыхания' },
        ],
        surnames: [
          { surname: 'Кериндар', meaning: 'хранители первородного пламени предков' },
          { surname: 'Нерданаш', meaning: 'несущие щиты из драконьей чешуи' },
          { surname: 'Даакар', meaning: 'род полуденного золотого солнца' },
          { surname: 'Вертихан', meaning: 'повелители грозовых перевалов' },
          { surname: 'Миррасис', meaning: 'чистая кровь платинового дракона' },
          { surname: 'Трахандар', meaning: 'несокрушимые воины клыка и когтя' },
        ],
      },
    ],
  },

  // ── 8. Тифлинги (Tieflings) ──
  {
    id: 'tiefling',
    name: 'Тифлинг',
    cultures: [
      {
        id: 'infernal',
        name: 'Инфернальное наследие',
        description: 'Древний пакт с нижними планами, серное пламя, изогнутые рога и гордое сопротивление судьбе.',
        prefixes: [
          { root: 'Аз', meaning: 'пепел подземного инферно' },
          { root: 'Мал', meaning: 'тёмное пожирающее пламя' },
          { root: 'Бел', meaning: 'древний инфернальный пакт' },
          { root: 'Заг', meaning: 'ночной шёпот забытых глубин' },
          { root: 'Мор', meaning: 'холодное адское пламя' },
          { root: 'Калл', meaning: 'алый изогнутый рог' },
          { root: 'Ксап', meaning: 'лукавая ухмылка полуночи' },
          { root: 'Леви', meaning: 'повелитель тёмных течений' },
          { root: 'Меф', meaning: 'серный ядовитый туман' },
        ],
        maleSuffixes: [
          { root: 'мод', meaning: 'князь серного пламени' },
          { root: 'иал', meaning: 'вихрь неистовых искр' },
          { root: 'каир', meaning: 'несломленный гордый дух' },
          { root: 'ос', meaning: 'огненный шёпот возмездия' },
          { root: 'рон', meaning: 'хранитель тайного договора' },
        ],
        femaleSuffixes: [
          { root: 'иса', meaning: 'владычица ночных теней' },
          { root: 'лилит', meaning: 'полуночный соблазн и тайна' },
          { root: 'риэль', meaning: 'пепельный цветок бездны' },
          { root: 'мея', meaning: 'пронзительный инфернальный взор' },
          { root: 'ния', meaning: 'неугасающая искра преисподней' },
        ],
        surnames: [
          { surname: 'Пепельный', meaning: 'прошедший сквозь адское пламя' },
          { surname: 'Тенеплёт', meaning: 'ткущий мороки из полумрака' },
          { surname: 'Багряный', meaning: 'гордящийся цветом своей крови' },
          { surname: 'Безмолвный', meaning: 'не выдающий тайн своего рода' },
          { surname: 'Огнеглазый', meaning: 'в чьих глазах горит пламя преисподней' },
          { surname: 'Искрокрыл', meaning: 'опережающий серную вспышку' },
        ],
      },
      {
        id: 'virtue',
        name: 'Имена-добродетели (Virtue Names)',
        description: 'Традиция тифлингов брать имена понятий или идеалов, выражающих их призвание или жизненный ориентир.',
        prefixes: [],
        maleSuffixes: [],
        femaleSuffixes: [],
        surnames: [
          { surname: 'Странник', meaning: 'ищущий истинный дом среди звёзд' },
          { surname: 'Хранитель', meaning: 'оберегающий тех, кто слаб' },
          { surname: 'Искатель', meaning: 'жаждущий ответа на великие вопросы' },
          { surname: 'Отрешённый', meaning: 'возвысившийся над злобой толпы' },
        ],
        virtueNames: [
          { name: 'Отвага', meaning: 'Олицетворение несгибаемой доблести перед лицом предрассудков', gender: 'unisex' },
          { name: 'Тайна', meaning: 'Хранитель сокровенных знаний и непроницаемых секретов', gender: 'unisex' },
          { name: 'Скорбь', meaning: 'Память о потерях и очищающая сила пережитого страдания', gender: 'male' },
          { name: 'Надежда', meaning: 'Свет во тьме, ведущий сквозь любые невзгоды и шторма', gender: 'female' },
          { name: 'Рубеж', meaning: 'Стоящий на границе между светом и бездной защитник', gender: 'male' },
          { name: 'Факел', meaning: 'Освещающий путь другим во мраке неизвестности', gender: 'male' },
          { name: 'Поиск', meaning: 'Вечный странник, ищущий свою истинную судьбу', gender: 'male' },
          { name: 'Крепость', meaning: 'Непоколебимая опора для всех отверженных', gender: 'male' },
          { name: 'Безмятежность', meaning: 'Спокойствие чистой воды посреди адского шторма', gender: 'female' },
          { name: 'Музыка', meaning: 'Гармония, преображающая хаос в прекрасную песнь жизни', gender: 'female' },
          { name: 'Поэзия', meaning: 'Красота слога, способная смягчить черствые сердца', gender: 'female' },
          { name: 'Милость', meaning: 'Великодушие сильного духом к поверженным врагам', gender: 'female' },
          { name: 'Искра', meaning: 'Малое пламя, способное разжечь костёр надежды', gender: 'female' },
          { name: 'Свобода', meaning: 'Сброшенные оковы рока, предначертания и крови', gender: 'unisex' },
          { name: 'Заря', meaning: 'Обещание нового дня после самой долгой ночи', gender: 'female' },
          { name: 'Вера', meaning: 'Непоколебимая убежденность в справедливости своего пути', gender: 'female' },
          { name: 'Терпение', meaning: 'Сдержанность гранита, выдерживающего тысячелетия', gender: 'unisex' },
          { name: 'Бездна', meaning: 'Не знающий страха перед тайнами глубин мироздания', gender: 'male' },
        ],
      },
    ],
  },
];

/**
 * Normalizes user-provided race string into matching database race ID.
 */
export function normalizeRaceKey(race: string): string {
  const r = (race || '').toLowerCase().trim();
  if (r.includes('человек') || r.includes('люди') || r.includes('human')) return 'human';
  if (r.includes('эльф') || r.includes('дров') || r.includes('дроу') || r.includes('elf')) return 'elf';
  if (r.includes('дварф') || r.includes('дворф') || r.includes('карлик') || r.includes('dwarf')) return 'dwarf';
  if (r.includes('гном') || r.includes('gnome')) return 'gnome';
  if (r.includes('полуросл') || r.includes('хоббит') || r.includes('halfling')) return 'halfling';
  if (r.includes('орк') || r.includes('полуорк') || r.includes('orc')) return 'orc';
  if (r.includes('дракон') || r.includes('драконорожд') || r.includes('dragonborn')) return 'dragonborn';
  if (r.includes('тифлинг') || r.includes('инфернал') || r.includes('tiefling')) return 'tiefling';
  return 'human';
}

/**
 * Returns available cultures for a given race.
 */
export function getAvailableCultures(raceKeyOrName: string): CultureLineageConfig[] {
  const key = normalizeRaceKey(raceKeyOrName);
  const found = FANTASY_NAMES_DATABASE.find(r => r.id === key);
  return found ? found.cultures : FANTASY_NAMES_DATABASE[0].cultures;
}

/**
 * Capitalizes string nicely for Russian names.
 */
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Random element selector.
 */
function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates an authentic fantasy name with full meaning and culture breakdown.
 *
 * @param race Race name in Russian or English (e.g. "Человек", "human", "Эльф")
 * @param gender 'male' | 'female' | 'any'
 * @param specificCulture Optional culture/lineage ID or name (e.g. "valley", "wood", "Долина")
 */
export function generateFantasyName(
  race: string,
  gender: 'male' | 'female' | 'any' = 'any',
  specificCulture?: string
): FantasyNameResult {
  const raceKey = normalizeRaceKey(race);
  const raceData = FANTASY_NAMES_DATABASE.find(r => r.id === raceKey) || FANTASY_NAMES_DATABASE[0];

  // Pick culture
  let culture = raceData.cultures[0];
  if (specificCulture) {
    const matched = raceData.cultures.find(
      c => c.id.toLowerCase() === specificCulture.toLowerCase() ||
           c.name.toLowerCase().includes(specificCulture.toLowerCase())
    );
    if (matched) culture = matched;
  } else {
    culture = sample(raceData.cultures);
  }

  // Resolve gender
  const actualGender: 'male' | 'female' = gender === 'any'
    ? (Math.random() > 0.5 ? 'male' : 'female')
    : gender;

  // Special handling for Tiefling Virtue Names
  if (culture.id === 'virtue' && culture.virtueNames && culture.virtueNames.length > 0) {
    const eligibleVirtues = culture.virtueNames.filter(
      v => v.gender === 'unisex' || v.gender === actualGender
    );
    const chosenVirtue = sample(eligibleVirtues.length > 0 ? eligibleVirtues : culture.virtueNames);
    const surname = sample(culture.surnames);

    return {
      name: `${chosenVirtue.name} ${surname.surname}`,
      meaning: `Имя-добродетель: «${chosenVirtue.name}» (${chosenVirtue.meaning}). Прозвание: ${surname.surname} (${surname.meaning}).`,
      culture: `${raceData.name} (${culture.name})`
    };
  }

  // Generate standard prefix + suffix + surname
  const prefixObj = sample(culture.prefixes.length > 0 ? culture.prefixes : [{ root: 'Радо', meaning: 'радостный' }]);
  const suffixList = actualGender === 'female' ? culture.femaleSuffixes : culture.maleSuffixes;
  const suffixObj = sample(suffixList.length > 0 ? suffixList : [{ root: 'мир', meaning: 'хранитель мира' }]);
  const surnameObj = sample(culture.surnames.length > 0 ? culture.surnames : [{ surname: 'Дубравин', meaning: 'страж вековой дубравы' }]);

  // Harmonize first name
  let firstName = `${prefixObj.root}${suffixObj.root}`;
  // Avoid awkward triple identical letters or double hyphens
  firstName = capitalize(firstName);

  // Synthesize harmonious translation
  const firstNameMeaning = `«${prefixObj.meaning}» + «${suffixObj.meaning}»`;
  const surnameMeaning = `Клан/Прозвание: ${surnameObj.surname} («${surnameObj.meaning}»)`;

  return {
    name: `${firstName} ${surnameObj.surname}`,
    meaning: `${prefixObj.root} + ${suffixObj.root}: ${firstNameMeaning}. ${surnameMeaning}.`,
    culture: `${raceData.name} (${culture.name})`
  };
}

/**
 * Generates a batch of multiple unique fantasy names.
 */
export function generateMultipleFantasyNames(
  race: string,
  gender: 'male' | 'female' | 'any' = 'any',
  count: number = 4,
  specificCulture?: string
): FantasyNameResult[] {
  const results: FantasyNameResult[] = [];
  const seenNames = new Set<string>();

  for (let i = 0; i < count * 3 && results.length < count; i++) {
    const candidate = generateFantasyName(race, gender, specificCulture);
    if (!seenNames.has(candidate.name)) {
      seenNames.add(candidate.name);
      results.push(candidate);
    }
  }

  return results;
}
