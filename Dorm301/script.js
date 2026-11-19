const intro = document.getElementById("intro");
const introText = document.getElementById("introText");
const introTitle = document.getElementById("introTitle");

const startBtn = document.getElementById("startBtn");
const introChoices = document.getElementById("introChoices");

const checkPhoneBtn = document.getElementById("checkPhoneBtn");
const sleepBtn = document.getElementById("sleepBtn");

startBtn.addEventListener("click", function() {
    intro.dataset.stage = "choice";
    introTitle.textContent = "深夜来讯";
    startBtn.hidden = true;
    introText.textContent = "嗡嗡嗡————你枕边的手机振动起来";
    introChoices.hidden = false;
    checkPhoneBtn.focus({ preventScroll: true });
});

checkPhoneBtn.addEventListener("click", function() {
    intro.classList.add("hidden");
    phoneScreen.parentElement.inert = false;
});

sleepBtn.addEventListener("click", function() {
    intro.dataset.stage = "ending";
    introTitle.textContent = "结局";
    introText.textContent = "解锁结局————沉默的睡神：天大的事都没我睡觉重要！";
    introChoices.hidden = true;
    startBtn.textContent = "重新开始";
    startBtn.hidden = false;
    startBtn.focus({ preventScroll: true });
});

const phoneScreen = document.querySelector(".screen");
const unlockPhone = document.getElementById("unlockPhone");
const launcher = document.getElementById("launcher");
const launcherViewport = document.getElementById("launcherViewport");
const launcherTrack = document.getElementById("launcherTrack");
const launcherPages = [...launcherTrack.children];
const pageButtons = [...launcher.querySelectorAll(".launcher-pagination button")];
const wechatScreen = document.getElementById("wechatScreen");
const wechatBack = document.getElementById("wechatBack");
let currentPage = 0;
let gesture;
let suppressClick = false;

const iconPaths = {
    wechat: "M19 13.5a5.5 5.5 0 0 1-5.8 5.2 7 7 0 0 1-2-.3l-2.4 1 .5-2A5 5 0 0 1 7.5 13c.3-2.8 3-4.8 6-4.6s5.6 2.4 5.5 5.1Z M6 14a5 5 0 0 1-3-4.5C3 6.5 6 4 9.5 4c2.8 0 5 1.4 6 3.6 M4.7 13l-.7 2.8 2.7-1.3 M8 8.5h.1 M11.8 8.5h.1 M11.5 12.7h.1 M15.2 12.7h.1",
    clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M12 7v5l3 2",
    gallery: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z M4 16l5-5 4 4 2-2 5 5 M15 8h.1",
    calendar: "M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z M8 3v4m8-4v4M4 10h16m-11 4h2m3 0h1m-6 3h2",
    settings: "M10 3h4l.6 2.4 2 .9 2.2-1.2 2 3.5-1.7 1.8v2.4l1.7 1.8-2 3.5-2.2-1.2-2 .9L14 21h-4l-.6-2.4-2-.9-2.2 1.2-2-3.5 1.7-1.8v-2.4L3.2 9.4l2-3.5 2.2 1.2 2-.9Z M14.8 12a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0Z",
    penguin: "M12 3c3.5 0 5.5 3.3 5.5 7l2 5-2 1v2.5l-3 1H9l-2.5-1V16l-2-1 2-5C6.5 6.3 8.5 3 12 3Z M10 8h.1m3.8 0h.1m-3.5 2.5 1.5.8 1.5-.8M8.5 13c1.5 1 5.5 1 7 0",
    weather: "M7 18a4 4 0 0 1-.6-8 5.5 5.5 0 0 1 10.5 1 3.5 3.5 0 1 1 .5 7Z",
    store: "M5 8h14l1 12H4L5 8Zm4 1V6a3 3 0 0 1 6 0v3",
    calculator: "M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M9 7h6m-6 5h.1m2.9 0h.1m2.9 0h.1M9 16h.1m2.9 0h.1m2.9 0h.1",
    keyboard: "M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z M6 10h.1m3.9 0h.1m3.9 0h.1m3.9 0h.1M8 14h8",
    translate: "M3 6h11m-5-3v3m3 0c-.5 4-3 7-8 10m2-7c1 3 3 5 5 6m1 6 4.5-11L21 21m-7-4h5",
    book: "M12 6c-3-2-6-2-9-1v13c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1v13",
    search: "M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-2 4.5 5.5 5.5",
    train: "M8 3h8a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm-3 8h14M9 14h.1m5.9 0h.1M8 18l-2 3m10-3 2 3",
    music: "M9 18a3 2.5 0 1 1-3-2.5c1.7 0 3 1.1 3 2.5Zm0 0V6l11-3v12m0 0a3 2.5 0 1 1-3-2.5c1.7 0 3 1.1 3 2.5ZM9 10l11-3",
    browser: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M3 12h18M12 3c-4 4-4 14 0 18 4-4 4-14 0-18Z",
    game: "M8 7h8c3 0 4 2 4.5 4.5l1 4c.6 2.8-2.4 4.1-4 2.3l-2-2.3h-7l-2 2.3c-1.6 1.8-4.6.5-4-2.3l1-4C4 9 5 7 8 7Zm-1 5h4m-2-2v4m7-2h.1m2-1h.1",
    cart: "M3 4h2l3 11h10l2-7H6m3 12h.1m8 0h.1",
    video: "M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z M10 9l5 3-5 3V9Z",
    notes: "M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M14 3v5h5M8 12h8m-8 4h6",
    activity: "M3 12h4l2.5-6 4.5 11 2-5h5",
    mail: "M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z M4 7l8 6 8-6",
    compass: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M16 8l-2 6-6 2 2-6 6-2Z",
    map: "m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15",
    tv: "M5 7h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Zm4-4 3 4 3-4m-6 9 2 2m4-2-2 2",
    tools: "m6 18 8-8a5 5 0 0 1 5-6l-2 3 1 1 3-2a5 5 0 0 1-6 5l-8 8a1 1 0 0 1-1-1ZM4 4l5 5m-5-5 2 1m-2-1 1 2m9 9 5 5",
    phone: "M7 4 4 6c0 7 7 14 14 14l2-3-4-3-2 2c-3-1-5-3-6-6l2-2-3-4Z",
    contacts: "M15.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM5 20v-1a7 7 0 0 1 14 0v1H5Z",
    messages: "M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 5h8m-8 3h5",
    camera: "M4 8h4l2-3h4l2 3h4a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm11.5 5.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z",
};

