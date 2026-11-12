const cdnBase = "https://www." + "gstatic.com" + "/firebasejs/10.8.0/";
const { initializeApp } = await import(cdnBase + "firebase-app.js");
const { getDatabase, ref, set, get, update, onValue } = await import(cdnBase + "firebase-database.js");

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

const HEROES = {
    lira: { name: "🩸 Лира", soul: 20, fials: 5, inv: ["boots", "potion", "blood_harp"], desc: "Магия крови. Ловушки лечат (+10 Души). Старт: 20 HP." },
    melissa: { name: "🛡️ Мелисса", soul: 55, fials: 10, inv: ["boots", "potion"], desc: "Непробиваемая стена. Повышенный запас Души (55 HP)." },
    crayd: { name: "⚔️ Крэйд", soul: 40, fials: 20, inv: ["boots", "potion"], desc: "Шаги по 5-6 клеток. Бонус при сужении карты." },
    rios: { name: "🔪 Риос", soul: 45, fials: 10, inv: ["boots", "potion"], desc: "Шаги по 1-3 клетки. Шанс восстановить +1 Души при ходе." },
    diessa: { name: "🎵 Диесса", soul: 35, fials: 35, inv: ["boots", "potion", "ballad"], desc: "Телепортируется при попадании в капкан." }
};

const ITEMS = {
    boots: { name: "🥾 Сапоги (+4 шага)" },
    potion: { name: "🧪 Экстракт (+15 Души)" },
    blood_harp: { name: "🩸 Арфа крови (Капканы)" },
    ballad: { name: "🎵 Баллада (Лечение)" }
};

const EVENTS = {
    empty_waste: { text: "🏜️ Пустошь: ветер гонит песок. Спокойный шаг.", fials: 0, soul: 0, skip: false },
    statue: { text: "🗿 Статуя в песках: найден тайник! (+5 фиалов)", fials: 5, soul: 0, skip: false },
    kara_riosa: { text: "🏛️ Кара Риоса: молитва у руин укрепляет Душу. (+5 Души)", fials: 0, soul: 5, skip: false },
    scorpenid: { text: "🦂 Ловушка Скорпенида! (-5 Души и пропуск хода)", fials: 0, soul: -5, skip: true },
    taraxacum_event: { text: "🌱 Заросли Тараксакума! Яростный выпад чудовища. (-15 Души)", fials: 0, soul: -15, skip: false }
};

let selectedHero = "melissa";
let currentRoomId = null;
let myRole = null;
let gameState = null;

const heroListEl = document.getElementById("hero-list");
Object.entries(HEROES).forEach(([id, h]) => {
    const div = document.createElement("div");
    div.className = "hero-card" + (id === selectedHero ? " selected" : "");
    
    const title = document.createElement("h3");
    title.innerText = h.name;
    const desc = document.createElement("p");
    desc.innerText = h.desc;
    
    div.appendChild(title);
    div.appendChild(desc);
    
    div.onclick = () => {
        document.querySelectorAll(".hero-card").forEach(el => el.classList.remove("selected"));
        div.classList.add("selected");
        selectedHero = id;
    };
    heroListEl.appendChild(div);
});

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
            status: "waiting",
            boardMemory: {},
            logs: ["🌀 Игрок 1 (" + h.name + ") открыл разлом в измерении Зикс. Ожидаем соперника..."],
            p1: { hero: selectedHero, name: h.name, pos: 1, soul: h.soul, fials: h.fials, inv: [...h.inv], skip: false },
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

    if (!snapshot.exists()) return alert("Комната не найдена! Проверьте код.");
    const data = snapshot.val();
    if (data.p2) return alert("В этой комнате уже два игрока!");

    const h = HEROES[selectedHero];
    const updatedLogs = [...(data.logs || []), "😈 Игрок 2 (" + h.name + ") вошел в измерение! Дуэль началась."];

    await update(roomRef, {
        status: "playing",
        logs: updatedLogs,
        p2: { hero: selectedHero, name: h.name, pos: 60, soul: h.soul, fials: h.fials, inv: [...h.inv], skip: false }
    });

    enterRoom(roomCode, "p2");
};

function enterRoom(roomCode, role) {
    currentRoomId = roomCode;
    myRole = role;
    document.getElementById("lobby-screen").classList.remove("active");
    document.getElementById("game-screen").classList.add("active");
    document.getElementById("display-room-id").innerText = roomCode;

    onValue(ref(db, "rooms/" + roomCode), (snapshot) => {
        gameState = snapshot.val();
        if (gameState) renderGame();
    });
}

