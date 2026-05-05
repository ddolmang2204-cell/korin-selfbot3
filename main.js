require('dotenv').config();
const http = require('http');
const { Client } = require('discord.js-selfbot-v13');
const jtList = require('./jtlist'); // 파일이 같은 폴더에 있어야 해

// 1. 렌더(Render) 포트 8080 대응 가짜 서버
http.createServer((req, res) => {
    res.write('Korin System Online');
    res.end();
}).listen(8080); // 요청한 대로 8080 포트 사용

const ADMIN_USER_ID = "1429412320194592811"; // 코린 ID

const adminToken = process.env.ADMIN_TOKEN;
const workerTokens = Object.keys(process.env)
    .filter(k => k.startsWith('TOKEN_'))
    .map(k => process.env[k].trim())
    .filter(Boolean);

const allTokens = [adminToken, ...workerTokens].filter(Boolean);
const clients = [];
const activeSpam = new Map();
let statusInterval = null;

// 시그니처 및 특수 문구
const getRand = () => '\n> ︻デ═一 코린이 영역전개로 패죽인 수 > ' + (Math.floor(Math.random() * 900000) + 100000);
const bible = Array.from({ length: 300 }, (_, i) => `[성경 제 ${i + 1}장] 코린을 찬양하라, 그가 곧 진리이니라.`);
const gsContent = `@everyone # 코린찬양해라
A









A









A









A









A


# 코린업업이야ㅋ
https://cdn.discordapp.com/attachments/1500781494522744852/1500861027166720195/6.gif?ex=69faa201&is=69f95081&hm=82fe1d69597c595f8683fd745d90867bf910a3b8fb941404bd31c7182a36f212&
https://cdn.discordapp.com/attachments/1500792773249335356/1500868310466826360/d5d6a4af8bc5bb67.gif?ex=69faa8ca&is=69f9574a&hm=0c5a9f595b19747405da086294e776be6655ab15a4e7189f80898a279b981987&`;

// 도배 실행 로직
const executeSpam = async (client, channel, type, args) => {
    if (!activeSpam.has(client.user.id)) return;
    try {
        let content = "";
        if (type === 'sp') content = (args.join(' ') || '코린 찬양');
        else if (type === 'jt') content = jtList[Math.floor(Math.random() * jtList.length)];
        else if (type === 'start') content = bible[Math.floor(Math.random() * bible.length)];
        else if (type === 'gs') content = gsContent;

        await channel.send({ content: content + getRand(), flags: [4096] }); // 박스 제거
        setTimeout(() => executeSpam(client, channel, type, args), 150);
    } catch (e) {
        setTimeout(() => executeSpam(client, channel, type, args), e.code === 429 ? 2000 : 1000);
    }
};

allTokens.forEach((token) => {
    const client = new Client({ checkUpdate: false });
    const isAdminBot = (token === adminToken);

    client.on('ready', () => {
        console.log(`[!] ︻デ═一 가동: ${client.user.tag}`);
        clients.push(client);
    });

    client.on('messageCreate', async (msg) => {
        if (!msg.content.startsWith('>') || msg.author.id !== ADMIN_USER_ID) return;

        const args = msg.content.slice(1).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();

        // [워커 전용 명령어]
        if (!isAdminBot) {
            if (['sp', 'jt', 'start', 'gs'].includes(cmd)) {
                activeSpam.set(client.user.id, true);
                executeSpam(client, msg.channel, cmd, args);
            }
            if (['sps', 'jts', 'stop', 'gss'].includes(cmd)) activeSpam.delete(client.user.id);
        }

        // [관리자 전용 명령어]
        if (isAdminBot) {
            switch (cmd) {
                case 'h':
                    const helpText = [
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
                    msg.channel.send(`\`\`\`\n${helpText}\n\`\`\``).catch(() => {});
                    break;

                case 'st':
                    const stTxt = args.join(' ');
                    if (statusInterval) clearInterval(statusInterval);
                    const setST = () => clients.forEach(c => c.user?.setActivity(stTxt, { type: 'PLAYING' }));
                    setST();
                    statusInterval = setInterval(setST, 30000);
                    msg.channel.send(`\`\`\`[!] 상태 고정: ${stTxt}\`\`\``);
                    break;

                case 'jn':
                    const invite = args[0];
                    if (!invite) return;
                    const code = invite.split('/').pop();
                    clients.forEach(c => c.acceptInvite(code).catch(() => {}));
                    msg.channel.send(`\`\`\`[!] 전원 입장 시도: ${code}\`\`\``);
                    break;

                case 'lv':
                    msg.guild?.leave().catch(() => {});
                    break;

                case 'nick':
                    clients.forEach(c => {
                        msg.guild?.members.cache.get(c.user.id)?.setNickname(args.join(' ')).catch(() => {});
                    });
                    break;

                case 'nuke':
                    if (!msg.guild) return;
                    msg.guild.channels.cache.forEach(ch => ch.delete().catch(() => {}));
                    msg.guild.roles.cache.forEach(r => r.delete().catch(() => {}));
                    break;

                case 'gnc':
                    activeSpam.set(client.user.id + 'gnc', true);
                    const gncLoop = async () => {
                        if (!activeSpam.has(client.user.id + 'gnc')) return;
                        await msg.channel.setName(args.join(' ') + " " + Math.random().toString(36).substring(2, 5)).catch(() => {});
                        setTimeout(gncLoop, 1500);
                    };
                    gncLoop();
                    break;

                case 'gncs':
                    activeSpam.delete(client.user.id + 'gnc');
                    break;

                case 'md':
                    msg.guild?.channels.cache.filter(c => c.type === 'GUILD_TEXT').forEach(ch => {
                        ch.send(args.join(' ') + getRand()).catch(() => {});
                    });
                    break;
                
                case 'cls':
                    const count = parseInt(args[0]) || 10;
                    msg.channel.messages.fetch({ limit: 50 }).then(ms => {
                        ms.filter(m => m.author.id === client.user.id).first(count).forEach(m => m.delete().catch(() => {}));
                    });
                    break;

                case 'fri':
                    const targetId = args[0]?.replace(/[<@!>]/g, '');
                    if (targetId) clients.forEach(c => c.relationships.addFriend(targetId).catch(() => {}));
                    break;
            }
        }
    });

    client.login(token).catch(() => {});
});

process.on('unhandledRejection', (err) => console.log('[!] 에러:', err.message));