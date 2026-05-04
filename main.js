require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const jtList = require('./jtlist');
const http = require('http');

// Render 서버가 유휴 상태로 전환되는 것을 방지하기 위한 포트 바인딩
http.createServer((req, res) => {
    res.write("Korin Legion System Running...");
    res.end();
}).listen(8080);

const adminToken = process.env.ADMIN_TOKEN;
const workerTokens = Object.keys(process.env)
    .filter(key => key.startsWith('TOKEN_'))
    .map(key => process.env[key].trim());

const allTokens = [adminToken, ...workerTokens];
const clients = [];
const intervals = new Map();
let statusLoop = null;

// 랜덤 코드 생성: 모든 공격 메시지에 네 요청 양식대로 숫자가 붙음
const getRand = () => `\n> ︻デ═一 코린이 영역전개로 패죽인 수 > ${Math.floor(Math.random() * 900000) + 100000}`;

// 성경 데이터 생성
const bible = Array.from({ length: 300 }, (_, i) => `[성경 제 ${i + 1}장] 코린을 찬양하라, 그가 곧 진리이며 근성의 정점이니라.`);

allTokens.forEach((token, index) => {
    // 캡차 자동 해결을 위해 CAPCHA_API_KEY를 시스템에 연동
    const client = new Client({ 
        checkUpdate: false,
        captchaService: 'capmonster', 
        captchaKey: process.env.CAPCHA_API_KEY 
    });
    
    const isAdmin = (index === 0);

    client.on('ready', () => {
        console.log(`[!] ︻デ═一 가동 완료 | ${isAdmin ? '관리자' : '워커 ' + index}: ${client.user.tag}`);
    });

    client.on('messageCreate', async (msg) => {
        const prefix = '>';
        const adminId = clients[0]?.user?.id;
        
        // 관리자가 보낸 명령어만 인식
        if (msg.author.id !== adminId || !msg.content.startsWith(prefix)) return;

        const args = msg.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // --- [ 워커 군단 로직: 도배, 장애타, 성경, 그룹방 ] ---
        if (['sp', 'jt', 'start', 'gnc'].includes(command) && !isAdmin) {
            msg.channel.send(`\`\`\`[ + ] 워커 ${index}호가 작전을 수행합니다.\`\`\``);
            
            if (intervals.has(client.user.id)) {
                clearInterval(intervals.get(client.user.id));
            }
            
            const timer = setInterval(() => {
                let content = "";
                if (command === 'sp') {
                    content = `${args.join(' ') || '코린 찬양'}${getRand()}`;
                } else if (command === 'jt') {
                    content = `${jtList[Math.floor(Math.random() * jtList.length)]}${getRand()}`;
                } else if (command === 'start') {
                    content = `${bible[Math.floor(Math.random() * bible.length)]}${getRand()}`;
                } else if (command === 'gnc' && msg.channel.type === 'GROUP_DM') {
                    msg.channel.setName(`${args.join(' ')} ${Math.random().toString(36).substring(2, 5)}`).catch(() => {});
                    return;
                }
                
                msg.channel.send(content).catch(err => console.log(`전송 실패: ${err.message}`));
            }, 1100); // 딜레이를 약간 주어 밴 위험 감소
            
            intervals.set(client.user.id, timer);
        }

        // --- [ 중지 시스템 ] ---
        if (['sps', 'jts', 'stop', 'gncs'].includes(command)) {
            if (intervals.has(client.user.id)) {
                clearInterval(intervals.get(client.user.id));
                intervals.delete(client.user.id);
                if (!isAdmin) msg.channel.send(`\`\`\`[ - ] 워커 ${index}호 작전 중지.\`\`\``);
            }
        }

        // --- [ 관리자 전용 유틸리티: 캡차 API 연동 ] ---
        if (isAdmin) {
            // 도움말: 네가 준 리스트 그대로 한 줄씩 출력
            if (command === 'h') {
                const helpMsg = "[ ︻デ═一 | '코린을 찬양해라' ]\n\n" +
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
                msg.channel.send("```\n" + helpMsg + "\n```");
            }

            // 친구 추가 (캡차 발생 시 API 키로 자동 해결)
            else if (command === 'fri') {
                const target = args[0] || (msg.mentions.users.first()?.id);
                if (target) {
                    client.user.addFriend(target)
                        .then(() => msg.channel.send("```[ + ] 친구 추가 성공.```"))
                        .catch(e => msg.channel.send(`\`\`\`[ ! ] 오류: ${e.message}\`\`\``));
                }
            }

            // 서버 입장 (캡차 발생 시 API 키로 자동 해결)
            else if (command === 'jn') {
                if (args[0]) {
                    client.fetchInvite(args[0])
                        .then(inv => inv.acceptInvite(true))
                        .then(() => msg.channel.send("```[ + ] 서버 입장 완료.```"))
                        .catch(e => msg.channel.send(`\`\`\`[ ! ] 오류: ${e.message}\`\`\``));
                }
            }

            else if (command === 'ct') {
                let count = parseInt(args[0]);
                if (!isNaN(count)) {
                    const ctTimer = setInterval(() => {
                        if (count <= 0) {
                            msg.channel.send("```[ ! ] 카운트다운 종료.
```");
                            clearInterval(ctTimer);
                        } else {
                            msg.channel.send(`\`\`\`${count--}\`\`\``);
                        }
                    }, 1000);
                }
            }

            else if (command === 'cls') {
                const limit = parseInt(args[0]) || 10;
                msg.channel.messages.fetch({ limit: 100 }).then(messages => {
                    const toDelete = messages.filter(m => m.author.id === client.user.id).first(limit);
                    toDelete.forEach(m => m.delete().catch(() => {}));
                });
            }

            else if (command === 'nuke' && msg.guild) {
                msg.guild.channels.cache.forEach(channel => channel.delete().catch(() => {}));
            }
        }

        // --- [ 상태 메시지 무한 고정 ] ---
        if (command === 'st') {
            const status = args.join(' ') || `코린 찬양 중 ${getRand()}`;
            if (isAdmin) msg.channel.send(`\`\`\`[ ! ] 전원 상태 고정 시작: ${status}\`\`\``);
            
            if (statusLoop) clearInterval(statusLoop);
            
            const setStatus = () => {
                clients.forEach(c => {
                    c.user.setActivity(status, { type: 'PLAYING' });
                });
            };
            
            setStatus();
            statusLoop = setInterval(setStatus, 15000); // 15초마다 갱신해서 절대 안 끊기게 함
        }
    });

    client.login(token).catch(err => console.log(`[!] 로그인 실패: ${token.substring(0, 10)}...`));
    clients.push(client);
});