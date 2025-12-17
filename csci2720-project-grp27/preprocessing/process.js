const fs = require("fs");
const xml2js = require("xml2js");

const parser = new xml2js.Parser({ explicitArray: false });

function readXML(path) {
    const xml = fs.readFileSync(path, "utf8");
    return parser.parseStringPromise(xml);
}

function formatDate(yyyymmdd) {
    if (!yyyymmdd || yyyymmdd === "20990101") return null;
    return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6)}`;
}

const dedupeByLatLngFirst = (arr) => {
  const seen = new Set();
  return arr.filter(item => {
    const key = `${item.latitude},${item.longitude}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

async function main() {
    const eventsXML = await readXML("events.xml");
    const datesXML = await readXML("eventDates.xml");
    const venuesXML = await readXML("venues.xml");

    const events = eventsXML.events.event;
    const dateEvents = datesXML.event_dates.event;
    const venues = venuesXML.venues.venue;


    // Build eventId → dates map
    const eventDatesMap = {};

    dateEvents.forEach(ev => {
        const id = ev.$.id;
        const dates = Array.isArray(ev.indate) ? ev.indate : [ev.indate];

        eventDatesMap[id] = dates
            .map(d => formatDate(d))
            .filter(Boolean);
    });


    // Normalize events (english only)
    const normalizedEvents = events.map(ev => {
        const id = ev.$.id;
        return {
            eventId: id,
            title: ev.titlee && ev.titlee !== "--" ? ev.titlee : ev.titlec || "",
            venueId: ev.venueid,
            dates: eventDatesMap[id] || [],
            description: ev.desce || "",
            presenter: ev.presenterorge || ""
        };
    }).filter(ev => ev.dates.length > 0);

    // Count events per venue
    const venueEventCount = {};
    normalizedEvents.forEach(ev => {
        venueEventCount[ev.venueId] = (venueEventCount[ev.venueId] || 0) + 1;
    });

    // Filter valid venues
    const validVenues = venues.filter(v =>
        v.latitude &&
        v.longitude &&
        venueEventCount[v.$.id] >= 3
    );
	
	const dedupedValidVenues = dedupeByLatLngFirst(validVenues);

    const selectedVenues = dedupedValidVenues.slice(0, 10);
    const selectedVenueIds = new Set(selectedVenues.map(v => v.$.id));

    // Build venues_clean.json
    const venuesClean = selectedVenues.map(v => ({
        id: v.$.id,
        name: v.venuee,
        latitude: parseFloat(v.latitude),
        longitude: parseFloat(v.longitude),
        eventCount: venueEventCount[v.$.id]
    }));

    // Build events_clean.json
    const eventsClean = normalizedEvents
        .filter(ev => selectedVenueIds.has(ev.venueId))
        .map(ev => ({
            eventId: ev.eventId,
            title: ev.title,
            dates: ev.dates,
            description: ev.description,
            presenter: ev.presenter,
            venue: venuesClean.find(v => v.id === ev.venueId)
        }));

    fs.writeFileSync("venues_clean.json", JSON.stringify(venuesClean, null, 2));
    fs.writeFileSync("events_clean.json", JSON.stringify(eventsClean, null, 2));

    console.log("Preprocessing complete");
    console.log(`Venues: ${venuesClean.length}`);
    console.log(`Events: ${eventsClean.length}`);
}

main().catch(console.error);