function createApp(name) {
    const isWechat = name === "wechat";
    const app = document.createElement(isWechat ? "button" : "div");
    const icon = document.createElement("span");
    const label = document.createElement("span");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const outline = document.createElementNS(svg.namespaceURI, "path");

    app.className = "launcher-app";
    icon.className = "launcher-app-icon";
    icon.setAttribute("aria-hidden", "true");
    svg.setAttribute("viewBox", "0 0 24 24");
    outline.setAttribute("d", iconPaths[name]);
    svg.append(outline);
    icon.append(svg);
    label.className = "launcher-app-label";
    label.textContent = isWechat ? "微信" : "Locked";

    if (isWechat) {
        app.type = "button";
        app.id = "wechatApp";
        icon.classList.add("wechat-icon");
        app.addEventListener("click", openWechat);
    }

    app.append(icon, label);
    return app;
}

const primaryApps = ["wechat", "clock", "gallery", "calendar", "settings", "penguin", "weather", "store"];
const secondaryApps = [
    "calculator", "keyboard", "translate", "book", "search", "train", "music", "browser", "game", "cart",
    "video", "notes", "activity", "mail", "compass", "map", "tv", "tools",
];
const dockApps = ["phone", "contacts", "messages", "camera"];
document.getElementById("launcherPrimaryApps").append(...primaryApps.map(createApp));
launcherPages[1].append(...secondaryApps.map(createApp));
document.getElementById("launcherDock").append(...dockApps.map(createApp));

function unlock() {
    phoneScreen.classList.add("is-unlocked");
    launcher.hidden = false;
    pageButtons[0].focus({ preventScroll: true });
}

function showPage(index) {
    if (index < 0 || index >= launcherPages.length || index === currentPage) return;

    const focusWasOnPage = launcherPages[currentPage].contains(document.activeElement);
    launcherPages[currentPage].inert = true;
    pageButtons[currentPage].removeAttribute("aria-current");
    currentPage = index;
    launcherPages[currentPage].inert = false;
    pageButtons[currentPage].setAttribute("aria-current", "page");
    launcherTrack.style.setProperty("--offset", `${-100 * currentPage}%`);
    if (focusWasOnPage) pageButtons[currentPage].focus({ preventScroll: true });
}

