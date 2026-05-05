require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const jtList = require('./jtlist'); 

const ADMIN_USER_ID = "1429412320194592811"; 

const adminToken = process.env.ADMIN_TOKEN;
const workerTokens = Object.keys(process.env)
    .filter(k => k.startsWith('TOKEN_'))
    .map(k => process.env[k].trim())
    .filter(Boolean);

const allTokens = [adminToken, ...workerTokens].filter(Boolean);
const clients = [];
const activeSpam = new Map();
let statusInterval = null;

const getRand = () => '\n> ︻デ═一 코린이 영역전개로 패죽인 수 > ' + (Math.floor(Math.random() * 900000) + 100000);
const bible = Array.from({ length: 300 }, (_, i) => `[성경 제 ${i + 1}장] 코린을 찬양하라, 그가 곧 진리이니라.`);

const executeSpam = async (client, channel, type, args) => {
    if (!activeSpam.has(client.user.id)) return;
    try {
        let content = "";
        if (type === 'sp') content = (args.join(' ') || '코린 찬양');
        else if (type === 'jt') content = jtList[Math.floor(Math.random() * jtList.length)];
        else if (type === 'start') content = bible[Math.floor(Math.random() * bible.length)];

        await channel.send(content + getRand());
        setTimeout(() => executeSpam(client, channel, type, args), 100);
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

        if (!isAdminBot) {
            if (['sp', 'jt', 'start'].includes(cmd)) {
                activeSpam.set(client.user.id, true);
                executeSpam(client, msg.channel, cmd, args);
            }
            if (['sps', 'jts', 'stop'].includes(cmd)) activeSpam.delete(client.user.id);
        }

        if (isAdminBot) {
            switch (cmd) {
                case 'h':
                    const help = [
                        ">sp [내용] : 워커 무한 도배",
                        ">sps : 도배 중지",
                        ">jt : 장애타 시작",
                        ">start : 성경 난사",
                        ">st [내용] : 상태 메시지 고정",
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
                    msg.channel.send('```\n' + help + '\n
```').catch(() => {});
                    break;

                case 'st':
                    const stTxt = args.join(' ');
                    if (statusInterval) clearInterval(statusInterval);
                    const setST = () => clients.forEach(c => c.user?.setActivity(stTxt, { type: 'PLAYING' }));
                    setST();
                    statusInterval = setInterval(setST, 30000);
                    msg.channel.send(`\`\`\`[!] 상태 고정: ${stTxt}\`\`\``);
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
            }
        }
    });

    client.login(token).catch(() => {});
});

process.on('unhandledRejection', (err) => console.log('[!] 에러 가드:', err.message));