const chapter = (() => {
    const room = "301野猪帮";
    const building = "十九舍大群";
    const panel = document.getElementById("chapterPanel");
    const heading = document.getElementById("chapterTitle");
    const body = document.getElementById("chapterBody");
    const actions = document.getElementById("chapterActions");
    const task = document.getElementById("chapterTask");
    const timerText = document.getElementById("chapterTimer");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const timers = new Set();
    let choices = new Map();
    let pending;
    let checkpoint;
    let busy = false;
    let ended = false;
    let started = false;
    let phase = "序幕";
    let deadline = 0;
    let clockInterval;
    let groupSize = 4;
    let sawBedClue = false;
    let momAttempt = false;
    let roomVisits = 0;
    let shownMessageAlteration = false;
    let ruleGlitch = false;

    function later(ms, callback) {
        const handle = setTimeout(() => {
            timers.delete(handle);
            if (!ended) callback();
        }, ms);
        timers.add(handle);
    }

    function clearTimers() {
        for (const handle of timers) clearTimeout(handle);
        timers.clear();
        stopClock();
    }

    function contact(name) { return conversations.find(item => item.name === name); }
    function emit(name, message) { deliverMessage(contact(name), message); }
    function note(text, name = room) { emit(name, { system: text }); }
    function dialogue(name, lines, done = () => {}, initial = 240) {
        lines.forEach(([from, text, memberId], index) => {
            later(initial + index * 480, () => emit(name, { from, text, memberId }));
        });
        later(initial + lines.length * 480, done);
    }

    function setTime(time, label) {
        phase = label;
        document.querySelector(".status-time").textContent = time;
        emit(room, { time });
    }

    const audio = chapterAudio.play;

    function button(label, run) {
        const item = document.createElement("button");
        item.type = "button";
        item.textContent = label;
        item.addEventListener("click", run);
        return item;
    }

    function show(title, lines, options = [], dark = false) {
        panel.hidden = false;
        panel.classList.toggle("chapter-dark", dark);
        phoneScreen.classList.add("chapter-overlay");
        wechatScreen.inert = true;
        launcher.inert = true;
        heading.textContent = title;
        body.replaceChildren(...lines.map(line => {
            const text = document.createElement("p");
            text.textContent = line;
            return text;
        }));
        actions.replaceChildren(...options.map(([label, run]) => button(label, run)));
        panel.scrollTop = 0;
        heading.focus({ preventScroll: true });
        refreshNotice();
    }

    function close() {
        panel.hidden = true;
        phoneScreen.classList.remove("chapter-overlay");
        wechatScreen.inert = false;
        launcher.inert = false;
        refreshNotice();
        (!task.hidden ? task : wechatBack).focus({ preventScroll: true });
        closeKick();
    }

    function refreshNotice() {
        const canShow = pending && activeContact?.name === pending.name && !wechatScreen.hidden && !wechatThread.hidden && panel.hidden;
        if (canShow && !pending.seen) {
            const marker = [...threadMessages.children].reverse().find(item => item.dataset.chapterMessage === pending.anchor);
            if (marker) {
                const viewport = threadMessages.getBoundingClientRect();
                const rect = marker.getBoundingClientRect();
                const pixels = Math.min(rect.bottom, viewport.bottom) - Math.max(rect.top, viewport.top);
                if (pixels >= Math.min(rect.height / 2, 14)) {
                    pending.seen = true;
                    chapterAudio.notice(true);
                    pending.onSeen?.();
                }
            }
        }
        task.hidden = !canShow || !pending.seen;
        timerText.hidden = !deadline || activeContact?.name !== room;
    }

    function offer(label, open, { anchor = pending?.anchor, name = pending?.name || room, onSeen } = {}) {
        pending = { label, open, name, anchor, onSeen, seen: pending?.anchor === anchor && pending?.name === name && pending.seen };
        task.querySelector("strong").textContent = label;
        refreshNotice();
    }

    function clearOffer() {
        pending = undefined;
        refreshNotice();
    }

    threadMessages.addEventListener("scroll", refreshNotice, { passive: true });
    task.addEventListener("click", () => {
        if (pending?.seen && activeContact?.name === pending.name) pending.open();
    });
    const backOption = ["返回微信", close];

    function ask(entries) {
        choices = new Map(entries);
        if (activeContact?.name === room) updateThreadControls();
    }

    function replyOptions() { return [...choices.keys()]; }

    function selectReply(text) {
        const handler = choices.get(text);
        if (!handler || ended || busy || activeContact?.name !== room) return false;
        ask([]);
        if (text !== "不回复") deliverMessage(contact(room), { from: playerName, text }, true);
        handler();
        return true;
    }

    function stopClock() {
        clearInterval(clockInterval);
        deadline = 0;
        timerText.hidden = true;
    }

    function beginCheckpoint(start) {
        const names = [room, building, ...roommates];
        const savedReplies = new Map(privateReplies);
        const logs = names.map(name => storyThreads[name].messages.slice());
        const states = names.map(name => ({ unread: contact(name).unread, muted: contact(name).muted }));
        checkpoint = () => {
            clearTimers();
            ended = false;
            busy = false;
            privateReplies.clear();
            for (const [name, options] of savedReplies) privateReplies.set(name, options);
            deviceNote.hidden = true;
            panel.classList.remove("chapter-ending", "chapter-distortion");
            clearOffer();
            ask([]);
            names.forEach((name, index) => {
                Object.assign(contact(name), states[index]);
                storyThreads[name].messages = logs[index].slice();
            });
            close();
            if (!rulesViewer.hidden) closeRules();
            renderWechatList();
            if (activeContact) {
                const row = [...wechatList.children].find(item => item.dataset.contact === activeContact.name);
                showWechatThread(activeContact, row || openConversation);
            }
            updateUnreadCount();
            start();
        };
        start();
    }

    function ending(title, lines, win = false) {
        if (ended) return;
        if (wechatScreen.hidden) {
            if (launcher.hidden) unlock();
            openWechat();
        }
        ended = true;
        clearTimers();
        closeKick();
        deviceNote.hidden = true;
        chapterAudio.stop(undefined, 0.15);
        document.querySelector(".network-text").textContent = "5G";
        rulesViewer.querySelector("img").classList.remove("rule-image-glitch");
        clearOffer();
        ask([]);
        show(title, lines, [], true);
        panel.classList.add("chapter-ending");
        window.setTimeout(() => {
            if (!ended || heading.textContent !== title) return;
            const label = win ? "重新开始第一章" : "重新进行刚刚的剧情";
            actions.append(button(label, win ? () => location.reload() : checkpoint || (() => location.reload())));
        }, reducedMotion.matches ? 650 : 1450);
    }

    function refreshMembers() {
        if (activeContact?.name !== room) return;
        activeThreadTitle = `${room}（${groupSize}）`;
        wechatTitle.textContent = activeThreadTitle;
        threadMembers.hidden = false;
        threadMembers.textContent = groupSize === 4 ? "萝卜、李桥、长官、黄欣" : `群成员：${groupSize}`;
    }

    function networkEffect(text) {
        const status = document.querySelector(".network-text");
        status.textContent = text;
        later(1700, () => { status.textContent = "5G"; });
    }

    const firstReplies = {
        "牛逼黑客入侵了": [["李桥", "我靠黑客闲得慌啊"], ["长官", "特么的"]],
        "这是啥规则怪谈吗": [["长官", "啥意思"], ["李桥", "你没看过恐怖小说啊"]],
        "好困": [["李桥", "猪"]],
    };

    function start() {
        if (started) return;
        started = true;
        setTime("00:37", "只有微信能用");
        later(1250, () => openPrivateScene("first"));
        later(2650, deviceGlitch);
        dialogue(room, [["李桥", "我靠"], ["李桥", "怎么禁言了"], ["长官", "尼玛"], ["长官", "这啥东西啊"],
            ["黄欣", "不知道"], ["李桥", "你们手机其他软件能打开不"], ["长官", "不能"], ["黄欣", "我也不行"]], () => {
            ask(Object.entries(firstReplies).map(([label, response]) => [label, () => {
                dialogue(room, response, () => {
                    emit(room, { from: "李桥", text: "那我给隔壁唐可发个消息问问" });
                    dialogue(room, [["李桥", "发不出去"], ["长官", "我也是"]], () => later(8500, () => beginCheckpoint(footsteps)), 1450);
                });
            }]));
        });
    }

    function afterSend(name) {
        if (name !== "妈妈" || momAttempt || ended) return;
        momAttempt = true;
        setTimeout(() => emit("妈妈", { from: "妈妈", text: "早点睡。" }), 4600);
    }

    function onOpen(name) {
        refreshNotice();
        if (name === "长官") beginOfficerMessages();
        if (name !== room) return;
        const group = contact(building);
        if (!started) startTimeline(group, storyThreads[building].incoming);
        roomVisits++;
        if (bedClueReady && !sawBedClue) {
            sawBedClue = true;
            note("301寝室成员已全部返回床位。");
        }
        if (roomVisits >= 2 && bedClueReady && !shownMessageAlteration) {
            const message = storyThreads[room].messages.find(item => item.text === "我在床上。");
            if (message) {
                shownMessageAlteration = true;
                message.text = "我在你床上。";
                threadMessages.replaceChildren(...storyThreads[room].messages.map(createThreadMessage));
                threadMessages.scrollTop = threadMessages.scrollHeight;
            }
        }
        refreshMembers();
    }

    let bedClueReady = false;
    function footsteps() {
        dialogue(room, [["李桥", "算了"], ["李桥", "先别管手机了"], ["李桥", "我刚刚听到有人下床"]], () => {
            later(850, () => {
                emit(room, { from: "李桥", text: "你们谁下去了" });
                setTime("00:39", "有人下床了");
                openPrivateScene("footsteps");
                dialogue(room, [["长官", "？"], ["黄欣", "没"]], () => {
                    ask(["我没下", "我靠你别吓我", "隔壁的吧"].map(label => [label, hearFootsteps]));
                });
            });
        });
    }

    function hearFootsteps() {
        dialogue(room, [["李桥", "不是"], ["李桥", "就在我们寝室"], ["长官", "尼玛我也没动"], ["李桥", "真的"], ["李桥", "我听到拖鞋声了"]], () => {
            audio("slippers");
            function continueScene() {
                clearOffer();
                dialogue(room, [["黄欣", "我也听到了"], ["李桥", "我靠"], ["长官", "你们都别下床了"], ["李桥", "谁下了啊"]], () => {
                    ask(["先别乱动", "你们确定都在床上？", "看看是不是窗户响"].map(label => [label, () => {
                        bedClueReady = true;
                        const responses = label === "你们确定都在床上？" ? [["李桥", "我在啊"], ["黄欣", "在"], ["长官", "在"], ["李桥", "我在床上。"]] : [];
                        dialogue(room, responses, () => later(2100, nextRandomEvent));
                    }]));
                });
            }
            offer("放下手机听一听", () => {
                clearOffer();
                show("", [], [], true);
                later(560, () => audio("creak"));
                later(1350, () => { audio("buzz"); close(); continueScene(); });
            }, { anchor: "我听到拖鞋声了" });
            later(4300, () => { if (pending?.label === "放下手机听一听") continueScene(); });
        });
    }

    const eventQueue = [inspection, curtain, repair];
    eventQueue.splice(Math.floor(Math.random() * eventQueue.length), 1);
    function nextRandomEvent() {
        const event = eventQueue.shift();
        beginCheckpoint(event || duplicateOfficer);
    }

    function finishRandomEvent() {
        clearOffer();
        close();
        later(850, nextRandomEvent);
    }

    function inspection() {
        setTime("00:40", "卫生检查登记");
        const title = "十九舍卫生登记助手";
        const done = () => {
            note("已保留原始登记状态。");
            later(350, () => note("301寝室尚未完成本周登记。"));
            finishRandomEvent();
        };
        const assign = () => show(title, ["检查日期：周三。", "当前记录状态：待接待。", "请指定一名学生留寝配合检查人员。"], [
            ...[playerName, "李桥", "长官", "黄欣"].map(name => [name, () => show(title, [`${name}将在00:45负责接待本次检查。`, "是否确认？"], [
                ["确认夜间接待", () => {
                    show(title, ["登记成功。", "301寝室夜间来访预约已创建。", "来访者正在前往301。"]);
                    later(450, () => audio("steps"));
                    later(1100, () => ending("热心接待", ["本次登记已锁定。", "您已主动预约夜间来访。", "感谢您的配合。"]));
                }], ["取消夜间接待", done], backOption,
            ])]), ["稍后处理", done], backOption,
        ]);
        note(`${title}：本周三301寝室卫生检查记录未完善。`);
        offer("卫生检查登记", () => show(title, ["本周三301寝室卫生检查记录未完善。", "请指定一位留寝学生完成核验。"], [
            ["补充登记", assign], ["查看详情", assign], ["稍后处理", done], backOption,
        ]), { anchor: `${title}：本周三301寝室卫生检查记录未完善。` });
    }

    function curtain() {
        setTime("00:41", "床帘上的手");
        dialogue(room, [["李桥", "我靠"], ["李桥", "谁在拉我床帘"], ["长官", "？"], ["黄欣", "没动"],
            ["李桥", "不是"], ["李桥", "我真的看到动了一下"], ["李桥", "又动了"]], () => {
            ask(["媳妇你是不是睡迷糊了", "你看看是谁", "先别管"].map(label => [label, () => {
                emit(room, { from: "李桥", text: "我不敢拉" });
                offer("恢复亮度", () => show("屏幕亮度已降低", ["是否恢复亮度？"], [["恢复亮度", () => {
                    show("", [], [], true);
                    panel.classList.add("chapter-bright");
                    later(360, () => { panel.classList.remove("chapter-bright"); curtainView(); });
                }], backOption], true), { anchor: "我不敢拉" });
            }]));
        });
    }

    function curtainView() {
        const safe = () => {
            chapterAudio.stop("fabric", 0.10);
            clearOffer();
            close();
            dialogue(room, [["李桥", "媳妇"], ["李桥", "你刚刚看见了吗"]], () => {
                ask([["看见了", () => dialogue(room, [["李桥", "你怎么看到的"], ["李桥", "我床帘根本没打开过啊"]], finishRandomEvent)],
                    ["没看见", finishRandomEvent], ["不回复", finishRandomEvent]]);
            });
        };
        const observe = () => {
            actions.replaceChildren();
            later(2000, safe);
        };
        show("床帘外", [], [["继续观察", observe], ["轻轻挪动床帘", enableDrag], ["放下手机", safe]], true);
        const slit = document.createElement("div");
        slit.className = "curtain-slit";
        const scene = document.createElement("img");
        scene.src = "assets/curtain-view.png";
        scene.alt = "";
        slit.append(scene);
        audio("fabric");
        slit.setAttribute("role", "img");
        slit.setAttribute("aria-label", "窄缝外，一道人影背对你坐在床边");
        body.append(slit);

        function enableDrag() {
            const edge = button("拖动床帘边缘", () => {});
            edge.className = "curtain-edge";
            edge.setAttribute("aria-label", "床帘边缘，可向右拖动或按右方向键");
            slit.append(edge);
            actions.replaceChildren(button("松手，不再看", safe));
            let progress = 0;
            let dragStart;
            let initial;
            function move(value) {
                progress = Math.max(0, Math.min(1, value));
                slit.style.setProperty("--curtain-scale", String(1 + progress * 0.48));
                if (progress >= 0.65) chapterAudio.stop("fabric");
                if (progress < 1) return;
                dragStart = undefined;
                show("", [], [], true);
                chapterAudio.stop();
                later(950, () => ending("惊扰", ["你看见我了。", "第8条核验未通过。", "请不要惊扰床边的室友。"]));
            }
            edge.addEventListener("pointerdown", event => {
                dragStart = event.clientX;
                initial = progress;
                edge.setPointerCapture(event.pointerId);
            });
            edge.addEventListener("pointermove", event => {
                if (dragStart !== undefined) move(initial + (event.clientX - dragStart) / (slit.clientWidth * 0.66));
            });
            edge.addEventListener("lostpointercapture", () => { dragStart = undefined; });
            edge.addEventListener("keydown", event => {
                if (event.key === "ArrowRight") { event.preventDefault(); move(progress + 0.125); }
                if (event.key === "ArrowLeft") { event.preventDefault(); move(progress - 0.125); }
            });
            edge.focus();
        }
    }

    function repair() {
        setTime("00:42", "报修回执");
        const title = "十九舍智能报修助手";
        dialogue(room, [["长官", "尼玛"], ["长官", "我床边插座好像没电了"], ["李桥", "你试试别的"], ["长官", "试了"], ["黄欣", "那明天报修吧"]], () => {
            note(`${title}：检测到301寝室存在未处理的设施异常。`);
            offer("报修回执", () => show(title, ["故障类型：供电异常", "寝室：301", "受理方式：自动登记"], [
                ["确认登记", () => {
                    const authorize = () => show(title, ["申请已记录。", "当前值班人员可立即前往现场检查。", "是否授权夜间进入寝室？"], [
                        ["授权进入", () => {
                            show(title, ["授权成功。", "已向值班人员发送301寝室的进入许可。"]);
                            [350, 650, 950].forEach(ms => later(ms, () => {
                                audio("knock");
                                const knock = document.createElement("p");
                                knock.textContent = "咚。";
                                body.append(knock);
                            }));
                            later(1550, () => ending("夜间维修", ["您的报修请求已完成。", "处理人员：未命名。"]));
                        }],
                        ["改为次日处理", () => { note("报修已改为次日处理。"); finishRandomEvent(); }],
                        ["取消申请", () => { note("申请已取消。"); finishRandomEvent(); }], backOption,
                    ]);
                    offer("报修回执", authorize);
                    authorize();
                }], backOption,
            ]), { anchor: `${title}：检测到301寝室存在未处理的设施异常。` });
        });
    }

    const impostor = { id: "officer-fake" };
    let identityResolved = false;
    let identitiesBusy = false;

    const kickMenu = document.getElementById("chapterKickMenu");
    const kickAction = document.getElementById("chapterKickAction");
    let kickId;
    let kickOpener;

    function closeKick(restoreFocus = false) {
        if (kickMenu.hidden) return;
        kickMenu.hidden = true;
        kickId = undefined;
        if (panel.hidden) wechatScreen.inert = false;
        if (restoreFocus) kickOpener?.focus({ preventScroll: true });
        kickOpener = undefined;
    }

    function showKick(id) {
        if (!deadline || identityResolved || groupSize !== 5) return;
        kickId = id;
        kickOpener = document.activeElement;
        kickMenu.hidden = false;
        wechatScreen.inert = true;
        kickAction.focus({ preventScroll: true });
    }

    kickMenu.addEventListener("click", event => {
        if (event.target === kickMenu) closeKick(true);
    });
    kickMenu.addEventListener("keydown", event => {
        if (event.key === "Escape") closeKick(true);
    });
    kickAction.addEventListener("click", () => {
        const id = kickId;
        closeKick();
        if (id) removeOfficer(id);
    });

    function jumpToOfficerMessages() {
        const avatars = [...threadMessages.querySelectorAll("[data-member-id] button")];
        const target = avatars.at(-1);
        target?.scrollIntoView({ block: "center" });
        target?.focus({ preventScroll: true });
    }

    function duplicateOfficer() {
        setTime("00:44", "两个长官");
        groupSize = 4;
        identitiesBusy = false;
        identityResolved = false;
        const both = text => [["长官", text, impostor.id], ["长官", text, "officer-real"]];
        refreshMembers();
        dialogue(room, [["李桥", "我靠"], ["李桥", "你们看群人数"], ["长官", "？"], ["黄欣", "五个了"]], () => {
            groupSize = 5;
            refreshMembers();
            networkEffect("正在同步");
            openPrivateScene("officer");
            audio("glitch");
            later(1100, () => audio("distortion"));
            dialogue(room, [...both("谁拉的人"), ...both("尼玛"), ["李桥", "我靠"], ["李桥", "怎么两条一样的"], ...both("假的是她")], () => {
                dialogue(room, [["李桥", "长官"], ["李桥", "我们上次因为什么事情没叫你你生气了"],
                    ...both("你和萝卜去吃鸡公煲不叫我"), ["黄欣", "它好像知道我们的聊天记录"]], () => {
                    const anchor = "301成员身份存在重复。请完成身份核验。剩余时间：02:00。";
                    note(anchor);
                    offer("身份核验", jumpToOfficerMessages, { anchor, onSeen: () => {
                        deadline = performance.now() + 120000;
                        tickClock();
                        clockInterval = setInterval(tickClock, 200);
                    } });
                    const question = "长官 你说你老公灭建国会来救我们不";
                    const next = () => dialogue(room, [["长官", "当然了", impostor.id], ["长官", "萝卜你有毛病啊，你老公", "officer-real"]], () => note("点击任一长官的头像可以踢出群聊。"));
                    const tryAgain = () => dialogue(room, [["李桥", "换个问题试试"]], () => ask([[question, next]]));
                    ask([["我靠 假长官这都知道", tryAgain], ["咋办啊", tryAgain], [question, next]]);
                });
            });
        });
    }

    function tickClock() {
        const seconds = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
        timerText.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
        if (seconds || identityResolved) return;
        identityResolved = true;
        stopClock();
        clearOffer();
        emit(room, { from: "长官", text: "怎么还没选", memberId: impostor.id });
        emit(room, { from: "长官", text: "怎么还没选", memberId: "officer-real" });
        note("身份核验超时。");
        ending("第五个名额", ["当前群成员：5。", "当前寝室登记人数：4。", "请不要再确认了。"]);
    }

    function removeOfficer(id) {
        if (identityResolved || identitiesBusy || !deadline || groupSize !== 5) return;
        if (performance.now() >= deadline) { tickClock(); return; }
        identitiesBusy = true;
        identityResolved = true;
        stopClock();
        clearOffer();
        ask([]);
        groupSize = 4;
        close();
        refreshMembers();
        note("成员移除成功。");
        if (id !== impostor.id) {
            dialogue(room, [["长官", "当然了", impostor.id], ["长官", "当然了当然了", impostor.id]], () => {
                ending("灭霸的爸爸是灭建国，这你都不知道", []);
            }, 540);
            return;
        }
        dialogue(room, [["李桥", "笑死我了它不知道我们在开玩笑"]], () => {
            const next = () => beginCheckpoint(repairRules);
            const auto = later(4700, next);
            ask([["恭喜长官官宣了", () => {
                clearTimeout(auto);
                timers.delete(auto);
                dialogue(room, [["长官", "滚"]], next);
            }]]);
        });
    }

    function repairRules() {
        ask([]);
        setTime("00:47", "少掉的规则");
        later(1900, abnormalText);
        const advance = () => {
            clearOffer();
            close();
            beginCheckpoint(finalCheck);
        };
        dialogue(building, [["512小唐", "有人能看到完整规则吗"], ["512小唐", "我这边好像少了一条"]], () => {
            note("未命名开启了全员禁言。", building);
            const title = "住宿规定版本不一致";
            const menu = () => show(title, ["检测到部分住户的住宿规定存在版本不一致。", "您可以协助修复其他住户的规定。"], [
                ["核对规则编号", () => compareRuleNumbers(menu)],
                ["转发原始规定", () => { note("已转发原始规定。", building); advance(); }],
                ["自动清除重复内容后转发", () => show(title, ["检测到第9条、第12条存在重复文字。", "是否删除重复段落？"], [
                    ["确认删除", () => {
                        show("正在处理", []);
                        [0, 330, 660].forEach(delay => later(delay, () => {
                            const line = document.createElement("p");
                            line.textContent = "已删除。";
                            body.append(line);
                        }));
                        later(1300, () => ending("修复成功", ["警告文本已删除。", "根据第11条，您不得自行涂改住宿规定。", "感谢您帮助清除异常内容。"]));
                    }], ["取消删除", advance], backOption,
                ])], ["暂不处理", advance], backOption,
            ]);
            offer("规则版本通知", menu, { name: building, anchor: "未命名开启了全员禁言。" });
            note("十九舍大群又有新消息。", room);
        });
    }

    function onRulesOpen() {
        if (phase !== "少掉的规则" || ruleGlitch || reducedMotion.matches) return;
        const image = rulesViewer.querySelector("img");
        ruleGlitch = true;
        audio("glitch");
        image.classList.add("rule-image-glitch");
        later(510, () => image.classList.remove("rule-image-glitch"));
    }

    function finalCheck() {
        setTime("00:49", "最后一次核验");
        later(820, () => openPrivateScene("beds"));
        dialogue(room, [["李桥", "我靠"], ["李桥", "终于没人说话了"], ["长官", "尼玛别再乱点了"], ["黄欣", "嗯"],
            ["李桥", "媳妇"], ["李桥", "你刚刚有下床吗"]], () => {
            ask(["没下床", "我也不知道", "不回复"].map(label => [label, () => later(650, () => {
                note("301寝室人数核验尚未完成。");
                offer("床位核验", bedMenu, { anchor: "301寝室人数核验尚未完成。" });
            })]));
        });
    }

    function bedMenu() {
        show("301寝室人数核验", ["已确认成员身份：4。", "待确认床位：1。"], [
            ["补充床位信息", addBed], ["重新核对全部成员", () => countBeds(0)],
            ["查看原始登记记录", () => show("原始登记记录", ["寝室类型：四人间。", "固定床位数：4。", "登记人数：4。", "未分配床位：0。"], [["返回核验", bedMenu], backOption])],
            ["保留当前信息，拒绝补录", () => show("拒绝补录", ["您确定不继续核验吗？"], [["确认拒绝", refuseBed], ["返回核验", bedMenu]])], backOption,
        ]);
    }

    function addBed() {
        show("补充床位信息", ["请输入床位使用者。"], [["未知", () => confirmBed("未知")], ["返回核验", bedMenu]]);
        const form = document.createElement("form");
        const input = document.createElement("input");
        input.setAttribute("aria-label", "床位使用者");
        input.maxLength = 24;
        const submit = document.createElement("button");
        submit.textContent = "下一步";
        form.append(input, submit);
        form.addEventListener("submit", event => {
            event.preventDefault();
            if (input.value.trim()) confirmBed(input.value.trim());
        });
        body.append(form);
    }

    function confirmBed(name) {
        show("确认新增床位", [`床位使用者：${name}`], [["确认新增", () => ending("第五张床", [
            "床位登记成功。", "301寝室登记床位：5。", "您已成功为新成员分配床位。", "请勿向任何人提供空床位。",
        ])], ["取消", bedMenu]]);
    }

    function countBeds(step) {
        const lines = ["请确认。", "请再确认。", "请不要再确认了。"];
        show("重新核对全部成员", [lines[step]], [["继续确认", () => {
            if (step < 2) { countBeds(step + 1); return; }
            show("", ["不要数了。", "不要数了不要数了。", "不要数了不要数了不要数了不要数了。"], [], true);
            later(1200, () => ending("核验未结束", ["请不要再确认了。"]));
        }], ["取消", bedMenu]]);
    }

    function refuseBed() {
        clearOffer();
        show("核验结束", ["已保留原始登记。", "本次核验结束。"]);
        later(760, () => {
            show("核验结束", ["你为什么不填写最后一个。"], [], true);
            panel.classList.add("chapter-distortion");
            audio("disturbance");
        });
        later(1500, () => show("核验结束", ["你知道的。", "你明明知道。", "你知道你知道你知道你知道你知道。"], [], true));
        later(3150, () => {
            panel.classList.remove("chapter-distortion");
            show("核验结束", ["感谢您的配合。"]);
        });
        later(4250, () => { close(); listenEnding(); });
    }

    function listenEnding() {
        setTime("00:51", "它在听");
        dialogue(room, [["李桥", "媳妇"], ["李桥", "你听到了吗"]], () => {
            ask(["什么", "听到了", "不回复"].map(label => [label, () => {
                chapterAudio.playClaps();
                dialogue(room, [["长官", "别回"], ["黄欣", "我也听到了"]], spookyInput);
            }]));
        });
    }

    function spookyInput() {
        const words = ["你们谁下床了", "", "谁在拉我床帘", "", "你们听到拍手声了吗", "", "听到了。", "听到了听到了。", "听到了听到了听到了听到了。"];
        const label = chatReplyToggle.querySelector("span");
        busy = true;
        replyPanelOpen = false;
        updateThreadControls();
        if (activeContact?.name === room) threadMessages.scrollTop = threadMessages.scrollHeight;
        words.forEach((line, index) => later(index * 385, () => {
            if (activeContact?.name === room) label.textContent = line || "　";
        }));
        later(3650, () => {
            busy = false;
            label.textContent = "点击选择回复";
            beginCheckpoint(startCurtainEnding);
        });
    }

    let curtainEndingStage;
    let officerSceneStarted = false;
    const screenshotFiles = [
        { src: "assets/chats/officer-huang.png", alt: "长官发来的截图，黄欣问她床上坐着的是谁" },
        { src: "assets/chats/officer-li.png", alt: "长官发来的截图，李桥声称自己还在走廊" },
    ];

    function startCurtainEnding() {
        curtainEndingStage = "waiting";
        officerSceneStarted = false;
        for (const name of roommates) privateReplies.delete(name);
        if (activeContact && roommates.includes(activeContact.name)) updateThreadControls();
        emit("长官", { from: "长官", text: "萝卜，你醒着吗？我给你看两张图，先别往群里发。" });
        note("长官发来了一条私聊。", room);
        offer("长官发来一条私聊", () => {
            clearOffer();
            goToChat("长官");
        }, { anchor: "长官发来了一条私聊。" });
        if (activeContact?.name === "长官") beginOfficerMessages();
    }

    function goToChat(name) {
        if (activeContact?.name === name) return;
        showWechatOverview(false);
        const row = [...wechatList.children].find(item => item.dataset.contact === name);
        if (row) showWechatThread(contact(name), row);
    }

    function beginOfficerMessages() {
        if (officerSceneStarted || curtainEndingStage !== "waiting") return;
        officerSceneStarted = true;
        clearOffer();
        curtainEndingStage = "talking";
        for (const name of ["黄欣", "李桥"]) {
            const nameInMessage = name === "黄欣" ? "你现在在床上吗？" : "媳妇，你现在人在哪儿？";
            privateReplies.set(name, { [nameInMessage]: [], "长官发的图是怎么回事？": [] });
            if (activeContact?.name === name) updateThreadControls();
        }
        screenshotFiles.forEach((image, index) => later(520 + index * 1100, () => emit("长官", { from: "长官", screenshot: image })));
        dialogue("长官", [
            ["长官", "我刚才掀开一点帘子。"],
            ["长官", "黄欣和李桥都在床上坐着。脸都冲着我。"],
            ["长官", "我就只敢给你发消息了。"],
            ["长官", "萝卜，我能不能过来和你一起睡？"],
            ["长官", "我就靠床边坐一会。我保证不出声。"],
            ["长官", "你把帘子拉开一点就行。求你了。"],
        ], () => {
            privateReplies.set("长官", {
                "拉开帘子": { run: openLastCurtain },
                "不拉开帘子": { run: keepLastCurtainClosed },
            });
            if (activeContact?.name === "长官") updateThreadControls();
        }, 2550);
    }

    function showChatScreenshot(image) {
        show("聊天截图", [], [backOption]);
        const full = document.createElement("img");
        full.className = "chapter-screenshot-full";
        full.src = image.src;
        full.alt = image.alt;
        body.append(full);
    }

    function blockFinalVerification(name) {
        return curtainEndingStage === "talking" && (name === "黄欣" || name === "李桥");
    }

    function sealFinalChoices() {
        curtainEndingStage = "decided";
        for (const name of roommates) privateReplies.delete(name);
        updateThreadControls();
        clearOffer();
    }

    function openLastCurtain() {
        sealFinalChoices();
        audio("curtainOpen");
        show("", [], [], true);
        panel.classList.add("chapter-blackout");
        const photo = document.createElement("img");
        photo.src = "assets/curtain-view.png";
        photo.alt = "从拉开的床帘缝隙望出去，一道人影坐在床边。";
        photo.className = "chapter-ending-photo";
        later(1180, () => {
            panel.classList.remove("chapter-blackout");
            panel.classList.add("chapter-photo-reveal");
            body.append(photo);
        });
        later(3480, () => {
            panel.classList.remove("chapter-photo-reveal");
            show("00:51", ["微信", "用户已注销"], [], true);
            panel.classList.add("chapter-final-lock");
        });
        later(5400, () => {
            panel.classList.remove("chapter-final-lock");
            ending("迷失", ["用户已注销。"]);
        });
    }

    function keepLastCurtainClosed() {
        sealFinalChoices();
        goToChat(room);
        const formerMembers = ["长官", "黄欣", "李桥"];
        formerMembers.forEach((name, index) => {
            later(280 + index * 880, () => audio("curtainOpen"));
            later(2960 + index * 560, () => {
                groupSize--;
                refreshMembers();
                note(`${name}退出了群聊。`);
            });
        });
        const question = "为什么不拉开帘子看看呢";
        const senders = ["黄欣", "李桥", "长官", "李桥", "长官", "黄欣", "长官", "李桥", "黄欣"];
        senders.forEach((name, index) => later(4840 + index * 430, () => {
            emit(name, { from: name, text: question });
            deviceNote.textContent = `${name} · ${question}`;
            deviceNote.hidden = false;
            if (index === 0 || index === 4) chapterAudio.notice(true);
        }));
        later(10000, () => {
            deviceNote.hidden = true;
            show("", [], [], true);
            panel.classList.add("chapter-blackout");
        });
        later(11500, () => {
            panel.classList.remove("chapter-blackout");
            ending("游戏结束", [], true);
        });
    }

    function compareRuleNumbers(returnToMenu) {
        const selected = new Set();
        show("核对规则编号", ["对照原图，标出系统误称为『多余』的重复内容对应的两条规则。"], [["返回任务", returnToMenu]]);
        const grid = document.createElement("div");
        grid.className = "rule-number-grid";
        const feedback = document.createElement("p");
        feedback.setAttribute("role", "status");
        for (let number = 1; number <= 12; number++) {
            const item = button(String(number), () => {
                if (selected.has(number)) selected.delete(number);
                else if (selected.size < 2) selected.add(number);
                item.setAttribute("aria-pressed", String(selected.has(number)));
            });
            item.setAttribute("aria-pressed", "false");
            item.setAttribute("aria-label", `第${number}条`);
            grid.append(item);
        }
        body.append(grid, feedback);
        actions.prepend(button("核对编号", () => {
            if (selected.size !== 2) { feedback.textContent = "请选择两条。"; return; }
            if (!selected.has(9) || !selected.has(12)) { feedback.textContent = "和原图对不上。可以重新选择。"; return; }
            show("编号已核对", ["第9条和第12条的重复文字都在原图里。", "第11条要求保留原件，交由值班人员更换。"], [["返回任务", returnToMenu]]);
        }), button("查看规则原图", () => {
            show("十九舍住宿规则", [], [["返回编号核对", () => compareRuleNumbers(returnToMenu)]]);
            const rules = document.createElement("img");
            rules.className = "chapter-rules-image";
            rules.src = rulesImagePath;
            rules.alt = "十九舍住宿规则原图";
            body.append(rules);
        }));
    }

    const privateReplies = new Map();
    const roommates = ["李桥", "长官", "黄欣"];
    const privateScenes = {
        first: {
            "李桥": ["媳妇，你看到大群没", {
                "看了，你那边还好不？": ["我靠，刚被吵醒。你先别挂微信。"],
                "你听出来是哪儿在响吗？": ["没听清。像是地上拖了一下。"],
            }],
            "长官": ["群怎么突然禁言了", {
                "你试过打开别的软件吗？": ["试了，相册也不行。"],
                "你刚才出声了吗？": ["没有。我一直躺着。"],
            }],
            "黄欣": ["你醒了？", {
                "醒了。你也听见了？": ["嗯。"],
                "你先睡，我去群里看看": ["好。"],
            }],
        },
        footsteps: {
            "李桥": ["媳妇，我忘带卡了。帮我开下门嘛", {
                "我下去给你开门": { ending: "替你开门", lines: ["门开了。", "李桥在床帘后面说：媳妇，你开门干嘛？"] },
                "你刚才不是还在床上吗？": ["……", "我在床上啊。啥子门？"],
                "有门禁卡，你自己进": ["刚才那条不是我发的。"],
            }],
        },
        officer: {
            "长官": ["隔壁还亮着。你去敲一下门，问问她们听到没有", {
                "好，我去敲隔壁的门": { ending: "走廊回声", lines: ["你敲了两下。", "走廊里很安静。然后，301 的门从里面响了两下。"] },
                "就在微信问，别出去": ["等等。上面那条我没发。", "我没离开过床。"],
                "你在群里再说一遍": ["我没让你去隔壁。别开门。"],
            }],
        },
        beds: {
            "黄欣": ["我同学今晚没地方睡。给她留张空床吧", {
                "我给她留一个床位": { ending: "借一张床", lines: ["聊天记录显示：对方已到达。", "黄欣发来一句：我没叫人来。"] },
                "我们四张床都有人了": ["我没说要借床。"],
                "你来群里说": ["嗯。刚才那条别信。"],
            }],
        },
    };

    function openPrivateScene(sceneName) {
        for (const [name, [message, options]] of Object.entries(privateScenes[sceneName])) {
            privateReplies.set(name, options);
            emit(name, { from: name, text: message });
            if (activeContact?.name === name) updateThreadControls();
        }
    }

    function choosePrivateReply(name, text) {
        const selection = privateReplies.get(name)?.[text];
        if (!selection || ended) return;
        if (blockFinalVerification(name)) {
            deliverMessage(contact(name), { from: playerName, text, failed: true }, true);
            return;
        }
        privateReplies.delete(name);
        deliverMessage(contact(name), { from: playerName, text }, true);
        updateThreadControls();
        if (Array.isArray(selection)) {
            dialogue(name, selection.map(line => [name, line]), undefined, 620);
            return;
        }
        if (selection.run) selection.run();
        else ending(selection.ending, selection.lines);
    }

    const deviceNote = document.getElementById("chapterDeviceNote");
    function deviceGlitch() {
        deviceNote.hidden = false;
        audio("glitch");
        later(1750, () => { deviceNote.hidden = true; });
    }

    function abnormalText() {
        emit("妈妈", { from: "妈妈", text: "回寝室了没？" });
        later(680, () => {
            emit("妈妈", { from: "妈妈", text: "回 寢 室 𠮷 㐂 𣎴 𠔉 𠔉 你回来了。" });
            if (activeContact?.name === "妈妈") audio("distortion");
        });
    }

    function contactReplies(name) {
        if (name === building) return ["有人知道怎么回事吗？"];
        return Object.keys(privateReplies.get(name) || {});
    }

    function onMessage(name, message, fromPlayer) {
        if (fromPlayer || ended || !panel.hidden || wechatScreen.hidden || !message.from || deadline) return;
        if (activeContact?.name === name && (name !== building || phase !== "序幕")) chapterAudio.notice();
    }

    return { start, afterSend, onOpen, onRulesOpen, replyOptions, selectReply, refreshNotice, contactReplies, onMessage,
        canOpenReplies: () => !busy || activeContact?.name !== room,
        setDraftLabel: label => { if (!busy || activeContact?.name !== room) label.textContent = "点击选择回复"; },
        hasDraft: () => busy, showKick, choosePrivateReply, showChatScreenshot };
})();