function openWechat() {
    showWechatOverview(false);
    launcher.hidden = true;
    wechatScreen.hidden = false;
    wechatBack.focus({ preventScroll: true });
}

checkPhoneBtn.addEventListener("click", () => unlockPhone.focus({ preventScroll: true }));
unlockPhone.addEventListener("click", unlock);
pageButtons.forEach((button, index) => button.addEventListener("click", () => showPage(index)));
wechatBack.addEventListener("click", () => {
    if (!rulesViewer.hidden) {
        closeRules();
        return;
    }
    if (openConversation) {
        hideWechatStatic();
        wechatTitle.textContent = contactsView ? "通讯录" : "微信";
        wechatOverview.hidden = false;
        wechatThread.hidden = true;
        wechatBack.setAttribute("aria-label", "返回桌面");
        openConversation.focus({ preventScroll: true });
        openConversation = undefined;
        activeContact = undefined;
        chapter.refreshNotice();
        return;
    }
    wechatScreen.hidden = true;
    launcher.hidden = false;
    wechatApp.focus({ preventScroll: true });
});

phoneScreen.addEventListener("keydown", event => {
    if (!launcher.hidden && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        showPage(currentPage + (event.key === "ArrowRight" ? 1 : -1));
    } else if (!phoneScreen.classList.contains("is-unlocked") && event.key === "ArrowUp") {
        event.preventDefault();
        unlock();
    }
});

phoneScreen.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    const locked = !phoneScreen.classList.contains("is-unlocked");
    if (!locked && (launcher.hidden || !launcherViewport.contains(event.target))) return;

    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, locked };
    event.target.setPointerCapture(event.pointerId);
});

phoneScreen.addEventListener("pointerup", event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (gesture.locked && Math.hypot(dx, dy) > 16) suppressClick = true;
    if (gesture.locked && dy < -44 && -dy > Math.abs(dx) * 1.2) {
        suppressClick = true;
        unlock();
    } else if (!gesture.locked && Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        suppressClick = true;
        showPage(currentPage + (dx < 0 ? 1 : -1));
    }
    gesture = undefined;
});

phoneScreen.addEventListener("lostpointercapture", event => {
    if (gesture?.id === event.pointerId) gesture = undefined;
});

phoneScreen.addEventListener("click", event => {
    if (suppressClick && event.detail > 0) {
        event.stopPropagation();
        suppressClick = false;
    }
}, true);

const conversations = [
    { name: "十九舍大群", avatar: "19", color: "fern", unread: 3, pinned: true, group: true },
    { name: "301野猪帮", avatar: "301", color: "lavender", unread: 2, group: true },
    { name: "妈妈", avatar: "妈", color: "rose", unread: 1 },
    { name: "一家人", avatar: "家", color: "fern", group: true },
    { name: "爸爸", avatar: "爸", color: "sky" },
    { name: "外婆", avatar: "婆", color: "gold" },
    { name: "外公", avatar: "公", color: "olive" },
    { name: "李桥", avatar: "李", color: "sky", unread: 1 },
    { name: "长官", avatar: "长", color: "olive" },
    { name: "黄欣", avatar: "黄", color: "gold" },
    { name: "实验搭档陈雨桐", avatar: "雨", color: "sky" },
    { name: "学委周妍", avatar: "妍", color: "rose" },
    { name: "代课许知遥", avatar: "遥", color: "lavender" },
    { name: "马原小组成员沈嘉禾", avatar: "禾", color: "fern" },
    { name: "隔壁寝室唐可", avatar: "可", color: "gold" },
    { name: "班长林晓宁", avatar: "宁", color: "olive" },
];

const wechatTitle = document.getElementById("wechatTitle");
const wechatOverview = document.getElementById("wechatOverview");
const wechatThread = document.getElementById("wechatThread");
const wechatSearch = document.getElementById("wechatSearch");
const wechatList = document.getElementById("wechatList");
const wechatChatsTab = document.getElementById("wechatChatsTab");
const wechatContactsTab = document.getElementById("wechatContactsTab");
const wechatNotification = document.getElementById("wechatNotification");
const wechatApp = document.getElementById("wechatApp");
const totalUnread = conversations.reduce((total, contact) => total + (contact.unread || 0), 0);
let contactsView = false;
let openConversation;

