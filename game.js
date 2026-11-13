const cdnBase = "https://www." + "gstatic.com" + "/firebasejs/10.8.0/";
const { initializeApp } = await import(cdnBase + "firebase-app.js");
const { getDatabase, ref, set, get, update, onValue } = await import(cdnBase + "firebase-database.js");

const tgScript = document.createElement("script");
tgScript.src = "https://telegram." + "org/js/telegram-web-app.js";
tgScript.onload = () => {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            profile.name = tg.initDataUnsafe.user.first_name || profile.name;
            saveProfile();
            updateProfileUI();
        }
    }
};
document.head.appendChild(tgScript);

const firebaseConfig = {
    apiKey: "AIzaSyCpJpYoKXw1OqWn1MLnAXSSv8TsPgLwxw8",
    authDomain: "neverdellzix" + ".firebaseapp.com",
    databaseURL: "https://neverdellzix-default-rtdb.europe-west1." + "firebasedatabase.app",
    projectId: "neverdellzix",
    storageBucket: "neverdellzix" + ".firebasestorage.app",
    messagingSenderId: "952625363716",
    appId: "1:952625363716:web:23b7884d0c47730a06ee51",
    measurementId: "G-727YHG2MNP"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let profile = JSON.parse(localStorage.getItem("zix_profile")) || {
    name: "Скиталец",
    wins: 0,
    games: 0,
    totalFials: 0,
    lastHero: "melissa",
    lastRegion: "shteld"
};

function saveProfile() {
    localStorage.setItem("zix_profile", JSON.stringify(profile));
}

function updateProfileUI() {
    document.getElementById("prof-name").innerText = profile.name;
    document.getElementById("prof-wins").innerText = profile.wins;
    document.getElementById("prof-games").innerText = profile.games;
    document.getElementById("prof-fials").innerText = profile.totalFials;
}
updateProfileUI();

const HEROES = {
    lira: { icon: "🩸", name: "🩸 Лира", soul: 20, fials: 5, inv: ["boots", "potion", "blood_harp"], desc: "Ловушки лечат (+10 Души). Старт: 20 HP." },
    melissa: { icon: "🛡️", name: "🛡️ Мелисса", soul: 55, fials: 10, inv: ["boots", "potion"], desc: "Непробиваемая стена. Повышенный запас Души (55 HP)." },
    crayd: { icon: "⚔️", name: "⚔️ Крэйд", soul: 40, fials: 20, inv: ["boots", "potion"], desc: "Шаги по 5-6 клеток. Бонус при сужении карты." },
    rios: { icon: "🔪", name: "🔪 Риос", soul: 45, fials: 10, inv: ["boots", "potion"], desc: "Шаги по 1-3 клетки. Шанс восстановить +1 Души." },
    diessa: { icon: "🎵", name: "🎵 Диесса", soul: 35, fials: 35, inv: ["boots", "potion", "ballad"], desc: "Телепортируется при попадании в капкан." }
};

const REGIONS = {
    shteld: { name: "🏜️ Штельд", desc: "Пустынные руины. Баланс фиалов, капканов и чудовищ.", pool: ["empty_waste", "empty_waste", "statue", "statue", "kara_riosa", "scorpenid", "taraxacum_event"] },
    gems: { name: "💎 Царство Самоцветов", desc: "Богатые хрустальные жилы (+10 фиалов), но мало лечения.", pool: ["empty_waste", "empty_waste", "crystal_mine", "crystal_mine", "scorpenid", "taraxacum_event"] },
    blood_college: { name: "🩸 Кровавая Коллегия", desc: "Алые сгустки: много исцеления и ловушек.", pool: ["empty_waste", "kara_riosa", "kara_riosa", "scorpenid", "scorpenid", "statue"] },
    agna: { name: "🎭 Агна", desc: "Королевство ядов: повышенный шанс капканов и богатых тайников.", pool: ["empty_waste", "statue", "crystal_mine", "scorpenid", "scorpenid", "taraxacum_event"] }
};

const ITEMS = {
    boots: { name: "🥾 Сапоги (+4 шага)", buy: 10, sell: 5 },
    potion: { name: "🍷 Экстракт (+15 Души)", buy: 12, sell: 6 },
    blood_harp: { name: "🩸 Арфа крови", buy: 18, sell: 9 },
    ballad: { name: "🎵 Баллада", buy: 15, sell: 7 },
    aegis: { name: "🛡️ Щит Эгиды (Блок)", buy: 14, sell: 7 },
    swap_orb: { name: "🔮 Сфера Сдвига", buy: 20, sell: 10 }
};

function generateShopStock() {
    const allKeys = Object.keys(ITEMS);
    const stock = [];
    for (let i = 0; i < 5; i++) {
        stock.push(allKeys[Math.floor(Math.random() * allKeys.length)]);
    }
    return stock;
}

const EVENTS = {
    empty_waste: { text: "🏜️ Пустошь: ветер гонит песок. Спокойный шаг.", fials: 0, soul: 0, skip: false },
    statue: { text: "🗿 Статуя в песках: найден тайник! (+5 фиалов)", fials: 5, soul: 0, skip: false },
    crystal_mine: { text: "💎 Жила кристаллов: россыпь осколков! (+10 фиалов)", fials: 10, soul: 0, skip: false },
    kara_riosa: { text: "🏛️ Кара Риоса: молитва у руин укрепляет Душу. (+5 Души)", fials: 0, soul: 5, skip: false },
    scorpenid: { text: "🦂 Ловушка Скорпенида! (-5 Души и пропуск хода)", fials: 0, soul: -5, skip: true },
    taraxacum_event: { text: "🌱 Заросли Тараксакума! Яростный выпад чудовища. (-15 Души)", fials: 0, soul: -15, skip: false }
};

let selectedHero = profile.lastHero || "melissa";
let selectedRegion = profile.lastRegion || "shteld";
let currentRoomId = null;
let myRole = null;
let gameState = null;
let matchRecorded = false;
let timerInterval = null;
let roulettePlayed = false;

function renderLobbySelectors() {
    const heroListEl = document.getElementById("hero-list");
    Object.entries(HEROES).forEach(([id, h]) => {
        const div = document.createElement("div");
        div.className = "select-card" + (id === selectedHero ? " selected" : "");
        const title = document.createElement("h3");
        title.innerText = h.name;
        const desc = document.createElement("p");
        desc.innerText = h.desc;
        div.appendChild(title);
        div.appendChild(desc);
        div.onclick = () => {
            heroListEl.querySelectorAll(".select-card").forEach(el => el.classList.remove("selected"));
            div.classList.add("selected");
            selectedHero = id;
            profile.lastHero = id;
            saveProfile();
        };
        heroListEl.appendChild(div);
    });

    const regListEl = document.getElementById("region-list");
    Object.entries(REGIONS).forEach(([id, r]) => {
        const div = document.createElement("div");
        div.className = "select-card" + (id === selectedRegion ? " selected" : "");
        const title = document.createElement("h3");
        title.innerText = r.name;
        const desc = document.createElement("p");
        desc.innerText = r.desc;
        div.appendChild(title);
        div.appendChild(desc);
        div.onclick = () => {
            regListEl.querySelectorAll(".select-card").forEach(el => el.classList.remove("selected"));
            div.classList.add("selected");
            selectedRegion = id;
            profile.lastRegion = id;
            saveProfile();
        };
        regListEl.appendChild(div);
    });
}
renderLobbySelectors();

document.getElementById("btn-copy-code").onclick = () => {
    if (!currentRoomId) return;
    navigator.clipboard.writeText(currentRoomId).then(() => {
        const btn = document.getElementById("btn-copy-code");
        btn.innerText = "✅ Скопировано!";
        setTimeout(() => { btn.innerText = "📋 Копировать"; }, 2000);
    });
};

document.getElementById("btn-create").onclick = async () => {
    const btn = document.getElementById("btn-create");
    btn.disabled = true;
    btn.innerText = "⏳ Создание разлома...";
    try {
        const roomCode = "ZIX-" + Math.floor(1000 + Math.random() * 9000);
        const h = HEROES[selectedHero];
        
        const initialData = {
            size: 60,
            turn: "p1",
            turnStart: Date.now(),
            status: "waiting",
            activeRegion: selectedRegion,
            shopStock: generateShopStock(),
            winner: null,
            boardMemory: {},
            logs: ["🌀 " + profile.name + " (" + h.name + ") открыл разлом. Предпочтение: " + REGIONS[selectedRegion].name + "."],
            p1: { userName: profile.name, hero: selectedHero, icon: h.icon, name: h.name, regionChoice: selectedRegion, pos: 1, soul: h.soul, fials: h.fials, inv: [...h.inv], skip: false },
            p2: null
        };

        await set(ref(db, "rooms/" + roomCode), initialData);
        enterRoom(roomCode, "p1");
    } catch (err) {
        alert("Ошибка базы данных: " + err.message);
        btn.disabled = false;
        btn.innerText = "⚔️ Создать новую комнату";
    }
};

document.getElementById("btn-join").onclick = async () => {
    const roomCode = document.getElementById("room-input").value.trim().toUpperCase();
    if (!roomCode) return alert("Введите код комнаты!");

    const roomRef = ref(db, "rooms/" + roomCode);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) return alert("Комната не найдена!");
    const data = snapshot.val();
    if (data.p2) return alert("Комната уже заполнена!");

    const h = HEROES[selectedHero];
    const chosenReg = Math.random() < 0.5 ? data.p1.regionChoice : selectedRegion;
    const updatedLogs = [
        ...(data.logs || []),
        "😈 " + profile.name + " (" + h.name + ") вошел в разлом! Рулетка 50/50 выбрала: " + REGIONS[chosenReg].name + "!"
    ];

    await update(roomRef, {
        status: "playing",
        activeRegion: chosenReg,
        turnStart: Date.now(),
        logs: updatedLogs,
        p2: { userName: profile.name, hero: selectedHero, icon: h.icon, name: h.name, regionChoice: selectedRegion, pos: 60, soul: h.soul, fials: h.fials, inv: [...h.inv], skip: false }
    });

    enterRoom(roomCode, "p2");
};

