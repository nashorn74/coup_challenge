var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

const schedule = require('node-schedule');

const mySchedule = schedule.scheduleJob('00 00 12 * * *', () => {
	console.log('Cron-style Scheduling');
	var file = fs.createWriteStream("packages.txt");
	var request = http.get("http://cran.r-project.org/src/contrib/PACKAGES", function(response) {
		response.pipe(file);
		runPackageParser();
	});
});

/*const mySchedule2 = schedule.scheduleJob('00 03 02 * * *', () => {
	console.log('Cron-style Scheduling');
	var file = fs.createWriteStream("packages.txt");
	var request = http.get("http://cran.r-project.org/src/contrib/PACKAGES", function(response) {
		response.pipe(file);
		runPackageParser();
	});

});*/

var http = require('http');
var fs = require('fs');

router.get('/packages/download', function(req, res, next) {
	var file = fs.createWriteStream("packages.txt");
	var request = http.get("http://cran.r-project.org/src/contrib/PACKAGES", function(response) {
		response.pipe(file);
		//res.send('Download Complete...');
		res.redirect("/packages/parse");
	});
});

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
// Connection URL 
var url = 'mongodb://localhost:27017';
var dbObj = null;
MongoClient.connect(url, function(err, client) {
	if (err) {
		console.log(JSON.stringify(err))
	} else {
		console.log("Connected successfully to server");
		 
		dbObj = client.db('coup');
		 
		//client.close();
	}
});

router.get('/packages/index', function(req, res, next) {
	var indexes = dbObj.collection('indexes');
	indexes.find({}).toArray(function(err, results) {
		if (err) res.send(err);
		else {
			res.render('list', { title: 'Packages Index List', indexes:results });
		}
	});
});


var downloadCount = 0;
var packageInfo = null;

var LineByLineReader = require('line-by-line');
var extract = require('extract-zip')
const decompress = require('decompress');
const decompressGz = require('decompress-gz');
const decompressTargz = require('decompress-targz');
var targz = require('targz');

