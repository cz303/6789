const Telegraf = require('telegraf');
const mongoose = require('mongoose');
const Composer = require('telegraf/composer');
const WizardScene = require('telegraf/scenes/wizard');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');

const Config = require('./config');
const ban = require('./mongoose/ban');
const base_user = require('./mongoose/base_user');
const channel_base_user = require('./mongoose/channel_base_user');
const base_channel = require('./mongoose/base_channel');
const advertising = require('./mongoose/advertising');
const key = require('./mongoose/key');

const express = require('express');
const app = express();
app.use('/', express.static('public'));
app.listen(process.env.PORT || 8080);

mongoose.connect(`mongodb://${Config.channel_base}:${Config.password}.@ds213178.mlab.com:13178/bot_group`, { useNewUrlParser: true });

const db = mongoose.connection;

const bot = new Telegraf(Config.token);
const stage = new Stage();
const stepHandler = new Composer();

const send = new WizardScene('send',
    stepHandler,
    (ctx) => {ctx.reply('Введите текст сообщения:',{
        reply_markup:{
            keyboard:[
                ['Отмена']
            ],
            resize_keyboard: true
        }
    });
        return ctx.wizard.next()
    },
    (ctx) => {
        if (ctx.message.text === 'Отмена' || ctx.message.text === '/start') {
            bot.telegram.sendMessage(ctx.message.chat.id, '...', {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        ['📲Войти в чат','🔰Правила чата'],
                        ['💶Заработать','🔄Накрутка'],
                        ['✅Реклама']
                    ],
                    resize_keyboard: true
                },
                disable_notification: false
            });
            return ctx.scene.leave()
        }else {
            const text = ctx.message.text;
            const html = text;


            base_user.find({}, function (err, users) {
                var result = users.map(elem => elem.user_id);
                var index = 1;
                var current = 1;
                var fnc = setInterval(function(){
                    console.log(result[current]);
                    bot.telegram.sendMessage(result[current], html, {
                        parse_mode: 'HTML'
                    })
                        .catch(err => {
                            if (err.code == 403)
                            {
                                base_user.remove({'user_id': err.on.payload.chat_id}, function(err, result){
                                    console.log(result)
                                })
                            }
                        });
                    current++;
                    if(current >= result.length) {current = 0}
                    else if (++index == result.length) {
                        clearInterval(fnc);
                        console.log('Stop Script');
                    }
                }, 80);
                console.log(result)
            });

            ctx.reply('✅ Отправлено!', {
                reply_markup: {
                    keyboard: [
                        ['📲Войти в чат','🔰Правила чата'],
                        ['💶Заработать','🔄Накрутка'],
                        ['✅Реклама']
                    ],
                    resize_keyboard: true
                },
                disable_notification: false
            });
            return ctx.scene.leave()
        }
    }
);

const cash = new WizardScene('cash',
    stepHandler,
    (ctx) => {
        ctx.reply('Выберите кошелек для снятия средств:',{
            reply_markup:{
                keyboard:[
                    ['Я.Деньги', 'Киви'],
                    ['Отмена']
                ],
                resize_keyboard: true
            }
        });
        return ctx.wizard.next()
    },
    (ctx) => {
        if (ctx.message.text === 'Отмена' || ctx.message.text === '/start' || ctx.message.text === '↖️Назад') {
            ctx.reply(`
\`...\``, {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        ['📲Войти в чат','🔰Правила чата'],
                        ['💶Заработать','🔄Накрутка'],
                        ['✅Реклама']
                    ],
                    resize_keyboard:true
                }
            });
            return ctx.scene.leave()
        }
        else if (ctx.message.text === 'Я.Деньги'){
            ctx.reply(`
💳 *Укажите номер счета или номер мобильного телефона без знака  +*

⚠️\`Не допускайте ошибок в указание номера кошелька, в противном случае вы лишитесь своих средств\`. 
`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        ['Отмена']
                    ],
                    resize_keyboard:true
                }
            });
            ctx.session.counter = ctx.message.text;
            return ctx.wizard.next()
        }
        else if (ctx.message.text === 'Киви'){
            ctx.reply(`
💳 *Укажите номер счета или номер мобильного телефона без знака  +*

⚠️\`Не допускайте ошибок в указание номера кошелька, в противном случае вы лишитесь своих средств\`.             
            `, {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        ['Отмена']
                    ],
                    resize_keyboard:true
                }
            });
            ctx.session.counter = ctx.message.text;
            return ctx.wizard.next()
        }
    },
    (ctx) => {
        const id = ctx.message.chat.id;
        if (ctx.message.text === 'Отмена' || ctx.message.text === '/start') {
            ctx.reply(`
\`...\``, {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        ['📲Войти в чат'],
                        ['🔰Правила чата'],
                        ['💶Заработать'],
                        ['✅Рекламный пост']
                    ],
                    resize_keyboard: true
                }
            });
            return ctx.scene.leave()
        }
        else if(!isNaN(parseFloat(ctx.message.text)) === false)
        {
            ctx.reply(`⚠️\`Некорректный номер счета, попробуйте еще раз\`:`,{
                parse_mode: 'Markdown'
            });
        }
        else {
            base_user.findOne({'user_id': id },function(err, doc) {
            ctx.reply(`
💳 *Вами сформирована заявка на вывод средств*

*Тип средств*:  ${ctx.session.counter}
*Номер счета*:  ${ctx.message.text}
*Сумма*:  ${doc.money}₽

⚠️\`Заявка обрабатывается в течение 48 часов\`.
`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        ['📲Войти в чат','🔰Правила чата'],
                        ['💶Заработать','🔄Накрутка'],
                        ['✅Реклама']
                    ],
                    resize_keyboard: true
                }
            });
            const text = `
💳 *Заявка на вывод средств*

*Юзер*: [${ctx.message.from.first_name}](tg://user?id=${ctx.message.from.id})

*Тип средств*:  ${ctx.session.counter}
*Номер счета*:  \`${ctx.message.text}\`
*Сумма*:  ${doc.money}₽            
            `;
            ctx.telegram.sendMessage(Config.admin, text, {
               parse_mode: 'Markdown'
            });
                base_user.updateOne(
                    {'user_id': id},
                    {$set: {'money': 0}}, function () {})
        });
            return ctx.scene.leave()
        }
    }
);

