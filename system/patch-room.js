const f = require("fs");
const p = "src/views/bussiness/room/RoomList.vue";
let c = f.readFileSync(p, "utf8");
const old1 = "URL.createObjectURL(file.raw as File)";
const new1 = "URL.createObjectURL(file as File)";
if (c.includes(old1)) {
  c = c.split(old1).join(new1);
  console.log("replaced raw File");
} else {
  console.log("old1 not found");
}
f.writeFileSync(p, c, "utf8");
console.log("done");
