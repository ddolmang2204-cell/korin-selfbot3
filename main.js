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

// GS 명령어용 특수 텍스트
const gsContent = `@everyone # 코린찬양해라
A









A









A









A









A


# 코린업업이야ㅋ
https://cdn.discordapp.com/attachments/1500781494522744852/1500861027166720195/6.gif?ex=69faa201&is=69f95081&hm=82fe1d69597c595f8683fd745d90867bf910a3b8fb941404bd31c7182a36f212&
https://cdn.discordapp.com/attachments/1500792773249335356/1500868310466826360/d5d6a4af8bc5bb67.gif?ex=69faa8ca&is=69f9574a&hm=0c5a9f595b19747405da086294e776be6655ab15a4e7189f80898a279b981987&`;

const executeSpam = async (client, channel, type, args) => {
    if (!activeSpam.has(client.user.id)) return;
    try {
        let content = "";
        if (type === 'sp') content = (args.join(' ') || '코린 찬양');
        else if (type === 'jt') content = jtList[Math.floor(Math.random() * jtList.length)];
        else if (type === 'start') content = bible[Math.floor(Math.random() * bible.length)];
        else if (type === 'gs') content = gsContent; // GS 모드 추가

        // 박스(임베드) 안 생기게 링크 미리보기 비활성화 옵션 추가
        await channel.send({ content: content + getRand(), flags: [4096] }); 
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

        // [워커 전용] GS 명령어 포함 난사
        if (!isAdminBot) {
            if (['sp', 'jt', 'start', 'gs'].includes(cmd)) {
                activeSpam.set(client.user.id, true);
                executeSpam(client, msg.channel, cmd, args);
            }
            if (['sps', 'jts', 'stop', 'gss'].includes(cmd)) {
                activeSpam.delete(client.user.id);
            }
        }

        // [관리자 전용]
        if (isAdminBot) {
            switch (cmd) {
                case 'h':
                    const helpText = [
                        ">sp [내용] : 워커 무한 도배",
                        ">sps : 도배 중지",
                        ">gs : 코린찬양 움짤 테러",
                        ">gss : 움짤 테러 중지",
                        ">jt : 장애타 시작",
                        ">start : 성경 난사",
                        ">st [내용] : 상태 고정",
                        ">cls [수] : 내 메시지 삭제",
                        ">lv : 서버 탈퇴",
                        ">nick [이름] : 닉네임 변경",
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
                    msg.channel.send(`\`\`\`[!] 상태 업데이트 완료: ${stTxt}\`\`\``);
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