const vp = new WizardScene('vp',
    stepHandler,
    (ctx) => {
        ctx.reply('🔻 \`Перешлите сюда любой пост с канала, на который вы хотите накрутить подписчиков\`:',{
            parse_mode: 'Markdown',
            reply_markup:{
                keyboard:[
                    ['Отмена']
                ],
                resize_keyboard: true
            }
        });
        return ctx.wizard.next()
    },
    (ctx) => {

        const forward = ctx.message.forward_from_chat;

        if (ctx.message.text === 'Отмена' || ctx.message.text === '/start') {
            ctx.reply(`
\`...\``, {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        ['📲Войти в чат','🔰Правила чата'],
                        ['💶Заработать','🔄Накрутка'],
                        ['✅Реклама']
                    ],
                    resize_keyboard:true
                }
            });
            return ctx.scene.leave()
        }
        else if (forward){
            const id = ctx.message.chat.id;
            const username_channel = ctx.message.forward_from_chat.username;
            const id_chat = ctx.message.forward_from_chat.id;

            ctx.telegram.getChatMember(id_chat, Config.bot_id).then((i) => {

                    if (i.status === 'left') {
                        const text2  = `
❌ \`Бот не добавлен в администраторы данного канала!\`

⚠️ \`Добавьте бота, назначьте его администратором и попробуйте заново.\`

⚫️\`Подробнее в инструкции:\` /help`;
                        ctx.reply(text2,{
                            parse_mode: 'Markdown',
                            reply_markup: {
                                keyboard: [
                                    ['☑️Баланс'],
                                    ['🔺Подписаться','🔻Накрутить'],
                                    ['❗️Инструкция'],
                                    ['↖️Назад']
                                ],
                                resize_keyboard: true
                            }
                        });
                        return ctx.scene.leave()
                    }
                    else if (i.status === 'administrator') {
                        if(username_channel === undefined){
                            const text1 =`
⚠️ \`Ваш канал приватный, такие каналы для накрутки не поддерживаются.\`

⚫️\`Подробнее в инструкции:\` /help'                                  
                                    `;
                            ctx.reply(text1, {
                                parse_mode: 'Markdown',
                                reply_markup: {
                                    keyboard: [
                                        ['☑️Баланс'],
                                        ['🔺Подписаться','🔻Накрутить'],
                                        ['❗️Инструкция'],
                                        ['↖️Назад']
                                    ],
                                    resize_keyboard: true
                                }
                            });
                            return ctx.scene.leave()
                        }
                        else{
                        base_user.findOne({'user_id': id}, function (err, docs) {
                            const user = base_channel({
                                user_id: id,
                                channel_username: username_channel,
                                number1: docs.key,
                                number2: ' ',
                                number3: ' '
                            });

                            base_channel.findOne({'channel_username': username_channel}, function (err, doc) {
                                if (doc !== null) {
                                    ctx.reply('⚠️ \`Накрутка на этот канал уже добавлена, дождитесь его окончания или добавьте другой канал\`.', {
                                        parse_mode: 'Markdown',
                                        reply_markup: {
                                            keyboard: [
                                                ['☑️Баланс'],
                                                ['🔺Подписаться','🔻Накрутить'],
                                                ['❗️Инструкция'],
                                                ['↖️Назад']
                                            ],
                                            resize_keyboard: true
                                        }
                                    });
                                    return ctx.scene.leave()
                                }
                                else if (doc === null) {
                                    user.save(() => {
                                        ctx.reply(`✅ *Канал добавлен!*`, {
                                            parse_mode: 'Markdown',
                                            reply_markup: {
                                                keyboard: [
                                                    ['☑️Баланс'],
                                                    ['🔺Подписаться','🔻Накрутить'],
                                                    ['❗️Инструкция'],
                                                    ['↖️Назад']
                                                ],
                                                resize_keyboard: true
                                            }
                                        });
                                    });
                                    base_user.updateOne(
                                        {'user_id': id},
                                        {$set: {'key': 0}}, function () {
                                        });
                                    return ctx.scene.leave()
                                }
                            });
                        })
                    } }
            }).catch((err) => {
                if (err.code === 403){
                    const text = `
❌ \`Бот не добавлен в администраторы данного канала!\`

⚠️ \`Добавьте бота, назначьте его администратором и попробуйте заново.\`

⚫️\`Подробнее в инструкции:\` /help                   
                    `;
                    ctx.reply(text,{
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['☑️Баланс'],
                                ['🔺Подписаться','🔻Накрутить'],
                                ['❗️Инструкция'],
                                ['↖️Назад']
                            ],
                            resize_keyboard: true
                        }
                    });
                    return ctx.scene.leave()
                }
                console.log(err)
            })
        }
        else {

            ctx.reply('❌ \`Что то пошло не так, попробуйте заново переслать любой пост с канала, на который хотите накрутить подписчиков:\`',{
                parse_mode: 'Markdown'
            })}
    }
);