function enterRoom(roomCode, role) {
    currentRoomId = roomCode;
    myRole = role;
    matchRecorded = false;
    roulettePlayed = false;
    document.getElementById("lobby-screen").classList.remove("active");
    document.getElementById("game-screen").classList.add("active");
    document.getElementById("display-room-id").innerText = roomCode;

    onValue(ref(db, "rooms/" + roomCode), (snapshot) => {
        gameState = snapshot.val();
        if (gameState) renderGame();
    });

    startTurnTimer();
}

function startTurnTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(async () => {
        if (!gameState || gameState.status !== "playing") {
            document.getElementById("turn-timer").innerText = "⏱️ --";
            return;
        }
        const elapsed = Math.floor((Date.now() - (gameState.turnStart || Date.now())) / 1000);
        const left = Math.max(0, 30 - elapsed);
        document.getElementById("turn-timer").innerText = "⏱️ " + left + "с";

        if (left === 0 && gameState.turn === myRole) {
            const s = JSON.parse(JSON.stringify(gameState));
            const enemyRole = myRole === "p1" ? "p2" : "p1";
            s.logs.push("⌛ Время вышло! " + s[myRole].name + " не успел походить, ход переходит сопернику.");
            s.turn = enemyRole;
            s.turnStart = Date.now();
            await set(ref(db, "rooms/" + currentRoomId), s);
        }
    }, 1000);
}

