/**
 * MbtilestacheController
 *
 * @description :: Server-side logic for managing mbtilestaches
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var mapnik = require('mapnik');
var zlib = require('zlib');
var sm = new (require('sphericalmercator'))()
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('hpms.mbtiles');

module.exports = {

	sendTile:function(req,res){
		if(typeof req.param('z') == 'undefined' || typeof req.param('x') == 'undefined' || typeof req.param('y') == 'undefined'){
			return res.json({error:'invalid tile paramaters expect /layer/z/x/y'})
		}
		var z = parseInt(req.param('z')),
			x = parseInt(req.param('x')),
			y = parseInt(req.param('y'));

		var vt = new mapnik.VectorTile(z,x,y);
		db.get("select tile_data from images join map on map.tile_id = images.tile_id where map.zoom_level = $z and map.tile_column = $x and map.tile_row=$y", { $z: z, $x: x, $y:y },function(err,row){
		    if (err) throw err;
		    console.log('out of sqlite',row);

		    if(row =='undefined'){
		    	res.json({});
		    }
		    var raw = row.tile_data;
		    zlib.inflate(raw, function(err, data) {
		        if (err) throw err;
		        console.time('setData');
		        vt.setData(data);
		        console.timeEnd('setData');
		        console.time('parse');
		        vt.parse(function(err){
		            console.timeEnd('parse');
		            console.time('toGeoJSON');
		            var vdata = vt.toGeoJSON('__array__');
            		console.timeEnd('toGeoJSON');
      				console.time('send');
            		res.json(vdata);
		      		console.timeEnd('send');
		 		});//end PARSE
			});//end Inflate
		});//end sqlite3 query
	}
	
};