const edit = new WizardScene('edit',

    stepHandler,
    (ctx) => {
        ctx.reply('Введите рекламный текст:',{
            reply_markup:{
                keyboard:[
                    ['Отмена']
                ],
                resize_keyboard: true
            }
        });
        return ctx.wizard.next()
    },
    (ctx) => {
        const text = ctx.message.text;
        if (ctx.message.text === 'Отмена' || ctx.message.text === '/start') {
            ctx.reply(`
\`...\``, {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        ['📲Войти в чат','🔰Правила чата'],
                        ['💶Заработать','🔄Накрутка'],
                        ['✅Реклама']
                    ],
                    resize_keyboard:true
                }
            });
            return ctx.scene.leave()
        }
        else{
            advertising.findById('5d6e9dc07b54162974ebe09b' ,function(err, doc) {
                advertising.updateOne(
                    {'text': doc.text},
                    {$set: {'text': text}}, function () {
                        ctx.reply('Изменено', {
                        parse_mode: 'Markdown',
                            reply_markup: {
                            keyboard: [
                                ['📲Войти в чат','🔰Правила чата'],
                                ['💶Заработать','🔄Накрутка'],
                                ['✅Реклама']
                            ],
                                resize_keyboard:true
                        }
                    });
                    })
            });
            return ctx.scene.leave()
        }
    }
);

stage.register(cash, edit, vp, send);
bot.use(session());
bot.use(stage.middleware());

