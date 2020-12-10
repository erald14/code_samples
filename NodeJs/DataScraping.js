let axios = require("axios");
let cheerio = require("cheerio");
var myArgs = process.argv.slice(2);
let mapping = myArgs[0];
let dataFile = myArgs[1];
var json = require("./" + mapping);
var fs = require("fs");
var linksArray = [];
var ProprtyIndex = require("./PropertyIndex");
var AWS = require("./amazon");
const getData = (links, index) => {
  if (index >= links.length) {
    console.log("done");
    return;
  } else {
    ProprtyIndex.getProperty(links[index]).then((response) => {
      AWS.Add(response);
      getData(links, index + 1);
    });
  }
};
const postcodesFunc = (postcodes, current) => {
  if (current >= postcodes.length) {
    fs.appendFile(dataFile, JSON.stringify(linksArray) + "\n", function (err) {
      if (err) throw err;
      //console.log("Saved!");
    });
    getData(linksArray, 0);
    return;
  } else {
    //request here , get total
    getProperties(postcodes, current, 0, 10);
  }
};

const getProperties = (postcodes, current, index, total) => {
  //recursive funcition
  console.log(current, index, total);
  if (total <= index) {
    postcodesFunc(postcodes, current + 1);
    return;
  } else {
    let url = " "; //cant disclose

    axios.get(url).then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);
      lastScrp = $("div.paginate>a");
      if (lastScrp[lastScrp.length - 2]) {
        lastPage = lastScrp[lastScrp.length - 2].children[0].data;
      } else {
        lastPage = 0;
      }
      ///morrem last page
      links = $("a.photo-hover");
      for (var z = 0; z < links.length; z++) {
        if (
          links[z].attribs.href.length < 100 &&
          !links[z].attribs.href.includes("mobile")
        ) {
          linksArray.push(links[z].attribs.href);
          // ProprtyIndex.getProperty(links[z].attribs.href).then(response => {});
        }
      }
      console.log(links.length, `${current} out of ${postcodes.length}`);
      getProperties(postcodes, current, index + 1, lastPage);
    });
  }
};

postcodesFunc(json, 0);