function createUnreadBadge(count) {
    const badge = document.createElement("span");
    badge.className = "wechat-unread";
    badge.textContent = count;
    badge.setAttribute("aria-label", `${count} 条未读消息`);
    return badge;
}

function renderWechatList() {
    const term = wechatSearch.value.trim().toLowerCase();
    const matches = conversations.filter(contact =>
        (!contactsView || !contact.group) && `${contact.name} ${contact.role || ""}`.toLowerCase().includes(term));
    if (contactsView) matches.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    wechatList.replaceChildren();
    if (matches.length === 0) {
        const empty = document.createElement("p");
        empty.className = "wechat-empty";
        empty.textContent = "没有找到联系人或群聊";
        wechatList.append(empty);
        return;
    }

    for (const contact of matches) {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "wechat-row";
        row.dataset.contact = contact.name;
        const avatar = document.createElement("span");
        avatar.className = `wechat-avatar ${contact.color}`;
        avatar.textContent = contact.avatar;
        avatar.setAttribute("aria-hidden", "true");
        const identity = document.createElement("span");
        identity.className = "wechat-identity";
        const name = document.createElement("strong");
        name.textContent = contact.name;
        identity.append(name);
        if (contact.role) {
            const role = document.createElement("span");
            role.textContent = contact.role;
            identity.append(role);
        }
        row.append(avatar, identity);
        if (!contactsView) {
            const details = document.createElement("span");
            details.className = "wechat-details";
            if (contact.pinned) {
                row.classList.add("wechat-pinned");
                const pin = document.createElement("span");
                pin.textContent = "置顶";
                details.append(pin);
            }
            if (contact.unread) details.append(createUnreadBadge(contact.unread));
            row.append(details);
        }
        row.addEventListener("click", () => showWechatThread(contact, row));
        wechatList.append(row);
    }
}

function showWechatOverview(showContacts) {
    contactsView = showContacts;
    wechatTitle.textContent = showContacts ? "通讯录" : "微信";
    wechatList.setAttribute("aria-label", showContacts ? "联系人列表" : "会话列表");
    wechatSearch.setAttribute("aria-label", showContacts ? "搜索联系人" : "搜索联系人或群聊");
    wechatSearch.value = "";
    const activeTab = showContacts ? wechatContactsTab : wechatChatsTab;
    const inactiveTab = showContacts ? wechatChatsTab : wechatContactsTab;
    activeTab.setAttribute("aria-current", "page");
    inactiveTab.removeAttribute("aria-current");
    renderWechatList();
    wechatList.scrollTop = 0;
}

wechatSearch.addEventListener("input", () => {
    renderWechatList();
    wechatList.scrollTop = 0;
});
wechatChatsTab.addEventListener("click", () => showWechatOverview(false));
wechatContactsTab.addEventListener("click", () => showWechatOverview(true));
wechatNotification.addEventListener("click", () => {
    unlock();
    openWechat();
});

document.getElementById("wechatNotificationIcon").append(wechatApp.querySelector("svg").cloneNode(true));