bot.hears(/start (.+)/, (ctx) => {


    const add = ctx.message.chat.id;
    const text = ctx.message.text;
    const id = parseInt(text.replace(/\D+/g,""));
    const newStr = text.replace('/start ', "",);

    const user = base_user({
        user_id: ctx.message.chat.id,
        money: 0,
        members: 0,
        referrer: '',
        status: 'Отсутствует',
        key: 0,
        key2: 0,
        key3: 0,
        key4: 0
    });

    if (newStr === 'regulation') {

        base_user.findOne({'user_id': add}, function (err, doc) {

            if (doc !== null) {
                const markdown = `
✅*Правила нашего чата*!

Чат предназначен для совершения взаимных подписок на каналы, группы и ботов среди пользователей чата, а так же для всяких прикалюшек типа пролистать ленту на канале или поставить лайк под постом.

⛔️*В данном чате запрещается*:

- флуд, флейм, спам
- рекламировать что либо
- пересылка из других источников
- отправка медиафайлов
- пропаганда наркотиков, порнографии
- ругаться матом
- отправка внешних ссылок

⚠️За несоблюдение правил грозит *Бан*, сроком на *1 месяц*.

\`Большое Спасибо за внимание!\`           
                `;
                ctx.reply(markdown, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        keyboard: [
                            ['📲Войти в чат','🔰Правила чата'],
                            ['💶Заработать','🔄Накрутка'],
                            ['✅Реклама']

                        ],
                        resize_keyboard: true
                    }
                });
                console.log(ctx.message)
            }
            else if (doc === null) {
                user.save(() => {
                    const markdown = `
✅*Правила нашего чата*!

Чат предназначен для совершения взаимных подписок на каналы, группы и ботов среди пользователей чата, а так же для всяких прикалюшек типа пролистать ленту на канале или поставить лайк под постом.

⛔️*В данном чате запрещается*:

- флуд, флейм, спам
- рекламировать что либо
- пересылка из других источников
- отправка медиафайлов
- пропаганда наркотиков, порнографии
- ругаться матом
- отправка внешних ссылок

⚠️За несоблюдение правил грозит *Бан*, сроком на *1 месяц*.

\`Большое Спасибо за внимание!\`           
                `;
                    ctx.reply(markdown, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['📲Войти в чат','🔰Правила чата'],
                                ['💶Заработать','🔄Накрутка'],
                                ['✅Реклама']
                            ],
                            resize_keyboard: true
                        }
                    });
                });
            }
        })
    }
    else if (newStr === 'advertising') {

        base_user.findOne({'user_id': add}, function (err, doc) {

            if (doc !== null) {
                const markdown = `
✅ *Рекламный пост*!

*Стоимость услуги*: 10₽ на весь день.

⚠️ Пост будет появляться каждые полчаса в течение всего дня с *7*:*00* до *00*:*00* по МСК времени. 

☑️ *Разместить пост*: /post
        
                `;
                ctx.reply(markdown, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        keyboard: [
                            ['📲Войти в чат','🔰Правила чата'],
                            ['💶Заработать','🔄Накрутка'],
                            ['✅Реклама']
                        ],
                        resize_keyboard: true
                    }
                });
                console.log(ctx.message)
            }
            else if (doc === null) {
                user.save(() => {
                    const markdown = `
✅ *Рекламный пост*!

*Стоимость услуги*: 10₽ на весь день.

⚠️ Пост будет появляться каждый час в течение всего дня с *7*:*00* до *00*:*00* по МСК времени.

☑️ *Разместить пост*: /post          
                `;
                    ctx.reply(markdown, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['📲Войти в чат','🔰Правила чата'],
                                ['💶Заработать','🔄Накрутка'],
                                ['✅Реклама']
                            ],
                            resize_keyboard: true
                        }
                    });
                });
            }
        })
    }
    else if(id){base_user.findOne({'user_id': add}, function (err, doc) {

            if (doc != null) {
                ctx.reply(`🔻 \`Для работы с ботом воспользуйтесь меню.\` `, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        keyboard: [
                            ['📲Войти в чат','🔰Правила чата'],
                            ['💶Заработать','🔄Накрутка'],
                            ['✅Реклама']
                        ],
                        resize_keyboard: true
                    }
                });
                console.log(ctx.message)
            }
            else if (doc == null) {
                base_user.findOne({'user_id': id}, function (err, dac) {
                    if (dac != null) {
                        user.save((err, user) => {
                            ctx.telegram.sendMessage(ctx.message.chat.id = `${add}`, `
Приветствуем Вас *${ctx.message.from.first_name}*

🔻 \`Для работы с ботом воспользуйтесь меню.\` `, {
                                parse_mode: 'Markdown',
                                reply_markup: {
                                    keyboard: [
                                        ['📲Войти в чат','🔰Правила чата'],
                                        ['💶Заработать','🔄Накрутка'],
                                        ['✅Реклама']
                                    ],
                                    resize_keyboard: true
                                }
                            });
                            console.log('good', user)
                        });
                            base_user.updateOne(
                                {'user_id': id},
                                {$set: {'members': ++dac.members, 'money': dac.money + 0.3}}, function () {
                                    ctx.telegram.sendMessage(ctx.message.chat.id = `${id}`, `
✅ Вам начислен бонус за привлеченного участника в размере 0.3*₽*
`, {
                                        parse_mode: 'Markdown'
                                    });
                                })
                    }
                    else if (dac == null) {
                        user.save((err, user) => {
                            ctx.telegram.sendMessage(ctx.message.chat.id = `${add}`, `
Приветствуем Вас *${ctx.message.from.first_name}*

🔻 \`Для работы с ботом воспользуйтесь меню.\` `, {
                                parse_mode: 'Markdown',
                                reply_markup: {
                                    keyboard: [
                                        ['📲Войти в чат','🔰Правила чата'],
                                        ['💶Заработать','🔄Накрутка'],
                                        ['✅Реклама']
                                    ],
                                    resize_keyboard: true
                                }
                            });
                            console.log('good', user)
                        });
                    }
                })

            }
        })}

});
bot.hears(/ban (.+)/, (ctx) => {

    const text = ctx.message.text;
    const newStr = text.replace('/ban ', "",);
    const user = ban({
        word: newStr
    });

    const as = ctx.message.chat.type;
    const chat = ctx.message.chat.id;

    if (as !== 'supergroup' && chat === Config.admin){
        user.save(() => {
            ctx.reply('Попал в бан')
        });
    }

});
bot.command('start', (ctx) => {

    const as = ctx.message.chat.type;

    if(as !== 'supergroup'){
        const id = ctx.message.chat.id;
        const user = base_user({
            user_id: ctx.message.chat.id,
            money: 0,
            members: 0,
            referrer: '',
            status: 'Отсутствует',
            key: 0,
            key2: 0,
            key3: 0,
            key4: 0
        });

        base_user.findOne({'user_id': id },function(err, doc) {

            if(doc !== null)
            {


                    ctx.reply(`\`🔻 Для работы с ботом воспользуйтесь меню.\``, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['📲Войти в чат','🔰Правила чата'],
                                ['💶Заработать','🔄Накрутка'],
                                ['✅Реклама']
                            ],
                            resize_keyboard:true
                        }
                    });

            }
            else if (doc === null) {
                user.save(() => {
                    ctx.reply(`
Приветствуем Вас *${ctx.message.from.first_name}*

🔻 \`Для работы с ботом воспользуйтесь меню.\``, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['📲Войти в чат','🔰Правила чата'],
                                ['💶Заработать','🔄Накрутка'],
                                ['✅Реклама']
                            ],
                            resize_keyboard:true
                        }
                    });
                })

            }
        });
    }
});
bot.command('admin', (ctx) => {
    const as = ctx.message.chat.type;
    const chat = ctx.message.chat.id;

    if (as !== 'supergroup' && chat === Config.admin){

        ctx.reply(`...`, {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [
                    ['Рекламный пост'],
                    ['↖️Назад']
                ],
                resize_keyboard: true
            }
        });
    }
    else if(as !== 'supergroup'){
        ctx.reply(`❌ Недоступно`,{
            parse_mode: 'Markdown'
        })
    }
});
bot.command('post', (ctx) => {
    const as = ctx.message.chat.type;

    if (as !== 'supergroup'){
        const html = `
☑️ <b>Для размещения поста пишем сюда</b>:

👤 @rtdme
        
        `;
        ctx.reply(html, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [
                    ['📲Войти в чат','🔰Правила чата'],
                    ['💶Заработать','🔄Накрутка'],
                    ['✅Реклама']
                ],
                resize_keyboard: true
            }
        });
    }
});
bot.command('help', (ctx) => {
    const as = ctx.message.chat.type;
    const text  = `
[❗️Инструкция](https://bit.ly/2pLzAsh)`;

    if (as !== 'supergroup'){
        ctx.reply(text, {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [
                    ['📲Войти в чат','🔰Правила чата'],
                    ['💶Заработать','🔄Накрутка'],
                    ['✅Реклама']
                ],
                resize_keyboard: true
            }
        });
    }
});
bot.command('send', stepHandler, (ctx) => {

    const as = ctx.message.chat.type;
    const chat = ctx.message.chat.id;

    if (as !== 'supergroup' && chat === Config.admin){
        ctx.scene.enter('send')
    }
});

