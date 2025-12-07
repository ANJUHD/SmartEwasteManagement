const mongoose = require('mongoose');

const CenterSchema = new mongoose.Schema({
  name: {type:String, required:true},
  address: {type:String},
  location: {
    // simple geo: [lng, lat]
    type: {type:String, default:'Point'},
    coordinates: {type:[Number], default:[0,0]}
  },
  contact: {type:String}
});

module.exports = mongoose.model('Center', CenterSchema);