function playRouletteAnimation(finalRegionId) {
    const box = document.getElementById("roulette-box");
    box.style.display = "block";
    const keys = Object.keys(REGIONS);
    let ticks = 0;
    const anim = setInterval(() => {
        const randKey = keys[ticks % keys.length];
        box.innerText = "🎰 Рулетка территорий (50/50): " + REGIONS[randKey].name + "...";
        ticks++;
        if (ticks > 12) {
            clearInterval(anim);
            box.innerText = "✨ Выпала территория: " + REGIONS[finalRegionId].name + "!";
            setTimeout(() => { box.style.display = "none"; }, 3500);
        }
    }, 120);
}

document.getElementById("btn-rematch").onclick = async () => {
    if (!gameState || !gameState.p1 || !gameState.p2) return;
    const h1 = HEROES[gameState.p1.hero];
    const h2 = HEROES[gameState.p2.hero];
    const chosenReg = Math.random() < 0.5 ? gameState.p1.regionChoice : gameState.p2.regionChoice;

    const rematchData = {
        size: 60,
        turn: gameState.turn === "p1" ? "p2" : "p1",
        turnStart: Date.now(),
        status: "playing",
        activeRegion: chosenReg,
        shopStock: generateShopStock(),
        winner: null,
        boardMemory: {},
        logs: ["🔄 РЕВАНШ! Рулетка 50/50 выбрала: " + REGIONS[chosenReg].name + "! Прилавок торговца обновлен."],
        p1: { userName: gameState.p1.userName, hero: gameState.p1.hero, icon: h1.icon, name: h1.name, regionChoice: gameState.p1.regionChoice, pos: 1, soul: h1.soul, fials: h1.fials, inv: [...h1.inv], skip: false },
        p2: { userName: gameState.p2.userName, hero: gameState.p2.hero, icon: h2.icon, name: h2.name, regionChoice: gameState.p2.regionChoice, pos: 60, soul: h2.soul, fials: h2.fials, inv: [...h2.inv], skip: false }
    };

    await set(ref(db, "rooms/" + currentRoomId), rematchData);
};

