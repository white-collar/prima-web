// Short theory and formulas for each screen, shown in the "?" popover.
// Formulas are language-neutral; the explanation is given in EN / RU / UK.
window.PRIMA = window.PRIMA || {};

PRIMA.HELP = {
  radii: {
    formula: [
      "V² = 1 + e′²·cos²B,   c = a²/b",
      "N = c / V        M = c / V³",
      "R = √(M·N)       rB = N·cosB",
    ],
    en: "The curvature of the ellipsoid at a point depends on the direction. Its extreme values are the radius of the meridian section M and the radius of the prime vertical N (the section perpendicular to the meridian). Their geometric mean R is the mean (Gaussian) radius of curvature, and rB is the radius of the parallel through the point.",
    ru: "Кривизна эллипсоида в точке зависит от направления. Её крайние значения — радиус меридианного сечения M и радиус сечения первого вертикала N (перпендикулярного меридиану). Их среднее геометрическое R — средний (гауссов) радиус кривизны, а rB — радиус параллели, проходящей через точку.",
    uk: "Кривина еліпсоїда в точці залежить від напрямку. Її крайні значення — радіус меридіанного перерізу M і радіус перерізу першого вертикала N (перпендикулярного до меридіана). Їхнє середнє геометричне R — середній (гауссів) радіус кривини, а rB — радіус паралелі, що проходить через точку.",
  },
  ra: {
    formula: [
      "1 / RA = cos²A / M + sin²A / N",
      "RA = M·N / (N·cos²A + M·sin²A)",
    ],
    en: "Euler's theorem gives the radius of curvature of a normal section with any azimuth A. It changes smoothly from M in the meridian (A = 0°) to N in the prime vertical (A = 90°).",
    ru: "Теорема Эйлера даёт радиус кривизны нормального сечения с произвольным азимутом A. Он плавно меняется от M в меридиане (A = 0°) до N в первом вертикале (A = 90°).",
    uk: "Теорема Ейлера дає радіус кривини нормального перерізу з довільним азимутом A. Він плавно змінюється від M у меридіані (A = 0°) до N у першому вертикалі (A = 90°).",
  },
  meridian: {
    formula: [
      "Bm = (B1 + B2) / 2",
      "Sm = M(Bm) · |B2 − B1|",
    ],
    en: "The length of a meridian arc between latitudes B1 and B2. As in the original program, the arc is treated as a circle with the meridian radius at the mean latitude. This is accurate for arcs of up to 1–2°; longer arcs need the full series for the meridian length X(B).",
    ru: "Длина дуги меридиана между широтами B1 и B2. Как и в исходной программе, дуга считается дугой окружности с радиусом меридианного сечения на средней широте. Это точно для дуг до 1–2°; для длинных дуг нужен полный ряд для длины меридиана X(B).",
    uk: "Довжина дуги меридіана між широтами B1 і B2. Як і в оригінальній програмі, дуга вважається дугою кола з радіусом меридіанного перерізу на середній широті. Це точно для дуг до 1–2°; для довгих дуг потрібен повний ряд для довжини меридіана X(B).",
  },
  parallel: {
    formula: [
      "r = N · cosB",
      "Sп = N · cosB · ΔL",
    ],
    en: "A parallel is a circle of radius r = N·cosB, so the length of its arc is simply the radius multiplied by the longitude difference. The formula is exact for any ΔL.",
    ru: "Параллель — окружность радиуса r = N·cosB, поэтому длина её дуги равна радиусу, умноженному на разность долгот. Формула точна при любой ΔL.",
    uk: "Паралель — коло радіуса r = N·cosB, тому довжина її дуги дорівнює радіусу, помноженому на різницю довгот. Формула точна для будь-якої ΔL.",
  },
  frames: {
    formula: [
      "c  = M(Bm) · ΔB · 100 / m",
      "a2 = N(B2) · cosB2 · Δl · 100 / m",
      "a1 = N(B1) · cosB1 · Δl · 100 / m",
    ],
    en: "A survey trapezoid (map sheet) is bounded by two parallels and two meridians. These are the lengths of its sides on paper at scale 1 : m: c is the western and eastern (meridian) side, a2 the northern side and a1 the southern side. The northern side is shorter because parallels shrink towards the pole.",
    ru: "Съёмочная трапеция (лист карты) ограничена двумя параллелями и двумя меридианами. Здесь вычисляются длины её сторон на бумаге в масштабе 1 : m: c — западная и восточная (меридианные) стороны, a2 — северная, a1 — южная. Северная сторона короче, потому что параллели уменьшаются к полюсу.",
    uk: "Знімальна трапеція (аркуш карти) обмежена двома паралелями і двома меридіанами. Тут обчислюються довжини її сторін на папері в масштабі 1 : m: c — західна і східна (меридіанні) сторони, a2 — північна, a1 — південна. Північна сторона коротша, бо паралелі зменшуються до полюса.",
  },
  area: {
    formula: [
      "F(B) = sinB + ⅔e²·sin³B + ⅗e⁴·sin⁵B",
      "P = b² · Δl · ( F(B2) − F(B1) )",
    ],
    en: "The area of a trapezoid on the ellipsoid bounded by the parallels B1, B2 and the meridians L1, L2. It is the integral of the area element M·N·cosB·dB·dl, expanded in a series in e². The result is in square kilometres.",
    ru: "Площадь трапеции на эллипсоиде, ограниченной параллелями B1, B2 и меридианами L1, L2. Это интеграл элемента площади M·N·cosB·dB·dl, разложенный в ряд по e². Результат — в квадратных километрах.",
    uk: "Площа трапеції на еліпсоїді, обмеженої паралелями B1, B2 і меридіанами L1, L2. Це інтеграл елемента площі M·N·cosB·dB·dl, розкладений у ряд за e². Результат — у квадратних кілометрах.",
  },
  schreiber: {
    formula: [
      "u = S·cosA12 / N1      v = S·sinA12 / N1",
      "ΔB = V1²·Δφ·(1 − ¾e′²·sin2B1·Δφ − ½e′²·cos2B1·Δφ²)",
      "A21 = A12 ± 180° + ΔA",
    ],
    en: "The direct geodetic problem: from point 1, the azimuth A12 and the distance S, find point 2 and the reverse azimuth A21. Schreiber's method first solves the triangle on an auxiliary sphere of radius N1 using series in u and v, then converts the latitude difference to the ellipsoid. It suits lines of up to a few hundred kilometres.",
    ru: "Прямая геодезическая задача: по точке 1, азимуту A12 и расстоянию S найти точку 2 и обратный азимут A21. Способ Шрейбера сначала решает треугольник на вспомогательной сфере радиуса N1 с помощью рядов по u и v, а затем переносит разность широт на эллипсоид. Подходит для линий до нескольких сотен километров.",
    uk: "Пряма геодезична задача: за точкою 1, азимутом A12 і відстанню S знайти точку 2 та обернений азимут A21. Спосіб Шрейбера спочатку розв'язує трикутник на допоміжній сфері радіуса N1 за допомогою рядів за u і v, а потім переносить різницю широт на еліпсоїд. Підходить для ліній до кількох сотень кілометрів.",
  },
  rkm: {
    formula: [
      "dB/ds = cosA · V³ / c",
      "dL/ds = sinA · V / (c · cosB)",
      "dA/ds = sinB · dL/ds",
    ],
    en: "The same direct problem solved numerically: the differential equations of the geodesic are integrated along the line with Merson's five-stage Runge–Kutta method. As in the original program, one step covers the whole line.",
    ru: "Та же прямая задача, решённая численно: дифференциальные уравнения геодезической линии интегрируются вдоль линии пятиэтапным методом Рунге–Кутта–Мерсона. Как и в исходной программе, вся линия проходится за один шаг.",
    uk: "Та сама пряма задача, розв'язана чисельно: диференціальні рівняння геодезичної лінії інтегруються вздовж лінії п'ятиетапним методом Рунге–Кутта–Мерсона. Як і в оригінальній програмі, вся лінія проходиться за один крок.",
  },
  inverse: {
    formula: [
      "b = B2 − B1,   l = L2 − L1,   Bm = (B1 + B2) / 2",
      "S·cosAm = P(b, l, Bm)      S·sinAm = Q(b, l, Bm)",
      "A12 = Am − ΔA/2      A21 = Am + ΔA/2 ± 180°",
    ],
    en: "The inverse geodetic problem: from two points, find the distance S and the azimuths A12 and A21. Gauss's mid-latitude formulas expand the solution in series around the middle of the line (latitude Bm, azimuth Am). They suit lines of up to about 200 km.",
    ru: "Обратная геодезическая задача: по двум точкам найти расстояние S и азимуты A12 и A21. Формулы Гаусса со средними аргументами разлагают решение в ряды относительно середины линии (широта Bm, азимут Am). Подходят для линий примерно до 200 км.",
    uk: "Обернена геодезична задача: за двома точками знайти відстань S та азимути A12 і A21. Формули Гаусса із середніми аргументами розкладають розв'язок у ряди відносно середини лінії (широта Bm, азимут Am). Підходять для ліній приблизно до 200 км.",
  },
  xy2bl: {
    formula: [
      "y = Y − Y0,   Bx: X(Bx) = x",
      "B = Bx + b2·y² + b4·y⁴ + b6·y⁶ + b8·y⁸",
      "l = a1·y + a3·y³ + a5·y⁵ + a7·y⁷,   L = L0 + l",
    ],
    en: "The inverse Gauss–Krüger conversion. First the footpoint latitude Bx is found: the latitude on the central meridian whose arc length equals x. Then B and the longitude difference l are expanded in powers of y, the distance from the central meridian. Y0 is the false easting (usually 500 000 m, often with the zone number in front).",
    ru: "Обратное преобразование Гаусса–Крюгера. Сначала находится широта Bx основания ординаты — широта на осевом меридиане, длина дуги до которой равна x. Затем B и разность долгот l раскладываются в ряды по степеням y — расстояния от осевого меридиана. Y0 — условная ордината осевого меридиана (обычно 500 000 м, часто с номером зоны впереди).",
    uk: "Обернене перетворення Гаусса–Крюгера. Спочатку знаходиться широта Bx основи ординати — широта на осьовому меридіані, довжина дуги до якої дорівнює x. Потім B і різниця довгот l розкладаються в ряди за степенями y — відстані від осьового меридіана. Y0 — умовна ордината осьового меридіана (зазвичай 500 000 м, часто з номером зони попереду).",
  },
  bl2xy: {
    formula: [
      "l = L − L0",
      "x = X(B) + a2·l² + a4·l⁴ + a6·l⁶ + a8·l⁸",
      "y = b1·l + b3·l³ + b5·l⁵ + b7·l⁷,    b1 = N·cosB",
    ],
    en: "The Gauss–Krüger projection maps the ellipsoid conformally onto a plane, one zone at a time (usually 6° or 3° wide). The central meridian L0 becomes the x axis and keeps its true length, so x starts from the meridian arc X(B). Y is given without the 500 km false easting.",
    ru: "Проекция Гаусса–Крюгера конформно отображает эллипсоид на плоскость по зонам (обычно шириной 6° или 3°). Осевой меридиан L0 становится осью x и сохраняет истинную длину, поэтому x начинается с длины дуги меридиана X(B). Y приводится без условной добавки 500 км.",
    uk: "Проєкція Гаусса–Крюгера конформно відображає еліпсоїд на площину по зонах (зазвичай завширшки 6° або 3°). Осьовий меридіан L0 стає віссю x і зберігає істинну довжину, тому x починається з довжини дуги меридіана X(B). Y наводиться без умовної добавки 500 км.",
  },
  gamma: {
    formula: [
      "l = L − L0",
      "tg γ = sinB · tg l + sinB · η² · cos²B · l³ · (1 + ⅔η² + cos²B · l²)",
      "γ ≈ l · sinB    (η² = e′²·cos²B)",
    ],
    en: "The Gaussian meridian convergence γ is the angle on the plane between the image of the meridian and the x axis (grid north). It is zero on the central meridian, positive to the east of it and negative to the west, and grows with latitude.",
    ru: "Гауссово сближение меридианов γ — угол на плоскости между изображением меридиана и осью x (линией, параллельной осевому меридиану). Оно равно нулю на осевом меридиане, положительно к востоку от него, отрицательно к западу и растёт с широтой.",
    uk: "Гауссове зближення меридіанів γ — кут на площині між зображенням меридіана і віссю x (лінією, паралельною осьовому меридіану). Воно дорівнює нулю на осьовому меридіані, додатне на схід від нього, від'ємне на захід і зростає з широтою.",
  },
  corr: {
    formula: [
      "δ12 ≈ −ρ″ / (2R²) · (x2 − x1) · (ym − Δy/6)",
      "Δs = S · (m − 1),   m = 1 + ym²/2R² + Δy²/24R² + ym⁴/24R⁴",
      "ρ″ = 206 265,   ym = (y1 + y2) / 2",
    ],
    en: "To use a line measured on the ellipsoid on the Gauss–Krüger plane, two corrections are applied. The direction corrections δ12 and δ21 give the angle between the curved image of the geodesic and the straight chord. The distance correction Δs comes from the projection scale m, which grows with distance from the central meridian. Coordinates are entered in kilometres.",
    ru: "Чтобы использовать линию, измеренную на эллипсоиде, на плоскости Гаусса–Крюгера, вводятся две поправки. Поправки в направления δ12 и δ21 — угол между кривой изображения геодезической линии и прямой хордой. Поправка в расстояние Δs вызвана масштабом проекции m, который растёт с удалением от осевого меридиана. Координаты вводятся в километрах.",
    uk: "Щоб використати лінію, виміряну на еліпсоїді, на площині Гаусса–Крюгера, вводять дві поправки. Поправки в напрямки δ12 і δ21 — кут між кривою зображення геодезичної лінії і прямою хордою. Поправка у відстань Δs спричинена масштабом проєкції m, що зростає з віддаленням від осьового меридіана. Координати вводяться в кілометрах.",
  },
};

// Words used inside the diagrams (js/diagrams.js); everything else there is symbols.
PRIMA.DIAGRAM_WORDS = {
  en: { eq: "equator", merid: "meridian", par: "parallel", geod: "geodesic", chord: "chord", sheet: "map sheet", given: "given", computed: "computed" },
  ru: { eq: "экватор", merid: "меридиан", par: "параллель", geod: "геодезическая", chord: "хорда", sheet: "лист карты", given: "дано", computed: "вычисляется" },
  uk: { eq: "екватор", merid: "меридіан", par: "паралель", geod: "геодезична", chord: "хорда", sheet: "аркуш карти", given: "дано", computed: "обчислюється" },
};