const playerName = "萝卜";
const roommateNames = new Set(["李桥", "长官", "黄欣"]);
const stickerLabels = ["哭哭脸", "探头", "得意脸", "笑眯眯", "比手势", "竖大拇指"];
const storyThreads = {
    "妈妈": { messages: [
        { time: "昨晚 21:18" },
        { from: "妈妈", text: "在干嘛" },
        { from: playerName, text: "写作业" },
        { from: "妈妈", text: "加油！" },
        { from: "妈妈", text: "早点睡。" },
    ] },
    "爸爸": { messages: [
        { time: "昨晚 19:25" },
        { from: "爸爸", text: "钱够花不？" },
        { from: playerName, text: "够了" },
        { from: "爸爸", text: "行" },
    ] },
    "外婆": { messages: [
        { time: "昨晚 18:50" },
        { from: "playerName", text: "婆婆我好想你" },
        { from: "外婆", text: "在学校好好学习，元旦节又见面了" },
        { from: playerName, text: "好。" },
    ] },
    "外公": { messages: [
        { time: "昨晚 17:32" },
        { from: "外公", text: "那个天气预报怎么变成北京了呢？我点了半天找不到成都。" },
        { from: playerName, text: "右上角有三个点，你点进去搜成都。" },
    ] },
    "一家人": {
        messages: [
            { time: "昨晚 19:40" },
            { from: "外公", text: "屋里还有番茄不？要买不" },
            { from: "外婆", text: "多得很，你莫买" },
            { from: "外公", text: "萝卜：给你寄的衣服收到没" },
            { from: playerName, text: "拿到了，我衣柜都要爆了" },
        ],
    },
    "李桥": { messages: [
        { time: "昨晚 22:12" },
        { from: playerName, text: "媳妇明天早八签到给我说一声" },
        { from: "李桥", text: "你坤" },
    ] },
    "长官": { messages: [
        { time: "昨晚 19:42" },
        { from: playerName, text: "长官" },
        { from: playerName, text: "长官" },
        { from: "长官", text: "干嘛" },
        { from: playerName, text: "不干嘛，想你了" },
        { from: "长官", text: "。。。。" },
        { from: playerName, sticker: 6 },
    ] },
    "黄欣": { messages: [
        { time: "昨晚 11:06" },
        { from: playerName, text: "签到了吗" },
        { from: "黄欣", text: "刚刚下课签了啊" },
        { from: playerName, text: "完了，我拉屎去了" },
    ] },
    "实验搭档陈雨桐": { messages: [
        { time: "昨晚 20:54" },
        { from: "实验搭档陈雨桐", text: "实验报告明晚九点前交，老师说每人一份 PDF，原始数据可以共用。" },
        { from: playerName, text: "第三次那个数是 3.42？我本子被水打湿了。" },
        { from: "实验搭档陈雨桐", text: "对，我刚翻了照片。图的纵轴记得写单位。" },
    ] },
    "学委周妍": { messages: [
        { time: "昨晚 21:02" },
        { from: "学委周妍", text: "明天概率统计换到 B204 了，八点照旧。你看到回个 1，我统计一下。" },
        { from: playerName, text: "1。谢谢，差点又跑错楼。" },
    ] },
    "代课许知遥": { messages: [
        { time: "昨晚 20:31" },
        { from: "代课许知遥", text: "不好意思宝宝，周四早八我有事" },
        { from: playerName, text: "行" },
    ] },
    "马原小组成员沈嘉禾": { messages: [
        { time: "昨晚 22:03" },
        { from: "马原小组成员沈嘉禾", text: "马原展示你讲第二部分哈。PPT 我合好了，每个人控制在三分钟。" },
        { from: playerName, text: "好" },
    ] },
    "隔壁寝室唐可": { messages: [
        { time: "昨晚 22:26" },
        { from: "隔壁寝室唐可", text: "今晚该你们寝室打扫卫生" },
        { from: playerName, text: "收到" },
    ] },
    "班长林晓宁": { messages: [
        { time: "昨晚 19:58" },
        { from: "班长林晓宁", text: "班级信息表还差你那一格，学号最后两位发我一下就好。" },
        { from: playerName, text: "我在表里补了，班长" },
    ] },
    "301野猪帮": {
        messages: [
            { time: "昨晚 22:43" },
            { from: "长官", text: "明天早八谁去上" },
            { time: "昨晚 22:48" },
            { from: playerName, text: "貌似没人想去呢" },
            { from: "黄欣", text: "那我去吧" },
            { from: "长官", text: "妈妈" },
            { from: "李桥", text: "妈妈" },
            { from: playerName, text: "妈妈" },
            { time: "昨晚 22:51" },
            { from: playerName, text: "谁陪我刷校园跑" },
            { from: playerName, text: "老子还差七次" },
            { from: "李桥", text: "明晚去嘛" },
            { from: playerName, sticker: 4 },
        ],
        incoming: [
            { delay: 450, from: "长官", text: "尼玛什么声音" },
            { delay: 1450, from: "李桥", text: "不知道啊我靠，你们看那个十九舍大群" },
            { delay: 2500, from: "黄欣", text: "我去这是啥" },
        ],
    },
    "十九舍大群": {
        memberCount: 244,
        pinnedRules: true,
        messages: [
            { time: "昨晚 22:48" },
            { from: "407 小何", text: "有谁把蓝色雨伞落一楼饮水机旁边了？我给挪到窗台上了。" },
            { from: "209 小蒋", text: "我的我的，明早去拿，谢谢！" },
            { time: "00:35" },
            { from: "未命名", text: "十九舍住宿规则已更新。请核对。" },
            { from: "未命名", rules: true },
            { system: "未命名置顶了一条消息" },
            { time: "00:36" },
        ],
        incoming: [
            { delay: 1200, from: "407 小何", text: "什么东西在响，我们整个寝室都被吵醒了？？？？" },
            { delay: 2300, from: "209 小蒋", text: "？" },
            { delay: 3700, from: "512 小唐", text: "我手机除了微信都点不开了" },
            { delay: 5100, from: "316 小冯", text: "这个未知用户是谁，好吓人" },
            { delay: 6800, from: "602 小徐", text: "有点像恐怖片了..." },
            { delay: 8300, from: "118 小郑", text: "像我看的无限流小说" },
            { delay: 10000, from: "209 小蒋", text: "有人知道这是什么情况吗？" },
            { delay: 11900, system: "未命名开启了全员禁言", mute: true },
        ],
    },
};