function renderGame() {
    const s = gameState;
    const activeReg = s.activeRegion || "shteld";
    document.getElementById("active-region-label").innerText = "Королевство: " + REGIONS[activeReg].name;

    const turnEl = document.getElementById("turn-status");
    const rollBtn = document.getElementById("btn-roll");
    const rematchBtn = document.getElementById("btn-rematch");

    if (s.status === "playing") {
        matchRecorded = false;
        rematchBtn.style.display = "none";
        if (!roulettePlayed) {
            roulettePlayed = true;
            playRouletteAnimation(activeReg);
        }
    }

    if (s.status === "waiting") {
        turnEl.innerText = "⏳ Ждем второго игрока...";
        turnEl.className = "turn-indicator wait";
        rollBtn.disabled = true;
    } else if (s.status === "finished") {
        turnEl.innerText = "🏁 Испытание завершено!";
        turnEl.className = "turn-indicator";
        rollBtn.disabled = true;
        rematchBtn.style.display = "block";
        roulettePlayed = false;

        if (!matchRecorded && s[myRole]) {
            matchRecorded = true;
            profile.games += 1;
            const earned = s[myRole].fials;
            if (s.winner === myRole) {
                profile.wins += 1;
                profile.totalFials += earned;
            } else {
                profile.totalFials += Math.floor(earned * 0.3);
            }
            saveProfile();
            updateProfileUI();
        }
    } else if (s.turn === myRole) {
        turnEl.innerText = "🟢 ВАШ ХОД!";
        turnEl.className = "turn-indicator";
        rollBtn.disabled = false;
    } else {
        turnEl.innerText = "⏳ Ход соперника...";
        turnEl.className = "turn-indicator wait";
        rollBtn.disabled = true;
    }

    document.getElementById("p1-box").className = "player-box" + (myRole === "p1" ? " me" : "");
    document.getElementById("p1-name").innerText = s.p1.name + " [" + (s.p1.userName || "Игрок 1") + "]" + (myRole === "p1" ? " (Вы)" : "");
    document.getElementById("p1-stats").innerText = "❤️ Душа: " + s.p1.soul + " | 🏺 Фиалы: " + s.p1.fials;

    if (s.p2) {
        document.getElementById("p2-box").className = "player-box" + (myRole === "p2" ? " me" : "");
        document.getElementById("p2-name").innerText = s.p2.name + " [" + (s.p2.userName || "Игрок 2") + "]" + (myRole === "p2" ? " (Вы)" : "");
        document.getElementById("p2-stats").innerText = "❤️ Душа: " + s.p2.soul + " | 🏺 Фиалы: " + s.p2.fials;
    }

    const boardEl = document.getElementById("game-board");
    boardEl.innerHTML = "";
    const mem = s.boardMemory || {};

    for (let i = 1; i <= s.size; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        if (mem[i]) cell.classList.add(mem[i]);

        let icons = "";
        if (s.p1 && s.p1.pos === i) icons += (s.p1.icon || "👤");
        if (s.p2 && s.p2.pos === i) icons += (s.p2.icon || "😈");
        if (!icons && mem[i]) {
            if (mem[i] === "empty_waste") icons = "⚪";
            else if (mem[i] === "statue" || mem[i] === "crystal_mine") icons = "🟡";
            else if (mem[i] === "scorpenid") icons = "🟣";
            else icons = "🟢";
        }

        const numSpan = document.createElement("span");
        numSpan.className = "cell-num";
        numSpan.innerText = i;
        const iconSpan = document.createElement("span");
        iconSpan.innerText = icons;

        cell.appendChild(numSpan);
        cell.appendChild(iconSpan);
        boardEl.appendChild(cell);
    }

    const me = s[myRole];
    const isMyTurn = (s.status === "playing" && s.turn === myRole);

    const invEl = document.getElementById("inventory-list");
    invEl.innerHTML = "";
    if (me && me.inv) {
        me.inv.forEach((itemKey, idx) => {
            const chip = document.createElement("div");
            chip.className = "item-chip";
            const useBtn = document.createElement("button");
            useBtn.className = "item-use-btn";
            useBtn.innerText = ITEMS[itemKey].name;
            useBtn.disabled = !isMyTurn;
            useBtn.onclick = () => useItem(idx, itemKey);

            const sellBtn = document.createElement("button");
            sellBtn.className = "item-sell-btn";
            sellBtn.innerText = "+" + ITEMS[itemKey].sell + "🏺";
            sellBtn.title = "Продать торговцу";
            sellBtn.disabled = !isMyTurn;
            sellBtn.onclick = () => sellItem(idx, itemKey);

            chip.appendChild(useBtn);
            chip.appendChild(sellBtn);
            invEl.appendChild(chip);
        });
    }

    const shopEl = document.getElementById("shop-list");
    shopEl.innerHTML = "";
    const stock = s.shopStock || [];
    if (stock.length === 0) {
        const emptyMsg = document.createElement("span");
        emptyMsg.style.fontSize = "0.8rem";
        emptyMsg.style.color = "#938ca3";
        emptyMsg.innerText = "Прилавок пуст! Новый завоз будет при следующем сжатии поля.";
        shopEl.appendChild(emptyMsg);
    } else {
        stock.forEach((key, stockIdx) => {
            const item = ITEMS[key];
            if (!item) return;
            const btn = document.createElement("button");
            btn.className = "shop-buy-btn";
            btn.innerText = item.name + " (" + item.buy + "🏺)";
            btn.disabled = (!isMyTurn || !me || me.fials < item.buy);
            btn.onclick = () => buyItem(stockIdx, key);
            shopEl.appendChild(btn);
        });
    }

    const logEl = document.getElementById("event-log");
    logEl.innerHTML = "";
    (s.logs || []).slice().reverse().forEach(msg => {
        const entry = document.createElement("div");
        entry.className = "log-entry";
        entry.innerText = msg;
        logEl.appendChild(entry);
    });
}

