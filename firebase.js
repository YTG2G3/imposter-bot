const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const fapp = initializeApp({ credential: applicationDefault() });
const firestore = getFirestore(fapp);

const servers = firestore.collection("servers");
const matches = firestore.collection("matches");
const members = firestore.collection("members");

module.exports = { servers, matches, members };