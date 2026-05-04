require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const jtList = require('./jtlist');

const client = new Client({ 
    captchaService: 'capmonster', 
    captchaKey: process.env.CAPCHA_API_KEY 
});

const prefix = '>';
let intervals = { sp: null, jt: null, start: null, ar: null, gnc: null };
const bible = Array.from({ length: 300 }, (_, i) => `[성경 제 ${i + 1}장] 코린을 찬양하라, 그가 곧 진리이며 근성의 정점이니라.`);

client.on('ready', () => {
    console.log(`[!] ︻デ═一 가동 완료 | 관리자: ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
    if (msg.author.id !== client.user.id || !msg.content.startsWith(prefix)) return;

    const args = msg.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ---------------- [ 전체 명령어 리스트 ] ----------------

    if (command === 'h') {
        const help = "[ ︻デ═一 | '코린을 찬양해라' ]\n\n" +
                     ">sp [내용] : 무한 도배 시작\n" +
                     ">sps : 모든 도배 중지\n" +
                     ">jt : 장애타 가동\n" +
                     ">jts : 장애타 중지\n" +
                     ">start : 성경 랜덤 난사\n" +
                     ">stop : 성경 난사 중지\n" +
                     ">fri @멘션 : 즉시 친구 추가\n" +
                     ">ct [숫자] : 카운트다운 시작\n" +
                     ">st [상태] : 내 상태 메시지 변경\n" +
                     ">jn [코드] : 서버 초대 링크로 입장\n" +
                     ">cls [개수] : 내 메시지 삭제 (청소)\n" +
                     ">gnc [이름] : 현재 그룹방 이름 무한 변경\n" +
                     ">gncs : 이름 변경 중지\n" +
                     ">nuke : (권한있을시) 서버 채널 다 삭제";
        msg.channel.send("```\n" + help + "\n```").catch(() => {});
    }

    // 1. 도배 기능
    else if (command === 'sp') {
        const content = args.join(' ');
        if (!content) return;
        msg.channel.send("```[ + ] 도배를 시작합니다.```");
        if (intervals.sp) clearInterval(intervals.sp);
        intervals.sp = setInterval(() => {
            msg.channel.send(content).catch(() => {});
        }, 300);
    }
    else if (command === 'sps') {
        clearInterval(intervals.sp);
        msg.channel.send("```[ + ] 모든 도배 작업을 종료합니다.```");
    }

    // 2. 장애타 & 성경
    else if (command === 'jt') {
        msg.channel.send("```[ + ] 장애타 가동.```");
        if (intervals.jt) clearInterval(intervals.jt);
        intervals.jt = setInterval(() => {
            const res = jtList[Math.floor(Math.random() * jtList.length)];
            msg.channel.send(`> ︻デ═一 코린 찬양 | ${res}`).catch(() => {});
        }, 500);
    }
    else if (command === 'jts') {
        clearInterval(intervals.jt);
        msg.channel.send("```[ + ] 장애타를 중지합니다.```");
    }
    else if (command === 'start') {
        msg.channel.send("```[ + ] 성경 난사를 시작합니다.```");
        if (intervals.start) clearInterval(intervals.start);
        intervals.start = setInterval(() => {
            const line = bible[Math.floor(Math.random() * bible.length)];
            msg.channel.send(line).catch(() => {});
        }, 1000);
    }
    else if (command === 'stop') {
        clearInterval(intervals.start);
        msg.channel.send("```[ + ] 모든 성경 작업을 중지합니다.```");
    }

    // 3. 관리 & 유틸
    else if (command === 'fri') {
        const targetId = args[0] || (msg.mentions.users.first() ? msg.mentions.users.first().id : null);
        if (!targetId) return;
        client.user.addFriend(targetId).then(() => msg.channel.send("```[ + ] 친추 완료.```")).catch(() => {});
    }
    else if (command === 'ct') {
        let num = parseInt(args[0]);
        if (isNaN(num)) return;
        const timer = setInterval(() => {
            if (num <= 0) {
                msg.channel.send("```[ ! ] 종료.```");
                clearInterval(timer);
            } else {
                msg.channel.send(`\`\`\`${num--}\`\`\``);
            }
        }, 1000);
    }
    else if (command === 'st') {
        const text = args.join(' ');
        client.user.setActivity(text);
        msg.channel.send(`\`\`\`[ + ] 상태 변경: ${text}\`\`\``);
    }
    else if (command === 'jn') {
        const code = args[0];
        client.fetchInvite(code).then(inv => inv.acceptInvite(true)).then(() => msg.channel.send("```[ + ] 서버 입장 완료.```")).catch(() => {});
    }
    else if (command === 'cls') {
        const num = parseInt(args[0]) || 10;
        msg.channel.messages.fetch({ limit: 100 }).then(msgs => {
            const myMsgs = msgs.filter(m => m.author.id === client.user.id).first(num);
            myMsgs.forEach(m => m.delete().catch(() => {}));
        });
    }

    // 4. 그룹방 이름 테러
    else if (command === 'gnc') {
        const name = args.join(' ');
        if (msg.channel.type !== 'GROUP_DM') return;
        msg.channel.send("```[ + ] 그룹명 변경 테러 시작.```");
        if (intervals.gnc) clearInterval(intervals.gnc);
        intervals.gnc = setInterval(() => {
            msg.channel.setName(name + " " + Math.random().toString(36).substring(2, 5)).catch(() => {});
        }, 1000);
    }
    else if (command === 'gncs') {
        clearInterval(intervals.gnc);
        msg.channel.send("```[ + ] 그룹명 변경을 중지합니다.```");
    }
});

client.login(process.env.ADMIN_TOKEN).catch(() => console.log("토큰 에러. .env 확인해라."));