const threadMessages = document.getElementById("threadMessages");
const threadMembers = document.getElementById("threadMembers");
const pinnedRules = document.getElementById("pinnedRules");
const rulesViewer = document.getElementById("rulesViewer");
const staticOverlay = document.getElementById("wechatStatic");
const lockUnreadText = document.getElementById("wechatUnreadText");
const desktopUnread = createUnreadBadge(totalUnread);
const rulesImagePath = rulesViewer.querySelector("img").getAttribute("src");
let activeThreadTitle;
let rulesOpener;
let threadScrollBeforeRules;
let hasSeenStatic = false;
let staticTimer;

function updateUnreadCount() {
    const unread = conversations.reduce((total, contact) => total + (contact.unread || 0), 0);
    lockUnreadText.textContent = `${unread} 条未读消息`;
    wechatNotification.hidden = unread === 0;
    desktopUnread.hidden = unread === 0;
    desktopUnread.textContent = unread;
    desktopUnread.setAttribute("aria-label", `${unread} 条未读消息`);
}

function playWechatStatic() {
    if (hasSeenStatic) return;
    hasSeenStatic = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    staticOverlay.hidden = false;
    staticTimer = window.setTimeout(hideWechatStatic, 660);
}

function hideWechatStatic() {
    window.clearTimeout(staticTimer);
    staticOverlay.hidden = true;
}

function openRules(opener) {
    rulesOpener = opener;
    threadScrollBeforeRules = threadMessages.scrollTop;
    wechatThread.hidden = true;
    rulesViewer.hidden = false;
    chapter.onRulesOpen();
    chapter.refreshNotice();
    rulesViewer.scrollTop = 0;
    wechatTitle.textContent = "十九舍住宿规则";
    wechatBack.setAttribute("aria-label", "返回群聊");
    rulesViewer.focus({ preventScroll: true });
}

function closeRules() {
    rulesViewer.hidden = true;
    wechatThread.hidden = false;
    threadMessages.scrollTop = threadScrollBeforeRules;
    wechatTitle.textContent = activeThreadTitle;
    wechatBack.setAttribute("aria-label", "返回会话列表");
    rulesOpener.focus({ preventScroll: true });
    chapter.refreshNotice();
}

