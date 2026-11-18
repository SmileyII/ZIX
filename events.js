export const EVENTS = {
    empty_waste: {
        text: "🏜️ Пустошь: ветер гонит песок. Спокойный шаг.",
        fials: 0,
        soul: 0,
        skip: false
    },
    statue: {
        text: "🗿 Статуя в песках: найден тайник! (+5 фиалов)",
        fials: 5,
        soul: 0,
        skip: false
    },
    crystal_mine: {
        text: "💎 Жила кристаллов: россыпь осколков! (+10 фиалов)",
        fials: 10,
        soul: 0,
        skip: false
    },
    kara_riosa: {
        text: "🏛️ Кара Риоса: молитва у руин укрепляет Душу. (+5 Души)",
        fials: 0,
        soul: 5,
        skip: false
    },
    scorpenid: {
        text: "🦂 Ловушка Скорпенида! (-5 Души и пропуск хода)",
        fials: 0,
        soul: -5,
        skip: true
    },
    taraxacum_event: {
        text: "🌱 Заросли Тараксакума! Яростный выпад чудовища. (-15 Души)",
        fials: 0,
        soul: -15,
        skip: false
    }
};
