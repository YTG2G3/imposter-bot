const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const fapp = initializeApp({ credential: applicationDefault() });

const firestore = getFirestore(fapp);
const servers = firestore.collection("servers");

module.exports = { servers };