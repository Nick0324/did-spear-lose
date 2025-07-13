const express = require('express');
const axios = require('axios');
require('dotenv').config();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static('public')); // serve frontend from /public

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const MATCH_REGION = 'europe';

// Hardcoded Riot ID and Tagline
const RIOT_ID = 'Speartan';
const RIOT_TAGLINE = 'EUW';

console.log("RIOT_API_KEY loaded:", RIOT_API_KEY ? "yes" : "no");

app.get('/match-result', async (req, res) => {
  try {
    const accountRes = await axios.get(
      `https://${MATCH_REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${RIOT_ID}/${RIOT_TAGLINE}?api_key=${RIOT_API_KEY}`,
    );

    const puuid = accountRes.data.puuid;

    const matchIdsRes = await axios.get(
      `https://${MATCH_REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=1&api_key=${RIOT_API_KEY}`,
    );

    const lastMatchId = matchIdsRes.data[0];

    const matchDataRes = await axios.get(
      `https://${MATCH_REGION}.api.riotgames.com/lol/match/v5/matches/${lastMatchId}?api_key=${RIOT_API_KEY}`,
    );

    const match = matchDataRes.data;
    const player = match.info.participants.find(p => p.puuid === puuid);

    res.json({
      riotId: `${RIOT_ID}#${RIOT_TAGLINE}`,
      matchId: lastMatchId,
      win: player.win,
      champion: player.championName,
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      gameMode: match.info.gameMode,
      time: new Date(match.info.gameEndTimestamp).toLocaleString()
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Could not fetch match result',
      details: err.response?.data || err.message
    });
  }
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
