require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const jtList = require('./jtlist');
const http = require('http');

// Render 생존용 웹 서버
http.createServer((req, res) => { res.write("System Online"); res.end(); }).listen(8080);

const adminToken = process.env.ADMIN_TOKEN;
const workerTokens = Object.keys(process.env).filter(k => k.startsWith('TOKEN_')).map(k => process.env[k].trim());
const allTokens = [adminToken, ...workerTokens];
const clients = [];
const intervals = new Map();
let statusLoop = null;

const getRand = () => '\n> ︻デ═一 코린이 영역전개로 패죽인 수 > ' + (Math.floor(Math.random() * 900000) + 100000);
const bible = Array.from({ length: 300 }, (_, i) => `[성경 제 ${i + 1}장] 코린을 찬양하라, 그가 곧 진리이며 근성의 정점이니라.`);

allTokens.forEach((token, index) => {
    const client = new Client({ checkUpdate: false, captchaService: 'capmonster', captchaKey: process.env.CAPCHA_API_KEY });
    const isAdmin = (index === 0);

    client.on('ready', () => console.log(`[!] ︻デ═一 가동 완료 | ${isAdmin ? 'Admin' : 'Worker' + index}`));

    client.on('messageCreate', async (msg) => {
        const adminId = clients[0]?.user?.id;
        if (!msg.content.startsWith('>') || msg.author.id !== adminId) return;

        const args = msg.content.slice(1).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();

        // --- [ >h 도움말: 네가 준 원본 텍스트 100% 반영 ] ---
        if (isAdmin && cmd === 'h') {
            let h = ">sp [내용] : 무한 도배 시작\n" +
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
            msg.channel.send('```\n' + h + '\n```').catch(() => {});
        }

        // --- [ 워커 작전 로직 ] ---
        if (!isAdmin && ['sp', 'jt', 'start', 'gnc'].includes(cmd)) {
            if (intervals.has(client.user.id)) clearInterval(intervals.get(client.user.id));
            const t = setInterval(() => {
                let m = "";
                if (cmd === 'sp') m = (args.join(' ') || '코린 찬양') + getRand();
                else if (cmd === 'jt') m = jtList[Math.floor(Math.random() * jtList.length)] + getRand();
                else if (cmd === 'start') m = bible[Math.floor(Math.random() * bible.length)] + getRand();
                else if (cmd === 'gnc' && msg.channel.type === 'GROUP_DM') {
                    msg.channel.setName(`${args.join(' ')} ${Math.random().toString(36).substring(2, 5)}`).catch(() => {});
                    return;
                }
                msg.channel.send(m).catch(() => {});
            }, 1100);
            intervals.set(client.user.id, t);
        }

        // --- [ 중지 시스템 ] ---
        if (['sps', 'jts', 'stop', 'gncs'].includes(cmd)) {
            if (intervals.has(client.user.id)) {
                clearInterval(intervals.get(client.user.id));
                intervals.delete(client.user.id);
                if (!isAdmin) msg.channel.send(`\`\`\`[ - ] 작전 중지.\`\`\``);
            }
        }

        // --- [ 관리자 전용 (API 활용) ] ---
        if (isAdmin) {
            if (cmd === 'fri') client.user.addFriend(args[0] || msg.mentions.users.first()?.id).catch(() => {});
            if (cmd === 'jn') client.fetchInvite(args[0]).then(i => i.acceptInvite(true)).catch(() => {});
            if (cmd === 'ct') {
                let c = parseInt(args[0]);
                if (!isNaN(c)) {
                    const t = setInterval(() => {
                        if (c <= 0) { msg.channel.send("```[ ! ] 종료.```"); clearInterval(t); }
                        else msg.channel.send("```" + c-- + "```");
                    }, 1000);
                }
            }
            if (cmd === 'cls') {
                msg.channel.messages.fetch({ limit: 50 }).then(ms => {
                    const target = ms.filter(m => m.author.id === client.user.id).first(parseInt(args[0]) || 10);
                    target.forEach(m => m.delete().catch(() => {}));
                });
            }
            if (cmd === 'nuke') msg.guild.channels.cache.forEach(c => c.delete().catch(() => {}));
        }

        // --- [ 상태 메시지 무한 고정 ] ---
        if (cmd === 'st') {
            const s = args.join(' ') || '코린 찬양 중';
            if (statusLoop) clearInterval(statusLoop);
            const up = () => clients.forEach(c => c.user.setActivity(s, { type: 'PLAYING' }));
            up(); statusLoop = setInterval(up, 15000);
            if (isAdmin) msg.channel.send('```[ ! ] 상태 메시지 고정 완료.```');
        }
    });

    client.login(token).catch(() => {});
    clients.push(client);
});