bot.hears('🔺Подписаться', (ctx) => {

    const as = ctx.message.chat.type;

    if (as !== 'supergroup'){
    let r = 0;
    let userExists = false;
    base_channel.find({}, function (err, users) {

        users.forEach(function (userName) {

            ctx.telegram.getChatMember(`@${userName.channel_username}`, ctx.message.chat.id).then((i) => {
                if (!userExists) {
                    r++;
                    if (i.status === 'left') {
                        r = 0;
                        const html = `
🔺 <b>Подпишитесь на данный канал, затем нажмите «Проверить».</b>
                        
@${userName.channel_username}                   
                        `;
                        ctx.reply(html, {
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: `Проверить`,
                                            callback_data: `${userName.channel_username}`
                                        }
                                    ]
                                ]
                            }
                        });
                        userExists = true;
                    }
                    else if (r >= users.length) {
                        r = 0;
                        ctx.reply('<b>Заданий нету, попробуйте позже.</b>', {
                            parse_mode: 'HTML'
                        });
                        userExists = true;
                    }
                }
            }).catch((err) => {
                    r++;
                    if (r >= users.length) {
                        r = 0;
                        ctx.reply('<b>Заданий нету, попробуйте позже.</b>', {
                            parse_mode: 'HTML'
                        });
                    }
                });
        });

    })
    }
});
bot.hears('🔄Накрутка', (ctx) => {
    const as = ctx.message.chat.type;
    const text  = `\`...\``;

    if (as !== 'supergroup'){
        ctx.reply(text, {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [
                    ['☑️Баланс'],
                    ['🔺Подписаться','🔻Накрутить'],
                    ['❗️Инструкция'],
                    ['↖️Назад']
                ],
                resize_keyboard: true
            }
        });
    }
    console.log(ctx.message)
});
bot.hears('☑️Баланс', (ctx) => {
    const id = ctx.message.chat.id;
    const as = ctx.message.chat.type;

    if (as !== 'supergroup'){
        base_user.findOne({'user_id': id}, function (err, doc) {
            const text = `
*Баланс*: ${doc.key} VP
    `;
            if (as !== 'supergroup') {
                ctx.reply(text, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        keyboard: [
                            ['☑️Баланс'],
                            ['🔺Подписаться','🔻Накрутить'],
                            ['❗️Инструкция'],
                            ['↖️Назад']
                        ],
                        resize_keyboard: true
                    }
                });
            }
        });
    }

});
bot.hears('🔻Накрутить', (ctx) => {

    const as = ctx.message.chat.type;
    const id = ctx.message.chat.id;

    if (as !== 'supergroup') {

        base_user.findOne({'user_id': id}, function (err, doc) {

            if (doc.key >= 2) {
                ctx.scene.enter('vp');
            }else (
                ctx.reply(`
🔻 *У Вас недостаточно VP*.

*Баланс*: ${doc.key} VP 

⚠ \`Минимальный заказ на накрутку составляет от\`: *2VP*  
        `, {
                    parse_mode: 'Markdown'}))
        })
    }

});
bot.hears('❗️Инструкция', (ctx) => {

    const as = ctx.message.chat.type;
    const text  = `
[❗️Инструкция](https://bit.ly/2pLzAsh)`;

    if (as !== 'supergroup'){
        ctx.reply(text, {
            parse_mode: 'Markdown'
        });
    }
});

bot.hears('📲Войти в чат', (ctx) => {
    const id = ctx.message.chat.id;
    const as = ctx.message.chat.type;

    if (as !== 'supergroup'){
            const markdown = `
📲 <b>Вход в чат</b>:


➡️ <a href="http://t.me/${Config.invite}/">Войти в чат</a>

            `;
            ctx.telegram.sendMessage(id, markdown,{
                parse_mode: 'HTML'
            });

    }
    console.log(ctx.message)
});
bot.hears('🔰Правила чата', (ctx) => {
    const as = ctx.message.chat.type;

    if (as !== 'supergroup'){
    const markdown = `
✅*Правила нашего чата*!

Чат предназначен для совершения взаимных подписок на каналы, группы и ботов среди пользователей чата, а так же для всяких прикалюшек типа пролистать ленту на канале или поставить лайк под постом.

⛔️*В данном чате запрещается*:

- флуд, флейм, спам
- рекламировать что либо
- пересылка из других источников
- отправка медиафайлов
- пропаганда наркотиков, порнографии
- ругаться матом
- отправка внешних ссылок

⚠️За несоблюдение правил грозит *Бан*, сроком на *1 месяц*.

\`Большое Спасибо за внимание!\`           
                `;
    ctx.reply(markdown, {
        parse_mode: 'Markdown'
    })}
});
bot.hears('💶Заработать', (ctx) => {
    const id = ctx.message.chat.id;
    const as = ctx.message.chat.type;

    if (as !== 'supergroup'){
        base_user.findOne({'user_id': id },function(err, doc) {
        const markdown = `
💳 *Баланс*: ${doc.money} ₽
👥 *Кол-во приглашенных*: ${doc.members}

❗️\`Мы платим\` *0.3₽* \`за каждого привлеченного юзера в наш Бот\`.

✅ *Ваша ссылка для приглашения*:

https://t.me/isvaxbot?start=${ctx.message.chat.id}

⚠ \`Минимальная сумма для снятия средств составляет\`: *10₽*          
                `;
        ctx.reply(markdown, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: {
                keyboard: [
                    ['➕Вывести'],
                    ['↖️Назад']
                ],
                resize_keyboard: true,
            }
        });
    })}
});
bot.hears('➕Вывести', (ctx) => {

    const id = ctx.message.chat.id;
    const as = ctx.message.chat.type;

    if (as !== 'supergroup'){base_user.findOne({'user_id': id },function(err, doc) {

        if (doc.money >= 10) {
            ctx.scene.enter('cash');
        }
        else (
            ctx.reply(`
💳 *На вашем балансе недостаточно средств*.

*Баланс*: ${doc.money} ₽ 

⚠ \`Минимальная сумма для снятия средств составляет\`: *10₽*  
        `, {
            parse_mode: 'Markdown'}))

    })}

});
bot.hears('↖️Назад', (ctx) => {
    const as = ctx.message.chat.type;

    if (as !== 'supergroup'){ctx.reply(`

\`...\``, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                ['📲Войти в чат','🔰Правила чата'],
                ['💶Заработать','🔄Накрутка'],
                ['✅Реклама']
            ],
            resize_keyboard:true
        }
    })}
});
bot.hears('Отмена', (ctx) => {

    const as = ctx.message.chat.type;

    if (as !== 'supergroup'){ctx.reply(`

\`...\``, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                ['📲Войти в чат','🔰Правила чата'],
                ['💶Заработать','🔄Накрутка'],
                ['✅Реклама']
            ],
            resize_keyboard:true
        }
    })}
});
bot.hears('3', (ctx) => {
    // ctx.exportChatInviteLink(Config.channel)
});
bot.hears('✅Реклама', (ctx) => {
    const as = ctx.message.chat.type;

    if (as !== 'supergroup'){
        const html = `
✅ <b>Рекламный пост</b>!

<b>Стоимость услуги</b>: 10₽ на весь день.

⚠️ Пост будет появляться каждые полчаса в течение всего дня с <b>7</b>:<b>00</b> до <b>00</b>:<b>00</b> по МСК времени. 

☑️ <b>Разместить пост</b>: /post
        
        `;
        ctx.reply(html, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [
                    ['📲Войти в чат','🔰Правила чата'],
                    ['💶Заработать','🔄Накрутка'],
                    ['✅Реклама']
                ],
                resize_keyboard: true
            }
        });
    }
});
bot.hears('Рекламный пост', (ctx) => {
    const as = ctx.message.chat.type;
    const chat = ctx.message.chat.id;

    if (as !== 'supergroup' && chat === Config.admin){
        advertising.findById('5d6e9dc07b54162974ebe09b' ,function(err, doc) {
            if(doc.word === 1 || doc.word === 2) {
                ctx.reply(`...`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        keyboard: [
                            ['Изменить'],
                            ['выкл'],
                            ['↖️Назад']
                        ],
                        resize_keyboard: true
                    }
                });
            }
            else if(doc.word === 0){
                ctx.reply(`...`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        keyboard: [
                            ['Изменить'],
                            ['Билборд'],
                            ['вкл'],
                            ['↖️Назад']
                        ],
                        resize_keyboard:true
                    }
                });
            }
        });

    }
});
bot.hears('Изменить', (ctx) => {
    const as = ctx.message.chat.type;
    const chat = ctx.message.chat.id;

    if (as !== 'supergroup' && chat === Config.admin) {
        ctx.scene.enter('edit');
    }
});

