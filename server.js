const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'open') {
            const creds = require('fs').readFileSync('auth_info/creds.json', 'utf-8');
            const session = Buffer.from(creds).toString('base64');
            res.send(`<h2>Session ID:</h2><textarea rows="10" cols="80">${session}</textarea>`);
        }

        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = new Boom(lastDisconnect.error)).output.statusCode !== DisconnectReason.loggedOut;
            if(shouldReconnect) {
                res.send('Connection closed. Please refresh and try again.');
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
});

app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