function createThreadMessage(message) {
    if (message.time || message.system) {
        const note = document.createElement("p");
        note.className = "thread-note";
        note.textContent = message.time || message.system;
        if (message.system) note.dataset.chapterMessage = message.system;
        return note;
    }

    const row = document.createElement("article");
    const self = message.from === playerName;
    row.className = self ? "thread-message thread-self" : "thread-message";
    const sender = conversations.find(contact => contact.name === message.from);
    const avatar = document.createElement("span");
    avatar.className = `wechat-avatar ${sender?.color || (self ? "fern" : "unknown")}`;
    avatar.textContent = sender?.avatar || (self ? playerName[0] : message.from === "未命名" ? "·" : message.from.slice(-1));
    avatar.setAttribute("aria-hidden", "true");
    const body = document.createElement("div");
    const name = document.createElement("p");
    name.className = "thread-sender";
    name.textContent = message.from;
    body.append(name);

    if (message.screenshot) {
        body.className = "thread-image-body";
        const attachment = document.createElement("button");
        attachment.type = "button";
        attachment.className = "thread-attachment thread-screenshot";
        attachment.setAttribute("aria-label", message.screenshot.alt);
        const image = document.createElement("img");
        image.src = message.screenshot.src;
        image.alt = "";
        attachment.append(image);
        attachment.addEventListener("click", () => chapter.showChatScreenshot(message.screenshot));
        body.append(attachment);
    } else if (message.rules) {
        body.className = "thread-image-body";
        const attachment = document.createElement("button");
        attachment.type = "button";
        attachment.className = "thread-attachment";
        attachment.setAttribute("aria-label", "查看十九舍住宿规则原图");
        const thumbnail = document.createElement("img");
        thumbnail.src = rulesImagePath;
        thumbnail.alt = "";
        const caption = document.createElement("span");
        caption.textContent = "查看原图";
        attachment.append(thumbnail, caption);
        attachment.addEventListener("click", () => openRules(attachment));
        body.append(attachment);
    } else if (message.sticker) {
        const sticker = document.createElement("img");
        sticker.className = "thread-sticker";
        sticker.src = `assets/stickers/${message.sticker}.${message.sticker === 6 ? "png" : "jpg"}`;
        sticker.alt = stickerLabels[message.sticker - 1] + "表情包";
        body.append(sticker);
    } else {
        const bubble = document.createElement("p");
        bubble.className = "thread-bubble";
        bubble.textContent = message.text;
        body.append(bubble);
    }

    if (message.text) row.dataset.chapterMessage = message.text;
    if (message.memberId) {
        row.dataset.memberId = message.memberId;
        const profile = document.createElement("button");
        profile.type = "button";
        profile.className = avatar.className;
        profile.textContent = avatar.textContent;
        profile.setAttribute("aria-label", "长官头像");
        profile.addEventListener("click", () => chapter.showKick(message.memberId));
        row.append(profile, body);
    } else {
        row.append(avatar, body);
    }
    if (message.failed) {
        const failure = document.createElement("span");
        failure.className = "thread-failed";
        failure.setAttribute("role", "img");
        failure.setAttribute("aria-label", "消息发送失败");
        failure.textContent = "!";
        row.append(failure);
    }
    return row;
}

function showWechatThread(contact, row) {
    const story = storyThreads[contact.name];
    const count = story?.memberCount || story?.members?.length;
    openConversation = row;
    activeContact = contact;
    replyPanelOpen = false;
    chatDirectForm.reset();
    activeThreadTitle = count ? `${contact.name}（${count}）` : contact.name;
    wechatTitle.textContent = activeThreadTitle;
    threadMembers.hidden = !story?.members;
    threadMembers.textContent = story?.members?.join("、") || "";
    pinnedRules.hidden = !story?.pinnedRules;
    if (story) {
        threadMessages.replaceChildren(...story.messages.map(createThreadMessage));
    } else {
        const empty = document.createElement("p");
        empty.className = "thread-note";
        empty.textContent = "暂无聊天记录";
        threadMessages.replaceChildren(empty);
    }

    wechatOverview.hidden = true;
    wechatThread.hidden = false;
    updateThreadControls();
    threadMessages.scrollTop = threadMessages.scrollHeight;
    wechatBack.setAttribute("aria-label", contactsView ? "返回通讯录" : "返回会话列表");
    wechatBack.focus({ preventScroll: true });
    if (story?.pinnedRules) playWechatStatic();
    readConversation(contact, row);
    startTimeline(contact, story?.incoming);
    chapter.setDraftLabel(chatReplyToggle.querySelector("span"));
    chapter.onOpen(contact.name);
}

pinnedRules.addEventListener("click", () => openRules(pinnedRules));
wechatApp.append(desktopUnread);
updateUnreadCount();

const chatComposer = document.getElementById("chatComposer");
const startedTimelines = new Set();
let activeContact;

const roomGroupName = "301野猪帮";
const chatQuickReplies = document.getElementById("chatQuickReplies");
const chatMuted = document.getElementById("chatMuted");

