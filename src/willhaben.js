const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const willhaben = require("willhaben");

const channelId = "1143231376892633210";
const roleId = "1142924124080054272";
const rows = 150;
const link = `https://www.willhaben.at/iad/gebrauchtwagen/motorrad/motorradboerse?MC_MODEL/MAKE=7771&sfId=a5b790a3-bb83-4ad2-8239-b79ab9703c8a&isNavigation=true&MC_MODEL/MODEL=234&MC_MODEL/MODEL=235&sort=3&page=1&rows=${rows}&YEAR_MODEL_FROM=2016`;
const hourOffset = 0;

function getHour() {
  const date = new Date();
  date.setHours(date.getHours() + hourOffset);
  return date.getHours();
};

function sendListing(listing, client) {
  const id = listing.id || "NONE";
  const desc = listing.body_dyn || "NONE";
  const price = listing.price_for_display || "NONE";
  const country = listing.country || "NONE";
  const state = listing.state || "NONE";
  const district = listing.district || "NONE";
  const address = listing.address || "NONE";

  const ezAttribute = listing.teaserAttributes.find((attribute) => attribute.postfix == "EZ");
  const kmAttribute = listing.teaserAttributes.find((attribute) => attribute.postfix == "km");
  const ccmAttribute = listing.teaserAttributes.find((attribute) => attribute.postfix == "ccm");

  const ez = (ezAttribute && ezAttribute.value) || "NEU";
  const km = (kmAttribute && kmAttribute.value) || "NONE";
  const ccm = (ccmAttribute && ccmAttribute.value) || "NONE";

  const msgEmbed = new EmbedBuilder()
    .setColor("#4ec200")
    .setTitle(`**${listing.heading}**`)
    .setURL(`https://www.willhaben.at/iad/${listing.seo_url}`)
    .setThumbnail(`https://cache.willhaben.at/mmo/${listing.mmo}`)
    .addFields(
      { name: "PREIS", value: `**${price}**` },
      { name: "\u200B", value: "\u200B" },
      { name: "BESCHREIBUNG", value: desc },
      { name: "\u200B", value: "\u200B" },
      { name: "ERSTZULASSUNG", value: `**${ez}**`, inline: true },
      { name: "KM", value: `**${km}**`, inline: true },
      { name: "CCM", value: `**${ccm}**`, inline: true },
      { name: "\u200B", value: "\u200B" },
      { name: "LAND", value: country },
      { name: "BUNDESLAND", value: state },
      { name: "BEZIRK", value: district },
      { name: "ADRESSE", value: address }
    )
    .setTimestamp()
    .setFooter({ text: "willhaben.at" });

  client.channels.cache.get(channelId).send({ content: `New Listing! <@&${roleId}>`, embeds: [msgEmbed] }).then((message) => {
    message.crosspost();
  }).catch((err) => {
    console.log(`NEW LISTING POST ERROR: ${err}`);
  });
};

function getListings() {
  return JSON.parse(fs.readFileSync(__dirname + "/wh-listings.json"));
};

function updateListings(client) {
  const hour = getHour();
  
  if (hour >= 22 || hour < 8) return;

  const currentListings = getListings();

  willhaben.getListings(link).then((json) => {
    json.forEach(listing => {
      let newListing = listing;

      if (currentListings.find(currentListing => currentListing.id === listing.id)) {
        newListing = false;
      };

      if (newListing) {
        sendListing(newListing, client);
      };
    });

    fs.writeFileSync(__dirname + "/wh-listings.json", JSON.stringify(json));
  });
};

module.exports = { sendListing, updateListings, getListings };
