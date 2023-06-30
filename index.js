// Menambahkan dependencies
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const Boom = require('@hapi/boom');
const GPT = require('./openai');

// fungsi utama WA BOT
async function connectToWhatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState('Auth_info_logins');
  // console.log(state);

  // buat koneksi baru
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    defaultQueryTimeoutMs: undefined,
  });

  // Handler untuk event 'connection.update'
  function handleConnectionUpdate(update) {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reconnecting = (lastDisconnect.error === Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`Koneksi terputus karena ${lastDisconnect.error}, Hubungkan kembali! ${reconnecting}`);
      if (reconnecting) {
        connectToWhatsapp();
      }
    } else if (connection === 'open') {
      console.log('Terhubung!');
    }
  }

  // Menambahkan listener untuk event 'connection.update'
  sock.ev.on('connection.update', handleConnectionUpdate);

  await sock.ev.on('creds.update', saveCreds);

  // Fungsi untuk memantau pesan masuk
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    console.log(`Tipe pesan : ${type}`);
    const number = messages[0].key.remoteJid;
    if (type === 'notify' && !messages[0].key.fromMe) {
      try {
        let selainPesan = false;
        console.log(messages);
        let chat = messages[0].message.conversation;
        if (!chat) {
          chat = messages[0].message.extendedTextMessage.text;
        }
        const ambilRequestChat = chat.split(' ').slice(1).join(' ').toString();
        const ambilRequest = ambilRequestChat.split(' ')[0];

        //membuat variabel untuk mengecek apakah pesan dari group dan mention bot
        const isMessageGroup = number.includes('@g.us');
        const isMessageMentionBot = chat.includes('@628388995241');

        console.log(number);
        console.log(chat);
        if (chat.toLowerCase() === 'ping') {
          const send = await sock.sendMessage(number, { text: 'Halo, selamat datang\nBot Berfungsi dengan baik!' }, { quoted: messages[0] }, 2000);
          selainPesan = true;
        }

        //logic jika mention bot saja
        if (isMessageGroup && isMessageMentionBot && ambilRequestChat.includes('/nanya')) {
          await sock.sendMessage(number, { text: 'Sebentar sedang mikir...' }, { quoted: messages[0] }, 2000);
          const req = await GPT(ambilRequestChat);
          await sock.sendMessage(number, { text: req }, { quoted: messages[0] }, 2000);
          selainPesan = true;
          // console.log(ambilRequestChat);
        }
        if (chat.includes('/nanya')) {
          await sock.sendMessage(number, { text: 'Sebentar sedang mikir...' }, { quoted: messages[0] }, 2000);
          console.log('isi pesan nya', ambilRequestChat);
          const req = await GPT(ambilRequestChat);
          await sock.sendMessage(number, { text: req }, { quoted: messages[0] }, 2000);
          console.log(ambilRequestChat);
          selainPesan = true;
        }
        if (selainPesan === false) {
          await sock.sendMessage(number, { text: `Maaf, pesan anda tidak saya kenali,\nuntuk membuat pertanyaan silahkan pakai kunci \n"/nanya (pertanyaan anda)"` });
        }
      } catch (e) {
        console.log(e);
      }
    }
  });
}

// menjalankan Whatsapp bot
connectToWhatsapp().catch((error) => {
  console.log(error);
});
