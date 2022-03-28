let dbobj = {};
const db = require("better-sqlite3")("./database.sqlite");

//This is a very shitty Database, im too lazy ;_; and it works so yes

/**
 * Cache Database
 * id = Etag ID or Link @String
 * file = Buffer of PDF file
 * pages = Concat buffer of all the pages of the file
 */
const cache = db
  .prepare(
    "SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'cache';"
  )
  .get();
if (!cache["count(*)"]) {
  db.prepare(
    "CREATE TABLE cache (id TEXT PRIMARY KEY, file BLOB, pages BLOB, totalPages INTEGER, splitString TEXT);"
  ).run();

  db.prepare("CREATE UNIQUE INDEX idx_cache_id ON cache (id);").run();
  db.pragma("synchronous = 1");
  db.pragma("journal_mode = wal");
}
dbobj.getCached = db.prepare("SELECT * FROM cache WHERE id = ?");
dbobj.deleteCached = db.prepare("DELETE FROM cache WHERE id = ?");
dbobj.setCached = db.prepare(
  "INSERT OR REPLACE INTO cache (id, file, pages, totalPages, splitString) VALUES (@id, @file, @pages, @totalPages, @splitString);"
);

dbobj.getCachedDB = (id) => {
  let data = dbobj.getCached.get(id);
  if (!data) {
    data = {
      id: id,
      file: Buffer.alloc(0),
      pages: Buffer.alloc(0),
      totalPages: 0,
      splitString: "",
      notSaved: true, // this wont be saved in database and only exists if the etag cache doesnt exist
    };
  }
  return data;
};

dbobj.resetDB = db.prepare("DELETE FROM cache");

module.exports = { dbobj, db };