var orologio_statistiche_recenti;
var intervalFn=function() {

    advertising.findById('5d6e9dc07b54162974ebe09b' ,function(err, doc) {
        if (doc.word === 1) {

            bot.telegram.sendMessage(Config.channel, `${doc.text}`,{
                parse_mode: 'HTML'
            });
            console.log('hello');
        }
        else if (doc.word === 2) {

            bot.telegram.sendMessage(Config.channel, `${doc.text1}`,{
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Разместить',
                                url: 'http://t.me/isvaxbot?start=advertising'
                            }
                        ],
                    ]
                }
            });
        }
    })

};
orologio_statistiche_recenti = setInterval(intervalFn, 1800000);


bot.hears('выкл', (ctx) => {

    const as = ctx.message.chat.type;
    const chat = ctx.message.chat.id;

    if (as !== 'supergroup' && chat === Config.admin){
        advertising.findById('5d6e9dc07b54162974ebe09b' ,function(err, doc) {
            advertising.updateOne(
                {'word': doc.word},
                {$set: {'word': 0}}, function () {
                    ctx.reply(`Выключенно`, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['Изменить'],
                                ['Билборд'],
                                ['вкл'],
                                ['↖️Назад']
                            ],
                            resize_keyboard:true
                        }
                    });
                })
        });
    }

});
bot.hears('вкл', (ctx) => {

    const as = ctx.message.chat.type;
    const chat = ctx.message.chat.id;

    if (as !== 'supergroup' && chat === Config.admin){
        advertising.findById('5d6e9dc07b54162974ebe09b' ,function(err, doc) {
            advertising.updateOne(
                {'word': doc.word},
                {$set: {'word': 1}}, function () {
                    ctx.reply(`Включенно`, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['Изменить'],
                                ['выкл'],
                                ['↖️Назад']
                            ],
                            resize_keyboard:true
                        }
                    });
                })
        });
    }


});
bot.hears('Билборд', (ctx) => {

    const as = ctx.message.chat.type;
    const chat = ctx.message.chat.id;

    if (as !== 'supergroup' && chat === Config.admin){
        advertising.findById('5d6e9dc07b54162974ebe09b' ,function(err, doc) {
            advertising.updateOne(
                {'word': doc.word},
                {$set: {'word': 2}}, function () {
                    ctx.reply(`Включенно`, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            keyboard: [
                                ['Изменить'],
                                ['выкл'],
                                ['↖️Назад']
                            ],
                            resize_keyboard:true
                        }
                    });
                })
        });
    }

});

