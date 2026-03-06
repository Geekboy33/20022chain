"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export const LOCALES = ['en', 'es', 'ar', 'zh', 'ru', 'fr', 'pt'] as const;
export type Locale = typeof LOCALES[number];

export const LANG_META: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇺🇸" },
  es: { label: "Español", flag: "🇪🇸" },
  ar: { label: "العربية", flag: "🇸🇦" },
  zh: { label: "中文", flag: "🇨🇳" },
  ru: { label: "Русский", flag: "🇷🇺" },
  fr: { label: "Français", flag: "🇫🇷" },
  pt: { label: "Português", flag: "🇧🇷" },
};

const translations: Record<Locale, Record<string, string>> = {
  en: {
    "nav.tech": "Technology", "nav.subsystems": "Subsystems", "nav.wallets": "Wallets", "nav.explorer": "Explorer", "nav.whitepaper": "Whitepaper", "nav.access": "Access", "nav.enter": "ENTER EXPLORER",
    "hero.badge": "MAINNET LAUNCH Q3 2026", "hero.title1": "The Blockchain", "hero.title2": "for Real Assets.", "hero.subtitle": "20022Chain is the world's first blockchain built natively for ISO 20022 financial messaging. Purpose-designed for institutional tokenization of mining, real estate, gemstones, bonds, and private credit.",
    "hero.launch": "LAUNCH EXPLORER", "hero.wp": "WHITEPAPER",
    "tech.badge": "Architecture", "tech.title": "How 20022Chain Works", "tech.subtitle": "From transaction submission to instant finality — every step is designed for institutional-grade performance and compliance.",
    "tech.s1": "Submit", "tech.s1d": "User signs a transaction (token transfer, smart contract call, or asset tokenization) from any connected wallet or API.",
    "tech.s2": "Validate", "tech.s2d": "Transaction enters the DAG mempool where it's validated against ISO 20022 format, checked for sufficient balance and correct nonce.",
    "tech.s3": "Execute", "tech.s3d": "Parallel execution engine processes the transaction alongside thousands of others. Conflict detection ensures consistency.",
    "tech.s4": "Finalize", "tech.s4d": "ArchPoS consensus commits the block in 0.4 s with instant finality. No rollbacks, no reorgs. Settlement is final.",
    "sub.badge": "Core Infrastructure", "sub.title": "12 Subsystems", "sub.subtitle": "Every component of 20022Chain is purpose-built for institutional RWA tokenization.",
    "wallet.badge": "Developer Tools", "wallet.title": "Wallets & API", "wallet.subtitle": "Full-featured wallet creation, balance queries, token transfers, and developer faucet — all through a simple REST API.",
    "wallet.api": "Full API Reference",
    "explorer.badge": "Block Explorer", "explorer.title": "Real-Time Transparency", "explorer.subtitle": "Full-featured block explorer with blocks, transactions, validators, ISIN instruments, governance, and cross-chain bridge activity.",
    "explorer.cta": "ENTER EXPLORER", "explorer.ctaSub": "Request access to explore blocks, transactions, and tokenized assets in real-time",
    "archt.badge": "Ecosystem", "archt.title": "Connected to ARCHT", "archt.subtitle": "20022Chain is the settlement layer for the ARCHT.World RWA tokenization platform. Every tokenized mine, property, gemstone, and bond settles on 20022Chain.",
    "access.badge": "REQUEST ACCESS", "access.title": "Explore 20022Chain", "access.subtitle": "Enter your email to receive explorer credentials. Full access to blocks, transactions, validators, and tokenized assets.",
    "access.granted": "Access Granted", "access.sentTo": "Credentials sent to", "access.enterNow": "ENTER NOW", "access.placeholder": "Your institutional email", "access.request": "REQUEST",
    "footer.part": "Part of the ARCHT Ecosystem",
  },
  es: {
    "nav.tech": "Tecnología", "nav.subsystems": "Subsistemas", "nav.wallets": "Billeteras", "nav.explorer": "Explorador", "nav.whitepaper": "Libro Blanco", "nav.access": "Acceso", "nav.enter": "ENTRAR AL EXPLORADOR",
    "hero.badge": "LANZAMIENTO MAINNET Q3 2026", "hero.title1": "La Blockchain", "hero.title2": "para Activos Reales.", "hero.subtitle": "20022Chain es la primera blockchain del mundo construida nativamente para mensajería financiera ISO 20022. Diseñada para la tokenización institucional de minería, bienes raíces, gemas, bonos y crédito privado.",
    "hero.launch": "LANZAR EXPLORADOR", "hero.wp": "LIBRO BLANCO",
    "tech.badge": "Arquitectura", "tech.title": "Cómo Funciona 20022Chain", "tech.subtitle": "Desde el envío de transacciones hasta la finalidad instantánea — cada paso diseñado para rendimiento y cumplimiento institucional.",
    "tech.s1": "Enviar", "tech.s1d": "El usuario firma una transacción (transferencia de tokens, llamada a contrato inteligente o tokenización de activos) desde cualquier billetera o API.",
    "tech.s2": "Validar", "tech.s2d": "La transacción entra al mempool DAG donde se valida contra el formato ISO 20022, se verifica el balance y el nonce.",
    "tech.s3": "Ejecutar", "tech.s3d": "El motor de ejecución paralela procesa la transacción junto con miles de otras. La detección de conflictos asegura consistencia.",
    "tech.s4": "Finalizar", "tech.s4d": "El consenso ArchPoS confirma el bloque en 0,4 s con finalidad instantánea. Sin reversiones. La liquidación es final.",
    "sub.badge": "Infraestructura Central", "sub.title": "12 Subsistemas", "sub.subtitle": "Cada componente de 20022Chain está diseñado para la tokenización institucional de RWA.",
    "wallet.badge": "Herramientas para Desarrolladores", "wallet.title": "Billeteras y API", "wallet.subtitle": "Creación de billeteras, consultas de balance, transferencias de tokens y faucet para desarrolladores — todo a través de una API REST simple.",
    "wallet.api": "Referencia Completa de API",
    "explorer.badge": "Explorador de Bloques", "explorer.title": "Transparencia en Tiempo Real", "explorer.subtitle": "Explorador completo con bloques, transacciones, validadores, instrumentos ISIN, gobernanza y actividad del puente cross-chain.",
    "explorer.cta": "ENTRAR AL EXPLORADOR", "explorer.ctaSub": "Solicita acceso para explorar bloques, transacciones y activos tokenizados en tiempo real",
    "archt.badge": "Ecosistema", "archt.title": "Conectado a ARCHT", "archt.subtitle": "20022Chain es la capa de liquidación para la plataforma ARCHT.World. Cada mina, propiedad, gema y bono tokenizado se liquida en 20022Chain.",
    "access.badge": "SOLICITAR ACCESO", "access.title": "Explorar 20022Chain", "access.subtitle": "Ingrese su email para recibir credenciales del explorador. Acceso completo a bloques, transacciones, validadores y activos tokenizados.",
    "access.granted": "Acceso Otorgado", "access.sentTo": "Credenciales enviadas a", "access.enterNow": "ENTRAR AHORA", "access.placeholder": "Su email institucional", "access.request": "SOLICITAR",
    "footer.part": "Parte del Ecosistema ARCHT",
  },
  ar: {
    "nav.tech": "التكنولوجيا", "nav.subsystems": "الأنظمة الفرعية", "nav.wallets": "المحافظ", "nav.explorer": "المستكشف", "nav.whitepaper": "الورقة البيضاء", "nav.access": "الوصول", "nav.enter": "دخول المستكشف",
    "hero.badge": "إطلاق الشبكة الرئيسية Q3 2026", "hero.title1": "البلوكتشين", "hero.title2": "للأصول الحقيقية.", "hero.subtitle": "20022Chain هي أول بلوكتشين في العالم مبنية أصلياً لمعيار الرسائل المالية ISO 20022. مصممة للترميز المؤسسي للتعدين والعقارات والأحجار الكريمة والسندات.",
    "hero.launch": "إطلاق المستكشف", "hero.wp": "الورقة البيضاء",
    "tech.badge": "البنية", "tech.title": "كيف يعمل 20022Chain", "tech.subtitle": "من إرسال المعاملة إلى النهائية الفورية.",
    "tech.s1": "إرسال", "tech.s1d": "يوقع المستخدم معاملة من أي محفظة أو واجهة برمجة.", "tech.s2": "التحقق", "tech.s2d": "تدخل المعاملة مجمع DAG للتحقق من تنسيق ISO 20022.", "tech.s3": "التنفيذ", "tech.s3d": "محرك التنفيذ المتوازي يعالج المعاملة مع آلاف أخرى.", "tech.s4": "الإنهاء", "tech.s4d": "إجماع ArchPoS يؤكد الكتلة في 0,4 ثانية مع نهائية فورية.",
    "sub.badge": "البنية التحتية", "sub.title": "12 نظاماً فرعياً", "sub.subtitle": "كل مكون مصمم خصيصاً لترميز الأصول الحقيقية المؤسسية.",
    "wallet.badge": "أدوات المطورين", "wallet.title": "المحافظ وواجهة البرمجة", "wallet.subtitle": "إنشاء محافظ واستعلامات وتحويلات عبر REST API.", "wallet.api": "مرجع API الكامل",
    "explorer.badge": "مستكشف الكتل", "explorer.title": "شفافية في الوقت الفعلي", "explorer.subtitle": "مستكشف كامل مع كتل ومعاملات ومدققين وأدوات ISIN.", "explorer.cta": "دخول المستكشف", "explorer.ctaSub": "اطلب الوصول لاستكشاف الكتل والمعاملات",
    "archt.badge": "النظام البيئي", "archt.title": "متصل بـ ARCHT", "archt.subtitle": "20022Chain هي طبقة التسوية لمنصة ARCHT.World.",
    "access.badge": "طلب الوصول", "access.title": "استكشف 20022Chain", "access.subtitle": "أدخل بريدك الإلكتروني لتلقي بيانات الاعتماد.", "access.granted": "تم منح الوصول", "access.sentTo": "تم إرسال البيانات إلى", "access.enterNow": "ادخل الآن", "access.placeholder": "بريدك المؤسسي", "access.request": "طلب",
    "footer.part": "جزء من نظام ARCHT البيئي",
  },
  zh: {
    "nav.tech": "技术", "nav.subsystems": "子系统", "nav.wallets": "钱包", "nav.explorer": "浏览器", "nav.whitepaper": "白皮书", "nav.access": "访问", "nav.enter": "进入浏览器",
    "hero.badge": "主网启动 2026年Q3", "hero.title1": "区块链", "hero.title2": "为实物资产而生。", "hero.subtitle": "20022Chain是世界上第一个原生支持ISO 20022金融消息的区块链。专为矿业、房地产、宝石、债券和私人信贷的机构级代币化而设计。",
    "hero.launch": "启动浏览器", "hero.wp": "白皮书",
    "tech.badge": "架构", "tech.title": "20022Chain如何运作", "tech.subtitle": "从交易提交到即时最终确认——每一步都为机构级性能和合规而设计。",
    "tech.s1": "提交", "tech.s1d": "用户从任何钱包或API签署交易。", "tech.s2": "验证", "tech.s2d": "交易进入DAG内存池，验证ISO 20022格式。", "tech.s3": "执行", "tech.s3d": "并行执行引擎同时处理数千笔交易。", "tech.s4": "最终确认", "tech.s4d": "ArchPoS共识在0.4秒内确认区块，具有即时最终性。",
    "sub.badge": "核心基础设施", "sub.title": "12个子系统", "sub.subtitle": "20022Chain的每个组件都专为机构级RWA代币化而构建。",
    "wallet.badge": "开发工具", "wallet.title": "钱包与API", "wallet.subtitle": "通过简单的REST API创建钱包、查询余额、转账代币。", "wallet.api": "完整API参考",
    "explorer.badge": "区块浏览器", "explorer.title": "实时透明", "explorer.subtitle": "完整的区块浏览器，包含区块、交易、验证者、ISIN工具。", "explorer.cta": "进入浏览器", "explorer.ctaSub": "申请访问权限以实时探索区块和代币化资产",
    "archt.badge": "生态系统", "archt.title": "连接ARCHT", "archt.subtitle": "20022Chain是ARCHT.World平台的结算层。",
    "access.badge": "申请访问", "access.title": "探索20022Chain", "access.subtitle": "输入邮箱获取浏览器凭证。", "access.granted": "访问已授予", "access.sentTo": "凭证已发送至", "access.enterNow": "立即进入", "access.placeholder": "您的机构邮箱", "access.request": "申请",
    "footer.part": "ARCHT生态系统的一部分",
  },
  ru: {
    "nav.tech": "Технология", "nav.subsystems": "Подсистемы", "nav.wallets": "Кошельки", "nav.explorer": "Обозреватель", "nav.whitepaper": "Белая книга", "nav.access": "Доступ", "nav.enter": "ВОЙТИ В ОБОЗРЕВАТЕЛЬ",
    "hero.badge": "ЗАПУСК МЕЙННЕТА Q3 2026", "hero.title1": "Блокчейн", "hero.title2": "для реальных активов.", "hero.subtitle": "20022Chain — первый в мире блокчейн с нативной поддержкой финансовых сообщений ISO 20022. Создан для институциональной токенизации.",
    "hero.launch": "ЗАПУСТИТЬ ОБОЗРЕВАТЕЛЬ", "hero.wp": "БЕЛАЯ КНИГА",
    "tech.badge": "Архитектура", "tech.title": "Как работает 20022Chain", "tech.subtitle": "От отправки транзакции до мгновенного подтверждения.",
    "tech.s1": "Отправка", "tech.s1d": "Пользователь подписывает транзакцию из кошелька или API.", "tech.s2": "Проверка", "tech.s2d": "Транзакция проверяется на соответствие ISO 20022.", "tech.s3": "Исполнение", "tech.s3d": "Параллельный движок обрабатывает тысячи транзакций.", "tech.s4": "Финализация", "tech.s4d": "Консенсус ArchPoS подтверждает блок за 0,4 с.",
    "sub.badge": "Инфраструктура", "sub.title": "12 подсистем", "sub.subtitle": "Каждый компонент создан для институциональной токенизации.",
    "wallet.badge": "Инструменты разработчика", "wallet.title": "Кошельки и API", "wallet.subtitle": "Создание кошельков, запросы баланса, переводы через REST API.", "wallet.api": "Полный справочник API",
    "explorer.badge": "Блок-обозреватель", "explorer.title": "Прозрачность в реальном времени", "explorer.subtitle": "Полный обозреватель с блоками, транзакциями, валидаторами и ISIN.", "explorer.cta": "ВОЙТИ", "explorer.ctaSub": "Запросите доступ для просмотра блоков и токенизированных активов",
    "archt.badge": "Экосистема", "archt.title": "Связан с ARCHT", "archt.subtitle": "20022Chain — расчётный слой для платформы ARCHT.World.",
    "access.badge": "ЗАПРОСИТЬ ДОСТУП", "access.title": "Исследуйте 20022Chain", "access.subtitle": "Введите email для получения доступа.", "access.granted": "Доступ предоставлен", "access.sentTo": "Данные отправлены на", "access.enterNow": "ВОЙТИ СЕЙЧАС", "access.placeholder": "Ваш email", "access.request": "ЗАПРОСИТЬ",
    "footer.part": "Часть экосистемы ARCHT",
  },
  fr: {
    "nav.tech": "Technologie", "nav.subsystems": "Sous-systèmes", "nav.wallets": "Portefeuilles", "nav.explorer": "Explorateur", "nav.whitepaper": "Livre Blanc", "nav.access": "Accès", "nav.enter": "ENTRER",
    "hero.badge": "LANCEMENT MAINNET T3 2026", "hero.title1": "La Blockchain", "hero.title2": "pour les actifs réels.", "hero.subtitle": "20022Chain est la première blockchain au monde conçue nativement pour la messagerie financière ISO 20022. Conçue pour la tokenisation institutionnelle.",
    "hero.launch": "LANCER L'EXPLORATEUR", "hero.wp": "LIVRE BLANC",
    "tech.badge": "Architecture", "tech.title": "Comment fonctionne 20022Chain", "tech.subtitle": "De la soumission de transaction à la finalité instantanée.",
    "tech.s1": "Soumettre", "tech.s1d": "L'utilisateur signe une transaction depuis un portefeuille ou une API.", "tech.s2": "Valider", "tech.s2d": "La transaction est validée au format ISO 20022.", "tech.s3": "Exécuter", "tech.s3d": "Le moteur parallèle traite des milliers de transactions.", "tech.s4": "Finaliser", "tech.s4d": "Le consensus ArchPoS confirme le bloc en 0,4 s.",
    "sub.badge": "Infrastructure", "sub.title": "12 Sous-systèmes", "sub.subtitle": "Chaque composant est conçu pour la tokenisation institutionnelle.",
    "wallet.badge": "Outils développeurs", "wallet.title": "Portefeuilles et API", "wallet.subtitle": "Création de portefeuilles, requêtes de solde, transferts via REST API.", "wallet.api": "Référence API complète",
    "explorer.badge": "Explorateur de blocs", "explorer.title": "Transparence en temps réel", "explorer.subtitle": "Explorateur complet avec blocs, transactions, validateurs et ISIN.", "explorer.cta": "ENTRER", "explorer.ctaSub": "Demandez l'accès pour explorer en temps réel",
    "archt.badge": "Écosystème", "archt.title": "Connecté à ARCHT", "archt.subtitle": "20022Chain est la couche de règlement pour la plateforme ARCHT.World.",
    "access.badge": "DEMANDER L'ACCÈS", "access.title": "Explorez 20022Chain", "access.subtitle": "Entrez votre email pour recevoir les identifiants.", "access.granted": "Accès accordé", "access.sentTo": "Identifiants envoyés à", "access.enterNow": "ENTRER MAINTENANT", "access.placeholder": "Votre email institutionnel", "access.request": "DEMANDER",
    "footer.part": "Fait partie de l'écosystème ARCHT",
  },
  pt: {
    "nav.tech": "Tecnologia", "nav.subsystems": "Subsistemas", "nav.wallets": "Carteiras", "nav.explorer": "Explorador", "nav.whitepaper": "Livro Branco", "nav.access": "Acesso", "nav.enter": "ENTRAR NO EXPLORADOR",
    "hero.badge": "LANÇAMENTO MAINNET Q3 2026", "hero.title1": "A Blockchain", "hero.title2": "para Ativos Reais.", "hero.subtitle": "20022Chain é a primeira blockchain do mundo construída nativamente para mensagens financeiras ISO 20022. Projetada para tokenização institucional.",
    "hero.launch": "LANÇAR EXPLORADOR", "hero.wp": "LIVRO BRANCO",
    "tech.badge": "Arquitetura", "tech.title": "Como o 20022Chain Funciona", "tech.subtitle": "Do envio de transações à finalidade instantânea.",
    "tech.s1": "Enviar", "tech.s1d": "O usuário assina uma transação de qualquer carteira ou API.", "tech.s2": "Validar", "tech.s2d": "A transação é validada no formato ISO 20022.", "tech.s3": "Executar", "tech.s3d": "O motor paralelo processa milhares de transações.", "tech.s4": "Finalizar", "tech.s4d": "O consenso ArchPoS confirma o bloco em 0,4 s.",
    "sub.badge": "Infraestrutura", "sub.title": "12 Subsistemas", "sub.subtitle": "Cada componente projetado para tokenização institucional.",
    "wallet.badge": "Ferramentas de Desenvolvedor", "wallet.title": "Carteiras e API", "wallet.subtitle": "Criação de carteiras, consultas de saldo, transferências via REST API.", "wallet.api": "Referência completa da API",
    "explorer.badge": "Explorador de Blocos", "explorer.title": "Transparência em Tempo Real", "explorer.subtitle": "Explorador completo com blocos, transações, validadores e ISIN.", "explorer.cta": "ENTRAR NO EXPLORADOR", "explorer.ctaSub": "Solicite acesso para explorar blocos e ativos tokenizados",
    "archt.badge": "Ecossistema", "archt.title": "Conectado ao ARCHT", "archt.subtitle": "20022Chain é a camada de liquidação da plataforma ARCHT.World.",
    "access.badge": "SOLICITAR ACESSO", "access.title": "Explore o 20022Chain", "access.subtitle": "Insira seu email para receber credenciais.", "access.granted": "Acesso Concedido", "access.sentTo": "Credenciais enviadas para", "access.enterNow": "ENTRAR AGORA", "access.placeholder": "Seu email institucional", "access.request": "SOLICITAR",
    "footer.part": "Parte do Ecossistema ARCHT",
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('chain_locale') as Locale | null;
    if (saved && LOCALES.includes(saved)) setLocaleState(saved);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('chain_locale', l);
  }, []);

  const t = useCallback((key: string) => {
    return translations[locale]?.[key] || translations.en[key] || key;
  }, [locale]);

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be within I18nProvider');
  return ctx;
}
