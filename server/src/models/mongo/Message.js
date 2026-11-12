// src/models/mongo/Message.js
const mongoose = require('mongoose');

const rollResultSchema = new mongoose.Schema({
  dice: { type: String, required: true },        
  count: { type: Number, required: true },       
  sides: { type: Number, required: true },       
  rolls: { type: [Number], required: true },     
  modifier: { type: Number, default: 0 },        
  total: { type: Number, required: true },       
}, { _id: false });

const messageSchema = new mongoose.Schema({
  roomId: { type: Number, required: true, index: true },  
  userId: { type: Number, required: true },
  username: { type: String, required: true },
  type: { type: String, enum: ['chat', 'roll', 'system'], required: true },
  text: { type: String, default: '' },           
  rollResult: { type: rollResultSchema, default: null }, 
  createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('Message', messageSchema);