bot.on('channel_post', (ctx) => {

    // ctx.telegram.getChatMember(number, ctx.message.from.id).then(err => {
    //     if(err.status == 'left'){
    //
    //     }
    // });
    console.log(ctx.update)
});
bot.on('message', ctx => {

    const message_id = ctx.message.message_id;
    const message = ctx.message.text;
    const as = ctx.message.chat.type;

    if (as === 'supergroup'){

        if (ctx.message.new_chat_member) {

            channel_base_user.findOne({'user_id': ctx.message.from.id}, function (err, doc) {

                if (doc === null) {

                    const user = channel_base_user({
                        user_id: ctx.message.from.id,
                        money: 0,
                        members: 0,
                        referrer: '',
                        status: 'Отсутствует',
                        key: 0,
                        key2: 0,
                        key3: 0,
                        key4: 0
                    });

                    user.save(() => {
                        ctx.telegram.sendMessage(ctx.message.chat.id,
                            `[${ctx.message.from.first_name}](tg://user?id=${ctx.message.from.id}), \`Приветствуем вас в нашем чате!\`
\`Рекомендуем прочесть правила!\``,
                            {
                                parse_mode: 'Markdown',
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            {
                                                text: `🔰Правила чата`,
                                                url: `http://t.me/${Config.bot}?start=regulation`
                                            }
                                        ],
                                    ]
                                },
                            })
                    });
                }
                else if (doc !== null) {
                    ctx.telegram.sendMessage(ctx.message.chat.id,
                        `[${ctx.message.from.first_name}](tg://user?id=${ctx.message.from.id}), \`Приветствуем вас в нашем чате!\`
\`Рекомендуем прочесть правила!\``,
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: `🔰Правила чата`,
                                            url: `http://t.me/${Config.bot}?start=regulation`
                                        }
                                    ],
                                ]
                            },
                        })
                }
            });
            ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message = message_id)
        }
        else if (message) {
            const add = ctx.message.from.id;
            if (ctx.message.forward_from_chat || ctx.message.forward_from) {

                ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message = message_id)

            }
            else if(ctx.message.reply_to_message){
                if(ctx.message.reply_to_message.from.id === 858522531){ctx.reply('Hello')}}
            else{
                const isArabic =  /[\u0600-\u06FF\u0750-\u077F]/;
                const x  =  ctx.message.text;
                if(!x.match(isArabic)) {
                    channel_base_user.findOne({'user_id': add}, function (err, doc) {
                        if (doc !== null) {
                            if (doc.key === 1) {

                                    ctx.telegram.sendMessage(ctx.message.chat.id, `
[${ctx.message.from.first_name}](tg://user?id=${ctx.message.from.id}), \`интервал между сообщениями\` *2* \`секунды\`.
`, {
                                        parse_mode: 'Markdown'
                                    });

                                ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message = message_id)
                            }
                            else {
                                channel_base_user.updateOne(
                                    {'user_id': add},
                                    {$set: {'key': 1}}, function () {
                                        ban.find({}, function (err, docs) {
                                            docs.forEach(function (user) {
                                                if (message.toLowerCase().indexOf(user.word) !== -1) {
                                                    console.log(user.word);
                                                    ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message = message_id).then(() => {

                                                    })
                                                }
                                            })
                                        });
                                    });
                                setTimeout(function () {

                                    channel_base_user.updateOne(
                                        {'user_id': add},
                                        {$set: {'key': 0}}, function () {
                                        })
                                }, 5000);
                            }
                        }
                        else if(doc === null) {
                            const user1 = channel_base_user({
                                user_id: ctx.message.from.id,
                                money: 0,
                                members: 0,
                                referrer: '',
                                status: 'Отсутствует',
                                key: 0,
                                key2: 0,
                                key3: 0,
                                key4: 0
                            });
                            user1.save(() => {
                                channel_base_user.updateOne(
                                    {'user_id': add},
                                    {$set: {'key': 1}}, function () {
                                        ban.find({}, function (err, docs) {
                                            docs.forEach(function (user) {
                                                if (message.toLowerCase().indexOf(user.word) !== -1) {
                                                    ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message = message_id);
                                                }
                                            })
                                        });
                                    });
                                setTimeout(function () {
                                    channel_base_user.updateOne(
                                        {'user_id': add},
                                        {$set: {'key': 0}}, function () {
                                        })
                                }, 5000);
                            });
                        }
                    });
                }

                else(
                    ctx.telegram.restrictChatMember(ctx.message.chat.id, ctx.message.from.id, false).then(() => {
                        ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message = message_id)
                    })
                )

            }
        }
        else if (ctx.message.left_chat_member) {
            ctx.telegram.deleteMessage(ctx.message.chat.id, ctx.message.message = message_id)
        }
        else{
            const user = channel_base_user({
                user_id: ctx.message.from.id,
                money: 0,
                members: 0,
                referrer: '',
                status: 'Отсутствует',
                key: 0,
                key2: 0,
                key3: 0,
                key4: 0
            });

            user.save(() => {})
        }


    }
    // else if(as !== 'supergroup'){
    //     const id = ctx.message.chat.id;
    //     const username_channel = ctx.message.forward_from_chat.username;
    //     const forward = ctx.message.forward_from_chat;
    //     const user = base_channel({
    //         user_id: id,
    //         channel_username: username_channel,
    //         number1: ' ',
    //         number2: ' ',
    //         number3: ' '
    //     });
    //     if(forward) {
    //         user.save(() => {
    //             ctx.reply('Saved')
    //         })
    //     }
    //     else{console.log(ctx.message)}
    // }

    console.log(ctx.message);

});

