// src/mongo.js
const mongoose = require('mongoose');

async function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('⚠️  MONGO_URI не задан — чат работать не будет');
    return;
  }
  try {
    await mongoose.connect(uri, { family: 4 });
    console.log('MongoDB connected');
  } catch (e) {
    console.error('⚠️  MongoDB connection error:', e.message);
    console.error('   Чат будет недоступен, остальные функции работают');
  }
}

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectMongo, isMongoReady };