function renderGame() {
    const s = gameState;
    document.getElementById("board-size-text").innerText = s.size;

    const turnEl = document.getElementById("turn-status");
    const rollBtn = document.getElementById("btn-roll");

    if (s.status === "waiting") {
        turnEl.innerText = "⏳ Ждем второго игрока...";
        turnEl.className = "turn-indicator wait";
        rollBtn.disabled = true;
    } else if (s.status === "finished") {
        turnEl.innerText = "🏁 Испытание завершено!";
        turnEl.className = "turn-indicator";
        rollBtn.disabled = true;
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
    document.getElementById("p1-name").innerText = "👤 " + s.p1.name + (myRole === "p1" ? " (Вы)" : "");
    document.getElementById("p1-stats").innerText = "❤️ Душа: " + s.p1.soul + " | 🪙 Фиалы: " + s.p1.fials + " | 📍 Кл: " + s.p1.pos;

    if (s.p2) {
        document.getElementById("p2-box").className = "player-box" + (myRole === "p2" ? " me" : "");
        document.getElementById("p2-name").innerText = "😈 " + s.p2.name + (myRole === "p2" ? " (Вы)" : "");
        document.getElementById("p2-stats").innerText = "❤️ Душа: " + s.p2.soul + " | 🪙 Фиалы: " + s.p2.fials + " | 📍 Кл: " + s.p2.pos;
    }

    const boardEl = document.getElementById("game-board");
    boardEl.innerHTML = "";
    const mem = s.boardMemory || {};

    for (let i = 1; i <= s.size; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        if (mem[i]) cell.classList.add(mem[i]);

        let icons = "";
        if (s.p1 && s.p1.pos === i) icons += "👤";
        if (s.p2 && s.p2.pos === i) icons += "😈";
        if (!icons && mem[i]) {
            if (mem[i] === "empty_waste") icons = "⚪";
            else if (mem[i] === "statue") icons = "🟡";
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

    const invEl = document.getElementById("inventory-list");
    invEl.innerHTML = "";
    const me = s[myRole];
    if (me && me.inv) {
        me.inv.forEach((itemKey, idx) => {
            const btn = document.createElement("button");
            btn.className = "item-btn";
            btn.innerText = ITEMS[itemKey].name;
            btn.disabled = (s.status !== "playing" || s.turn !== myRole);
            btn.onclick = () => useItem(idx, itemKey);
            invEl.appendChild(btn);
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
    let logMsg = "🎲 " + me.name + " делает шаг на " + steps + " кл. (позиция " + me.pos + "). ";

    if (me.pos > s.size) {
        me.pos = 1;
        s.size = Math.max(15, s.size - 2);
      logMsg += "🔥 Край измерения сгорел! Поле сжалось до " + s.size + " клеток. ";
        if (me.hero === "crayd") { me.soul += 5; me.fials += 5; }
    } else if (me.pos < 1) {
        me.pos = s.size;
        s.size = Math.max(15, s.size - 2);
        logMsg += "🔥 Край измерения сгорел! Поле сжалось до " + s.size + " клеток. ";
        if (me.hero === "crayd") { me.soul += 5; me.fials += 5; }
    }

    if (enemy.pos > s.size) enemy.pos = s.size;

    if (me.pos === enemy.pos) {
        s.status = "finished";
        let winnerText = "";
        if (me.soul > enemy.soul) winnerText = "🏆 Побеждает " + me.name + " (Душа: " + me.soul + " против " + enemy.soul + ")!";
        else if (enemy.soul > me.soul) winnerText = "🏆 Побеждает " + enemy.name + " (Душа: " + enemy.soul + " против " + me.soul + ")!";
        else winnerText = me.fials >= enemy.fials ? "🏆 Ничья по Душе, но по фиалам побеждает " + me.name + "!" : "🏆 По фиалам побеждает " + enemy.name + "!";

        s.logs.push("⚔️ СТОЛКНОВЕНИЕ ЛОБ В ЛОБ НА КЛЕТКЕ " + me.pos + "! " + winnerText);
        await set(ref(db, "rooms/" + currentRoomId), s);
        return;
    }

    if (!s.boardMemory) s.boardMemory = {};
    let evKey = s.boardMemory[me.pos];
    if (!evKey) {
        const pool = ["empty_waste", "empty_waste", "empty_waste", "statue", "statue", "kara_riosa", "scorpenid", "taraxacum_event"];
        evKey = pool[Math.floor(Math.random() * pool.length)];
        s.boardMemory[me.pos] = evKey;
    } else {
        logMsg += "[Повторная метка] ";
    }

    const ev = EVENTS[evKey];
    logMsg += ev.text;
    me.fials += ev.fials;
    me.soul = Math.min(100, Math.max(0, me.soul + ev.soul));

    if (ev.skip) {
        if (me.hero === "diessa") {
            me.pos = Math.floor(Math.random() * s.size) + 1;
            logMsg += " 🎵 Диесса разрушает оковы и телепортируется на клетку " + me.pos + "!";
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
        msg = "🧪 " + me.name + " выпивает Экстракт Воли (+15 Души).";
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
        msg = "🥾 " + me.name + " использует Сапоги Скитальца и переносится на клетку " + me.pos + "!";
    }

    s.logs.push(msg);
    await set(ref(db, "rooms/" + currentRoomId), s);
}
