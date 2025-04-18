const https = require("https");
const settings = [];

const settingsConstructor = {
    indiaChannel: null,
    indiaUsers: []
};

function httpGet(path) {
    /*return new Promise((resolve, reject) => {
        const get = https.get({
            hostname: "janibotdb.cyclic.app",
            path: path,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }, res => {
            let data = "";

            res.on("data", chunk => {
                data += chunk;
            });

            res.on("end", () => {
                resolve(JSON.parse(data));
            });
        });
    
        get.end();
    });*/
};

function httpPost(path, data) {
    /*const post = https.request({
        hostname: "janibotdb.cyclic.app",
        path: path,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });

    post.write(JSON.stringify(data));
    post.end();*/
};

settings.newGuild = async function(guildId) {
    /*const server = await httpGet(`/${guildId}/settings`);

    if (!server) {
        httpPost(`/${guildId}/settings`, settingsConstructor);
    };*/
};

settings.getGuild = async function(guildId) {
    /*const serverSettings = await httpGet(`/${guildId}/settings`);

    return serverSettings.props;*/
    return settingsConstructor;
};

settings.setGuildValue = async function(guildId, setting, value) {
    /*const serverSettings = await httpGet(`/${guildId}/settings`);
    
    if (serverSettings) {
        if (serverSettings["props"]) {
            for (const key in serverSettings["props"]) {
                if (serverSettings["props"].hasOwnProperty(key)) {
                    serverSettings[key] = serverSettings["props"][key];
                };
            };

            delete serverSettings["props"];
        };

        delete serverSettings["updated"];
        delete serverSettings["created"];
        serverSettings[setting] = value;
    };
    
    httpPost(`/${guildId}/settings`, serverSettings);*/
};

settings.setUserValue = async function(userId, setting, value) {

};

settings.deleteGuild = async function(guildId) {
    /*return new Promise((resolve, reject) => {
        const del = https.request({
            hostname: "janibotdb.cyclic.app",
            path: `/${guildId}/settings`,
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        });
    
        del.end();
    });*/
}

module.exports = settings;
