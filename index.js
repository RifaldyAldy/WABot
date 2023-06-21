// Menambahkan dependencies
const { default: makeWASocket, DisconnectReason, useSingleFileAuthState } = require('@adiwajshing/baileys');
const Boom = require('@hapi/boom');
const { state, saveState } = useSingleFileAuthState('./login.json');

// fungsi utama WA BOT
async function connectToWhatsapp() {
  // Membuat objek agent proxy

  // buat koneksi baru
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reconnecting = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`Koneksi terputus karena ${lastDisconnect.error}, Hubungkan kembali! ${reconnecting}`);
      if (reconnecting) {
        connectToWhatsapp();
      }
    } else if (connection === 'open') {
      console.log('Terhubung!');
    }
  });

  sock.ev.on('creds.update', saveState);

  //Fungsi untuk memantau pesan masuk
  sock.ev.on('messages.upsert', ({ messages, type }) => {
    console.log(`Tipe pesan : ${type}`);
    console.log(messages);
  });
}

connectToWhatsapp();
