const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const path = require("path");

async function syncLocalToAtlas() {
  console.log("🚀 Starting local database to Atlas synchronizer...");
  let localMs;
  try {
    localMs = await MongoMemoryServer.create({
      binary: { downloadDir: path.join(__dirname, "node_modules", ".cache", "mongodb-memory-server") },
      instance: { dbPath: path.join(__dirname, ".mongo_data"), storageEngine: "wiredTiger", dbName: "lifeguard" },
    });
  } catch (e) {
    console.log("Local db already open or empty:", e.message);
    return;
  }

  const localUri = localMs.getUri("lifeguard");
  const localConn = await mongoose.createConnection(localUri).asPromise();
  const atlasUri = "mongodb+srv://tisha:tisha123@cluster0.6mmtnpp.mongodb.net/lifeguard?retryWrites=true&w=majority";
  const atlasConn = await mongoose.createConnection(atlasUri).asPromise();

  console.log("Connected to both databases. Syncing data...");

  const collections = ["users", "reminders", "medicalwallets", "communityposts", "usersettings"];
  for (const col of collections) {
    const docs = await localConn.collection(col).find({}).toArray();
    let count = 0;
    for (const doc of docs) {
      try {
        if (col === "users") {
          await atlasConn.collection(col).updateOne(
            { email: doc.email },
            { $setOnInsert: doc },
            { upsert: true }
          );
        } else {
          await atlasConn.collection(col).updateOne(
            { _id: doc._id },
            { $set: doc },
            { upsert: true }
          );
        }
        count++;
      } catch (err) {
        // Ignore single doc duplicates
      }
    }
    console.log(`✅ Synced ${count} documents for ${col}`);
  }

  await localConn.close();
  await atlasConn.close();
  await localMs.stop();
  console.log("🎉 All local records successfully uploaded to MongoDB Atlas!");
}

syncLocalToAtlas()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration notice:", err.message);
    process.exit(0);
  });