const chatReplyToggle = document.getElementById("chatReplyToggle");
const chatDirectForm = document.getElementById("chatDirectForm");
const directInput = chatDirectForm.querySelector("input");
function hasScriptedReplies(name) {
    return name === roomGroupName || name === "十九舍大群" || roommateNames.has(name);
}
chatDirectForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!activeContact || hasScriptedReplies(activeContact.name) || activeContact.muted) return;
    const text = directInput.value.trim();
    if (!text) return;
    chatDirectForm.reset();
    sendChatMessage(text);
});
let replyPanelOpen = false;

function updateThreadControls() {
    const muted = Boolean(activeContact?.muted);
    const scripted = activeContact && hasScriptedReplies(activeContact.name);
    const replies = !scripted ? [] : activeContact.name === roomGroupName ? chapter.replyOptions() : chapter.contactReplies(activeContact.name);
    const draft = activeContact?.name === roomGroupName && chapter.hasDraft();
    const expanded = replyPanelOpen && !muted && replies.length > 0 && !draft;
    chatReplyToggle.hidden = !scripted;
    chatDirectForm.hidden = Boolean(scripted);
    chatMuted.hidden = !muted;
    chatComposer.hidden = muted || Boolean(scripted && replies.length === 0 && !draft);
    chatReplyToggle.setAttribute("aria-expanded", String(expanded));
    chatQuickReplies.hidden = !expanded;
    chatQuickReplies.replaceChildren();
    if (!expanded) return;

    for (const reply of replies) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = reply;
        button.addEventListener("click", () => {
            sendChatMessage(reply);
            chatReplyToggle.focus({ preventScroll: true });
        });
        chatQuickReplies.append(button);
    }
}

chatReplyToggle.addEventListener("click", () => {
    if (!chapter.canOpenReplies()) return;
    const wasAtBottom = threadMessages.scrollHeight - threadMessages.scrollTop - threadMessages.clientHeight < 50;
    replyPanelOpen = !replyPanelOpen;
    updateThreadControls();
    if (wasAtBottom) threadMessages.scrollTop = threadMessages.scrollHeight;
});

wechatThread.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !replyPanelOpen) return;
    replyPanelOpen = false;
    updateThreadControls();
    chatReplyToggle.focus({ preventScroll: true });
});

function scheduleStoryMessages(contact, entries) {
    for (const { delay, mute, ...message } of entries) {
        window.setTimeout(() => {
            if (mute) {
                contact.muted = true;
                if (activeContact === contact) updateThreadControls();
            }
            deliverMessage(contact, message);
            if (mute) chapter.start();
        }, delay);
    }
}

function readConversation(contact, row) {
    if (!contact.unread) return;
    contact.unread = 0;
    row.querySelector(".wechat-unread")?.remove();
    updateUnreadCount();
}

function deliverMessage(contact, message, fromPlayer = false) {
    storyThreads[contact.name].messages.push(message);
    chapter.onMessage(contact.name, message, fromPlayer);
    if (activeContact === contact) {
        const isNearBottom = threadMessages.scrollHeight - threadMessages.scrollTop - threadMessages.clientHeight < 50;
        threadMessages.append(createThreadMessage(message));
        if (fromPlayer || isNearBottom) threadMessages.scrollTop = threadMessages.scrollHeight;
        chapter.refreshNotice();
        return;
    }

    contact.unread = (contact.unread || 0) + 1;
    const row = [...wechatList.children].find(child => child.dataset.contact === contact.name);
    const details = row?.querySelector(".wechat-details");
    details?.querySelector(".wechat-unread")?.remove();
    details?.append(createUnreadBadge(contact.unread));
    updateUnreadCount();
}

function startTimeline(contact, incoming) {
    if (!incoming || startedTimelines.has(contact.name)) return;
    startedTimelines.add(contact.name);
    scheduleStoryMessages(contact, incoming);
}

function sendChatMessage(text) {
    const contact = activeContact;
    if (!text || !contact || contact.muted) return;
    replyPanelOpen = false;
    updateThreadControls();
    if (contact.name === roomGroupName) {
        chapter.selectReply(text);
        return;
    }

    if (roommateNames.has(contact.name)) {
        chapter.choosePrivateReply(contact.name, text);
        return;
    }

    deliverMessage(contact, { from: playerName, text, failed: contact.name !== "十九舍大群" }, true);
    chapter.afterSend(contact.name);
}