function runPackageParser() {
	var lr = new LineByLineReader('packages.txt');
    downloadCount = 0;
    packageInfo = null;

	lr.on('error', function (err) {
		// 'err' contains error object
		console.log(err);
	});

	lr.on('line', function (line) {
		// 'line' contains the current line without the trailing newline character.
		if (downloadCount < 50) {
			if (line.indexOf("Package: ") != -1) {
				packageInfo = {};
				packageInfo.name = line.replace("Package: ", "");
				console.log(line);
			}
			if (line.indexOf("Version: ") != -1 && packageInfo != null) {
				packageInfo.version = line.replace("Version: ", "");
				var packagename = packageInfo.name;
				var foldername = packageInfo.name+"_"+packageInfo.version;
				var filename = foldername+".tar.gz";
				var file = fs.createWriteStream("./public/"+filename);
				var request = http.get("http://cran.r-project.org/src/contrib/"+filename, function(response) {
					response.pipe(file);
					response.on('end', function() {
						console.log(filename+" download complete.");
						/*decompress(process.cwd()+"/public/"+filename, 
							process.cwd()+"/public",
							{
							    plugins: [
							        decompressTargz()
							    ]
							}).then(files => {
						    console.log(filename+" extract gzip complete.");
						});*/
						targz.decompress({
						    src: "./public/"+filename,
						    dest: "./public"
						}, function(err){
						    if(err) {
						        console.log(err);
						    } else {
						        console.log(filename+" extract gzip complete.");
						        console.log("./public/"+packagename+"/DESCRIPTION");
						        fs.readFile("./public/"+packagename+"/DESCRIPTION", function(err, f){
								    var array = f.toString().split('\n');
								    // use the array
								    var obj = {};
								    for (var i = 0; i < array.length; i++) {
								    	//console.log(array[i]);
								    	if (array[i].indexOf("Package: ") != -1) {
								    		obj.package_name = array[i].replace("Package: ", "");
								    	}
								    	if (array[i].indexOf("Version: ") != -1) {
								    		obj.version = array[i].replace("Version: ", "");
								    	}
								    	if (array[i].indexOf("Date/Publication: ") != -1) {
								    		obj.date_publication = new Date(array[i].replace("Date/Publication: ", ""));
								    	}
								    	if (array[i].indexOf("Title: ") != -1) {
								    		obj.title = array[i].replace("Title: ", "");
								    	}
								    	if (array[i].indexOf("Description: ") != -1) {
								    		obj.description = array[i].replace("Description: ", "");
								    	}
								    	if (array[i].indexOf("Maintainer: ") != -1) {
								    		obj.maintainer = {};
								    		var maintainerArray = array[i].replace("Maintainer: ", "").split('<');
								    		obj.maintainer.name = maintainerArray[0];
								    		obj.maintainer.email = maintainerArray[1].substring(0, maintainerArray[1].length-1);
								    	}
								    	if (array[i].indexOf("Author: ") != -1) {
								    		obj.authors = [];
								    		var author = array[i].replace("Author: ", "");
								    		if (author.indexOf("],") != -1) {
								    			author = author.replace("],", "]:");
								    			var temp = author.split(':');
								    			for (var j = 0; j < temp.length; j++) {
								    				if (temp[j] != '') obj.authors.push({name:temp[j]});
								    			}
								    		} else if (author.indexOf("]") != -1) {
								    			obj.authors.push({name:author});
								    		} else if (author.indexOf(">,") != -1) {
								    			author = author.replace(">,", ">:");
								    			var temp = author.split(':');
								    			for (var j = 0; j < temp.length; j++) {
								    				if (temp[j].indexOf('<') != -1) {
														var temp2 = temp[j].split('<');
								    					obj.authors.push({name:temp2[0], email:temp2[1].substring(0,temp2[1].length-1)});
								    				} else {
								    					obj.authors.push({name:temp[j]});
								    				}
								    				
								    			}
								    		} else if (author.indexOf(">") != -1) {
								    			var temp = author.split('<');
								    			obj.authors.push({name:temp[0], email:temp[1].substring(0,temp[1].length-1)});
								    		} else if (author.indexOf(",") != -1) {
								    			var temp = author.split(',');
								    			for (var j = 0; j < temp.length; j++) {
								    				if (temp[j] != '') obj.authors.push({name:temp[j]});
								    			}
								    		} else if (author.indexOf("and") != -1) {
								    			var temp = author.split('and');
								    			for (var j = 0; j < temp.length; j++) {
								    				if (temp[j] != '') obj.authors.push({name:temp[j]});
								    			}
								    		} else {
								    			obj.authors.push({name:author});
								    		}
								    	}
								    }
								    //console.log(obj);

								    if (dbObj != null) {
								    	var packages = dbObj.collection('packages');
								    	packages.find({package_name:obj.package_name, version:obj.version}).toArray(function(err, results) {
								    		if (err) console.log(err);
								    		else {
								    			if (results.length > 0) {
								    				//skip;
								    			} else {
								    				var packages = dbObj.collection('packages');
								    				packages.insert(obj, function(err, result) {
								    					if (err) console.log(err);
								    					else {
								    						var indexes = dbObj.collection('indexes');
								    						indexes.find({package_name:obj.package_name}).toArray(function(err2, results2) {
																if (err2) console.log(err2);
													    		else {
													    			if (results2.length > 0) {
													    				if (results2[0].version != obj.version) {
													    					indexes.update({package_name:obj.package_name},
													    						{
													    							package_name:obj.package_name,
													    							version:obj.version,
													    							document_id:result.insertedIds['0']
													    						}, function(err3, result3) {
													    							if (err3) console.log(err3);
													    							else console.log(result3);
													    						});
													    				} else {
													    					console.log('nothing...');
													    				}
													    			} else {
																			indexes.insert(
													    						{
													    							package_name:obj.package_name,
													    							version:obj.version,
													    							document_id:result.insertedIds['0']
													    						}, function(err3, result3) {
													    							if (err3) console.log(err3);
													    							else console.log(result3);
													    						});
													    			}
													    		}
								    						});
								    					}
								    				});
								    			}
								    		}
								    	});
								    }
								});
						    }
						});
					});

				});
				packageInfo = null;
				downloadCount++;
			}
		}
		
	});

	lr.on('end', function () {
		// All lines are read, file is closed now.
		console.log("Complete parsing...");
	});
}

router.get('/packages/parse', function(req, res, next) {

    runPackageParser();

	res.send("Run Text Parser...");
});


module.exports = router;
