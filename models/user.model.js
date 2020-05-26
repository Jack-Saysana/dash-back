const mongoose = require( "mongoose" );
const url = require( "url" );

const Schema = mongoose.Schema;

const contentScheme = new Schema({
  url: { // raw url
    type: String,
    validate: {
      validator: function( data ) {
        try {
          new URL( data );
          return true;
        } catch (err) {
          return false;
        }
      },
      message: `not a valid url`
    }
  },
  link: { // cleaned url
    type: String,
    default: function() {
      try {
        return new URL( this.url.split(/[?#]/)[0] ).toString();
      } catch (err) {
        return "";
      }
    },
    required: false,
  },
  host: { // domain
    type: String,
    required: false,
    default: function() {
      try {
        return new URL( this.url ).hostname;
      } catch (err) {
        return "";
      }
    },
  },
  notes: {
    type: String,
    required: false
  },
  opened: { // times it was opened
    type: Number,
    required: false,
    default: 0
  },
  meta: {
    type: Schema.Types.Mixed,
    required: false
  }
}, { timestamps: { createdAt: "created_at", updatedAt: "timestamps.createdAt" } } );


const folderScheme = new Schema({
  name: {
    type: String,
    required: true
  },
  content: [ contentScheme ]
}, { timestamps: { createdAt: "created_at", updatedAt: "timestamps.createdAt" } } );


const userSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    content: {
      dashboard: [ contentScheme ],
      archive: [ contentScheme ],
      folder: [ folderScheme ]
    }
}, { timestamps: { createdAt: "created_at", updatedAt: "timestamps.createdAt" } } );

module.exports = { userSchema: mongoose.model( "user", userSchema ), folderScheme: mongoose.model( "folderScheme", folderScheme ), contentScheme: mongoose.model( "contentScheme", contentScheme )  };
