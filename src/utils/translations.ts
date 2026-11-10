/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'mn' | 'en';

export interface Translations {
  title: string;
  tagline: string;
  subtitle: string;
  menu: {
    newGame: string;
    continue: string;
    missionControl: string;
    rocketLab: string;
    spacecraftLab: string;
    debrisMap: string;
    academy: string;
    achievements: string;
    settings: string;
    startBriefing: string;
    skipIntro: string;
  };
  stages: {
    missionControl: string;
    rocketLab: string;
    designLab: string;
    launch: string;
    orbitalNav: string;
    detection: string;
    approach: string;
    capture: string;
    disposal: string;
    report: string;
  };
  common: {
    budget: string;
    cost: string;
    mass: string;
    wetMass: string;
    dryMass: string;
    fuelMass: string;
    thrust: string;
    isp: string;
    deltaV: string;
    power: string;
    powerMargin: string;
    altitude: string;
    velocity: string;
    distance: string;
    hazard: string;
    tumble: string;
    success: string;
    failure: string;
    proceed: string;
    execute: string;
    retry: string;
    close: string;
    nominal: string;
    caution: string;
    critical: string;
    soundOn: string;
    soundOff: string;
    voiceOn: string;
    voiceOff: string;
    language: string;
    back: string;
    play: string;
    pause: string;
    reset: string;
    camera: string;
    freeCam: string;
    telemetry: string;
  };
  launch: {
    badge: string;
    launchReady: string;
    startCountdown: string;
    abortLaunch: string;
    fastForward: string;
    proceedToOrbit: string;
    overloadWarning: string;
    massMargin: string;
    targetOrbit: string;
    cameras: {
      pad: string;
      tracking: string;
      booster: string;
      spacecraft: string;
      free: string;
    };
    phases: {
      padHold: string;
      countdown: string;
      ignition: string;
      liftoff: string;
      towerClear: string;
      gravityTurn: string;
      maxQ: string;
      meco: string;
      boosterSep: string;
      s2Ignition: string;
      fairingSep: string;
      seco: string;
      orbitAchieved: string;
      deploySuccess: string;
    };
    telemetry: {
      altitude: string;
      velocity: string;
      downrange: string;
      dynamicPressure: string;
      machNumber: string;
      acceleration: string;
      throttle: string;
    };
  };
  capture: {
    badge: string;
    title: string;
    subtitle: string;
    targetObject: string;
    targetMass: string;
    tumbleRate: string;
    relativeVel: string;
    captureEnvelope: string;
    triggerCapture: string;
    synchronizing: string;
    tumbleZeroed: string;
    successTitle: string;
    failureTitle: string;
    proceedToDisposal: string;
    cameras: {
      dockingHud: string;
      armCam: string;
      chaseCam: string;
      free: string;
    };
    steps: {
      sync: string;
      deploy: string;
      latch: string;
      stabilize: string;
    };
    tools: {
      roboticArm: string;
      deployableNet: string;
      harpoonTether: string;
      magneticGecko: string;
    };
  };
  disposal: {
    badge: string;
    title: string;
    subtitle: string;
    stackMass: string;
    fuelRemaining: string;
    deorbitDeltaV: string;
    requiredFuel: string;
    selectStrategy: string;
    strategies: {
      reentry: {
        name: string;
        desc: string;
        destination: string;
      };
      graveyard: {
        name: string;
        desc: string;
        destination: string;
      };
      dragSail: {
        name: string;
        desc: string;
        destination: string;
      };
    };
    phases: {
      retrogradeFlip: string;
      burnActive: string;
      entryInterface: string;
      hypersonicPlasma: string;
      aerodynamicBreakup: string;
      pointNemoSplash: string;
      graveyardParked: string;
    };
    telemetry: {
      plasmaTemp: string;
      entryAltitude: string;
      mach: string;
      impactZone: string;
      groundCasualtyRisk: string;
    };
    executeBurn: string;
    proceedToReport: string;
  };
  nav: {
    badge: string;
    title: string;
    currentOrbit: string;
    targetOrbit: string;
    hohmannTransfer: string;
    burn1: string;
    burn2: string;
    relativeDist: string;
    rendezvousComplete: string;
    fireBurn: string;
    proceedToDetection: string;
  };
  detection: {
    badge: string;
    title: string;
    sensorModes: {
      optical: string;
      lidar: string;
      radar: string;
      thermal: string;
    };
    targetAcquired: string;
    scanComplete: string;
    tumbleAnalysis: string;
    proceedToApproach: string;
  };
  approach: {
    badge: string;
    title: string;
    manualControls: string;
    fireForward: string;
    fireRetro: string;
    fireLateral: string;
    killRelativeVel: string;
    warningHighVel: string;
    alignmentOptimal: string;
    proceedToCapture: string;
  };
  aiAssistant: {
    name: string;
    role: string;
    intro: string;
    designLabHelp: string;
    rocketLabHelp: string;
    launchHelp: string;
    orbitHelp: string;
    detectionHelp: string;
    approachHelp: string;
    captureHelp: string;
    disposalHelp: string;
    successMessage: string;
  };
  ranks: {
    cadet: string;
    juniorEngineer: string;
    spaceEngineer: string;
    missionCommander: string;
    chiefEngineer: string;
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  mn: {
    title: 'QUASAR – МОНГОЛЫН САНСРЫН ХАМГААЛАГЧ',
    tagline: 'МОНГОЛООС САНСАРТ. ДААЛГАВРАА БҮТЭЭ. ДЭЛХИЙН ТОЙРОГ ЗАМЫГ ХАМГААЛ.',
    subtitle: 'Сансрын Хог Хаягдал Зайлуулах 3D Инженерийн Симулятор',
    menu: {
      newGame: 'Шинэ Даалгавар Эхлүүлэх',
      continue: 'Үргэлжлүүлэх',
      missionControl: 'Сансрын Удирдлагын Төв',
      rocketLab: 'Пуужин Угсралтын Лаборатори',
      spacecraftLab: 'Сансрын Хөлгийн Лаборатори',
      debrisMap: 'Тойрог Замын Хог Хаягдлын Зураг',
      academy: 'Сансрын Инженерийн Академи',
      achievements: 'Цол ба Амжилтууд',
      settings: 'Тохиргоо',
      startBriefing: 'Даалгаврын Зааварчилгаа',
      skipIntro: 'Танилцуулгыг Алгасах',
    },
    stages: {
      missionControl: '1. Удирдлагын Төв',
      rocketLab: '2. Пуужин Угсралт',
      designLab: '3. Хөлгийн Загвар',
      launch: '4. Сансарт Хөөрөх',
      orbitalNav: '5. Тойрог Зам',
      detection: '6. Хог Илрүүлэх',
      approach: '7. Ойртолт & Синхрон',
      capture: '8. Баригч Гар / Тороор Барих',
      disposal: '9. Аюулгүй Устгал',
      report: '10. Инженерийн Тайлан',
    },
    common: {
      budget: 'Төсөв',
      cost: 'Өртөг',
      mass: 'Масс',
      wetMass: 'Хөөргөх Нийт Масс',
      dryMass: 'Хуурай Масс',
      fuelMass: 'Түлшний Масс',
      thrust: 'Зүтгэх Хүч',
      isp: 'Хувийн Импульс (Isp)',
      deltaV: 'Хурдатгалын Нөөц (Δv)',
      power: 'Цахилгаан Чадал',
      powerMargin: 'Эрчим Хүчний Нөөц',
      altitude: 'Өндөр',
      velocity: 'Хурд',
      distance: 'Зай',
      hazard: 'Аюулын Зэрэг',
      tumble: 'Эргэлтийн Хурд',
      success: 'Амжилттай',
      failure: 'Амжилтгүй',
      proceed: 'Үргэлжлүүлэх',
      execute: 'Гүйцэтгэх',
      retry: 'Дахин Оролдох',
      close: 'Хаах',
      nominal: 'Хэвийн',
      caution: 'Анхаар',
      critical: 'Аюултай',
      soundOn: 'Дуу асаалттай',
      soundOff: 'Дуу хаагдсан',
      voiceOn: 'Хөтөчийн хоолой асаалттай',
      voiceOff: 'Хөтөчийн хоолой хаагдсан',
      language: 'Хэл солих',
      back: 'Буцах',
      play: 'Эхлүүлэх',
      pause: 'Түр Зогсоох',
      reset: 'Шинэчлэх',
      camera: 'Камер',
      freeCam: 'Чөлөөт 3D Камер',
      telemetry: 'Телеметр',
    },
    launch: {
      badge: 'ШАТ 4 // МОНГОЛЫН САНСРЫН ХӨЛӨГ ХӨӨРӨХ СИМУЛЯТОР',
      launchReady: 'Хөөрөлтөд бүрэн бэлэн. Системүүд шалгагдсан.',
      startCountdown: 'ХӨӨРӨХ ТУШААЛ ӨГӨХ (GO FOR LAUNCH)',
      abortLaunch: 'ХӨӨРӨЛТИЙГ ЗОГСООХ (ABORT)',
      fastForward: 'Хурдасгаж үзэх (Fast Forward)',
      proceedToOrbit: 'ТОЙРОГ ЗАМЫН МАНЕВРТ ШИЛЖИХ',
      overloadWarning: 'ХЭТ ХҮНД: Хөлгийн масс пуужингийн даацаас хэтэрсэн байна!',
      massMargin: 'Даацын нөөц боломжтой',
      targetOrbit: 'Зорилтот тойрог зам',
      cameras: {
        pad: '1. Хөөрөх Цамхаг (Tower Cam)',
        tracking: '2. Мөшгих Телескоп (Tracking)',
        booster: '3. Пуужингийн Бортын Камер (Booster Cam)',
        spacecraft: '4. Сансрын Хөлгийн Камер (Payload Cam)',
        free: '5. Чөлөөт Тойрог (3D Free Orbit)',
      },
      phases: {
        padHold: 'Хөөрөх талбайд бэлэн байдалд байна',
        countdown: 'Тоолол явагдаж байна (Terminal Countdown)',
        ignition: 'Үндсэн хөдөлгүүрүүд аслаа! Ус цацалт идэвхжлээ',
        liftoff: 'ХӨӨРЛӨӨ! Цамхаг чөлөөлөгдлөө (Tower Cleared)',
        towerClear: 'Хурдатгал авч, чиглэл тогтворжлоо',
        gravityTurn: 'Таталцлын эргэлт (Gravity Turn) эхэллээ',
        maxQ: 'МАКС-Q: Аэродинамик даралтын дээд цэг ба уурын цагариг',
        meco: 'MECO: 1-р угсрааны хөдөлгүүрүүд унтарлаа',
        boosterSep: '1-р шатны салгалт амжилттай. Торлог далавч дэлгэгдлээ',
        s2Ignition: '2-р шатны вакуум хөдөлгүүр аслаа',
        fairingSep: 'Хамгаалалтын хавтас салж, сансрын хөлөг ил гарлаа',
        seco: 'SECO: 2-р шат унтарлаа. Тойрог замын хурд 7.7 км/с хүрэв',
        orbitAchieved: 'ДЭЛХИЙН ТОЙРОГ ЗАМД АМЖИЛТТАЙ ОРЛОО (LEO Insertion)',
        deploySuccess: 'Хөлөг салж, нарны зайн хуудаснууд дэлгэгдлээ',
      },
      telemetry: {
        altitude: 'ӨНДӨР (KM)',
        velocity: 'ХУРД (KM/S)',
        downrange: 'ТУУЛСАН ЗАЙ (KM)',
        dynamicPressure: 'ДИ НАМИК ДАРАЛТ (KPA)',
        machNumber: 'МАХЫН ТОО (MACH)',
        acceleration: 'ХУРДАТГАЛ (G)',
        throttle: 'ХӨДӨЛГҮҮРИЙН ХҮЧ',
      },
    },
    capture: {
      badge: 'ШАТ 8 // САНСРЫН ХОГИЙГ БАРЬЖ АВАХ АЖИЛЛАГАА',
      title: 'Сансрын Хогийг Тэнцвэржүүлэн Хатуу Бэхэлгээгээр Барих',
      subtitle: 'Монголын хөлгийн тусгай тоноглолоор хогийг тогтоон залгагдах процесс',
      targetObject: 'Зорилтот сансрын хог',
      targetMass: 'Хогийн жин',
      tumbleRate: 'Эргэлтийн хурд',
      relativeVel: 'Харьцангуй хурд',
      captureEnvelope: 'Аюулгүй барих бүс',
      triggerCapture: 'БАРИХ ТӨХӨӨРӨМЖИЙГ ИДЭВХЖҮҮЛЭХ',
      synchronizing: 'Эргэлт ба байрлалыг тэгшитгэж байна...',
      tumbleZeroed: 'Эргэлт зогсож, хатуу бэхлэгдлээ (Tumble: 0.0°/s)',
      successTitle: 'АМЖИЛТТАЙ БАРЬЖ БЭХЭЛЛЭЭ!',
      failureTitle: 'БАРИЛТ АМЖИЛТГҮЙ БОЛЛОО!',
      proceedToDisposal: 'АЮУЛГҮЙ УСТГАЛЫН ШАТАНД ШИЛЖИХ',
      cameras: {
        dockingHud: '1. Залгагдах Нави-HUD (Docking Cam)',
        armCam: '2. Робот Гарын Камер (End-Effector)',
        chaseCam: '3. Хөндлөнгийн Мөшгигч (Chase Cam)',
        free: '4. Чөлөөт 3D Тойрог (Free Orbit)',
      },
      steps: {
        sync: '1. Эргэлтийг Тэнцвэржүүлэх (Spin Match)',
        deploy: '2. Төхөөрөмжийг Сунгах/Дэлгэх (Deploy Tool)',
        latch: '3. Механик Холболт & Түгжих (Mechanical Latch)',
        stabilize: '4. Эргэлтийг 0 болгож Залгагдах (Rigid Berthing)',
      },
      tools: {
        roboticArm: '7-Тэнхлэгт Үет Робот Гар (Canadarm Style)',
        deployableNet: 'Дэлгэгддэг Dyneema Тор (Deployable Net)',
        harpoonTether: 'Сансрын Жад ба Татагч Утас (Harpoon)',
        magneticGecko: 'Соронзон & Геко Наалдамхай Хавчуур (Gecko Gripper)',
      },
    },
    disposal: {
      badge: 'ШАТ 9 // ДЭЛХИЙН АГААР МАНДАЛД ШАТААЖ УСТГАХ',
      title: 'Тойрог Замаас Буулгаж, Пойнт Немод Шатаан Устгах',
      subtitle: 'Агаар мандалд 2,500°C гипероны плазмаар шатааж, үлдэгдлийг далайд унагах',
      stackMass: 'Нийт масс (Хөлөг + Хог)',
      fuelRemaining: 'Үлдсэн түлш',
      deorbitDeltaV: 'Шаардлагатай дельта-V',
      requiredFuel: 'Тооцоот түлшний зарцуулалт',
      selectStrategy: 'УСТГАЛЫН АРГАЧЛАЛ СОНГОХ',
      strategies: {
        reentry: {
          name: 'Агаар мандалд шатаах (Point Nemo)',
          desc: 'Ретроград тийрэлтээр өндрийг 45 км болгон бууруулж, Номхон далайн эзэнгүй бүсэд шатаана.',
          destination: 'Өмнөд Номхон Далай (Point Nemo, SPOUA)',
        },
        graveyard: {
          name: 'Оршуулгын тойрог зам руу түлхэх (+350 км)',
          desc: 'Идэвхтэй геостационар бүсээс 350 км дээш оршуулгын тойрог зам руу түлхэж мөнхөд байрлуулна.',
          destination: 'Оршуулгын тойрог зам (GEO +350 km)',
        },
        dragSail: {
          name: 'Аэродинамик далайн дарвуул дэлгэх',
          desc: 'Асар том ойлгогч дарвуул дэлгэж агаар мандлын үрэлтийг ихэсгэн 3-5 жилийн дотор унагана.',
          destination: 'Дээд агаар мандал (Пассив уналт)',
        },
      },
      phases: {
        retrogradeFlip: '1. Хөлгийг 180° эргүүлж ретроград чиглэлд тохируулав',
        burnActive: '2. Тоормослох үндсэн хөдөлгүүр аслаа (Deorbit Burn Active)',
        entryInterface: '3. Агаар мандлын дээд давхаргад нэвтэрлээ (h < 85 km)',
        hypersonicPlasma: '4. Мах 25 гипер-хурдны плазмын бамбар дүрэлзлээ (T > 2500°C)',
        aerodynamicBreakup: '5. Хүчтэй даралтаар сансрын хог хагарч, жижиг хэлтэрхий болон шатлаа',
        pointNemoSplash: '6. Шатаж амжаагүй цөөн үлдэгдэл Пойнт Немогийн далайд аюулгүй живлээ',
        graveyardParked: 'Оршуулгын аюулгүй тойрог замд амжилттай байрлуулав',
      },
      telemetry: {
        plasmaTemp: 'ПЛАЗМЫН ТЕМПЕРАТУР',
        entryAltitude: 'НЭВТРЭХ ӨНДӨР',
        mach: 'МАХЫН ХУРД',
        impactZone: 'УНАХ БҮС',
        groundCasualtyRisk: 'ХҮН АМД УЧРУУЛАХ ЭРСДЭЛ: 0.00% (БҮРЭН АЮУЛГҮЙ)',
      },
      executeBurn: 'ТООРМОСЛОХ ТҮЛХЭЛТ ХИЙЖ УСТГАЛЫГ ЭХЛҮҮЛЭХ',
      proceedToReport: 'ЭЦСИЙН ИНЖЕНЕРИЙН ТАЙЛАН ҮЗЭХ',
    },
    nav: {
      badge: 'ШАТ 5 // ТОЙРОГ ЗАМЫН ШИЛЖИЛТ & ГОМАННЫ МАНЕВР',
      title: 'Гоманны Шилжилтийн Түлхэлт',
      currentOrbit: 'Одоогийн өндөр',
      targetOrbit: 'Зорилтот хогийн өндөр',
      hohmannTransfer: 'Гоманны шилжилт',
      burn1: 'Түлхэлт 1: Перигейг өсгөх',
      burn2: 'Түлхэлт 2: Апогейг тэгшитгэх',
      relativeDist: 'Хог хүртэлх зай',
      rendezvousComplete: 'Шилжилт амжилттай! Хогтой 45 км зайд ойртлоо',
      fireBurn: 'ТИЙРЭЛТ ХИЙХ (FIRE BURN)',
      proceedToDetection: 'ХОГ ИЛРҮҮЛЭХ ШАТАНД ОРОХ',
    },
    detection: {
      badge: 'ШАТ 6 // ОЛОН СУВАГТ СЕНСОР СКАНИНГ',
      title: '3D Лазер Лидар & Навигацийн Камераар Хог Шинжлэх',
      sensorModes: {
        optical: 'Оптик НавКам',
        lidar: '3D Flash Лидар',
        radar: 'Бичил Долгионы Радар',
        thermal: 'Хэт Улаан Туяа (IR)',
      },
      targetAcquired: 'Зорилтот биет илэрлээ',
      scanComplete: '3D Геометр болон эргэлтийн тэнхлэг тогтоогдлоо',
      tumbleAnalysis: 'Эргэлтийн шинжилгээ дууссан',
      proceedToApproach: 'СИНХРОН ОЙРТОЛТ ХИЙХ',
    },
    approach: {
      badge: 'ШАТ 7 // ОЙРТОЛТ & СИНХРОНЧЛОЛ',
      title: 'Сансрын Хогтой Харьцангуй Хурдыг Тэгшитгэн Ойртох',
      manualControls: 'RCS Тийрэгчийн гар удирдлага',
      fireForward: 'Урагш тийрэх (+X)',
      fireRetro: 'Хойш тоормослох (-X)',
      fireLateral: 'Хажуу тийш (+Y / -Y)',
      killRelativeVel: 'Харьцангуй хурдыг 0 болгох (Kill Relative Vel)',
      warningHighVel: 'АНХААР: Хурд 0.25 м/с-ээс хэтэрвэл мөргөлдөнө!',
      alignmentOptimal: 'Байрлал, өнцөг маш сайн таарлаа',
      proceedToCapture: 'БАРИХ ШАТАНД ШИЛЖИХ',
    },
    aiAssistant: {
      name: 'САНСАР-AI',
      role: 'Монголын Сансрын Удирдлагын Туслах',
      intro: 'Сайн байна уу, Инженер ээ! Би таны даалгаврын туслах САНСАР-AI байна. Бид дэлхийн тойрог замыг аюултай хог хаягдлаас хамгаалах Монгол улсын анхны бие даасан номлолыг эхлүүлж байна.',
      designLabHelp: 'Хөлгийнхөө цахилгаан эрчим хүч (Нарны зай) болон түлшний Дельта-V нөөцийг тэнцвэржүүлээрэй. Хэрэв хүчдэлийн нөөц хасах утгатай бол аппарат сансарт унтарна!',
      rocketLabHelp: 'Пуужингийн даац таны хөлгийн нийт массаас (Wet Mass) илүү байх ёстой. Хөнгөн пуужин хямд боловч хүнд ачааг тойрог замд гаргаж чадахгүй.',
      launchHelp: 'Хөдөлгүүрийн асаалт, Макс-Q даралт болон салгалтын үе шатуудыг анхааралтай ажиглаарай. Монголын төрийн далбаат пуужин сансарт гарч байна!',
      orbitHelp: 'Гоманны шилжилтийн түлхэлт (Hohmann Transfer) хийж өндрийг зорилтот хогтой тааруулна. Сансарт зүгээр л тийшээ чиглэх хангалтгүй, тойрог замын хурдаа нэмэх хэрэгтэй.',
      detectionHelp: '3D Лазер Лидар (LiDAR) болон Навигацийн камераар хогийн эргэлтийн хурд болон хэлбэрийг сканнердаж байна.',
      approachHelp: 'Харьцангуй хурдаа 0.25 м/с-ээс бага байлгаарай! Эс бөгөөс мөргөлдөж хэлтэрхий үүсгэх аюултай.',
      captureHelp: 'Робот баригч гар болон тороо идэвхжүүлж хогийг хатуу бэхэлгээгээр холбоно уу.',
      disposalHelp: 'Пойнт Немо (Номхон далайн эзэнгүй бүс) рүү агаар мандалд шатаах эсвэл Оршуулгын тойрог зам руу түлхэнэ.',
      successMessage: 'Гайхалтай! Даалгавар амжилттай боллоо. Та дэлхийн тойрог замыг мянга мянган хэлтэрхий үүсэхээс аварлаа!',
    },
    ranks: {
      cadet: 'Сансрын Кадет',
      juniorEngineer: 'Туслах Инженер',
      spaceEngineer: 'Сансрын Инженер',
      missionCommander: 'Даалгаврын Командлагч',
      chiefEngineer: 'Ерөнхий Инженер (Chief)',
    },
  },
  en: {
    title: 'QUASAR – MONGOLIAN SPACE GUARDIAN',
    tagline: "FROM MONGOLIA TO SPACE. BUILD YOUR MISSION. PROTECT EARTH'S ORBIT.",
    subtitle: '3D Space Debris Removal Engineering Simulator',
    menu: {
      newGame: 'Start New Mission',
      continue: 'Continue Mission',
      missionControl: 'Mission Control',
      rocketLab: 'Rocket Assembly Lab',
      spacecraftLab: 'Spacecraft Laboratory',
      debrisMap: 'Orbital Debris Map',
      academy: 'Engineering Academy',
      achievements: 'Ranks & Badges',
      settings: 'Settings',
      startBriefing: 'Mission Briefing',
      skipIntro: 'Skip Cinematic',
    },
    stages: {
      missionControl: '1. Mission Control',
      rocketLab: '2. Rocket Assembly',
      designLab: '3. Spacecraft Lab',
      launch: '4. Launch Simulation',
      orbitalNav: '5. Orbital Nav',
      detection: '6. Target Detection',
      approach: '7. Proximity Sync',
      capture: '8. Debris Capture',
      disposal: '9. Safe Disposal',
      report: '10. Flight Report',
    },
    common: {
      budget: 'Budget',
      cost: 'Cost',
      mass: 'Mass',
      wetMass: 'Wet Launch Mass',
      dryMass: 'Dry Mass',
      fuelMass: 'Fuel Mass',
      thrust: 'Thrust',
      isp: 'Specific Impulse (Isp)',
      deltaV: 'Delta-V (Δv)',
      power: 'Electrical Power',
      powerMargin: 'Power Margin',
      altitude: 'Altitude',
      velocity: 'Velocity',
      distance: 'Distance',
      hazard: 'Hazard Score',
      tumble: 'Tumble Rate',
      success: 'Success',
      failure: 'Failure',
      proceed: 'Proceed',
      execute: 'Execute',
      retry: 'Retry',
      close: 'Close',
      nominal: 'Nominal',
      caution: 'Caution',
      critical: 'Critical',
      soundOn: 'Audio Enabled',
      soundOff: 'Audio Muted',
      voiceOn: 'Voice Narration On',
      voiceOff: 'Voice Narration Off',
      language: 'Language',
      back: 'Back',
      play: 'Play',
      pause: 'Pause',
      reset: 'Reset',
      camera: 'Camera',
      freeCam: 'Free 3D Camera',
      telemetry: 'Telemetry',
    },
    launch: {
      badge: 'STAGE 4 // LAUNCH SIMULATION & ASCENT FLIGHT',
      launchReady: 'All launch vehicle systems nominal. Ready for terminal count.',
      startCountdown: 'GO FOR LAUNCH',
      abortLaunch: 'ABORT LAUNCH',
      fastForward: 'Fast Forward Ascent',
      proceedToOrbit: 'PROCEED TO ORBITAL NAVIGATION',
      overloadWarning: 'OVERLOAD: Spacecraft exceeds launcher payload capacity!',
      massMargin: 'Payload margin available',
      targetOrbit: 'Target Orbit Profile',
      cameras: {
        pad: '1. Launch Tower (Tower Cam)',
        tracking: '2. Ground Tracking Telescope',
        booster: '3. Onboard Booster Cam',
        spacecraft: '4. Spacecraft Payload Cam',
        free: '5. 3D Free Orbit',
      },
      phases: {
        padHold: 'Holding on pad awaiting command',
        countdown: 'Terminal countdown sequence active',
        ignition: 'Main Engine Ignition! Water deluge suppression active',
        liftoff: 'LIFTOFF! Clock is running and tower is cleared',
        towerClear: 'Pitchover maneuver initiated',
        gravityTurn: 'Gravity turn downrange towards target inclination',
        maxQ: 'MAX-Q: Maximum aerodynamic pressure & condensation collar',
        meco: 'MECO: Main Engine Cutoff on Stage 1 booster',
        boosterSep: 'Stage 1 booster separation nominal. Grid fins deployed',
        s2Ignition: 'Stage 2 Vacuum Engine Ignition confirmed',
        fairingSep: 'Fairing halves jettisoned into space vacuum',
        seco: 'SECO: Stage 2 Cutoff. Orbital velocity 7.7 km/s attained',
        orbitAchieved: 'ORBITAL INSERTION ACHIEVED (LEO Parking Orbit)',
        deploySuccess: 'Spacecraft separation confirmed. Solar arrays deployed',
      },
      telemetry: {
        altitude: 'ALTITUDE (KM)',
        velocity: 'VELOCITY (KM/S)',
        downrange: 'DOWNRANGE (KM)',
        dynamicPressure: 'DYNAMIC PRESSURE (KPA)',
        machNumber: 'MACH NUMBER',
        acceleration: 'G-FORCE (G)',
        throttle: 'THROTTLE',
      },
    },
    capture: {
      badge: 'STAGE 8 // DEBRIS CAPTURE & BERTHING OPERATION',
      title: 'Precision Capture & Mechanical Latching',
      subtitle: 'Attitude matching, grapple engagement, and spin dampening',
      targetObject: 'Target Object',
      targetMass: 'Target Mass',
      tumbleRate: 'Tumble Rate',
      relativeVel: 'Relative Velocity',
      captureEnvelope: 'Safe Capture Envelope',
      triggerCapture: 'EXECUTE CAPTURE SEQUENCE',
      synchronizing: 'Attitude matching and synchronizing spin...',
      tumbleZeroed: 'Tumble rate neutralized. Berthing lock secured (0.0°/s)',
      successTitle: 'CAPTURE SUCCESSFUL!',
      failureTitle: 'CAPTURE FAILED!',
      proceedToDisposal: 'PROCEED TO SAFE DISPOSAL',
      cameras: {
        dockingHud: '1. Docking Nav-HUD Cam',
        armCam: '2. Arm End-Effector Cam',
        chaseCam: '3. External Chase Cam',
        free: '4. Free 3D Orbit',
      },
      steps: {
        sync: '1. Spin Synchronization',
        deploy: '2. Deploy Capture Mechanism',
        latch: '3. Mechanical Contact Latch',
        stabilize: '4. Tumble Neutralization & Berthing',
      },
      tools: {
        roboticArm: '7-DOF Articulated Robotic Arm',
        deployableNet: 'Pneumatic Deployable Dyneema Net',
        harpoonTether: 'High-Velocity Harpoon & Tether',
        magneticGecko: 'Magnetic & Gecko Gripper Clamp',
      },
    },
    disposal: {
      badge: 'STAGE 9 // CONTROLLED DEORBIT & SAFE DISPOSAL',
      title: 'Orbital Deceleration & Point Nemo Atmospheric Incineration',
      subtitle: 'Hypersonic 2,500°C plasma ablation and oceanic splashdown',
      stackMass: 'Total Stack Mass (Craft + Debris)',
      fuelRemaining: 'Fuel Remaining',
      deorbitDeltaV: 'Required Delta-V',
      requiredFuel: 'Required Fuel Consumption',
      selectStrategy: 'SELECT DISPOSAL STRATEGY',
      strategies: {
        reentry: {
          name: 'Atmospheric Reentry (Point Nemo)',
          desc: 'Retrograde burn drops perigee to 45 km for full atmospheric incineration over the oceanic pole of inaccessibility.',
          destination: 'South Pacific Oceanic Uninhabited Area (Point Nemo)',
        },
        graveyard: {
          name: 'Graveyard Orbit Boost (+350 km)',
          desc: 'Boosts satellite stack +350 km above GEO to indefinitely park in the graveyard disposal belt.',
          destination: 'Graveyard Orbit (GEO +350 km)',
        },
        dragSail: {
          name: 'Deploy Aerodynamic Drag Sail',
          desc: 'Unfurls a 25 m² reflective sail to increase atmospheric drag and induce decay over 3-5 years.',
          destination: 'Upper Mesosphere (Passive Decay)',
        },
      },
      phases: {
        retrogradeFlip: '1. Stack rotated 180° into retrograde orientation',
        burnActive: '2. Heavy deorbit burn active (Deceleration Δv applied)',
        entryInterface: '3. Atmospheric entry interface crossed (h < 85 km)',
        hypersonicPlasma: '4. Mach 25 hypersonic plasma envelope formed (T > 2500°C)',
        aerodynamicBreakup: '5. Extreme dynamic pressure causes catastrophic fragment breakup',
        pointNemoSplash: '6. Surviving dense core splashes down safely in Point Nemo cemetery',
        graveyardParked: 'Safely boosted into permanent graveyard storage orbit',
      },
      telemetry: {
        plasmaTemp: 'PLASMA TEMPERATURE',
        entryAltitude: 'ENTRY ALTITUDE',
        mach: 'MACH SPEED',
        impactZone: 'IMPACT ZONE',
        groundCasualtyRisk: 'GROUND CASUALTY RISK: 0.00% (NOMINAL SAFE)',
      },
      executeBurn: 'EXECUTE DEORBIT RETROGRADE BURN',
      proceedToReport: 'VIEW FLIGHT EVALUATION REPORT',
    },
    nav: {
      badge: 'STAGE 5 // ORBITAL TRANSFER & HOHMANN MANEUVER',
      title: 'Hohmann Transfer Trajectory Calculation',
      currentOrbit: 'Current Orbit',
      targetOrbit: 'Target Orbit',
      hohmannTransfer: 'Hohmann Transfer',
      burn1: 'Burn 1: Raise Perigee',
      burn2: 'Burn 2: Circularize Apogee',
      relativeDist: 'Distance to Debris',
      rendezvousComplete: 'Transfer complete! Co-orbital distance reduced to 45 km',
      fireBurn: 'EXECUTE BURN',
      proceedToDetection: 'PROCEED TO TARGET DETECTION',
    },
    detection: {
      badge: 'STAGE 6 // MULTI-SPECTRAL SENSOR SCANNING',
      title: '3D Flash LiDAR & Optical NavCam Debris Assessment',
      sensorModes: {
        optical: 'Optical NavCam',
        lidar: '3D Flash LiDAR',
        radar: 'Microwave Radar',
        thermal: 'Thermal Infrared (IR)',
      },
      targetAcquired: 'Target acquired in tracking gate',
      scanComplete: 'Target 3D envelope and rotation axis resolved',
      tumbleAnalysis: 'Tumble analysis completed',
      proceedToApproach: 'PROCEED TO PROXIMITY APPROACH',
    },
    approach: {
      badge: 'STAGE 7 // PROXIMITY APPROACH & SYNCHRONIZATION',
      title: 'Relative Velocity Nulling & Attitude Synchronization',
      manualControls: 'RCS Thruster Control Inputs',
      fireForward: 'Forward RCS (+X)',
      fireRetro: 'Retrograde Braking (-X)',
      fireLateral: 'Lateral RCS (Y/Z)',
      killRelativeVel: 'Kill Relative Velocity',
      warningHighVel: 'CAUTION: Relative velocity > 0.25 m/s causes collision risk!',
      alignmentOptimal: 'Attitude and approach corridor nominal',
      proceedToCapture: 'PROCEED TO CAPTURE PHASE',
    },
    aiAssistant: {
      name: 'SANSAR-AI',
      role: 'Mongolian Mission Control Assistant',
      intro: "Greetings, Engineer! I am SANSAR-AI, your mission guide. We are launching Mongolia's autonomous orbital sustainability mission to safeguard Earth's orbits from hazardous debris.",
      designLabHelp: 'Ensure your electrical power balance is positive and Delta-V exceeds mission requirements. Negative power will cause an orbital blackout!',
      rocketLabHelp: 'Rocket payload capacity must strictly exceed the spacecraft wet mass. A light rocket is cheaper, but cannot lift heavy servicing modules into polar orbit.',
      launchHelp: 'Monitor engine ignition, aerodynamic Max-Q pressure, and staging separation as the Mongolian flagship ascends into orbit.',
      orbitHelp: 'Execute Hohmann transfer burns to match target altitude. In orbital mechanics, firing retrograde lowers orbit and speeds up catch-up time!',
      detectionHelp: 'Utilize 3D Flash LiDAR and Optical NavCam to track target rotation axis, tumble rate, and capture hardpoints.',
      approachHelp: 'Keep relative velocity strictly under 0.25 m/s to prevent collision and catastrophic secondary fragmentation.',
      captureHelp: 'Trigger the robotic arm or deployable net within the safe envelope to secure the derelict object.',
      disposalHelp: 'Command a retrograde burn to direct perigee into Point Nemo (South Pacific Ocean) for safe atmospheric incineration.',
      successMessage: 'Outstanding achievement! Mission accomplished. You have permanently eliminated a critical collision threat from LEO!',
    },
    ranks: {
      cadet: 'Space Cadet',
      juniorEngineer: 'Junior Flight Engineer',
      spaceEngineer: 'Space Systems Engineer',
      missionCommander: 'Mission Commander',
      chiefEngineer: 'Chief Aerospace Engineer',
    },
  },
};

/**
 * Text-to-speech voice narration supporting Mongolian or English
 */
export function speakText(text: string, lang: Language = 'mn') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    const voices = window.speechSynthesis.getVoices();
    if (lang === 'mn') {
      const mnVoice = voices.find(v => v.lang.startsWith('mn') || v.name.toLowerCase().includes('mongol'));
      if (mnVoice) utterance.voice = mnVoice;
      else utterance.lang = 'mn-MN';
    } else {
      const enVoice = voices.find(v => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
      else utterance.lang = 'en-US';
    }

    window.speechSynthesis.speak(utterance);
  } catch {}
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
