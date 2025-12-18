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
4. Favorite
5. Comment
6. Meta (Last updated timestamp)

Each entity corresponds to a MongoDB collection.

## 3. Schema Designs
### 3.1 Venue Schema
Venues are the central subject of the application. All maps, sorting, and filtering operations start from venues.

#### Schema
``` js
const venueSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
});
```

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
const eventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  venueid: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  presenter: {
    type: String,
    default: '',
  },
});
```

### 3.3 User Schema
Required for both regular users and admin accounts.

#### Schema
``` js
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    }
  },
  { timestamps: true }
);
```

### 3.4 Favourite Schema
Tracks which venues a user has saved.

#### Schema
``` js
const favoriteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    venueId: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);
```
**Notes**
* Users cannot favourite the same venue more than once.

### 3.5 Comment Schema
Stores user comments for each venue. Comments are visible to all users.

#### Schema
``` js
const commentSchema = new Schema(
  {
    venueId: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000
    }
  },
  { timestamps: true }
);
```


### 3.6 Meta Schema (Last Updated Time)
Stores global metadata such as the last time the dataset was updated.

#### Schema
``` js
const metaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  lastUpdated: {
    type: Date,
    required: true,
  },
});
```
