require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const jtList = require('./jtlist');
const http = require('http');

// 1. 10초 주기 자가 생존 신호 (Anti-Sleep)
const SERVER_URL = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}.onrender.com`;
http.createServer((req, res) => { res.write("Korin System 24/7 Active"); res.end(); }).listen(8080);

setInterval(() => {
    if (process.env.RENDER_EXTERNAL_HOSTNAME) {
        http.get(SERVER_URL, (res) => {}).on('error', (err) => {});
    }
}, 10000);

const adminToken = process.env.ADMIN_TOKEN;
const workerTokens = Object.keys(process.env).filter(k => k.startsWith('TOKEN_')).map(k => process.env[k].trim());
const allTokens = [adminToken, ...workerTokens];
const clients = [];
const status = { active: new Map() };
let statusLoop = null;

// [박제] '데' 오타 수정 완료 (︻デ═一)
const getRand = () => '\n> ︻デ═一 코린이 영역전개로 패죽인 수 > ' + (Math.floor(Math.random() * 900000) + 100000);
const bible = Array.from({ length: 300 }, (_, i) => `[성경 제 ${i + 1}장] 코린을 찬양하라, 그가 곧 진리이며 근성의 정점이니라.`);

const executeSpam = async (client, channel, type, args) => {
    if (!status.active.get(client.user.id)) return;
    let m = (type === 'sp') ? (args.join(' ') || '코린 찬양') : (type === 'jt' ? jtList[Math.floor(Math.random() * jtList.length)] : bible[Math.floor(Math.random() * bible.length)]);
    channel.send(m + getRand()).then(() => {
        setTimeout(() => executeSpam(client, channel, type, args), 100);
    }).catch(() => {
        setTimeout(() => executeSpam(client, channel, type, args), 500);
    });
};

allTokens.forEach((token, index) => {
    const client = new Client({ checkUpdate: false });
    const isAdmin = (index === 0);

    client.on('ready', () => {
        console.log(`[!] ︻デ═一 가동 완료 | ${isAdmin ? 'Admin' : 'Worker' + index}`);
        clients.push(client);
    });

    client.on('messageCreate', async (msg) => {
        const adminBot = clients.find(c => c.token === adminToken);
        if (!msg.content.startsWith('>') || (adminBot && msg.author.id !== adminBot.user.id)) return;

        const args = msg.content.slice(1).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();

        // --- [ >h 도움말: 줄바꿈 및 오타 완벽 수정 ] ---
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
            msg.channel.send('```\n' + h + '\n
```').catch(() => {});
        }

        if (!isAdmin && ['sp', 'jt', 'start'].includes(cmd)) {
            status.active.set(client.user.id, true);
            executeSpam(client, msg.channel, cmd, args);
        }
        if (['sps', 'jts', 'stop'].includes(cmd)) status.active.set(client.user.id, false);

        if (cmd === 'st') {
            const userStatus = args.join(' ');
            if (!userStatus) return;
            if (isAdmin) msg.channel.send(`\`\`\`[ ! ] 상태 메시지 "${userStatus}" 고정 완료.\`\`\``);
            if (statusLoop) clearInterval(statusLoop);
            const up = () => clients.forEach(c => c.user.setActivity(userStatus, { type: 'PLAYING' }));
            up(); statusLoop = setInterval(up, 15000);
        }
        
        if (isAdmin) {
            if (cmd === 'fri') client.user.addFriend(args[0] || msg.mentions.users.first()?.id).catch(() => {});
            if (cmd === 'jn') client.fetchInvite(args[0]).then(i => i.acceptInvite(true)).catch(() => {});
            if (cmd === 'cls') {
                msg.channel.messages.fetch({ limit: 50 }).then(ms => {
                    ms.filter(m => m.author.id === client.user.id).first(parseInt(args[0]) || 10).forEach(m => m.delete().catch(() => {}));
                });
            }
        }
    });

    client.login(token).catch(() => {});
});