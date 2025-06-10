require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Client, IntentsBitField } = require('discord.js');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

const discordClient = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.MessageContent
  ]
});

discordClient.login(process.env.TOKEN);

app.get('/guilds', async (req, res) => {
  try {
    const guilds = discordClient.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      memberCount: guild.memberCount,
      channelCount: guild.channels.cache.size,
      roleCount: guild.roles.cache.size,
      emojiCount: guild.emojis.cache.size
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    res.json(guilds);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/guilds/:id/channels', async (req, res) => {
  try {
    const guild = discordClient.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).send('Servidor no encontrado');
    
    const channels = guild.channels.cache
      .filter(channel => channel.type === 0)
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    res.json(channels);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/guilds/:id/voice-channels', async (req, res) => {
  try {
    const guild = discordClient.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).send('Servidor no encontrado');
    
    const voiceChannels = guild.channels.cache
      .filter(channel => channel.type === 2) // 2 = GUILD_VOICE
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    res.json(voiceChannels);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/guilds/:id/roles', async (req, res) => {
  try {
    const guild = discordClient.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).send('Servidor no encontrado');
    
    const roles = guild.roles.cache
      .filter(role => !role.managed && role.name !== '@everyone')
      .map(role => ({
        id: role.id,
        name: role.name,
        color: role.hexColor
      }))
      .sort((a, b) => b.position - a.position);
    
    res.json(roles);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/guilds/:id/members', async (req, res) => {
  try {
    const guild = discordClient.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).send('Servidor no encontrado');
    
    await guild.members.fetch();
    const members = guild.members.cache
      .filter(member => !member.user.bot)
      .map(member => ({
        id: member.id,
        username: member.user.username,
        discriminator: member.user.discriminator,
        avatar: member.user.displayAvatarURL()
      }))
      .sort((a, b) => a.username.localeCompare(b.username));
    
    res.json(members);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/guilds/:id/emojis', async (req, res) => {
  try {
    const guild = discordClient.guilds.cache.get(req.params.id);
    if (!guild) return res.status(404).send('Servidor no encontrado');
    
    const emojis = guild.emojis.cache.map(emoji => ({
      id: emoji.id,
      name: emoji.name,
      animated: emoji.animated,
      url: emoji.imageURL()  // CORRECCIÓN APLICADA AQUÍ
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    res.json(emojis);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/send-message', async (req, res) => {
  try {
    const { guildId, channelId, content } = req.body;
    const guild = discordClient.guilds.cache.get(guildId);
    if (!guild) return res.status(404).send('Servidor no encontrado');
    
    const channel = guild.channels.cache.get(channelId);
    if (!channel || channel.type !== 0) return res.status(404).send('Canal no válido');
    
    await channel.send(content);
    res.json({ success: true });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Dashboard funcionando en http://localhost:${port}`);
});

discordClient.on('ready', () => {
  console.log(`✅ Bot conectado como ${discordClient.user.tag}`);
});