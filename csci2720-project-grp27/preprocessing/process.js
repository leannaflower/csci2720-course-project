const fs = require('fs');
const xml2js = require('xml2js');

const parser = new xml2js.Parser({ explicitArray: false });

async function parseXML(file) {
    const data = fs.readFileSync(file);
    return await parser.parseStringPromise(data);
}

async function main() {
    const venuesData = await parseXML('venues.xml');
    const eventsData = await parseXML('events.xml');

    const venues = venuesData.venues.venue;
    const events = eventsData.events.event;

    const eventCount = {};
    events.forEach(ev => {
        const vid = ev.venueid;
        if (!eventCount[vid]) eventCount[vid] = 0;
        eventCount[vid]++;
    });

    const validVenues = venues.filter(v =>
        eventCount[v.$.id] >= 3 &&
        v.latitude && String(v.latitude).trim() !== "" &&
        v.longitude && String(v.longitude).trim() !== ""
    );

    const chosen = validVenues.slice(0, 10);

    // map IDs
    const chosenIDs = chosen.map(v => v.$.id);

    // Filter events that belong to these venues
    const chosenEvents = events.filter(ev => chosenIDs.includes(ev.venueid));

    // Clean fields
    const cleanVenues = chosen.map(v => ({
        id: v.$.id,
        name: v.venuee,
        latitude: v.latitude || null,
        longitude: v.longitude || null
    }));

    const cleanEvents = chosenEvents.map(ev => ({
        id: ev.$.id,
        title: ev.titlee,
        venueid: ev.venueid,
        date: ev.predateE,
        description: ev.desce,
        presenter: ev.presenterorge
    }));

    // Save to JSON
    fs.writeFileSync('venues_clean.json', JSON.stringify(cleanVenues, null, 2));
    fs.writeFileSync('events_clean.json', JSON.stringify(cleanEvents, null, 2));

    console.log('Done. Generated venues_clean.json and events_clean.json');
}

main();