async function buyItem(stockIdx, itemKey) {
    if (!gameState || gameState.turn !== myRole || gameState.status !== "playing") return;
    const s = JSON.parse(JSON.stringify(gameState));
    const me = s[myRole];
    const item = ITEMS[itemKey];
    if (!s.shopStock || s.shopStock[stockIdx] !== itemKey || me.fials < item.buy) return;

    me.fials -= item.buy;
    s.shopStock.splice(stockIdx, 1);
    if (!me.inv) me.inv = [];
    me.inv.push(itemKey);
    s.logs.push("⚖️ " + me.name + " выкупает с прилавка: " + item.name + " за " + item.buy + " фиалов!");
    await set(ref(db, "rooms/" + currentRoomId), s);
}

async function sellItem(idx, itemKey) {
    if (!gameState || gameState.turn !== myRole || gameState.status !== "playing") return;
    const s = JSON.parse(JSON.stringify(gameState));
    const me = s[myRole];
    const item = ITEMS[itemKey];

    me.inv.splice(idx, 1);
    me.fials += item.sell;
    s.logs.push("⚖️ " + me.name + " продает торговцу " + item.name + " (+" + item.sell + " фиалов).");
    await set(ref(db, "rooms/" + currentRoomId), s);
}

document.getElementById("btn-roll").onclick = async () => {
    if (!gameState || gameState.turn !== myRole || gameState.status !== "playing") return;

    const s = JSON.parse(JSON.stringify(gameState));
    const me = s[myRole];
    const enemyRole = myRole === "p1" ? "p2" : "p1";
    const enemy = s[enemyRole];
    const dir = myRole === "p1" ? 1 : -1;

    if (me.skip) {
        me.skip = false;
        s.logs.push("⏳ " + me.name + " пропускает ход, выбираясь из пут!");
        s.turn = enemyRole;
        s.turnStart = Date.now();
        await set(ref(db, "rooms/" + currentRoomId), s);
        return;
    }

    let steps = 1;
    if (me.hero === "crayd") {
        steps = Math.random() < 0.5 ? 5 : 6;
    } else if (me.hero === "rios") {
        steps = Math.floor(Math.random() * 3) + 1;
        if (Math.random() < 0.5) me.soul = Math.min(100, me.soul + 1);
    } else {
        const r = Math.floor(Math.random() * 10) + 1;
        steps = r <= 4 ? 1 : (r <= 8 ? 2 : 4);
    }

    me.pos += steps * dir;
    let logMsg = "🎲 " + me.name + " делает шаг на " + steps + " кл. ";

    if (me.pos > s.size) {
        me.pos = 1;
        s.size = Math.max(15, s.size - 2);
        s.shopStock = generateShopStock();
        logMsg += "🔥 Край сгорел! Поле сжалось, торговец обновил товары. ";
        if (me.hero === "crayd") { me.soul += 5; me.fials += 5; }
    } else if (me.pos < 1) {
        me.pos = s.size;
        s.size = Math.max(15, s.size - 2);
        s.shopStock = generateShopStock();
        logMsg += "🔥 Край сгорел! Поле сжалось, торговец обновил товары. ";
        if (me.hero === "crayd") { me.soul += 5; me.fials += 5; }
    }

    if (enemy.pos > s.size) enemy.pos = s.size;

    if (me.pos === enemy.pos) {
        s.status = "finished";
        let winnerText = "";
        if (me.soul > enemy.soul) {
            s.winner = myRole;
            winnerText = "🏆 Побеждает " + me.name + " (Душа: " + me.soul + " против " + enemy.soul + ")!";
        } else if (enemy.soul > me.soul) {
            s.winner = enemyRole;
            winnerText = "🏆 Побеждает " + enemy.name + " (Душа: " + enemy.soul + " против " + me.soul + ")!";
        } else {
            s.winner = me.fials >= enemy.fials ? myRole : enemyRole;
            winnerText = me.fials >= enemy.fials ? "🏆 Ничья по Душе, но по фиалам побеждает " + me.name + "!" : "🏆 По фиалам побеждает " + enemy.name + "!";
        }

        s.logs.push("⚔️ СТОЛКНОВЕНИЕ ЛОБ В ЛОБ! " + winnerText);
        await set(ref(db, "rooms/" + currentRoomId), s);
        return;
    }

    if (!s.boardMemory) s.boardMemory = {};
    let evKey = s.boardMemory[me.pos];
    if (!evKey) {
        const regPool = REGIONS[s.activeRegion || "shteld"].pool;
        evKey = regPool[Math.floor(Math.random() * regPool.length)];
        s.boardMemory[me.pos] = evKey;
    } else {
        logMsg += "[Повторная метка] ";
    }

    const ev = EVENTS[evKey];
    logMsg += ev.text;
    me.fials += ev.fials;
    me.soul = Math.min(100, Math.max(0, me.soul + ev.soul));

    if (me.soul <= 0) {
        s.status = "finished";
        s.winner = enemyRole;
        logMsg += " 💀 Душа " + me.name + " угасла в песках! Победа достается " + enemy.name + "!";
        s.logs.push(logMsg);
        await set(ref(db, "rooms/" + currentRoomId), s);
        return;
    }

    if (ev.skip) {
        const aegisIdx = (me.inv || []).indexOf("aegis");
        if (aegisIdx !== -1) {
            me.inv.splice(aegisIdx, 1);
            logMsg += " 🛡️ Щит Эгиды рассыпался, но спас от капкана!";
        } else if (me.hero === "diessa") {
            me.pos = Math.floor(Math.random() * s.size) + 1;
            logMsg += " 🎵 Диесса разрушает оковы и телепортируется!";
        } else if (me.hero === "lira") {
            me.soul = Math.min(100, me.soul + 10);
            me.skip = true;
            logMsg += " 🩸 Магия крови исцеляет Лиру (+10 Души), но ход пропущен.";
        } else {
            me.skip = true;
        }
    }

    s.logs.push(logMsg);
    s.turn = enemyRole;
    s.turnStart = Date.now();
    await set(ref(db, "rooms/" + currentRoomId), s);
};

