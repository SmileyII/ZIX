export const ITEMS = {
    boots: { name: "🥾 Сапоги (+4 шага)", buy: 10, sell: 5 },
    potion: { name: "🍷 Экстракт (+15 Души)", buy: 12, sell: 6 },
    blood_harp: { name: "🩸 Арфа крови", buy: 18, sell: 9 },
    ballad: { name: "🎵 Баллада", buy: 15, sell: 7 },
    aegis: { name: "🛡️ Щит Эгиды (Блок)", buy: 14, sell: 7 },
    swap_orb: { name: "🔮 Сфера Сдвига", buy: 20, sell: 10 }
};

export function generateShopStock() {
    const allKeys = Object.keys(ITEMS);
    const stock = [];
    for (let i = 0; i < 5; i++) {
        stock.push(allKeys[Math.floor(Math.random() * allKeys.length)]);
    }
    return stock;
}

export function applyItemEffect(itemKey, state, myRole) {
    const me = state[myRole];
    const enemyRole = myRole === "p1" ? "p2" : "p1";
    const enemy = state[enemyRole];
    if (!state.boardMemory) state.boardMemory = {};

    if (itemKey === "potion") {
        me.soul = Math.min(100, me.soul + 15);
        return "🍷 " + me.name + " выпивает Экстракт Воли (+15 Души).";
    }
    if (itemKey === "blood_harp") {
        [enemy.pos - 1, enemy.pos + 1].forEach(c => {
            if (c >= 1 && c <= state.size) state.boardMemory[c] = "scorpenid";
        });
        return "🩸 " + me.name + " играет на Арфе крови! Клетки вокруг соперника превращены в капканы.";
    }
    if (itemKey === "ballad") {
        const dir = myRole === "p1" ? 1 : -1;
        [me.pos + dir, me.pos + dir * 3].forEach(c => {
            if (c >= 1 && c <= state.size) state.boardMemory[c] = "kara_riosa";
        });
        return "🎵 " + me.name + " поет Балладу Неверделла, создавая благословенные клетки впереди!";
    }
    if (itemKey === "boots") {
        const dir = myRole === "p1" ? 1 : -1;
        me.pos += 4 * dir;
        if (me.pos > state.size) me.pos = 1;
        if (me.pos < 1) me.pos = state.size;
        return "🥾 " + me.name + " использует Сапоги Скитальца и совершает рывок вперед!";
    }
    if (itemKey === "aegis") {
        me.inv.push("aegis");
        return "🛡️ Щит Эгиды работает пассивно — он сам сработает при попадании в капкан!";
    }
    if (itemKey === "swap_orb") {
        const tempPos = me.pos;
        me.pos = enemy.pos;
        enemy.pos = tempPos;
        return "🔮 " + me.name + " активирует Сферу Сдвига и меняется местами с соперником!";
    }
    return "";
}