// bot.on('edited_message', ctx => {
//
//     const message_id = ctx.update.edited_message.message_id;
//
//         const add = ctx.update.edited_message.from.id;
//             const isArabic =  /[\u0600-\u06FF\u0750-\u077F]/;
//             const x  =  ctx.update.edited_message.text;
//             if(!x.match(isArabic)) {
//                 channel_base_user.findOne({'user_id': add}, function (err, doc) {
//                     if (doc !== null) {
//                         if (doc.key === 1) {
//
//                             ctx.telegram.sendMessage(ctx.update.edited_message.chat.id, `
// 1, \`интервал между сообщениями\` *2* \`секунды\`.
// `, {
//                                 parse_mode: 'Markdown'
//                             });
//
//                             ctx.telegram.deleteMessage(ctx.update.edited_message.chat.id, ctx.update.message = message_id)
//                         }
//                         else {
//                             const message = ctx.update.edited_message.text;
//                             channel_base_user.updateOne(
//                                 {'user_id': add},
//                                 {$set: {'key': 1}}, function () {
//                                     ban.find({}, function (err, docs) {
//                                         docs.forEach(function (user) {
//                                             if (message.toLowerCase().indexOf(user.word) !== -1) {
//                                                 console.log(user.word);
//                                                 ctx.telegram.deleteMessage(ctx.update.edited_message.chat.id, ctx.update.message = message_id).then(() => {
//
//                                                 })
//                                             }
//                                         })
//                                     });
//                                 });
//                             setTimeout(function () {
//
//                                 channel_base_user.updateOne(
//                                     {'user_id': add},
//                                     {$set: {'key': 0}}, function () {
//                                     })
//                             }, 5000);
//                         }
//                     }
//                     else if(doc === null) {
//                         const user1 = channel_base_user({
//                             user_id: add,
//                             money: 0,
//                             members: 0,
//                             referrer: '',
//                             status: 'Отсутствует',
//                             key: 0,
//                             key2: 0,
//                             key3: 0,
//                             key4: 0
//                         });
//                         user1.save(() => {
//                             channel_base_user.updateOne(
//                                 {'user_id': add},
//                                 {$set: {'key': 1}}, function () {
//                                     ban.find({}, function (err, docs) {
//                                         docs.forEach(function (user) {
//                                             if (message.toLowerCase().indexOf(user.word) !== -1) {
//                                                 ctx.telegram.deleteMessage(ctx.update.edited_message.chat.id, ctx.update.message = message_id);
//                                             }
//                                         })
//                                     });
//                                 });
//                             setTimeout(function () {
//                                 channel_base_user.updateOne(
//                                     {'user_id': add},
//                                     {$set: {'key': 0}}, function () {
//                                     })
//                             }, 5000);
//                         });
//                     }
//                 });
//             }
//
//             else(
//                 ctx.telegram.restrictChatMember(ctx.update.edited_message.chat.id, ctx.update.edited_message.from.id, false).then(() => {
//                     ctx.telegram.deleteMessage(ctx.update.edited_message.chat.id, ctx.update.message = message_id)
//                 })
//             )
//
//
//
//     console.log(ctx.update.edited_message.text)
// });
bot.on('callback_query', ctx => {

    const s = ctx.update.callback_query.from.id;
    const query = ctx.callbackQuery.data;

    if (query === 'jok') {
        const chatId = ctx.callbackQuery.from.id;
        const messageId = ctx.callbackQuery.message.message_id;

        let r = 0;
        let userExists = false;
        base_channel.find({}, function (err, users) {

            users.forEach(function (userName) {

                ctx.telegram.getChatMember(`@${userName.channel_username}`, s).then((i) => {
                    if (!userExists) {
                        r++;
                        if (i.status === 'left') {
                            r = 0;
                            const html = `
🔺 <b>Подпишитесь на данный канал, затем нажмите «Проверить».</b>
                        
@${userName.channel_username}                   
                        `;
                            ctx.editMessageText(html,{
                                chat_id: chatId,
                                message_id: messageId,
                                parse_mode: 'HTML',
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            {
                                                text: `Проверить`,
                                                callback_data: `${userName.channel_username}`
                                            }
                                        ]
                                    ]
                                }
                            });
                            userExists = true;
                        }
                        else if (r >= users.length) {
                            r = 0;
                            ctx.editMessageText('<b>Заданий нету, попробуйте позже.</b>',{
                                chat_id: chatId,
                                message_id: messageId,
                                parse_mode: 'HTML'
                            })
                            userExists = true;
                        }
                    }
                }).catch((err) => {
                    r++;
                    if (r >= users.length) {
                        r = 0;
                        ctx.reply('<b>Заданий нету, попробуйте позже.</b>', {
                            parse_mode: 'HTML'
                        });
                    }
                });
            });

        })
    }
    else {
        const chatId = ctx.callbackQuery.from.id;
        const channel = ctx.callbackQuery.data;
        const messageId = ctx.callbackQuery.message.message_id;


        ctx.telegram.getChatMember(`@${channel}`, chatId).then((i) => {
            if (i.status === 'left') {
                const html = `
❌ <b>Вы не подписались.</b>                                                              
                        `;
                ctx.editMessageText(html,{
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Далее',
                                    callback_data: 'jok'
                                }
                            ],
                        ]
                    }
                })
            }
            else if (i.status === 'member') {
                const html1 = `
✅ <b>Получено 1 VP.</b>                                                              
                        `;
                base_user.findOne({user_id: chatId},function(err, doc) {
                    if(doc !== null){
                        base_user.updateOne(
                            {'user_id': chatId},
                            {$set: {'key': doc.key + 1}}, function () {})
                    }
                });
                ctx.editMessageText(html1,{
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Далее',
                                    callback_data: 'jok'
                                }
                            ],
                        ]
                    }
                }).then(() => {
                    base_channel.findOne({channel_username: channel},function(err, doc) {
                        if(doc !== null){
                                    if(doc.number1 <= 0){
                                        base_channel.remove({channel_username: channel}).exec();
                                    }
                                    else if(doc.number1 > 0){
                                        base_channel.updateOne(
                                                    {channel_username: channel},
                                                    {$set: {'number1': doc.number1 - 1}}, function () {})
                                    }
                        }
                        else if(doc === null){
                            console.log(channel)
                        }
                    })
                })
            }
        })
    }
    console.log(ctx.update)
});

db.once('open', () => {

    channel_base_user.updateMany(
        {'key': 1},
        { $set: {'key': 0}},function () {
            console.log('Изменили')
        });
});

bot.startPolling();
