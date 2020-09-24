const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');
require('dotenv').config();

const insertDocuments = function(db, collectionName, documents, callback) {
  const collection = db.collection(collectionName);

  collection.insertMany(documents, function(_, result) {
    callback(result);
  });
}

function connectAndExecute(uri, dbName, collectionName, documents) {
  MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, function(_, client) {
    const db = client.db(dbName);

    insertDocuments(db, collectionName, documents, () => {
      client.close();
    });
  });
};

async function getPokemons() {
  let { data } = await axios.get('https://pokeapi.co/api/v2/pokemon');

  const pokemons = [];

  let count = 0;
  
  while (!!data.next && count !== 10) {
    data.results.forEach(async pokemon => {
      const { data: pokemonData } = await axios.get(pokemon.url);
      const { id, name, height, weight, abilities, types } = pokemonData;

      const mappedAbilities = abilities.map(item => item.ability.name);
      const mappedTypes = types.map(item => item.type.name);

      const newPokemon = {
        _id: id,
        name,
        height,
        weight,
        abilities: mappedAbilities,
        types: mappedTypes
      };
      
      pokemons.push(newPokemon);
    });

    const response = await axios.get(data.next);
    data = response.data;
    console.log(count++);
  }

  return pokemons;
}

async function script() {
  const pokemons = await getPokemons();

  connectAndExecute(process.env.MONGO_URI, process.env.MONGO_DB, 'pokemons', pokemons);
}

script();
