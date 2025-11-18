# Data Design and Database Schemas

This document will describe the data structures, MongoDB schemas, and design decisions used for this project. It serves as a reference for backend development and ensures consistent data handling across the entire project.

## 1. Overview
The project uses a real dataset from the [Hong Kong LCSD Cultural Programmes](https://data.gov.hk/en-data/dataset/hk-lcsd-event-event-cultural). The original XML files were preprocessed into two JSON datasets:

- `events_clean.json`
- `venues_clean.json`

These cleaned datasets form the basis for our MongoDB collections.

To support required functionalities (location listing, maps, filtering, comments, favourites, admin CRUD), we designed a modular database structure with clear relationships between models.

MongoDB and Mongoose are used for the database layer.

## 2. Core Entities
The system contains six (6) main entities
1. Venue
2. Event
3. User
4. Favourite
5. Comment
6. Meta (Last updated timestamp)

Each entity corresponds to a MongoDB collection.

## 3. Schema Designs
### 3.1 Venue Schema
Venues are the central subject of the application. All maps, sorting, and filtering operations start from venues.

#### Fields
* Venue ID (string)
* English Name
* Latitude
* Longitude
* Event Count (derived field) &rarr; cached value for future sorting

#### Schema
``` js
const VenueSchema = new mongoose.Schema({
  venueId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },

  eventCount: { type: Number, default: 0 }
});

```
**Notes**
* Many venues in the dataset have missing coordinates, so nullable fields are required.
* `eventCount` improves sorting performance on the location list page.

### 3.2 Event Schema
Events are associated with venues and are displayed on each venue's individual page.

#### Fields
* Event ID
* Title
* Venue ID
* Date (raw string)
* Description
* Presenter
* Optional normalized date fields for future use

#### Schema
``` js
const EventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  venueId: { type: String, required: true, ref: "Venue" },
  date: { type: String, required: true },
  description: { type: String },
  presenter: { type: String },

  // Optional extension
  dateStart: { type: Date },
  dateEnd: { type: Date }
});
```
**Notes**
* Raw date strings are preserved because the dataset format varies significantly (for example: "1-30/11/2025", "Fri-Sat", "8, 15 (Sat) [10:00am-11:00am] /11/2025").
* Normalized date fields can be added in future if time-based filtering is required.

### 3.3 User Schema
Required for both regular users and admin accounts.

#### Fields
* Username
* Password (hashed)
* Role (`user` or `admin`)

#### Schema
``` js
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" }
});
```
**Notes**
* Admin accounts are simply users with the role set to `"admin"`.
* Passwords must always be stored as secure hashes.

### 3.4 Favourite Schema
Tracks which venues a user has saved.

#### Fields
* User ID
* Venue ID

#### Schema
``` js
const FavouriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  venueId: { type: String, ref: "Venue", required: true }
});
```
**Notes**
* Users cannot favourite the same venue more than once.

### 3.5 Comment Schema
Stores user comments for each venue. Comments are visible to all users.

#### Fields
* Venue ID
* User ID
* Comment text
* Timestamp

#### Schema
``` js
const CommentSchema = new mongoose.Schema({
  venueId: { type: String, ref: "Venue", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});
```


### 3.6 Meta Schema (Last Updated Time)
Stores global metadata such as the last time the dataset was updated.

#### Schema
``` js
const MetaSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: { type: String }
});
```
#### Example Document
```
{ key: "lastUpdated", value: "2025-11-22T14:52:00Z" }
```
