require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const jtList = require('./jtlist');

// 어드민 토큰을 가장 앞에 배치하고 나머지 토큰들을 합침
const tokens = [
    process.env.ADMIN_TOKEN,
    ...Object.keys(process.env)
        .filter(key => key.startsWith('TOKEN_'))
        .sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]))
        .map(key => process.env[key])
].filter(t => t);

const clients = tokens.map(t => new Client({ captchaService: 'capmonster', captchaKey: process.env.CAPCHA_API_KEY }));
const prefix = '>';
let intervals = { sp: null, jt: null, start: null, ar: null, gnc: null };

const bible = Array.from({ length: 300 }, (_, i) => `[성경 제 ${i + 1}장] 코린을 찬양하라, 그가 곧 진리이며 근성의 정점이니라.`);

clients.forEach((client, index) => {
    const isAdmin = (index === 0);
    
    client.on('ready', () => {
        if (isAdmin) console.log(`[!] ︻デ═一 | '코린을 찬양해라' 가동 완료 (어드민 제어 모드)`);
    });

    client.on('messageCreate', async (msg) => {
        // admin_token으로 로그인한 계정의 메시지만 명령어로 인식
        if (msg.author.id !== clients[0].user.id || !msg.content.startsWith(prefix)) return;

        const args = msg.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // ---------------- [ 친구 추가 ] ----------------
        if (command === 'fr') {
            const targetId = args[0] || (msg.mentions.users.first() ? msg.mentions.users.first().id : null);
            if (!targetId) return msg.channel.send('```[ ! ] 대상을 멘션하거나 ID를 입력해주세요.```');
            msg.channel.send('```[ + ] 모든 계정으로 친구 요청을 보냅니다.```');
            
            clients.forEach((c, i) => {
                c.relationships.addMemberRequest(targetId)
                    .then(() => console.log(`[+] 토큰 ${i + 1} 친구 요청 성공`))
                    .catch(e => console.log(`[-] 토큰 ${i + 1} 실패: ${e.message}`));
            });
        }

        // ---------------- [ 서버 조인 ] ----------------
        else if (command === 'jn') {
            const inviteCode = args[0];
            if (!inviteCode) return msg.channel.send('```[ ! ] 초대 코드를 입력해주세요.```');
            msg.channel.send('```[ + ] 서버 조인을 시작합니다.```');
            
            for (const [i, c] of clients.entries()) {
                try {
                    await c.acceptInvite(inviteCode);
                    console.log(`[+] 토큰 ${i + 1} 조인 성공`);
                    await new Promise(res => setTimeout(res, 2000));
                } catch (e) {
                    console.log(`[-] 토큰 ${i + 1} 실패: ${e.message}`);
                }
            }
        }

        // ---------------- [ 스팸 ] ----------------
        else if (command === 'sp') {
            msg.channel.send('```[ + ] 도배 시작합니다.
```');
            const content = args.join(' ');
            intervals.sp = setInterval(() => clients.forEach(c => {
                const ch = c.channels.cache.get(msg.channel.id);
                if (ch) ch.send('```' + content + '```');
            }), 300);
        } 
        else if (command === 'sps') {
            msg.channel.send('```[ + ] 도배 중지합니다.
```');
            clearInterval(intervals.sp);
        }
        else if (command === 'jt') {
            msg.channel.send('```[ + ] 장애타 시작합니다.```');
            intervals.jt = setInterval(() => {
                const res = jtList[Math.floor(Math.random() * jtList.length)];
                const count = Math.floor(Math.random() * 473848);
                clients.forEach(c => {
                    const ch = c.channels.cache.get(msg.channel.id);
                    if (ch) ch.send('> ︻デ═一코린에게 개처발린애들수 < ' + count + ' ' + res);
                });
            }, 500);
        } 
        else if (command === 'jts') {
            msg.channel.send('```[ + ] 장애타 중지합니다.```');
            clearInterval(intervals.jt);
        }
        else if (command === 'start') {
            msg.channel.send('```[ + ] 성경 랜덤 읽기 시작합니다.```');
            let pool = [...bible];
            intervals.start = setInterval(() => {
                if (pool.length === 0) pool = [...bible];
                const line = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
                clients.forEach(c => {
                    const ch = c.channels.cache.get(msg.channel.id);
                    if (ch) ch.send('```' + line + '```');
                });
            }, 1000);
        } 
        else if (command === 'stop') {
            msg.channel.send('```[ + ] 성경 중지합니다.```');
            clearInterval(intervals.start);
        }

        // ---------------- [ 유틸 ] ----------------
        else if (command === 'ct') {
            const target = msg.mentions.users.first();
            if (!target) return;
            let time = 10, done = false;
            const col = msg.channel.createMessageCollector({ filter: m => m.author.id === target.id, time: 6000 });
            col.on('collect', () => { done = true; col.stop(); });
            const t = setInterval(() => {
                if (done) {
                    msg.channel.send('```아 아쉽네 거의 다 죽였었는데...```');
                    return clearInterval(t);
                }
                if (time === 0) {
                    msg.channel.send('```컷컷ㅋㅋㅋㅋㅋ```');
                    return clearInterval(t);
                }
                msg.channel.send(target.toString() + ' ' + (time--));
            }, 500);
        }
        else if (command === 'ar') {
            msg.channel.send('```[ + ] 오토이모지 시작합니다.```');
            const target = msg.mentions.users.first();
            const emoji = args[0];
            intervals.ar = setInterval(() => {
                const lastMsg = msg.channel.messages.cache.filter(m => m.author.id === target.id).last();
                if (lastMsg) lastMsg.react(emoji).catch(() => {});
            }, 1000);
        }
        else if (command === 'ars') {
            msg.channel.send('```[ + ] 오토이모지 중지합니다.```');
            clearInterval(intervals.ar);
        }
        else if (command === 'cn') {
            msg.channel.send('```[ + ] 닉네임 변경 시작합니다.```');
            clients.forEach(c => c.user.setNickname('! 근성의 神 코린').catch(() => {}));
        }
        else if (command === 'st') {
            msg.channel.send('```[ + ] 상태 변경 시작합니다.```');
            const status = args.join(' ');
            clients.forEach(c => c.user.setActivity(status));
        }

        // ---------------- [ 서버 ] ----------------
        else if (command === 'nuke') {
            msg.channel.send('```[ + ] 서버 폭파 시작합니다.```');
            await msg.guild.setName('코린업업이야로');
            msg.guild.channels.cache.forEach(c => c.delete().catch(() => {}));
            setInterval(() => {
                msg.guild.channels.create('코린업', { type: 'GUILD_TEXT' })
                    .then(c => setInterval(() => c.send('@everyone 코린업'), 300));
            }, 1000);
        }
        else if (command === 'gnc') {
            msg.channel.send('```[ + ] 그룹이름 변경 시작합니다.
```');
            const name = args.join(' ');
            intervals.gnc = setInterval(() => {
                if (msg.channel.type === 'GROUP_DM') msg.channel.setName(name);
            }, 1000);
        }
        else if (command === 'gncs') {
            msg.channel.send('```[ + ] 그룹이름 변경 중지합니다.```');
            clearInterval(intervals.gnc);
        }

        // [ 도움말 ]
        if (command === 'h') {
            msg.channel.send('```' +
                '[ ︻デ═一 | \'코린을 찬양해라\' ]\n\n' +
                '[ 스팸 ]\n' +
                '>sp [내용]\n' +
                '>sps\n' +
                '>jt\n' +
                '>jts\n' +
                '>start\n' +
                '>stop\n\n' +
                '[ 유틸 ]\n' +
                '>fr @멘션 | >ct @멘션\n' +
                '>ar @멘션 [이모지] | >ars\n' +
                '>cn | >st [상태]\n\n' +
                '[ 서버 ]\n' +
                '>jn [초대코드]\n' +
                '>nuke\n' +
                '>gnc [이름]\n' +
                '>gncs' +
                '```');
        }
    });
});

tokens.forEach((t, i) => clients[i].login(t).catch(e => console.log(`[!] 토큰 ${i+1} 로그인 실패`)));