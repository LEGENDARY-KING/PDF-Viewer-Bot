const dbobj = require("../helpers/database.js");
const config = require("../config.json");
const CronJob = require("cron").CronJob;

module.exports = {
  name: "ready",
  once: true,
  description: "Runs on ready!",
  execute(client) {
    job.start();
    function update() {
      let data = dbobj.db.prepare("SELECT * FROM cache").all();
      client.user.setPresence({
        activities: [
          {
            name:
              "Processing PDFs in " +
              client.guilds.cache.size +
              " guilds with " +
              client.users.cache.size +
              " members and " +
              data.length +
              " PDFs in cache",
          },
        ],
        status: "online",
      });
    }
    update();
    setInterval(update, 1000 * 60 * 15);
  },
};

let job = new CronJob("* 0 0 * * 0", function () {
  let data = dbobj.db.prepare("SELECT * FROM cache").all();
  console.log(
    "Cached data had " + data.length + " cached PDFs\n" + "Deleting cache"
  );
  dbobj.dbobj.resetDB.run();
  let dataAfterReset = dbobj.db.prepare("SELECT * FROM cache").all();
  if (dataAfterReset === 0) console.log("Successfully deleted cache");
  else console.log("Uh-oh unable to delete cache");
});
