import { readFile, writeFile } from 'node:fs/promises';

const clientId = process.env.TWITCH_CLIENT_ID;
const secret = process.env.TWITCH_CLIENT_SECRET;
if (!clientId || !secret) throw new Error('TWITCH_CLIENT_ID et TWITCH_CLIENT_SECRET requis');

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Twitch HTTP ${response.status}: ${url.split('?')[0]}`);
  return response.json();
}

const creators = JSON.parse(await readFile(new URL('../data/creators.json',import.meta.url),'utf8'));
const logins = [...new Set(creators.map(c => c.twitch.toLowerCase()))];
const token = await request('https://id.twitch.tv/oauth2/token', {method:'POST',body:new URLSearchParams({client_id:clientId,client_secret:secret,grant_type:'client_credentials'})});
const headers = {'Client-Id':clientId,'Authorization':`Bearer ${token.access_token}`};
const streams = [];
// Helix accepte jusqu'à 100 identifiants par appel. Une erreur interrompt la mise à jour :
// l'ancien instantané devient périmé au lieu de signaler à tort des chaînes hors ligne.
for (let i=0;i<logins.length;i+=100) {
  const params = new URLSearchParams();
  for (const login of logins.slice(i,i+100)) params.append('user_login',login);
  params.set('first','100');
  const data = await request(`https://api.twitch.tv/helix/streams?${params}`,{headers});
  streams.push(...data.data.map(s => ({login:s.user_login.toLowerCase(),title:s.title,category:s.game_name,viewers:s.viewer_count,thumbnail:s.thumbnail_url.replace('{width}','440').replace('{height}','248'),startedAt:s.started_at})));
}
// Atomic replacement prevents a partially written public JSON file.
const target = new URL('../data/live.json',import.meta.url);
const temporary = new URL('../data/live.json.tmp',import.meta.url);
await writeFile(temporary,JSON.stringify({updatedAt:new Date().toISOString(),status:'ok',streams},null,2)+'\n');
await (await import('node:fs/promises')).rename(temporary,target);
console.log(`Synchronisation terminée : ${streams.length} live(s) sur ${logins.length} chaîne(s).`);
