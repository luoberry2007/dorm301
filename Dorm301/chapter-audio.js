const chapterAudio = (() => {
    let context;
    let master;
    let unlocked = false;
    let introInterval;
    let introKick;
    let latestNotice = -Infinity;
    let volume = 0.34;
    let muted = false;
    let clapAudio;
    let clapFallback;
    const voices = new Map();
    const control = document.getElementById("chapterSound");
    const settings = document.getElementById("chapterSoundSettings");
    const slider = document.getElementById("chapterVolume");
    const mute = document.getElementById("chapterMute");
    try {
        const saved = JSON.parse(localStorage.getItem("dorm301-audio"));
        if (saved && Number.isFinite(saved.volume)) volume = Math.max(0, Math.min(1, saved.volume));
        muted = Boolean(saved?.muted);
    } catch { /* Storage may be unavailable on file URLs. */ }
    slider.value = Math.round(volume * 100);
    mute.checked = muted;

    function initialize() {
        unlocked = true;
        try {
            const Audio = window.AudioContext || window.webkitAudioContext;
            if (!Audio) return;
            if (!context) {
                context = new Audio();
                master = context.createGain();
                master.gain.value = muted ? 0 : volume;
                master.connect(context.destination);
            }
            if (context.state === "suspended") context.resume()?.catch(() => {});
        } catch { /* The chapter advances independently of audio. */ }
    }

    function play(kind) {
        if (!unlocked || muted || volume === 0 || context?.state !== "running") return;
        try {
            const duration = { buzz: 0.34, notice: 0.14, slippers: 1.65, fabric: 1.8, creak: 0.30,
                steps: 0.75, knock: 0.13, clap: 0.105, glitch: 0.12, distortion: 0.18, disturbance: 2.35, curtainOpen: 0.62 }[kind];
            if (!duration) return;
            const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
            const samples = buffer.getChannelData(0);
            for (let i = 0; i < samples.length; i++) {
                const p = i / samples.length;
                const time = i / context.sampleRate;
                const noise = Math.random() * 2 - 1;
                const tone = frequency => Math.sin(time * Math.PI * 2 * frequency);
                const envelope = Math.sin(p * Math.PI) * (1 - p);
                let sample;
                switch (kind) {
                    case "buzz": sample = (tone(133) + 0.3 * tone(266)) * (p < 0.44 || p > 0.58 ? 0.7 : 0); break;
                    case "notice": sample = 0.40 * tone(p < 0.47 ? 770 : 1050); break;
                    case "slippers": case "steps": sample = noise * Math.max(0, Math.sin(p * Math.PI * 6 - 0.4)) ** 3; break;
                    case "fabric": case "clap": case "glitch": sample = noise; break;
                    case "curtainOpen": sample = noise * (0.35 + 0.58 * Math.sin(p * 14) ** 2) + tone(95) * 0.15; break;
                    case "knock": sample = tone(155) * 0.63 + noise * 0.37; break;
                    case "creak": sample = tone(112 + 22 * p) * 0.48 + noise * 0.37; break;
                    case "distortion": sample = Math.sign(tone(404)) * 0.38 + noise * 0.15; break;
                }
                if (kind === "disturbance") {
                    const buildup = p <= 0.79 ? (p / 0.79) ** 2.5 : 0.08 * Math.exp(-(p - 0.79) * 13);
                    samples[i] = (noise * 0.60 + tone(71) * 0.35 + tone(213) * 0.15) * buildup;
                } else samples[i] = sample * envelope;
            }
            const source = context.createBufferSource();
            const filter = context.createBiquadFilter();
            const gain = context.createGain();
            const pan = kind === "slippers" && context.createStereoPanner?.();
            filter.type = "lowpass";
            filter.frequency.value = { buzz: 540, notice: 2800, slippers: 670, steps: 550, fabric: 1350, creak: 850,
                knock: 1040, clap: 4500, glitch: 2400, distortion: 1650, disturbance: 1900, curtainOpen: 1450 }[kind];
            gain.gain.value = { buzz: 0.38, notice: 0.30, slippers: 0.44, steps: 0.36, fabric: 0.25, creak: 0.31,
                knock: 0.44, clap: 0.46, glitch: 0.27, distortion: 0.10, disturbance: 0.38, curtainOpen: 0.35 }[kind];
            source.buffer = buffer;
            source.connect(filter).connect(gain);
            if (pan) {
                gain.connect(pan).connect(master);
                pan.pan.setValueAtTime(-0.72, context.currentTime);
                pan.pan.linearRampToValueAtTime(0.72, context.currentTime + duration);
            } else gain.connect(master);
            voices.set(source, { kind, gain });
            source.onended = () => voices.delete(source);
            source.start();
        } catch { /* A missing synthesis feature cannot block gameplay. */ }
    }

    function playClaps() {
        if (!unlocked || muted || volume === 0) return;
        const fallback = () => {
            play("clap");
            clapFallback = setTimeout(() => play("clap"), 280);
        };
        try {
            clapAudio ||= new Audio("assets/chapter-claps.wav");
            clapAudio.volume = volume * 0.95;
            clapAudio.currentTime = 0;
            clapAudio.play()?.catch(error => { if (error.name !== "AbortError") fallback(); });
        } catch { fallback(); }
    }

    function stop(kind, fade = 0) {
        if (!kind || kind === "clap") {
            clearTimeout(clapFallback);
            clapAudio?.pause();
        }
        for (const [source, voice] of voices) {
            if (kind && kind !== voice.kind) continue;
            try {
                if (fade) voice.gain.gain.linearRampToValueAtTime(0, context.currentTime + fade);
                source.stop(context.currentTime + fade);
            } catch { /* The source may already have played out. */ }
        }
    }

    function notice(force = false) {
        if (muted || context?.state !== "running") return;
        const now = performance.now();
        if (!force && now - latestNotice < 4200) return;
        latestNotice = now;
        play("notice");
    }

    function save() {
        volume = Number(slider.value) / 100;
        muted = mute.checked;
        try { localStorage.setItem("dorm301-audio", JSON.stringify({ volume, muted })); } catch { /* Session controls still work. */ }
        if (master) master.gain.value = muted ? 0 : volume;
        if (clapAudio) clapAudio.volume = muted ? 0 : volume * 0.95;
        if (muted) stop();
        control.textContent = muted ? "已静音" : "音效";
    }

    control.addEventListener("click", () => {
        initialize();
        settings.hidden = !settings.hidden;
        control.setAttribute("aria-expanded", String(!settings.hidden));
    });
    slider.addEventListener("input", save);
    mute.addEventListener("change", save);
    control.textContent = muted ? "已静音" : "音效";

    startBtn.addEventListener("click", () => {
        initialize();
        clearInterval(introInterval);
        clearTimeout(introKick);
        introKick = setTimeout(() => { if (introInterval) play("buzz"); }, 125);
        introInterval = setInterval(() => play("buzz"), 1750);
    });
    for (const action of [checkPhoneBtn, sleepBtn]) action.addEventListener("click", () => {
        clearInterval(introInterval);
        clearTimeout(introKick);
        introInterval = undefined;
        stop("buzz");
        initialize();
    });
    return { play, stop, notice, playClaps };
})();