async function useItem(idx, itemKey) {
    if (!gameState || gameState.turn !== myRole || gameState.status !== "playing") return;
    const s = JSON.parse(JSON.stringify(gameState));
    const me = s[myRole];
    const enemyRole = myRole === "p1" ? "p2" : "p1";
    const enemy = s[enemyRole];
    if (!s.boardMemory) s.boardMemory = {};

    me.inv.splice(idx, 1);
    let msg = "";

    if (itemKey === "potion") {
        me.soul = Math.min(100, me.soul + 15);
        msg = "🍷 " + me.name + " выпивает Экстракт Воли (+15 Души).";
    } else if (itemKey === "blood_harp") {
        [enemy.pos - 1, enemy.pos + 1].forEach(c => {
            if (c >= 1 && c <= s.size) s.boardMemory[c] = "scorpenid";
        });
        msg = "🩸 " + me.name + " играет на Арфе крови! Клетки вокруг соперника превращены в капканы.";
    } else if (itemKey === "ballad") {
        const dir = myRole === "p1" ? 1 : -1;
        [me.pos + dir, me.pos + dir * 3].forEach(c => {
            if (c >= 1 && c <= s.size) s.boardMemory[c] = "kara_riosa";
        });
        msg = "🎵 " + me.name + " поет Балладу Неверделла, создавая благословенные клетки впереди!";
    } else if (itemKey === "boots") {
        const dir = myRole === "p1" ? 1 : -1;
        me.pos += 4 * dir;
        if (me.pos > s.size) me.pos = 1;
        if (me.pos < 1) me.pos = s.size;
        msg = "🥾 " + me.name + " использует Сапоги Скитальца и совершает рывок вперед!";
    } else if (itemKey === "aegis") {
        me.inv.push("aegis");
        msg = "🛡️ Щит Эгиды работает пассивно — он сам сработает при попадании в капкан!";
    } else if (itemKey === "swap_orb") {
        const tempPos = me.pos;
        me.pos = enemy.pos;
        enemy.pos = tempPos;
        msg = "🔮 " + me.name + " активирует Сферу Сдвига и меняется местами с соперником!";
    }

    s.logs.push(msg);
    await set(ref(db, "rooms/" + currentRoomId), s);
}
