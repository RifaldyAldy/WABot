const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const { state, saveState } = useMultiFileAuthState('auth_info_baileys');

async function connectToWhatsapp() {
  // membuat koneksi
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    defaultQueryTimeoutMs: undefined,
  });

  // sock.ev.on("connection.update")
}

connectToWhatsapp();
